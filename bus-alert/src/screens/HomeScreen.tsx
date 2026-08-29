import React, { useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ArrivalCard } from "../components/ArrivalCard";
import { Button, Notice } from "../components/ui";
import { useArrivals } from "../hooks/useArrivals";
import { byEta, DAY_LABELS, formatClock, isWithinSchedule } from "../lib/format";
import { getGeofenceStatus, runArrivalAlert } from "../lib/geofence";
import type { Settings } from "../types";
import { colors, radius, spacing } from "../theme";

function relativeTime(ts: number | null): string {
  if (!ts) return "아직 조회 전";
  const sec = Math.round((Date.now() - ts) / 1000);
  if (sec < 10) return "방금 갱신";
  if (sec < 60) return `${sec}초 전 갱신`;
  return `${Math.round(sec / 60)}분 전 갱신`;
}

export function HomeScreen({ settings, onOpenSettings }: { settings: Settings | null; onOpenSettings: () => void }) {
  const insets = useSafeAreaInsets();
  const { groups, loading, updatedAt, refresh, ready } = useArrivals(settings);
  const [geofenceOn, setGeofenceOn] = useState(false);
  const [alertResult, setAlertResult] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // "N초 전 갱신" 문구를 살아있게 유지한다.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 10_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    void getGeofenceStatus().then(setGeofenceOn);
  }, [settings, tick]);

  const scheduleActive = settings ? isWithinSchedule(settings.schedule) : false;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
      ]}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.textDim} />
      }
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.place}>{settings?.geofence.label ?? "버스 도착"}</Text>
          <Text style={styles.updated}>{relativeTime(updatedAt)}</Text>
        </View>
        <Pressable onPress={onOpenSettings} style={styles.settingsButton} accessibilityLabel="설정 열기">
          <Text style={styles.settingsIcon}>⚙</Text>
        </Pressable>
      </View>

      {!ready ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>설정이 아직 안 끝났어요</Text>
          <Text style={styles.emptyBody}>
            {settings && !settings.serviceKey
              ? "공공데이터포털 인증키를 넣으면 도착정보를 불러옵니다."
              : "알림 받을 정류장과 노선을 골라주세요."}
          </Text>
          <Button label="설정 열기" onPress={onOpenSettings} />
        </View>
      ) : (
        groups.map((group) => {
          const sorted = [...group.arrivals].sort(byEta);
          return (
            <View key={group.watch.arsId} style={styles.group}>
              <View style={styles.groupHead}>
                <Text style={styles.groupTitle}>{group.watch.stationName}</Text>
                <Text style={styles.groupArs}>{group.watch.arsId}</Text>
              </View>

              {group.error ? (
                <Notice tone="error">{group.error}</Notice>
              ) : sorted.length === 0 ? (
                <Notice>
                  선택한 노선의 도착 예정이 없습니다. 막차가 끊겼거나 노선 번호가 이 정류장에 없을 수 있어요.
                </Notice>
              ) : (
                <View style={styles.cards}>
                  {sorted.map((arrival) => (
                    <ArrivalCard key={`${arrival.arsId}-${arrival.routeName}`} arrival={arrival} />
                  ))}
                </View>
              )}
            </View>
          );
        })
      )}

      {settings ? (
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: geofenceOn ? colors.ok : colors.textFaint }]} />
            <Text style={styles.statusText}>
              {geofenceOn
                ? `${settings.geofence.label} 반경 ${settings.geofence.radius}m 감시 중`
                : "위치 알림이 꺼져 있습니다"}
            </Text>
          </View>
          <Text style={styles.statusSub}>
            {settings.schedule.days.map((d) => DAY_LABELS[d]).join("·") || "요일 없음"}{" "}
            {formatClock(settings.schedule.startMinute)}–{formatClock(settings.schedule.endMinute)}
            {scheduleActive ? " · 지금 알림 시간대" : " · 지금은 알림 시간대 아님"}
          </Text>

          <Button
            label="지금 알림 보내보기"
            variant="ghost"
            onPress={async () => setAlertResult(await runArrivalAlert("manual"))}
          />
          {alertResult ? <Text style={styles.statusSub}>{alertResult}</Text> : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  place: { color: colors.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.6 },
  updated: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: { color: colors.textDim, fontSize: 20 },
  group: { gap: spacing.sm },
  groupHead: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm },
  groupTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  groupArs: { color: colors.textFaint, fontSize: 12 },
  cards: { gap: spacing.sm },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  emptyBody: { color: colors.textDim, fontSize: 14, lineHeight: 20 },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: colors.text, fontSize: 14, fontWeight: "600", flex: 1 },
  statusSub: { color: colors.textFaint, fontSize: 12, lineHeight: 17 },
});
