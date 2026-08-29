import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { collectArrivals } from "./arrivals";
import { isWithinSchedule } from "./format";
import { log } from "./log";
import { ensureNotificationSetup, notifyArrivals } from "./notifications";
import { getLastAlertAt, loadSettings, setLastAlertAt } from "./settings";

export const GEOFENCE_TASK = "bus-alert-geofence";
export const REGION_ID = "bus-alert-stop-region";

export type AlertTrigger = "geofence" | "manual";

/**
 * 알림 한 사이클. 지오펜스가 깨울 때와 "지금 알림 보내기"를 누를 때 같은 경로를 탄다.
 * 백그라운드 콜드 스타트에서도 도는 코드라 화면 상태에 절대 의존하지 않는다.
 */
export async function runArrivalAlert(trigger: AlertTrigger): Promise<string> {
  const settings = await loadSettings();

  if (settings.watches.length === 0) {
    await log("정류장이 설정되지 않아 건너뜀");
    return "정류장이 설정되지 않았습니다.";
  }

  if (trigger === "geofence") {
    if (!isWithinSchedule(settings.schedule)) {
      await log("알림 시간대가 아니라 건너뜀");
      return "알림 시간대가 아닙니다.";
    }
    const elapsed = Date.now() - (await getLastAlertAt());
    if (elapsed < settings.cooldownMinutes * 60_000) {
      const left = Math.ceil((settings.cooldownMinutes * 60_000 - elapsed) / 60_000);
      await log(`재알림 대기 중(${left}분 남음)이라 건너뜀`);
      return `${left}분 뒤부터 다시 알립니다.`;
    }
  }

  await ensureNotificationSetup();
  const groups = await collectArrivals(settings);
  const sent = await notifyArrivals(groups, settings.geofence.label);
  if (sent) await setLastAlertAt(Date.now());

  const summary = groups
    .map((g) => (g.error ? `${g.watch.stationName} 실패` : `${g.watch.stationName} ${g.arrivals.length}건`))
    .join(", ");
  await log(`${trigger === "geofence" ? "도착 감지" : "수동"} → 알림 발송 (${summary})`);
  return sent ? "알림을 보냈습니다." : "보낼 도착 정보가 없습니다.";
}

// defineTask 는 반드시 모듈 최상단(=앱 진입점에서 import 되는 시점)에서 실행돼야 한다.
// OS가 백그라운드에서 앱을 깨울 때 이 등록이 없으면 이벤트가 그냥 버려진다.
TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }: any) => {
  if (error) {
    await log(`지오펜스 오류: ${error.message}`);
    return;
  }
  const eventType = data?.eventType;
  if (eventType !== Location.GeofencingEventType.Enter) return;
  try {
    await runArrivalAlert("geofence");
  } catch (e: any) {
    await log(`알림 처리 실패: ${e?.message ?? e}`);
  }
});

export type GeofenceStatus = {
  running: boolean;
  /** 못 켠 이유. 켜졌으면 null */
  reason: string | null;
};

export async function getGeofenceStatus(): Promise<boolean> {
  try {
    return await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);
  } catch {
    return false;
  }
}

async function stop(): Promise<void> {
  if (await getGeofenceStatus()) {
    await Location.stopGeofencingAsync(GEOFENCE_TASK);
  }
}

/**
 * 설정에 맞춰 지오펜스를 켜거나 끈다. 설정을 저장할 때마다 호출하면 된다
 * (startGeofencingAsync 를 다시 부르면 기존 영역이 교체된다).
 */
export async function syncGeofence(): Promise<GeofenceStatus> {
  const settings = await loadSettings();

  if (!settings.geofence.enabled || settings.watches.length === 0) {
    await stop();
    return {
      running: false,
      reason: settings.watches.length === 0 ? "정류장을 먼저 추가해주세요." : "위치 알림이 꺼져 있습니다.",
    };
  }

  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) {
    await stop();
    return { running: false, reason: "위치 권한이 필요합니다." };
  }

  const background = await Location.requestBackgroundPermissionsAsync();
  if (!background.granted) {
    await stop();
    return {
      running: false,
      reason: "'항상 허용' 위치 권한이 필요합니다. 설정 앱에서 바꿔주세요.",
    };
  }

  try {
    await Location.startGeofencingAsync(GEOFENCE_TASK, [
      {
        identifier: REGION_ID,
        latitude: settings.geofence.latitude,
        longitude: settings.geofence.longitude,
        radius: settings.geofence.radius,
        notifyOnEnter: true,
        notifyOnExit: false,
      },
    ]);
    await log(`지오펜스 등록 (${settings.geofence.label}, 반경 ${settings.geofence.radius}m)`);
    return { running: true, reason: null };
  } catch (e: any) {
    const reason = `지오펜스를 켜지 못했습니다: ${e?.message ?? e}`;
    await log(reason);
    return { running: false, reason };
  }
}
