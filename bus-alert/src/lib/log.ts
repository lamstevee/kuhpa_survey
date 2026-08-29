import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "bus-alert/log/v1";
const MAX = 40;

export type LogEntry = { at: number; text: string };

/**
 * 지오펜스는 백그라운드에서 조용히 돌아서, 안 울렸을 때 "안 들어온 건지 실패한 건지"를
 * 알 방법이 없다. 그래서 마지막 몇 건을 남겨 설정 화면에서 보여준다.
 */
export async function log(text: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const entries: LogEntry[] = raw ? JSON.parse(raw) : [];
    entries.unshift({ at: Date.now(), text });
    await AsyncStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)));
  } catch {
    // 로그 때문에 알림을 놓치는 게 더 나쁘다.
  }
}

export async function readLog(): Promise<LogEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function clearLog(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
