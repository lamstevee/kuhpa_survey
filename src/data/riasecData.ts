// 논문 리딩 세션 팀역할 6유형 데이터
// 공유 데이터 파일: PilotIntro, RiasecResult, RiasecTypeModal에서 사용
// 내부 코드 R/I/A/S/E/C는 그대로 유지하고 의미만 학회 맥락으로 재해석했다.

export type RiasecCode = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export interface RiasecTypeData {
  code: RiasecCode;
  name: string;
  fullName: string;
  color: string;
  emoji: string;
  description: string;
  coreTraits: string[];
  workPreferences: string[];
  idealEnvironments: string[]; // 잘 맞는 논문 유형
  representativeCareers: string[]; // 함께 있으면 좋은 조원 역할
}

export const RIASEC_DATA: Record<RiasecCode, RiasecTypeData> = {
  R: {
    code: 'R',
    name: '연결가',
    fullName: 'Bridger',
    color: '#DC6B4A',
    emoji: '🌉',
    description:
      '연결가는 논문의 결론을 실제 의료 현장과 정책에 연결해 생각하는 역할입니다. 이론적인 논의보다 "그래서 이게 우리 현실에 어떤 의미인가"를 항상 궁리하며, 실무적 함의와 적용 가능성을 찾는 데 강합니다.',
    coreTraits: ['실무 감각', '현장 적용에 대한 관심', '정책·제도와의 연결고리 파악', '구체적인 예시로 설명하는 힘'],
    workPreferences: ['논문의 정책적·실무적 함의 정리', '현장 사례와 비교하기', '발표에서 "그래서 어떻게 쓰이는가" 파트'],
    idealEnvironments: ['정책 평가 연구', '사례 기반·현장 개입 연구'],
    representativeCareers: ['조율가', '분석가'],
  },
  I: {
    code: 'I',
    name: '분석가',
    fullName: 'Analyst',
    color: '#4A6FA5',
    emoji: '📊',
    description:
      '분석가는 논문의 통계와 연구방법론을 꼼꼼히 검토하는 역할입니다. 표본, 회귀분석 결과, 신뢰구간을 직접 따라가며 결론이 데이터로 실제로 지지되는지를 확인하는 데서 만족을 느낍니다.',
    coreTraits: ['통계·수치에 대한 감각', '꼼꼼한 검토', '논리적 사고', '데이터로 판단하는 습관'],
    workPreferences: ['회귀분석·통계 결과 해석', '연구방법론 검토', '데이터 재확인'],
    idealEnvironments: ['정량 분석 중심 논문', '역학·통계 연구'],
    representativeCareers: ['비평가', '이론가'],
  },
  A: {
    code: 'A',
    name: '이론가',
    fullName: 'Theorist',
    color: '#9B7CB8',
    emoji: '📚',
    description:
      '이론가는 논문이 어떤 개념적 틀과 선행연구 위에 서 있는지 정리하는 역할입니다. 새로운 개념을 만나면 기존 이론과의 연결고리를 찾고, 큰 맥락 속에서 논문을 위치시키는 데 강합니다.',
    coreTraits: ['개념 정리 능력', '선행연구 맥락화', '큰 그림을 보는 시야', '이론적 배경 설명력'],
    workPreferences: ['이론적 배경과 맥락 정리', '개념 간 연결고리 찾기', '프레임워크 설명'],
    idealEnvironments: ['이론 중심 논문', '개념적 프레임워크를 제시하는 연구'],
    representativeCareers: ['정리가', '분석가'],
  },
  S: {
    code: 'S',
    name: '조율가',
    fullName: 'Facilitator',
    color: '#5B9A8B',
    emoji: '🤝',
    description:
      '조율가는 세션의 흐름을 만들고 조원들의 의견을 통합하는 역할입니다. 의견이 충돌할 때 양쪽 논지를 정리해 합의점을 찾고, 누구나 편하게 말할 수 있는 분위기를 만드는 데 강합니다.',
    coreTraits: ['진행·통합 능력', '경청', '갈등 조정', '편안한 분위기 조성'],
    workPreferences: ['발표 순서·역할 조율', '토론 진행', '의견 통합'],
    idealEnvironments: ['다양한 해석이 가능한 논문', '토론이 활발히 필요한 주제'],
    representativeCareers: ['연결가', '비평가'],
  },
  E: {
    code: 'E',
    name: '비평가',
    fullName: 'Critic',
    color: '#E8B86D',
    emoji: '🔍',
    description:
      '비평가는 논문의 한계와 허점을 짚어내는 역할입니다. 저자의 결론을 그대로 받아들이지 않고, 인과관계 주장이 설계로 정당화되는지, 논리적 허점은 없는지 의심하고 반론을 제기합니다.',
    coreTraits: ['비판적 사고', '허점을 짚는 감각', '근거를 따지는 습관', '반론 제기 능력'],
    workPreferences: ['한계점·타당성 지적', '반론 준비', '토론에서 질문 던지기'],
    idealEnvironments: ['인과관계를 강하게 주장하는 논문', '논쟁적인 주제'],
    representativeCareers: ['조율가', '정리가'],
  },
  C: {
    code: 'C',
    name: '정리가',
    fullName: 'Organizer',
    color: '#7C8798',
    emoji: '📋',
    description:
      '정리가는 논의된 내용을 요약하고 문서로 남기는 역할입니다. 핵심 내용을 깔끔하게 정리하고 표와 자료를 구조화해, 세션이 끝난 뒤에도 남은 사람들이 쉽게 되짚어볼 수 있게 만듭니다.',
    coreTraits: ['요약·문서화 능력', '꼼꼼함', '구조화하는 습관', '가독성 있는 정리'],
    workPreferences: ['핵심 요약 슬라이드 제작', '논의 내용 기록', '표·자료 구조화'],
    idealEnvironments: ['정보량이 많은 논문', '여러 논문을 비교하는 세션'],
    representativeCareers: ['이론가', '비평가'],
  },
};

// 간단한 유형 목록 (PilotIntro 등에서 사용)
export const RIASEC_TYPES = Object.values(RIASEC_DATA).map(({ code, name, color, emoji }) => ({
  code,
  name,
  color,
  emoji,
}));
