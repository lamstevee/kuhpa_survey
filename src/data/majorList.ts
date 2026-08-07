// ============================================================
// 전공 목록 · 샘플 데이터
// ------------------------------------------------------------
// 강의용 데모를 위해 직접 작성한 예시 데이터입니다.
// 특정 대학의 실제 학과 구성이나 검증된 프로파일이 아니며,
// RIASEC 벡터는 화면 동작을 보여주기 위한 임의의 예시값입니다.
// 진로 상담이나 실제 진단 목적으로 사용하지 마세요.
// ============================================================
import type { ClusterType } from './questionPool';

type Dim = 'R' | 'I' | 'A' | 'S' | 'E' | 'C' | 'V';

export interface MajorHierarchyEntry {
  cluster: ClusterType;
  college: string;
  department: string;
  major: string;
  majorName: string;
}

interface Major {
  key: string;
  name: string;
  vec: Partial<Record<Dim, number>>;
  cluster: ClusterType;
  college: string;
  url?: string;
}

// 데모에서는 학과 홈페이지 링크를 제공하지 않습니다.
export function getMajorUrl(_majorName: string): string | undefined {
  return undefined;
}

interface SampleMajor {
  key: string;
  name: string;
  college: string;
  department: string;
  cluster: ClusterType;
  vec: Record<'R' | 'I' | 'A' | 'S' | 'E' | 'C', number>;
}

