/**
 * 강의용 데모 스텁 (Supabase 대체)
 *
 * 원본 프로젝트(hsmatching)의 lib/supabase.ts 중 검사 플로우가 실제로 사용하는
 * 두 함수만 동일한 시그니처로 재현합니다. 네트워크 호출은 전혀 하지 않으며,
 * 결과는 브라우저 localStorage에만 남깁니다.
 *
 * → 인터넷 연결이나 API 키 없이도 검사가 끝까지 동작합니다.
 */

const DEMO_STORAGE_KEY = 'demo_pilot_results';

export interface DemoPilotRecord {
  code: string;
  savedAt: string;
  rawAnswers: any;
  options?: Record<string, any>;
}

/** 저장된 데모 결과 전체를 반환 (강의 중 "데이터가 이렇게 쌓입니다" 시연용) */
export function getDemoPilotResults(): DemoPilotRecord[] {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DemoPilotRecord[]) : [];
  } catch {
    return [];
  }
}

/** 저장된 데모 결과 전체 삭제 */
export function clearDemoPilotResults(): void {
  localStorage.removeItem(DEMO_STORAGE_KEY);
}

/**
 * 원본: Supabase pilot_results 테이블에 INSERT
 * 데모: localStorage에 append + 콘솔 출력
 */
export async function savePilotResult(
  code: string,
  rawAnswers: any,
  options?: {
    name?: string;
    studentId?: string;
    email?: string;
    phone?: string;
    valueScores?: any;
    careerDecision?: any;
    selfEfficacy?: any;
    preferences?: any;
    deviceInfo?: any;
    riasecScores?: any;
    riasecAnswers?: any;
    skippedSupplementary?: boolean;
    department?: string;
    major?: string;
    source?: string;
    durationSeconds?: number;
  }
): Promise<void> {
  const record: DemoPilotRecord = {
    code,
    savedAt: new Date().toISOString(),
    rawAnswers,
    options,
  };

  try {
    const all = getDemoPilotResults();
    all.push(record);
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    // localStorage 용량 초과 등 — 데모에서는 저장 실패가 검사를 막지 않아야 함
    console.warn('[demo] localStorage 저장 실패 (무시하고 계속 진행):', e);
  }

  console.group('[강의용 데모] 검사 결과 저장 (실제 DB 전송 없음)');
  console.log('결과 코드:', code);
  console.log('RIASEC 점수:', options?.riasecScores);
  console.log('전체 레코드:', record);
  console.groupEnd();
}

/**
 * 원본과 동일 — 혼동 문자를 제외한 8자리 결과 코드 생성
 */
export function generatePilotCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동 문자 제외
  let code = 'P';
  for (let i = 0; i < 7; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
