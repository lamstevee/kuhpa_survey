import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Chip, Divider, Field, Notice, Section, Stepper } from "../components/ui";
import { BusApiError, fetchArrivals, searchStations } from "../api/seoulBus";
import { DAY_LABELS, formatClock } from "../lib/format";
import { getGeofenceStatus, syncGeofence } from "../lib/geofence";
import { clearLog, readLog, type LogEntry } from "../lib/log";
import { ensureNotificationSetup } from "../lib/notifications";
import { saveSettings, SUGGESTED_ROUTES } from "../lib/settings";
import type { Settings, StationHit, Watch } from "../types";
import { colors, radius, routeColor, spacing } from "../theme";

const RADIUS_PRESETS = [150, 250, 400, 600];

type Props = {
  settings: Settings;
  onChange: (next: Settings) => void;
  onClose: () => void;
};

export function SettingsScreen({ settings, onChange, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [keyDraft, setKeyDraft] = useState(settings.serviceKey);
  const [keyStatus, setKeyStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StationHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [geofenceOn, setGeofenceOn] = useState(false);
  const [geofenceNote, setGeofenceNote] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [entries, setEntries] = useState<LogEntry[]>([]);

  const persist = useCallback(
    (next: Settings) => {
      onChange(next);
      void saveSettings(next);
    },
    [onChange]
  );

  const refreshStatus = useCallback(async () => {
    setGeofenceOn(await getGeofenceStatus());
    setEntries(await readLog());
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const applyGeofence = useCallback(async () => {
    const status = await syncGeofence();
    setGeofenceOn(status.running);
    setGeofenceNote(status.reason);
    setEntries(await readLog());
  }, []);

  async function testKey() {
    const key = keyDraft.trim();
    persist({ ...settings, serviceKey: key });
    if (!key) {
      setKeyStatus({ tone: "error", text: "인증키를 입력해주세요." });
      return;
    }
    setTesting(true);
    setKeyStatus(null);
    try {
      await searchStations("서울역", key);
      setKeyStatus({ tone: "ok", text: "인증키가 정상입니다." });
    } catch (e) {
      setKeyStatus({ tone: "error", text: e instanceof BusApiError ? e.message : String(e) });
    } finally {
      setTesting(false);
    }
  }

  async function runSearch() {
    const name = query.trim();
    if (!name) return;
    setSearching(true);
    setSearchError(null);
    setResults(null);
    try {
      setResults(await searchStations(name, settings.serviceKey));
    } catch (e) {
      setSearchError(e instanceof BusApiError ? e.message : String(e));
    } finally {
      setSearching(false);
    }
  }

  async function addStation(hit: StationHit) {
    if (settings.watches.some((w) => w.arsId === hit.arsId)) return;

    // 이 정류장에 실제로 들어오는 노선을 먼저 확인해서 461/641/4319 중 있는 것만 미리 체크해준다.
    let routes: string[] = [];
    try {
      const arrivals = await fetchArrivals(hit.arsId, settings.serviceKey);
      const available = new Set(arrivals.map((a) => a.routeName));
      routes = SUGGESTED_ROUTES.filter((r) => available.has(r));
    } catch {
      // 조회에 실패하면 전체 노선(빈 배열)으로 두고 사용자가 직접 고르게 한다.
    }

    const watch: Watch = { arsId: hit.arsId, stationName: hit.stationName, routes };
    persist({ ...settings, watches: [...settings.watches, watch] });
    setResults(null);
    setQuery("");
    void applyGeofence();
  }

  function removeStation(arsId: string) {
    persist({ ...settings, watches: settings.watches.filter((w) => w.arsId !== arsId) });
  }

  function setRoutes(arsId: string, routes: string[]) {
    persist({
      ...settings,
      watches: settings.watches.map((w) => (w.arsId === arsId ? { ...w, routes } : w)),
    });
  }

  async function useCurrentLocation() {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("위치 권한 필요", "현재 위치를 쓰려면 위치 권한을 허용해주세요.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      persist({
        ...settings,
        geofence: {
          ...settings.geofence,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        },
      });
      void applyGeofence();
    } catch (e: any) {
      Alert.alert("위치를 가져오지 못했습니다", String(e?.message ?? e));
    } finally {
      setLocating(false);
    }
  }

  function shiftTime(field: "startMinute" | "endMinute", delta: number) {
    const value = (settings.schedule[field] + delta + 1440) % 1440;
    persist({ ...settings, schedule: { ...settings.schedule, [field]: value } });
  }

  function toggleDay(day: number) {
    const days = settings.schedule.days.includes(day)
      ? settings.schedule.days.filter((d) => d !== day)
      : [...settings.schedule.days, day].sort();
    persist({ ...settings, schedule: { ...settings.schedule, days } });
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>설정</Text>
          <Pressable onPress={onClose} style={styles.closeButton} accessibilityLabel="설정 닫기">
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
        </View>

        <Section
          title="1. 공공데이터포털 인증키"
          hint={"data.go.kr에서 '서울특별시_정류소정보조회 서비스'를 활용신청하면 받는 일반 인증키입니다.\n인코딩/디코딩 어느 쪽을 붙여넣어도 알아서 처리합니다."}
        >
          <Field
            value={keyDraft}
            onChangeText={setKeyDraft}
            placeholder="인증키 붙여넣기"
            multiline
            style={styles.keyInput}
          />
          <Button label="저장하고 연결 테스트" onPress={testKey} loading={testing} />
          {keyStatus ? <Notice tone={keyStatus.tone}>{keyStatus.text}</Notice> : null}
        </Section>

        <Section
          title="2. 정류장과 노선"
          hint="정류장 이름으로 검색해 추가하세요. 추가하면 461·641·4319 중 그 정류장에 오는 노선이 자동으로 선택됩니다."
        >
          <View style={styles.searchRow}>
            <View style={{ flex: 1 }}>
              <Field
                value={query}
                onChangeText={setQuery}
                placeholder="예: 남부터미널"
                returnKeyType="search"
                onSubmitEditing={runSearch}
              />
            </View>
            <Button label="검색" onPress={runSearch} loading={searching} />
          </View>

          {searchError ? <Notice tone="error">{searchError}</Notice> : null}

          {results ? (
            results.length === 0 ? (
              <Notice>검색 결과가 없습니다.</Notice>
            ) : (
              <View style={styles.results}>
                {results.slice(0, 12).map((hit) => {
                  const added = settings.watches.some((w) => w.arsId === hit.arsId);
                  return (
                    <Pressable
                      key={hit.arsId}
                      onPress={() => void addStation(hit)}
                      disabled={added}
                      style={[styles.resultRow, added && styles.resultRowAdded]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resultName}>{hit.stationName}</Text>
                        <Text style={styles.resultArs}>{hit.arsId}</Text>
                      </View>
                      <Text style={styles.resultAction}>{added ? "추가됨" : "추가"}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )
          ) : null}

          {settings.watches.length > 0 ? <Divider /> : null}

          {settings.watches.map((watch) => (
            <WatchEditor
              key={watch.arsId}
              watch={watch}
              serviceKey={settings.serviceKey}
              onChangeRoutes={(routes) => setRoutes(watch.arsId, routes)}
              onRemove={() => removeStation(watch.arsId)}
            />
          ))}
        </Section>

        <Section
          title="3. 알림 받을 위치"
          hint="이 반경 안에 들어오면 앱을 켜지 않아도 도착시간 알림이 옵니다. 반경이 너무 작으면 OS가 진입을 놓칠 수 있어 250m 이상을 권합니다."
        >
          <Field
            value={settings.geofence.label}
            onChangeText={(label) => persist({ ...settings, geofence: { ...settings.geofence, label } })}
            placeholder="장소 이름 (알림 제목에 표시)"
          />
          <Text style={styles.coords}>
            {settings.geofence.latitude.toFixed(5)}, {settings.geofence.longitude.toFixed(5)}
          </Text>
          <Button
            label={locating ? "위치 확인 중…" : "지금 있는 위치로 지정"}
            variant="ghost"
            onPress={useCurrentLocation}
            loading={locating}
          />

          <Text style={styles.label}>반경</Text>
          <View style={styles.chipRow}>
            {RADIUS_PRESETS.map((r) => (
              <Chip
                key={r}
                label={`${r}m`}
                selected={settings.geofence.radius === r}
                onPress={() => {
                  persist({ ...settings, geofence: { ...settings.geofence, radius: r } });
                  void applyGeofence();
                }}
              />
            ))}
          </View>

          <Divider />

          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: geofenceOn ? colors.ok : colors.textFaint }]} />
            <Text style={styles.statusText}>{geofenceOn ? "위치 감시 중" : "위치 감시 꺼짐"}</Text>
            <Chip
              label={settings.geofence.enabled ? "켜짐" : "꺼짐"}
              selected={settings.geofence.enabled}
              onPress={() => {
                const next = {
                  ...settings,
                  geofence: { ...settings.geofence, enabled: !settings.geofence.enabled },
                };
                persist(next);
                setTimeout(() => void applyGeofence(), 0);
              }}
            />
          </View>
          {geofenceNote ? <Notice tone="error">{geofenceNote}</Notice> : null}
          <Button label="위치 알림 다시 적용" variant="ghost" onPress={applyGeofence} />
        </Section>

        <Section title="4. 알림 시간대" hint="퇴근길에만 울리게 해두면 주말·출근길에 방해받지 않습니다.">
          <View style={styles.chipRow}>
            {DAY_LABELS.map((label, day) => (
              <Chip
                key={label}
                label={label}
                selected={settings.schedule.days.includes(day)}
                onPress={() => toggleDay(day)}
              />
            ))}
          </View>
          <Stepper
            label="시작"
            value={formatClock(settings.schedule.startMinute)}
            onDecrease={() => shiftTime("startMinute", -30)}
            onIncrease={() => shiftTime("startMinute", 30)}
          />
          <Stepper
            label="끝"
            value={formatClock(settings.schedule.endMinute)}
            onDecrease={() => shiftTime("endMinute", -30)}
            onIncrease={() => shiftTime("endMinute", 30)}
          />
          <Stepper
            label="재알림 최소 간격"
            value={`${settings.cooldownMinutes}분`}
            onDecrease={() =>
              persist({ ...settings, cooldownMinutes: Math.max(5, settings.cooldownMinutes - 5) })
            }
            onIncrease={() =>
              persist({ ...settings, cooldownMinutes: Math.min(120, settings.cooldownMinutes + 5) })
            }
          />
        </Section>

        <Section title="5. 알림 권한 · 기록" hint="위치 알림이 안 왔을 때 여기서 원인을 볼 수 있습니다.">
          <Button
            label="알림 권한 확인"
            variant="ghost"
            onPress={async () => {
              const ok = await ensureNotificationSetup();
              Alert.alert(ok ? "알림이 허용돼 있습니다" : "알림이 꺼져 있습니다", ok ? "" : "설정 앱에서 알림을 켜주세요.");
            }}
          />
          {entries.length === 0 ? (
            <Text style={styles.logEmpty}>아직 기록이 없습니다.</Text>
          ) : (
            <View style={styles.log}>
              {entries.slice(0, 10).map((entry) => (
                <Text key={entry.at} style={styles.logLine}>
                  {new Date(entry.at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  {"  "}
                  {entry.text}
                </Text>
              ))}
            </View>
          )}
          <View style={styles.searchRow}>
            <View style={{ flex: 1 }}>
              <Button label="새로고침" variant="ghost" onPress={refreshStatus} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label="기록 지우기"
                variant="danger"
                onPress={async () => {
                  await clearLog();
                  setEntries([]);
                }}
              />
            </View>
          </View>
        </Section>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** 정류장 하나의 노선 선택 UI. 노선 목록은 펼칠 때 실제 도착정보에서 가져온다. */
function WatchEditor({
  watch,
  serviceKey,
  onChangeRoutes,
  onRemove,
}: {
  watch: Watch;
  serviceKey: string;
  onChangeRoutes: (routes: string[]) => void;
  onRemove: () => void;
}) {
  const [routes, setRoutes] = useState<{ name: string; type: string }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const arrivals = await fetchArrivals(watch.arsId, serviceKey);
      const seen = new Map<string, string>();
      for (const a of arrivals) if (!seen.has(a.routeName)) seen.set(a.routeName, a.routeType);
      setRoutes([...seen].map(([name, type]) => ({ name, type })));
    } catch (e) {
      setError(e instanceof BusApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [watch.arsId, serviceKey]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggle(name: string) {
    onChangeRoutes(
      watch.routes.includes(name) ? watch.routes.filter((r) => r !== name) : [...watch.routes, name]
    );
  }

  return (
    <View style={styles.watch}>
      <View style={styles.watchHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.watchName}>{watch.stationName}</Text>
          <Text style={styles.watchMeta}>
            {watch.arsId} · {watch.routes.length === 0 ? "전체 노선" : `${watch.routes.length}개 노선`}
          </Text>
        </View>
        <Pressable onPress={onRemove} accessibilityLabel={`${watch.stationName} 삭제`}>
          <Text style={styles.remove}>삭제</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.textDim} />
      ) : error ? (
        <Notice tone="error">{error}</Notice>
      ) : routes && routes.length > 0 ? (
        <View style={styles.chipRow}>
          {routes.map((route) => (
            <Chip
              key={route.name}
              label={route.name}
              tint={routeColor(route.type)}
              selected={watch.routes.includes(route.name)}
              onPress={() => toggle(route.name)}
            />
          ))}
        </View>
      ) : (
        <Text style={styles.logEmpty}>이 정류장에 지금 운행 중인 노선이 없습니다.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: { color: colors.text, fontSize: 26, fontWeight: "800", flex: 1, letterSpacing: -0.6 },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: { color: colors.textDim, fontSize: 16 },
  keyInput: { minHeight: 72, textAlignVertical: "top" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  results: { gap: spacing.xs },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  resultRowAdded: { opacity: 0.5 },
  resultName: { color: colors.text, fontSize: 15, fontWeight: "600" },
  resultArs: { color: colors.textFaint, fontSize: 12, marginTop: 1 },
  resultAction: { color: colors.accent, fontSize: 14, fontWeight: "700" },
  watch: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  watchHead: { flexDirection: "row", alignItems: "center" },
  watchName: { color: colors.text, fontSize: 15, fontWeight: "700" },
  watchMeta: { color: colors.textFaint, fontSize: 12, marginTop: 1 },
  remove: { color: colors.danger, fontSize: 13, fontWeight: "600", padding: spacing.xs },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  label: { color: colors.textDim, fontSize: 13, fontWeight: "600" },
  coords: { color: colors.textFaint, fontSize: 12, fontVariant: ["tabular-nums"] },
  statusRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: colors.text, fontSize: 14, fontWeight: "600", flex: 1 },
  log: { gap: spacing.xs },
  logLine: { color: colors.textFaint, fontSize: 11, lineHeight: 16 },
  logEmpty: { color: colors.textFaint, fontSize: 12 },
});
