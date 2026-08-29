import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { collectArrivals, type ArrivalGroup } from "../lib/arrivals";
import type { Settings } from "../types";

const REFRESH_MS = 20_000;

/**
 * 화면이 떠 있는 동안만 20초마다 다시 조회한다. 백그라운드로 내려가면 타이머를 멈추고,
 * 돌아오면 즉시 한 번 당겨온다 — 오래된 도착시간을 보여주는 게 제일 나쁘다.
 */
export function useArrivals(settings: Settings | null) {
  const [groups, setGroups] = useState<ArrivalGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const inFlight = useRef(false);

  const ready = !!settings && !!settings.serviceKey && settings.watches.length > 0;

  const refresh = useCallback(async () => {
    if (!settings || !ready || inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      setGroups(await collectArrivals(settings));
      setUpdatedAt(Date.now());
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [settings, ready]);

  useEffect(() => {
    if (!ready) {
      setGroups([]);
      setUpdatedAt(null);
      return;
    }
    void refresh();

    let timer: ReturnType<typeof setInterval> | null = setInterval(() => void refresh(), REFRESH_MS);
    const onAppState = (state: AppStateStatus) => {
      if (state === "active") {
        void refresh();
        timer ??= setInterval(() => void refresh(), REFRESH_MS);
      } else if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const sub = AppState.addEventListener("change", onAppState);

    return () => {
      if (timer) clearInterval(timer);
      sub.remove();
    };
  }, [ready, refresh]);

  return { groups, loading, updatedAt, refresh, ready };
}
