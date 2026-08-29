import { BusApiError, fetchArrivals } from "../api/seoulBus";
import type { Arrival, Settings, Watch } from "../types";

export type ArrivalGroup = {
  watch: Watch;
  arrivals: Arrival[];
  /** 이 정류장 조회가 실패한 이유. 성공했으면 null */
  error: string | null;
};

function filterAndOrder(watch: Watch, arrivals: Arrival[]): Arrival[] {
  if (watch.routes.length === 0) return arrivals;
  const wanted = new Set(watch.routes);
  const found = arrivals.filter((a) => wanted.has(a.routeName));
  // 설정에 적어둔 노선 순서를 그대로 유지한다 (곧 오는 순 정렬은 화면에서 고른다).
  return watch.routes
    .map((name) => found.find((a) => a.routeName === name))
    .filter((a): a is Arrival => a != null);
}

/** 설정된 모든 정류장을 동시에 조회한다. 한 정류장이 실패해도 나머지는 살린다. */
export async function collectArrivals(settings: Settings): Promise<ArrivalGroup[]> {
  const results = await Promise.all(
    settings.watches.map(async (watch): Promise<ArrivalGroup> => {
      try {
        const arrivals = await fetchArrivals(watch.arsId, settings.serviceKey);
        return { watch, arrivals: filterAndOrder(watch, arrivals), error: null };
      } catch (e) {
        const message = e instanceof BusApiError ? e.message : `조회 실패: ${e}`;
        return { watch, arrivals: [], error: message };
      }
    })
  );
  return results;
}

export function flatten(groups: ArrivalGroup[]): Arrival[] {
  return groups.flatMap((g) => g.arrivals);
}
