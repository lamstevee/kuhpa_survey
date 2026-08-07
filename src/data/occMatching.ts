// ============================================================
// 직무 RIASEC 프로파일 · 샘플 데이터
// ------------------------------------------------------------
// 강의용 데모를 위해 직접 작성한 예시 데이터입니다.
// 실제 직업 조사 결과나 검증된 프로파일이 아니며,
// 벡터값은 추천 화면의 동작을 보여주기 위한 임의의 예시입니다.
// ============================================================
import type { Dim } from './questionPool';

export type RoleProfile = { key: string; name: string; vec: Partial<Record<Dim, number>>; };

export const OCC_ROLES: RoleProfile[] = [
  // ===== R (현실형) 중심 =====
  { key: 'occ_mech_eng',    name: '기계공학 기술자',   vec: { R: 0.95, I: 0.75, A: 0.20, S: 0.20, E: 0.35, C: 0.55 } },
  { key: 'occ_elec_eng',    name: '전기·전자 기술자',  vec: { R: 0.90, I: 0.80, A: 0.15, S: 0.20, E: 0.30, C: 0.60 } },
  { key: 'occ_civil_eng',   name: '토목·건설 기술자',  vec: { R: 0.90, I: 0.65, A: 0.25, S: 0.30, E: 0.45, C: 0.65 } },
  { key: 'occ_pilot',       name: '항공기 조종사',     vec: { R: 0.85, I: 0.60, A: 0.15, S: 0.35, E: 0.50, C: 0.80 } },
  { key: 'occ_trainer',     name: '스포츠 지도자',     vec: { R: 0.85, I: 0.25, A: 0.35, S: 0.80, E: 0.60, C: 0.30 } },

  // ===== I (탐구형) 중심 =====
  { key: 'occ_data_sci',    name: '데이터 분석가',     vec: { R: 0.35, I: 0.95, A: 0.25, S: 0.30, E: 0.45, C: 0.85 } },
  { key: 'occ_researcher',  name: '자연과학 연구원',   vec: { R: 0.55, I: 0.98, A: 0.25, S: 0.25, E: 0.20, C: 0.70 } },
  { key: 'occ_sw_dev',      name: '소프트웨어 개발자', vec: { R: 0.55, I: 0.90, A: 0.35, S: 0.25, E: 0.40, C: 0.75 } },
  { key: 'occ_ai_eng',      name: 'AI 엔지니어',       vec: { R: 0.45, I: 0.95, A: 0.30, S: 0.25, E: 0.45, C: 0.75 } },
  { key: 'occ_actuary',     name: '보험계리사',        vec: { R: 0.15, I: 0.90, A: 0.10, S: 0.25, E: 0.45, C: 0.95 } },
  { key: 'occ_med_tech',    name: '임상 연구원',       vec: { R: 0.50, I: 0.90, A: 0.20, S: 0.50, E: 0.25, C: 0.80 } },

  // ===== A (예술형) 중심 =====
  { key: 'occ_designer',    name: '시각 디자이너',     vec: { R: 0.40, I: 0.35, A: 0.98, S: 0.40, E: 0.55, C: 0.30 } },
  { key: 'occ_ux',          name: 'UX/UI 디자이너',    vec: { R: 0.35, I: 0.60, A: 0.90, S: 0.55, E: 0.55, C: 0.45 } },
  { key: 'occ_writer',      name: '작가·에디터',       vec: { R: 0.10, I: 0.65, A: 0.95, S: 0.50, E: 0.40, C: 0.40 } },
  { key: 'occ_musician',    name: '음악가',            vec: { R: 0.30, I: 0.30, A: 0.98, S: 0.45, E: 0.40, C: 0.25 } },
  { key: 'occ_pd',          name: '방송 PD',           vec: { R: 0.35, I: 0.50, A: 0.90, S: 0.65, E: 0.80, C: 0.40 } },
  { key: 'occ_architect',   name: '건축가',            vec: { R: 0.75, I: 0.65, A: 0.90, S: 0.35, E: 0.55, C: 0.60 } },

  // ===== S (사회형) 중심 =====
  { key: 'occ_teacher',     name: '중등학교 교사',     vec: { R: 0.25, I: 0.60, A: 0.45, S: 0.95, E: 0.50, C: 0.55 } },
  { key: 'occ_counselor',   name: '상담 전문가',       vec: { R: 0.15, I: 0.65, A: 0.40, S: 0.98, E: 0.40, C: 0.45 } },
  { key: 'occ_social',      name: '사회복지사',        vec: { R: 0.25, I: 0.40, A: 0.30, S: 0.95, E: 0.50, C: 0.60 } },
  { key: 'occ_hr',          name: '인사·교육 담당자',  vec: { R: 0.15, I: 0.50, A: 0.30, S: 0.85, E: 0.70, C: 0.70 } },
  { key: 'occ_nurse',       name: '보건 관리자',       vec: { R: 0.45, I: 0.60, A: 0.20, S: 0.90, E: 0.40, C: 0.70 } },

  // ===== E (진취형) 중심 =====
  { key: 'occ_marketer',    name: '마케팅 기획자',     vec: { R: 0.15, I: 0.60, A: 0.65, S: 0.65, E: 0.95, C: 0.50 } },
  { key: 'occ_sales',       name: '영업 관리자',       vec: { R: 0.25, I: 0.35, A: 0.25, S: 0.75, E: 0.95, C: 0.55 } },
  { key: 'occ_pm',          name: '서비스 기획자(PM)', vec: { R: 0.25, I: 0.70, A: 0.55, S: 0.60, E: 0.85, C: 0.65 } },
  { key: 'occ_consultant',  name: '경영 컨설턴트',     vec: { R: 0.15, I: 0.85, A: 0.35, S: 0.60, E: 0.90, C: 0.70 } },
  { key: 'occ_founder',     name: '창업가',            vec: { R: 0.35, I: 0.60, A: 0.60, S: 0.55, E: 0.98, C: 0.35 } },
  { key: 'occ_lawyer',      name: '법률 전문가',       vec: { R: 0.10, I: 0.85, A: 0.30, S: 0.55, E: 0.80, C: 0.85 } },

  // ===== C (관습형) 중심 =====
  { key: 'occ_accountant',  name: '회계사',            vec: { R: 0.15, I: 0.65, A: 0.10, S: 0.30, E: 0.55, C: 0.98 } },
  { key: 'occ_tax',         name: '세무사',            vec: { R: 0.10, I: 0.60, A: 0.10, S: 0.35, E: 0.55, C: 0.95 } },
  { key: 'occ_public',      name: '공무원(행정)',      vec: { R: 0.20, I: 0.50, A: 0.15, S: 0.65, E: 0.50, C: 0.92 } },
  { key: 'occ_finance',     name: '금융 사무원',       vec: { R: 0.15, I: 0.65, A: 0.15, S: 0.45, E: 0.65, C: 0.90 } },
  { key: 'occ_qa',          name: '품질 관리자',       vec: { R: 0.65, I: 0.65, A: 0.15, S: 0.35, E: 0.40, C: 0.90 } },
  { key: 'occ_librarian',   name: '기록·정보 관리자',  vec: { R: 0.20, I: 0.70, A: 0.30, S: 0.50, E: 0.25, C: 0.90 } },
];
