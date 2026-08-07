import { PilotQuestion } from '../types/pilot';

export const PILOT_QUESTIONS: PilotQuestion[] = [
  // ===== 직업가치관 (V01-V15) - Likert 5점 =====
  { id: 'V01', area: 'value', type: 'likert', text: '직업선택에서 높은 연봉은 중요하다' },
  { id: 'V02', area: 'value', type: 'likert', text: '직업선택에서 초봉보다 앞으로의 성장가능성이 더 중요하다' },
  { id: 'V03', area: 'value', type: 'likert', text: '안정적으로 오래 다닐 수 있는 직장인지가 중요하다' },
  { id: 'V04', area: 'value', type: 'likert', text: '불안정해도 성장하는 산업인지가 중요하다' },
  { id: 'V05', area: 'value', type: 'likert', text: '남들이 인정해주는 직업을 갖는 것이 중요하다' },
  { id: 'V06', area: 'value', type: 'likert', text: '가족이나 친구 등 중요한 타인이 좋다고 하는 직업이 중요하다' },
  { id: 'V07', area: 'value', type: 'likert', text: '내 방식대로 일할 수 있는 자유가 중요하다' },
  { id: 'V08', area: 'value', type: 'likert', text: '정해진 시간보다 유연하게 일할 수 있는 직장인지가 중요하다' },
  { id: 'V09', area: 'value', type: 'likert', text: '사회적으로 도움이 되는 직업을 갖는 것은 중요하다' },
  { id: 'V10', area: 'value', type: 'likert', text: '연봉보다는 의미 있는 일을 하는 것이 중요하다' },
  { id: 'V11', area: 'value', type: 'likert', text: '어려운 목표달성에서 보람을 느낄 수 있는 것이 중요하다' },
  { id: 'V12', area: 'value', type: 'likert', text: '성과를 내기 위해 경쟁하는 것도 마다하지 않는다' },
  { id: 'V13', area: 'value', type: 'likert', text: '한 분야에서 전문가가 되는 것이 중요하다' },
  { id: 'V14', area: 'value', type: 'likert', text: '여러 분야를 넓게 경험하는 것이 중요하다' },
  { id: 'V15', area: 'value', type: 'likert', text: '일보다 개인 생활이 더 중요하다' },

  // ===== 진로결정 (D01-D04) - Likert 5점 =====
  { id: 'D01', area: 'decision', type: 'likert', text: '나는 어떤 전공으로 진학할지 정했다' },
  { id: 'D02', area: 'decision', type: 'likert', text: '나는 구체적인 진로 목표가 있다' },
  { id: 'D03', area: 'decision', type: 'likert', text: '내 진로 선택에 확신이 있다' },
  { id: 'D04', area: 'decision', type: 'likert', text: '다양한 전공과 직업을 더 알아보고 싶다' },

  // ===== 자기효능감 (E01-E06) - RIASEC 연계 Likert 5점 =====
  { id: 'E01', area: 'efficacy', type: 'likert', text: '나는 복잡한 문제를 논리적으로 분석할 수 있다', riasecDim: 'I' },
  { id: 'E02', area: 'efficacy', type: 'likert', text: '나는 창의적인 아이디어를 잘 떠올린다', riasecDim: 'A' },
  { id: 'E03', area: 'efficacy', type: 'likert', text: '나는 상대방을 배려하며 관계를 잘 맺는다', riasecDim: 'S' },
  { id: 'E04', area: 'efficacy', type: 'likert', text: '나는 팀을 이끌고 결정을 내리는 것에 자신있다', riasecDim: 'E' },
  { id: 'E05', area: 'efficacy', type: 'likert', text: '나는 손으로 무언가를 만들거나 조작하는 것을 잘한다', riasecDim: 'R' },
  { id: 'E06', area: 'efficacy', type: 'likert', text: '나는 계획을 세우고 체계적으로 실행하는 것을 잘한다', riasecDim: 'C' },

  // ===== 현실고려 (P01-P05) - Likert 5점 =====
  { id: 'P01', area: 'practical', type: 'likert', text: '졸업 후 취업이 잘 되는 전공을 선택하고 싶다' },
  { id: 'P02', area: 'practical', type: 'likert', text: '취업전망보다 하고 싶은 공부가 더 중요하다' },
  { id: 'P03', area: 'practical', type: 'likert', text: 'AI 시대에도 살아남을 직업을 찾고 싶다' },

  // ===== 구체선호 (S01-S04) - 단일선택 =====
  {
    id: 'S01',
    area: 'preference',
    type: 'single',
    text: '현재 가장 관심 있는 계열은?',
    options: ['인문', '사회', '교육', '공학', '자연', '의약', '예체능', '아직 미정']
  },
  {
    id: 'S02',
    area: 'preference',
    type: 'single',
    text: '다음 중 가장 해보고 싶은 일은?',
    options: ['연구개발', '기획/마케팅', '영업/상담', '디자인/창작', '교육/지도', '행정/관리', '기술/제작', '의료/케어']
  },
  {
    id: 'S03',
    area: 'preference',
    type: 'single',
    text: '선호하는 근무 환경은?',
    options: ['대기업', '공기업/공무원', '스타트업', '전문직', '프리랜서', '창업', '연구기관']
  },
  {
    id: 'S04',
    area: 'preference',
    type: 'single',
    text: '선호하는 업무 방식은?',
    options: ['혼자 집중', '팀 협업', '고객 대면', '현장 활동', '재택/유연근무']
  },

  // ===== 조건부 심층 (C01-C04) =====
  {
    id: 'C01',
    area: 'conditional',
    type: 'single',
    text: '공학 내에서 가장 관심 있는 분야는?',
    options: ['기계/자동차', '전기/전자', '컴퓨터/SW', '화학/신소재', '건축/토목', '산업공학'],
    condition: { dependsOn: 'S01', values: ['공학'] }
  },
  {
    id: 'C02',
    area: 'conditional',
    type: 'single',
    text: '사회계열 내에서 가장 관심 있는 분야는?',
    options: ['경영/경제', '법/행정', '미디어/광고', '사회복지', '심리/상담'],
    condition: { dependsOn: 'S01', values: ['사회'] }
  },
  {
    id: 'C03',
    area: 'conditional',
    type: 'multi',
    text: '전공을 정하지 못한 이유는? (해당하는 것 모두 선택)',
    options: ['정보가 부족해서', '흥미가 불확실해서', '성적이 걱정되어서', '부모님 의견 때문에', '관심 분야가 여러 개라서'],
    condition: { dependsOn: 'D01', values: [1, 2] },
    maxSelections: 5
  },
  {
    id: 'C04',
    area: 'conditional',
    type: 'single',
    text: '자연과학계열 내에서 가장 관심 있는 분야는?',
    options: ['수학/통계', '물리', '화학', '생물/생명', '지구/환경'],
    condition: { dependsOn: 'S01', values: ['자연'] }
  },

  // ===== 롤모델 (R01-R02) =====
  {
    id: 'R01',
    area: 'rolemodel',
    type: 'freetext',
    text: '관심 있는 직업이 있다면 입력해 주세요 (없으면 건너뛰기)'
  },
  {
    id: 'R02',
    area: 'rolemodel',
    type: 'multi',
    text: '어떤 선배의 이야기가 듣고 싶나요? (해당하는 것 모두 선택)',
    options: ['같은 전공 졸업생', '비슷한 흥미유형 선배', '원하는 직업 종사자', '진로 변경 경험자'],
    maxSelections: 4
  },

  // ===== 가치순위 (K01) =====
  {
    id: 'K01',
    area: 'ranking',
    type: 'ranking',
    text: '직업 선택 시 가장 중요한 것 3가지를 순서대로 선택하세요',
    options: ['연봉', '안정성', '흥미/적성', '사회기여', '워라밸', '성장가능성', '전문성', '사회적 인정'],
    maxRank: 3
  }
];