// 7개 계열 × 3~4개 전공 = 24개 샘플 전공
const SAMPLE_MAJORS: SampleMajor[] = [
  // ===== 인문 =====
  { key: 'korean_lit',   name: '국어국문학과',   college: '인문대학',   department: '국어국문학과',   cluster: '인문',
    vec: { R: 0.15, I: 0.70, A: 0.85, S: 0.60, E: 0.35, C: 0.45 } },
  { key: 'english_lit',  name: '영어영문학과',   college: '인문대학',   department: '영어영문학과',   cluster: '인문',
    vec: { R: 0.15, I: 0.70, A: 0.75, S: 0.65, E: 0.45, C: 0.50 } },
  { key: 'history',      name: '사학과',         college: '인문대학',   department: '사학과',         cluster: '인문',
    vec: { R: 0.20, I: 0.90, A: 0.60, S: 0.45, E: 0.25, C: 0.60 } },
  { key: 'philosophy',   name: '철학과',         college: '인문대학',   department: '철학과',         cluster: '인문',
    vec: { R: 0.10, I: 0.95, A: 0.70, S: 0.45, E: 0.25, C: 0.40 } },

  // ===== 사회 =====
  { key: 'public_admin', name: '행정학과',       college: '사회과학대학', department: '행정학과',     cluster: '사회',
    vec: { R: 0.20, I: 0.60, A: 0.25, S: 0.75, E: 0.75, C: 0.85 } },
  { key: 'psychology',   name: '심리학과',       college: '사회과학대학', department: '심리학과',     cluster: '사회',
    vec: { R: 0.20, I: 0.85, A: 0.45, S: 0.90, E: 0.40, C: 0.55 } },
  { key: 'social_work',  name: '사회복지학과',   college: '사회과학대학', department: '사회복지학과', cluster: '사회',
    vec: { R: 0.25, I: 0.45, A: 0.35, S: 0.95, E: 0.55, C: 0.55 } },
  { key: 'media_comm',   name: '미디어커뮤니케이션학과', college: '사회과학대학', department: '미디어커뮤니케이션학과', cluster: '사회',
    vec: { R: 0.25, I: 0.55, A: 0.75, S: 0.75, E: 0.70, C: 0.40 } },

  // ===== 경상 =====
  { key: 'business',     name: '경영학과',       college: '경영대학',   department: '경영학과',       cluster: '경상',
    vec: { R: 0.20, I: 0.55, A: 0.30, S: 0.60, E: 0.95, C: 0.75 } },
  { key: 'economics',    name: '경제학과',       college: '경영대학',   department: '경제학과',       cluster: '경상',
    vec: { R: 0.15, I: 0.90, A: 0.20, S: 0.40, E: 0.70, C: 0.80 } },
  { key: 'accounting',   name: '회계세무학과',   college: '경영대학',   department: '회계세무학과',   cluster: '경상',
    vec: { R: 0.15, I: 0.60, A: 0.10, S: 0.35, E: 0.55, C: 0.95 } },
  { key: 'intl_trade',   name: '국제통상학과',   college: '경영대학',   department: '국제통상학과',   cluster: '경상',
    vec: { R: 0.20, I: 0.60, A: 0.30, S: 0.60, E: 0.85, C: 0.70 } },

  // ===== 공학 =====
  { key: 'computer_eng', name: '컴퓨터공학과',   college: '공과대학',   department: '컴퓨터공학과',   cluster: '공학',
    vec: { R: 0.65, I: 0.90, A: 0.30, S: 0.25, E: 0.40, C: 0.75 } },
  { key: 'mechanical',   name: '기계공학과',     college: '공과대학',   department: '기계공학과',     cluster: '공학',
    vec: { R: 0.95, I: 0.80, A: 0.25, S: 0.20, E: 0.35, C: 0.65 } },
  { key: 'electronic',   name: '전자공학과',     college: '공과대학',   department: '전자공학과',     cluster: '공학',
    vec: { R: 0.85, I: 0.85, A: 0.20, S: 0.20, E: 0.35, C: 0.70 } },
  { key: 'architecture', name: '건축학과',       college: '공과대학',   department: '건축학과',       cluster: '공학',
    vec: { R: 0.80, I: 0.65, A: 0.85, S: 0.35, E: 0.50, C: 0.60 } },

  // ===== 자연 =====
  { key: 'mathematics',  name: '수학과',         college: '자연과학대학', department: '수학과',       cluster: '자연',
    vec: { R: 0.20, I: 0.98, A: 0.30, S: 0.20, E: 0.20, C: 0.80 } },
  { key: 'chemistry',    name: '화학과',         college: '자연과학대학', department: '화학과',       cluster: '자연',
    vec: { R: 0.70, I: 0.95, A: 0.20, S: 0.25, E: 0.20, C: 0.75 } },
  { key: 'life_science', name: '생명과학과',     college: '자연과학대학', department: '생명과학과',   cluster: '자연',
    vec: { R: 0.60, I: 0.95, A: 0.25, S: 0.35, E: 0.25, C: 0.70 } },
  { key: 'food_nutrition', name: '식품영양학과', college: '자연과학대학', department: '식품영양학과', cluster: '자연',
    vec: { R: 0.60, I: 0.75, A: 0.35, S: 0.70, E: 0.35, C: 0.70 } },

  // ===== 예체능 =====
  { key: 'visual_design', name: '시각디자인학과', college: '예술체육대학', department: '시각디자인학과', cluster: '예체능',
    vec: { R: 0.45, I: 0.35, A: 0.98, S: 0.40, E: 0.55, C: 0.35 } },
  { key: 'music',        name: '음악학과',       college: '예술체육대학', department: '음악학과',     cluster: '예체능',
    vec: { R: 0.35, I: 0.30, A: 0.98, S: 0.50, E: 0.40, C: 0.35 } },
  { key: 'sports',       name: '체육학과',       college: '예술체육대학', department: '체육학과',     cluster: '예체능',
    vec: { R: 0.90, I: 0.30, A: 0.45, S: 0.75, E: 0.65, C: 0.35 } },

  // ===== 융합 =====
  { key: 'ai_convergence', name: '인공지능학과', college: '융합대학',   department: '인공지능학과',   cluster: '융합',
    vec: { R: 0.55, I: 0.95, A: 0.35, S: 0.25, E: 0.45, C: 0.75 } },
  { key: 'data_science', name: '데이터사이언스학과', college: '융합대학', department: '데이터사이언스학과', cluster: '융합',
    vec: { R: 0.40, I: 0.95, A: 0.25, S: 0.30, E: 0.50, C: 0.90 } },
  { key: 'culture_content', name: '문화콘텐츠학과', college: '융합대학', department: '문화콘텐츠학과', cluster: '융합',
    vec: { R: 0.25, I: 0.55, A: 0.90, S: 0.65, E: 0.70, C: 0.40 } },
];

export function getMajorHierarchyEntries(): MajorHierarchyEntry[] {
  return SAMPLE_MAJORS.map((m) => ({
    cluster: m.cluster,
    college: m.college,
    department: m.department,
    major: m.name,
    majorName: m.name,
  }));
}

export const MAJORS: Major[] = SAMPLE_MAJORS.map((m) => ({
  key: m.key,
  name: m.name,
  vec: m.vec,
  cluster: m.cluster,
  college: m.college,
}));
