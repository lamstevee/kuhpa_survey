/** 감시할 정류장 하나. arsId는 정류장 기둥에 적힌 5자리 번호다. */
export type Watch = {
  arsId: string;
  stationName: string;
  /** 이 정류장에서 보고 싶은 노선 번호. 비어 있으면 전체 노선을 본다. */
  routes: string[];
};

export type Schedule = {
  /** 0=일 … 6=토 */
  days: number[];
  /** 자정 기준 분 (예: 17시 30분 = 1050) */
  startMinute: number;
  endMinute: number;
};

export type Geofence = {
  enabled: boolean;
  label: string;
  latitude: number;
  longitude: number;
  /** 미터. iOS/Android 모두 100m 아래로는 잘 안 잡힌다. */
  radius: number;
};

export type Settings = {
  /** 공공데이터포털 일반 인증키 */
  serviceKey: string;
  watches: Watch[];
  geofence: Geofence;
  schedule: Schedule;
  /** 같은 정류장에서 다시 알릴 때까지 최소 간격(분) */
  cooldownMinutes: number;
};

/** 다음 버스 한 대의 도착 예측. */
export type Prediction = {
  /** API가 준 원문 (예: "3분30초후[2번째 전]") */
  message: string;
  /** 도착까지 남은 초. 출발대기/운행종료면 null */
  etaSeconds: number | null;
  /** 몇 정거장 전인지. 모르면 null */
  stopsAway: number | null;
  currentStation: string | null;
  plateNo: string | null;
  isLast: boolean;
  isFull: boolean;
  lowFloor: boolean;
  /** "여유" | "보통" | "혼잡" | "매우혼잡" | null */
  congestion: string | null;
};

export type Arrival = {
  arsId: string;
  stationName: string;
  routeName: string;
  /** 간선 / 지선 / 광역 … */
  routeType: string;
  /** 방면 (예: "서초역") */
  direction: string;
  first: Prediction | null;
  second: Prediction | null;
};

export type StationHit = {
  arsId: string;
  stationName: string;
  latitude: number | null;
  longitude: number | null;
};