// Helper to get questions by area
export function getQuestionsByArea(area: string): PilotQuestion[] {
  return PILOT_QUESTIONS.filter(q => q.area === area);
}

// Helper to check if conditional question should be shown
export function shouldShowQuestion(question: PilotQuestion, answers: Record<string, any>): boolean {
  if (!question.condition) return true;

  const { dependsOn, values } = question.condition;
  const dependentAnswer = answers[dependsOn];

  if (dependentAnswer === undefined) return false;

  return values.includes(dependentAnswer);
}

// Get active questions based on current answers
export function getActiveQuestions(answers: Record<string, any>): PilotQuestion[] {
  return PILOT_QUESTIONS.filter(q => shouldShowQuestion(q, answers));
}

// Question area labels for UI
export const AREA_LABELS: Record<string, { label: string; emoji: string }> = {
  value: { label: '직업가치관', emoji: '💎' },
  decision: { label: '진로결정', emoji: '🧭' },
  efficacy: { label: '자기효능감', emoji: '💪' },
  practical: { label: '현실고려', emoji: '📋' },
  preference: { label: '구체선호', emoji: '🎯' },
  conditional: { label: '심층질문', emoji: '🔍' },
  rolemodel: { label: '롤모델', emoji: '⭐' },
  ranking: { label: '가치순위', emoji: '🏆' }
};

// Likert scale labels
export const LIKERT_LABELS = [
  { value: 1, label: '전혀 아니다' },
  { value: 2, label: '아니다' },
  { value: 3, label: '보통이다' },
  { value: 4, label: '그렇다' },
  { value: 5, label: '매우 그렇다' }
];
