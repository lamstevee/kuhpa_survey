import type { Arrival, Prediction, StationHit } from "../types";

// 서울시 버스운행정보 공유서비스 (공공데이터포털 "서울특별시_정류소정보조회 서비스").
// https 인증서가 없는 서버라 http로만 붙는다 — app.json에서 ATS 예외 / cleartext 를 열어둔 이유다.
const BASE = "http://ws.bus.go.kr/api/rest/stationinfo";
const TIMEOUT_MS = 8000;

export class BusApiError extends Error {
  code: string | undefined;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "BusApiError";
    this.code = code;
  }
}

/**
 * 공공데이터포털은 인증키를 "Encoding"(퍼센트 인코딩된)과 "Decoding" 두 가지로 준다.
 * 인코딩된 쪽을 그대로 넣으면 URLSearchParams가 한 번 더 인코딩해 인증이 깨지므로
 * 붙여넣은 값이 이미 인코딩돼 있으면 먼저 되돌린다.
 */
export function normalizeServiceKey(raw: string): string {
  const key = raw.trim();
  if (/%[0-9A-Fa-f]{2}/.test(key)) {
    try {
      return decodeURIComponent(key);
    } catch {
      return key;
    }
  }
  return key;
}

function xmlTag(text: string, tag: string): string | null {
  const m = text.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return m ? m[1].trim() : null;
}

async function call(path: string, params: Record<string, string>, serviceKey: string): Promise<any[]> {
  const key = normalizeServiceKey(serviceKey);
  if (!key) throw new BusApiError("서비스 키가 설정되지 않았습니다. 설정에서 인증키를 넣어주세요.");

  const qs = new URLSearchParams({ ...params, serviceKey: key, resultType: "json" });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let text: string;
  try {
    const res = await fetch(`${BASE}/${path}?${qs.toString()}`, { signal: controller.signal });
    text = await res.text();
    if (!res.ok && !text) throw new BusApiError(`서버 응답 오류 (HTTP ${res.status})`);
  } catch (e: any) {
    if (e?.name === "AbortError") throw new BusApiError("응답이 없습니다. 네트워크를 확인해주세요.");
    if (e instanceof BusApiError) throw e;
    throw new BusApiError(`연결에 실패했습니다: ${e?.message ?? e}`);
  } finally {
    clearTimeout(timer);
  }

  // 키가 틀리면 resultType=json 을 줘도 포털이 XML 에러를 돌려준다.
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    const reason = xmlTag(text, "returnAuthMsg") ?? xmlTag(text, "errMsg") ?? xmlTag(text, "headerMsg");
    if (reason === "SERVICE_KEY_IS_NOT_REGISTERED_ERROR") {
      throw new BusApiError("등록되지 않은 인증키입니다. 포털에서 발급한 키가 맞는지, 활용신청이 승인됐는지 확인해주세요.");
    }
    throw new BusApiError(reason ? `API 오류: ${reason}` : "응답을 해석할 수 없습니다.");
  }

  const root = json?.ServiceResult ?? json;
  const header = root?.msgHeader ?? {};
  const code = header.headerCd != null ? String(header.headerCd) : "";
  if (code && code !== "0") {
    throw new BusApiError(header.headerMsg || `API 오류 (코드 ${code})`, code);
  }

  const list = root?.msgBody?.itemList;
  if (!list) return [];
  return Array.isArray(list) ? list : [list];
}

const ROUTE_TYPES: Record<string, string> = {
  "1": "공항",
  "2": "마을",
  "3": "간선",
  "4": "지선",
  "5": "순환",
  "6": "광역",
  "7": "인천",
  "8": "경기",
  "0": "공용",
};

const CONGESTION: Record<string, string> = {
  "3": "여유",
  "4": "보통",
  "5": "혼잡",
  "6": "매우혼잡",
};

/**
 * arrmsg 는 정류장 전광판에 뜨는 문구 그대로다 — "3분30초후[2번째 전]", "곧 도착",
 * "출발대기", "운행종료". traTime 은 초 단위 예측이지만 출발대기 상태에서 0으로 오므로
 * 문구를 먼저 읽고 traTime 을 보조로 쓴다.
 */
export function parseEtaSeconds(message: string, traTime: number): number | null {
  if (!message) return traTime > 0 ? traTime : null;
  if (/운행종료|출발대기|回|정보없음/.test(message)) return null;
  if (/곧\s*도착/.test(message)) return 0;
  const m = message.match(/(\d+)분(?:\s*(\d+)초)?/);
  if (m) return Number(m[1]) * 60 + Number(m[2] ?? 0);
  return traTime > 0 ? traTime : null;
}

function parseStopsAway(message: string): number | null {
  const m = message?.match(/\[(\d+)번째\s*전\]/);
  return m ? Number(m[1]) : null;
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function toPrediction(item: any, n: 1 | 2): Prediction | null {
  const message = str(item[`arrmsg${n}`]);
  if (!message || message === "-") return null;
  return {
    message,
    etaSeconds: parseEtaSeconds(message, num(item[`traTime${n}`])),
    stopsAway: parseStopsAway(message),
    currentStation: str(item[`stationNm${n}`]) || null,
    plateNo: str(item[`plainNo${n}`]) || null,
    isLast: str(item[`isLast${n}`]) === "1",
    isFull: str(item[`isFullFlag${n}`]) === "1",
    lowFloor: str(item[`busType${n}`]) === "1",
    congestion: CONGESTION[str(item[`congestion${n}`])] ?? null,
  };
}

/** 정류장 하나(arsId)에 들어오는 모든 노선의 도착정보. */
export async function fetchArrivals(arsId: string, serviceKey: string): Promise<Arrival[]> {
  const items = await call("getStationByUid", { arsId }, serviceKey);
  return items.map((item) => ({
    arsId: str(item.arsId) || arsId,
    stationName: str(item.stNm),
    routeName: str(item.rtNm),
    routeType: ROUTE_TYPES[str(item.routeType)] ?? "",
    direction: str(item.adirection),
    first: toPrediction(item, 1),
    second: toPrediction(item, 2),
  }));
}

/** 정류장 이름으로 검색. 설정에서 arsId 를 직접 외우지 않아도 되게 하는 용도. */
export async function searchStations(name: string, serviceKey: string): Promise<StationHit[]> {
  const items = await call("getStationByName", { stSrch: name }, serviceKey);
  return items
    .map((item) => ({
      arsId: str(item.arsId),
      stationName: str(item.stNm),
      latitude: Number(item.posY) || null,
      longitude: Number(item.posX) || null,
    }))
    .filter((s) => s.arsId && s.arsId !== "0");
}
