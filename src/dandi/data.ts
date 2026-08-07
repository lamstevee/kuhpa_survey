/**
 * 단디 프로토타입 — 목업 데이터와 목적별 최소정보 플레이북.
 * 제안서 12p(핵심 기능)·14p(화면1·2)·16p(기술 구성)의 룰 부분을 그대로 옮긴 것.
 */

export type FieldKey =
  | "name"
  | "phone"
  | "email"
  | "school"
  | "statement"
  | "address"
  | "rrn";

export type PiiLevel = "direct" | "indirect" | "none";

export const FIELDS: Record<
  FieldKey,
  { label: string; pii: PiiLevel; note?: string }
> = {
  name: { label: "이름", pii: "direct" },
  phone: { label: "전화번호", pii: "direct" },
  email: { label: "이메일", pii: "direct" },
  school: { label: "학교·소속", pii: "indirect" },
  statement: { label: "지원내용", pii: "none" },
  address: { label: "집 주소", pii: "direct", note: "공모전 운영에 불필요" },
  rrn: { label: "주민등록번호", pii: "direct", note: "법령 근거 필요" },
};

/** 폼 생성 시 단디가 추천하는 기본 수집 항목 (14p 화면1) */
export const RECOMMENDED: FieldKey[] = ["name", "phone", "school", "statement"];
/** 목적상 불필요해 단디가 걸러낸 항목 */
export const EXCLUDED_AT_SETUP: FieldKey[] = ["address", "rrn"];

export type PurposeKey = "review" | "sms" | "attendance" | "report";

export const PURPOSES: {
  key: PurposeKey;
  label: string;
  desc: string;
  fields: FieldKey[];
  reason: string;
  /** 집계 통계로만 내보내는 목적 */
  aggregate?: boolean;
}[] = [
  {
    key: "review",
    label: "심사용 자료",
    desc: "심사위원에게 지원서를 전달",
    fields: ["school", "statement"],
    reason:
      "이름·연락처 등 직접식별정보를 제외했어요. 접수번호와 원본의 연결정보는 심사위원에게 제공되지 않고 별도로 관리됩니다.",
  },
  {
    key: "sms",
    label: "문자 안내용",
    desc: "합격·일정 안내 문자 발송",
    fields: ["name", "phone"],
    reason:
      "문자 발송에는 이름과 전화번호만 필요해요. 지원내용과 이메일은 담지 않았어요.",
  },
  {
    key: "attendance",
    label: "출석 확인용",
    desc: "행사 당일 현장 접수",
    fields: ["name", "school"],
    reason:
      "현장에서 본인 확인에 필요한 최소 항목만 담았어요. 연락처는 인쇄물로 나가지 않습니다.",
  },
  {
    key: "report",
    label: "결과보고용",
    desc: "학교 제출용 집계 통계",
    fields: [],
    aggregate: true,
    reason:
      "개인 단위 자료 없이 집계 통계만 만들었어요. 이 자료는 파기 대상이 아니라 보관 대상입니다.",
  },
];

export type Row = { id: number; code: string } & Record<FieldKey, string>;

const SURNAMES = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임"];
const SCHOOLS = [
  "고려대 보건정책관리학부",
  "연세대 보건행정학과",
  "서울대 보건대학원",
  "중앙대 경영학부",
  "이화여대 융합보건학과",
  "성균관대 소프트웨어학과",
];
const STATEMENTS = [
  "의료데이터 분석 동아리 활동 경험을 바탕으로 지원합니다.",
  "병원 경영 컨설팅 인턴 경험을 살리고 싶습니다.",
  "디지털 헬스케어 스타트업 창업을 준비 중입니다.",
  "보건정책 연구에 관심이 있어 참여하고자 합니다.",
  "공공보건 데이터 시각화 프로젝트를 진행했습니다.",
];

/** 143건 목업 응답. 값은 전부 생성된 예시이며 실제 개인정보가 아니다. */
export const RESPONSES: Row[] = Array.from({ length: 143 }, (_, i) => {
  const n = i + 1;
  return {
    id: n,
    code: `A-${String(n).padStart(3, "0")}`,
    name: `${SURNAMES[i % SURNAMES.length]}○○`,
    phone: `010-${String(1000 + (i * 37) % 9000)}-${String(1000 + (i * 71) % 9000)}`,
    email: `applicant${n}@example.com`,
    school: SCHOOLS[i % SCHOOLS.length],
    statement: STATEMENTS[i % STATEMENTS.length],
    address: "서울시 성북구 안암로 ○○",
    rrn: "000000-0******",
  };
});

export const REVIEWERS = ["김○○ 교수", "이○○ 위원", "박○○ 위원"];

/** 프로젝트 마감 체크리스트 (15p 화면4) */
export type CloseItemKey = "links" | "stats" | "originals" | "external";

export const CLOSE_ITEMS: {
  key: CloseItemKey;
  label: string;
  detail: string;
  action: string;
  /** 승인 후 실행 결과 문구 */
  done: string;
  /** 파기가 아니라 보관/확인 성격이면 true */
  keep?: boolean;
}[] = [
  {
    key: "links",
    label: "공유 링크 3개",
    detail: "심사용 자료 · 8월 14일 만료 예정",
    action: "만료",
    done: "링크 3개 즉시 만료 처리했어요. 이후 접근은 모두 차단됩니다.",
  },
  {
    key: "stats",
    label: "집계 통계 생성 · 보관",
    detail: "지원자 143명 · 학교별 분포 · 개인 식별 불가",
    action: "생성·보관",
    keep: true,
    done: "결과보고용 집계 통계를 만들어 보호공간에 보관했어요.",
  },
  {
    key: "originals",
    label: "원본 응답 143건",
    detail: "파기 후보 · 운영자 승인 후 30일 유예기간",
    action: "파기 승인",
    done: "파기 예약했어요. 30일 유예기간 동안 복구할 수 있습니다.",
  },
  {
    key: "external",
    label: "외부 반출 파일 1건",
    detail: "3월 12일 엑셀 다운로드 · 단체방 공유 이력",
    action: "회수 요청",
    done: "받은 사람에게 회수 요청을 보냈어요. 확인 여부를 추적합니다.",
  },
];

/** 파기 후보에서 제외된 자료 (15p) */
export const NEEDS_REVIEW = {
  label: "정산 근거 자료 1건",
  reason:
    "정산 근거로 법적 보관이 필요할 수 있어 파기 후보에서 제외하고 '추가 확인 필요'로 분류했어요.",
};

// ---- 프로토타입 전역 상태 -------------------------------------------------

export type DandiState = {
  step: number;
  /** 화면1에서 확정한 수집 항목 */
  collected: FieldKey[];
  purposeText: string;
  endText: string;
  /** 화면2에서 고른 목적 */
  purpose: PurposeKey | null;
  /** 화면3 공유 설정 */
  share: { recipients: string[]; days: number; noDownload: boolean } | null;
  /** 화면4에서 승인한 마감 항목 */
  closed: CloseItemKey[];
  /** 원본 다운로드를 택한 횟수 — 제안서의 성과지표(Q2) 데모용 */
  rawDownloads: number;
};

export const INITIAL_STATE: DandiState = {
  step: 0,
  collected: RECOMMENDED,
  purposeText: "대학생 공모전 운영",
  endText: "결과 발표 후 30일까지 관리",
  purpose: null,
  share: null,
  closed: [],
  rawDownloads: 0,
};

export type StepProps = {
  state: DandiState;
  set: (patch: Partial<DandiState>) => void;
  next: () => void;
};
