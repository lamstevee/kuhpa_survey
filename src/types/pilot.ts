// KUHPA 신입 학회원 적성·흥미 검사 — 타입 정의

import type { ClusterType } from '../data/questionPool';

// 검사 단계
export type PilotPhase = 'intro' | 'interest_select' | 'riasec' | 'complete';

// 내부 코드는 그대로 유지. 화면 노출 라벨은 riasecData.ts 참조.
// R=연결가 I=분석가 A=이론가 S=조율가 E=비평가 C=정리가
export interface RiasecScores {
  R: number;
  I: number;
  A: number;
  S: number;
  E: number;
  C: number;
}

// 문항 id → 선택('A' | 'B')
export interface RiasecAnswer {
  [questionId: number]: 'A' | 'B';
}

export interface ParticipantInfo {
  name: string;
  studentId: string;
}

// 검사 완료 결과 (로컬 파일/localStorage에 저장되는 형태)
export interface PilotResult {
  code: string;
  name?: string;
  studentId?: string;
  riasecScores: RiasecScores;
  riasecAnswers: RiasecAnswer;
  interestedFields: ClusterType[];
  createdAt: string;
}
