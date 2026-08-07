// ============================================================
// 학과 → 단과대학 매핑 · 샘플 데이터
// ------------------------------------------------------------
// 원본에서는 외부 인증(SSO)으로 전달된 학과 코드/이름을 단과대학으로
// 매핑해 추천 범위를 제한하는 데 사용했습니다.
// 이 데모에는 인증 연동이 없으므로 샘플 전공 구성에 맞춘
// 최소한의 매핑만 남겨 두었습니다.
// ============================================================

export type CollegeName =
  | '인문대학'
  | '사회과학대학'
  | '경영대학'
  | '공과대학'
  | '자연과학대학'
  | '예술체육대학'
  | '융합대학';

interface DepartmentEntry {
  departname: string;
  college: CollegeName;
}

const DEPARTMENT_COLLEGE_LIST: DepartmentEntry[] = [
  { departname: '국어국문학', college: '인문대학' },
  { departname: '영어영문학', college: '인문대학' },
  { departname: '사학', college: '인문대학' },
  { departname: '철학', college: '인문대학' },

  { departname: '행정학', college: '사회과학대학' },
  { departname: '심리학', college: '사회과학대학' },
  { departname: '사회복지학', college: '사회과학대학' },
  { departname: '미디어커뮤니케이션학', college: '사회과학대학' },

  { departname: '경영학', college: '경영대학' },
  { departname: '경제학', college: '경영대학' },
  { departname: '회계세무학', college: '경영대학' },
  { departname: '국제통상학', college: '경영대학' },

  { departname: '컴퓨터공학', college: '공과대학' },
  { departname: '기계공학', college: '공과대학' },
  { departname: '전자공학', college: '공과대학' },
  { departname: '건축학', college: '공과대학' },

  { departname: '수학', college: '자연과학대학' },
  { departname: '화학', college: '자연과학대학' },
  { departname: '생명과학', college: '자연과학대학' },
  { departname: '식품영양학', college: '자연과학대학' },

  { departname: '시각디자인학', college: '예술체육대학' },
  { departname: '음악학', college: '예술체육대학' },
  { departname: '체육학', college: '예술체육대학' },

  { departname: '인공지능학', college: '융합대학' },
  { departname: '데이터사이언스학', college: '융합대학' },
  { departname: '문화콘텐츠학', college: '융합대학' },
];

/** 학과명(또는 전공명)으로 단과대학을 찾습니다. */
export function getCollegeByDepartment(departname: string, majorname?: string): CollegeName | null {
  const targets = [departname, majorname].filter(Boolean) as string[];
  for (const t of targets) {
    const hit = DEPARTMENT_COLLEGE_LIST.find(
      (e) => t.includes(e.departname) || e.departname.includes(t)
    );
    if (hit) return hit.college;
  }
  return null;
}

/**
 * 학과 코드로 단과대학을 찾습니다.
 * 데모에는 코드 체계가 없으므로 항상 null을 반환합니다.
 */
export function getCollegeByCode(_departcode?: string, _majorcode?: string): CollegeName | null {
  return null;
}

/**
 * 소속 학생에게만 추천하는 단과대학 목록.
 * 데모에서는 모든 전공을 동등하게 추천하므로 비어 있습니다.
 */
export const CONDITIONAL_EXCLUSION_COLLEGES: CollegeName[] = [];
