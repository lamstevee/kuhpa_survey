import type { Arrival, Prediction, Schedule } from "../types";

/** 12분 34초 → "12분", 45초 → "45초", 0초 → "곧 도착" */
export function formatEta(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 30) return "곧 도착";
  if (seconds < 60) return `${seconds}초`;
  const min = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (min < 10 && rest >= 30) return `${min}분 ${rest}초`;
  return `${min}분`;
}

/** 알림 본문에 넣는 짧은 표기: "3분", "곧", "—" */
export function formatEtaShort(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 60) return "곧";
  return `${Math.round(seconds / 60)}분`;
}

export function formatClock(minuteOfDay: number): string {
  const h = Math.floor(minuteOfDay / 60) % 24;
  const m = minuteOfDay % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 지금이 알림 받기로 한 시간대인지. 끝 시각이 시작보다 작으면 자정을 넘긴 것으로 보고
 * 그 경우 "시작한 날"의 요일을 기준으로 판정한다 (23:00~01:00 을 금요일로 설정하면
 * 토요일 0시 30분도 금요일 퇴근으로 친다).
 */
export function isWithinSchedule(schedule: Schedule, now: Date = new Date()): boolean {
  const minute = now.getHours() * 60 + now.getMinutes();
  const { startMinute, endMinute, days } = schedule;
  if (days.length === 0) return false;

  if (startMinute <= endMinute) {
    return days.includes(now.getDay()) && minute >= startMinute && minute <= endMinute;
  }
  if (minute >= startMinute) return days.includes(now.getDay());
  if (minute <= endMinute) return days.includes((now.getDay() + 6) % 7);
  return false;
}

/** 알림 한 줄: "461 3분 · 641 곧 · 4319 12분" */
export function summarizeForNotification(arrivals: Arrival[]): string {
  return arrivals
    .map((a) => `${a.routeName} ${formatEtaShort(a.first?.etaSeconds ?? null)}`)
    .join(" · ");
}

/** 정렬 기준: 곧 오는 순. 예측이 없는 노선은 뒤로. */
export function byEta(a: Arrival, b: Arrival): number {
  const x = a.first?.etaSeconds ?? Number.MAX_SAFE_INTEGER;
  const y = b.first?.etaSeconds ?? Number.MAX_SAFE_INTEGER;
  return x - y;
}

/** 도착 정보에 붙일 부가 문구 ("2번째 전 · 혼잡 · 막차") */
export function describe(prediction: Prediction | null): string {
  if (!prediction) return "";
  const parts: string[] = [];
  if (prediction.stopsAway != null) parts.push(`${prediction.stopsAway}정거장 전`);
  if (prediction.congestion) parts.push(prediction.congestion);
  if (prediction.isFull) parts.push("만차");
  if (prediction.isLast) parts.push("막차");
  if (prediction.lowFloor) parts.push("저상");
  return parts.join(" · ");
}
