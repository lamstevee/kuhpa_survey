/**
 * KUHPA 검사 결과 저장
 *
 * 배포하지 않는 로컬 전용 도구다. 저장 경로는 두 겹:
 *   1. localStorage — 항상 시도 (브라우저별로 격리되지만 마지막 백업)
 *   2. POST /api/save — `npm run dev`일 때만 vite.config.ts 미들웨어가 받아
 *      responses/*.json 으로 저장한다. `npm run build`/`preview`에는 미들웨어가
 *      없어 404가 나지만, fetch는 그걸로 reject하지 않으므로 검사는 멈추지 않는다.
 * 저장이 실패해도 검사 자체가 멈추면 안 된다 — 그래서 이 함수는 절대 throw하지 않는다.
 */

const DEMO_STORAGE_KEY = 'demo_pilot_results';

export interface DemoPilotRecord {
  code: string;
  savedAt: string;
  options?: Record<string, any>;
}

/** 저장된 결과 전체를 반환 (콘솔에서 확인용) */
export function getDemoPilotResults(): DemoPilotRecord[] {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DemoPilotRecord[]) : [];
  } catch {
    return [];
  }
}

/** 저장된 결과 전체 삭제 (조 편성 완료 후 폐기용) */
export function clearDemoPilotResults(): void {
  localStorage.removeItem(DEMO_STORAGE_KEY);
}

export async function savePilotResult(
  code: string,
  options?: {
    name?: string;
    studentId?: string;
    riasecScores?: any;
    riasecAnswers?: any;
    interestedFields?: string[];
  }
): Promise<void> {
  const record: DemoPilotRecord = {
    code,
    savedAt: new Date().toISOString(),
    options,
  };

  try {
    const all = getDemoPilotResults();
    all.push(record);
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.warn('[save] localStorage 저장 실패 (무시하고 계속 진행):', e);
  }

  let body: string;
  try {
    body = JSON.stringify(record);
  } catch (e) {
    console.warn('[save] 결과 직렬화 실패 (무시하고 계속 진행):', e);
    return;
  }

  await fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  }).catch((e) => console.warn('[save] 서버(dev) 저장 실패 — npm run dev가 아니면 정상입니다:', e));

  console.log('[KUHPA] 검사 결과 저장 완료. 결과 코드:', code);
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
