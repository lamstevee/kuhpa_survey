import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import type { ArrivalGroup } from "./arrivals";
import { formatEtaShort } from "./format";

export const CHANNEL_ID = "bus-arrival";

// 앱이 떠 있는 동안에도 배너를 띄운다 — 정류장에 서서 앱을 보고 있을 때 알림이
// 조용히 사라지면 오히려 헷갈린다.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** 채널 생성 + 권한 요청. 이미 허용돼 있으면 다시 묻지 않는다. */
export async function ensureNotificationSetup(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "버스 도착 알림",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 200, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: "default",
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return asked.granted;
}

export async function presentNow(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: "default",
      priority: Notifications.AndroidNotificationPriority.HIGH,
      autoDismiss: false,
    },
    // Android 는 채널을 지정해야 HIGH 로 뜬다. iOS 는 즉시 발송이라 trigger 가 필요 없다.
    trigger: Platform.OS === "android" ? { channelId: CHANNEL_ID } : null,
  });
}

/**
 * 도착 정보를 알림 한 건으로 만든다.
 * 제목엔 정류장, 본문엔 노선별 남은 시간 — 잠금화면에서 그대로 읽히는 게 목적이다.
 */
export async function notifyArrivals(groups: ArrivalGroup[], placeLabel: string): Promise<boolean> {
  const lines: string[] = [];

  for (const group of groups) {
    if (group.error) {
      lines.push(`${group.watch.stationName}: ${group.error}`);
      continue;
    }
    if (group.arrivals.length === 0) {
      lines.push(`${group.watch.stationName}: 도착 예정 없음`);
      continue;
    }
    const summary = group.arrivals
      .map((a) => `${a.routeName} ${formatEtaShort(a.first?.etaSeconds ?? null)}`)
      .join(" · ");
    lines.push(groups.length > 1 ? `${group.watch.stationName} — ${summary}` : summary);
  }

  if (lines.length === 0) return false;
  await presentNow(`🚌 ${placeLabel} 도착`, lines.join("\n"));
  return true;
}
