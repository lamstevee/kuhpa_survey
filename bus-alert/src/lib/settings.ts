import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Settings } from "../types";

const KEY = "bus-alert/settings/v1";
const LAST_ALERT_KEY = "bus-alert/last-alert-at";

/** 3호선 남부터미널역 일대. 설정에서 "현재 위치로 지정"으로 바꿀 수 있다. */
export const DEFAULT_SETTINGS: Settings = {
  serviceKey: "",
  watches: [],
  geofence: {
    enabled: true,
    label: "남부터미널",
    latitude: 37.4849,
    longitude: 127.0165,
    radius: 250,
  },
  schedule: {
    days: [1, 2, 3, 4, 5],
    startMinute: 17 * 60,
    endMinute: 23 * 60,
  },
  cooldownMinutes: 20,
};

/** 처음 정류장을 고를 때 미리 체크해두는 노선. */
export const SUGGESTED_ROUTES = ["461", "641", "4319"];

function merge(saved: Partial<Settings> | null): Settings {
  if (!saved) return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    geofence: { ...DEFAULT_SETTINGS.geofence, ...(saved.geofence ?? {}) },
    schedule: { ...DEFAULT_SETTINGS.schedule, ...(saved.schedule ?? {}) },
    watches: Array.isArray(saved.watches) ? saved.watches : [],
  };
}

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return merge(raw ? JSON.parse(raw) : null);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}

export async function getLastAlertAt(): Promise<number> {
  const raw = await AsyncStorage.getItem(LAST_ALERT_KEY);
  return raw ? Number(raw) || 0 : 0;
}

export async function setLastAlertAt(ts: number): Promise<void> {
  await AsyncStorage.setItem(LAST_ALERT_KEY, String(ts));
}
