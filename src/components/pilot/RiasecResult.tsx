import React, { useMemo, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { RiasecScores, ValueScores, SelfEfficacy } from '../../types/pilot';
import { MAJORS } from '../../data/majorList';
import { RIASEC_DATA, RiasecCode } from '../../data/riasecData';
import { recommendRoles } from '../../utils/roleRecommendation';
import { getWorkpediaJobUrl } from '../../data/workpediaJobMap';
import {
  isAbsoluteExcludedMajor,
  isConditionalExcludedCollege,
  STRICT_EXCLUSION_COLLEGES,
  CONDITIONAL_EXCLUSION_COLLEGES,
  shouldShowDiscontinuedMajor,
} from '../../utils/recommendMajors';

// Supplementary survey result data - display-ready types
interface SupplementaryData {
  valueScores?: ValueScores;
  careerDecision?: {
    level: string;        // '확정' | '탐색' | '미결정'
    confidence: number;   // 0-1 scale for display
  };
  selfEfficacy?: SelfEfficacy;
  preferences?: {
    fieldPreference?: string;
    workStyle?: string;
    environmentPreference?: string;
  };
  roleModel?: {
    name?: string;
    traits?: string[];
  };
  valueRanking?: Record<string, number>;
}

interface RiasecResultProps {
  scores: RiasecScores;
  onContinue?: () => void;
  onSkip?: () => void;
  onNavigate?: (page: string) => void;
  onRestart?: () => void;
  onStartSupplementary?: () => void;  // 보완검사 시작 (건너뛴 경우)
  participantName?: string;
  supplementaryData?: SupplementaryData;
  isComplete?: boolean;  // true if survey is complete (shows different UI)
  interestedMajorKeys?: string[];
  userCollege?: string | null;  // 사용자 소속 단과대학 (조건부 제외 필터용)
  userMajorName?: string | null;  // 사용자 학과/전공명 (폐과 필터링용)
  mode?: 'external' | 'default' | 'sso';
}

// Unified color palette - Light theme matching other question components
const COLORS = {
  bg: '#FAFAF9',
  surface: '#FFFFFF',
  primary: '#1E3A5F',
  secondary: '#4A6FA5',
  accent: '#E8B86D',
  muted: '#94A3B8',
  text: {
    primary: '#1E293B',
    secondary: '#475569',
    muted: '#94A3B8',
  },
  chart: {
    fill: 'rgba(30, 58, 95, 0.2)',
    stroke: '#1E3A5F',
  },
  card: {
    bg: '#FFFFFF',
    border: '#E2E8F0',
  },
  // Print-friendly colors for PDF export
  pdf: {
    primary: '#1E3A5F',
    secondary: '#4A6FA5',
    accent: '#E8B86D',
    text: {
      primary: '#1E293B',
      secondary: '#475569',
    }
  }
};

// Use shared RIASEC data - build RIASEC_LABELS from it
const RIASEC_LABELS: Record<string, { name: string; fullName: string; color: string; description: string; careers: string[] }> = Object.fromEntries(
  Object.entries(RIASEC_DATA).map(([code, data]) => [
    code,
    {
      name: data.name,
      fullName: data.fullName,
      color: data.color,
      description: data.description,
      careers: data.representativeCareers.slice(0, 5),
    },
  ])
);

// Major descriptions for top recommendations - 풍부한 전공 소개
export const MAJOR_DESCRIPTIONS: Record<string, string> = {
  // 샘플 데이터: 강의용 데모를 위해 작성한 예시 소개문입니다.
  '국어국문학과': '한국어의 구조와 한국 문학의 흐름을 깊이 있게 탐구합니다. 문학 작품 분석과 글쓰기 훈련을 통해 언어를 다루는 감각과 해석 능력을 기르며, 출판·미디어·교육 분야로 진출합니다.',
  '영어영문학과': '영어권의 언어와 문학, 문화를 함께 학습합니다. 원서 강독과 토론을 통해 언어 능력과 비판적 독해력을 기르며, 통번역·국제 업무·교육 분야에서 활동합니다.',
  '사학과': '사료를 읽고 해석하며 과거의 사건과 구조를 재구성합니다. 자료를 비판적으로 검토하는 훈련을 통해 맥락을 읽는 힘을 기르며, 연구·기록관리·문화기획 분야로 나아갑니다.',
  '철학과': '존재, 인식, 윤리에 대한 근본 물음을 다룹니다. 개념을 정확히 규정하고 논증을 구성하는 훈련을 통해 사고의 엄밀함을 기르며, 연구·기획·정책 분야에서 강점을 발휘합니다.',
  '행정학과': '공공 조직의 운영 원리와 정책 과정을 학습합니다. 정책 설계와 평가, 조직 관리 역량을 기르며, 공공기관과 공기업, 정책 연구 분야로 진출합니다.',
  '심리학과': '인간의 인지, 정서, 행동을 과학적 방법으로 연구합니다. 실험 설계와 통계 분석을 익히고 상담 이론을 학습하여, 상담·인사·사용자 조사 분야에서 활동합니다.',
  '사회복지학과': '개인과 지역사회의 복지 문제를 진단하고 개입 방법을 설계합니다. 상담과 사례 관리, 자원 연계 실무를 익혀 복지기관과 공공영역으로 진출합니다.',
  '미디어커뮤니케이션학과': '미디어의 생산과 수용, 사회적 영향을 분석합니다. 콘텐츠 기획과 제작 실습을 병행하여 언론·홍보·콘텐츠 산업에서 활동합니다.',
  '경영학과': '조직의 전략, 마케팅, 재무, 인사 전반을 폭넓게 학습합니다. 사례 분석과 팀 프로젝트를 통해 의사결정 역량을 기르며, 기업 전반의 직무로 진출합니다.',
  '경제학과': '자원 배분과 시장의 작동 원리를 이론과 데이터로 분석합니다. 계량 분석 역량을 갖추어 금융·정책 연구·데이터 분석 분야에서 활동합니다.',
  '회계세무학과': '재무 정보의 기록과 보고, 세법의 적용을 학습합니다. 회계 기준과 세무 실무를 익혀 회계법인, 기업 재무팀, 세무 분야로 진출합니다.',
  '국제통상학과': '국가 간 무역의 구조와 통상 규범을 학습합니다. 무역 실무와 외국어 역량을 갖추어 무역회사, 물류, 국제기구 분야에서 활동합니다.',
  '컴퓨터공학과': '자료구조와 알고리즘, 운영체제, 데이터베이스 등 전산의 기초 이론을 다지고 실제 시스템을 구현합니다. 프로젝트 중심 학습을 통해 개발 역량을 기르며 IT 산업 전반으로 진출합니다.',
  '기계공학과': '역학과 열유체를 기반으로 기계 시스템을 설계하고 해석합니다. 설계 도구와 제조 공정을 익혀 제조·자동차·항공 산업에서 활동합니다.',
  '전자공학과': '회로와 신호처리, 반도체 소자의 원리를 학습합니다. 실험과 설계 실습을 통해 하드웨어 구현 역량을 갖추고 전자·반도체 산업으로 진출합니다.',
  '건축학과': '공간의 기능과 형태를 함께 다루며 설계 스튜디오 중심으로 학습합니다. 구조와 환경, 도시 맥락을 이해하고 설계사무소와 건설 분야에서 활동합니다.',
  '수학과': '해석학, 대수학, 기하학 등 수학의 기본 구조를 엄밀하게 학습합니다. 추상적 사고와 논증 능력을 기르며 연구·금융·데이터 분야로 진출합니다.',
  '화학과': '물질의 구조와 반응을 실험과 이론으로 탐구합니다. 분석과 합성 실험 역량을 갖추어 화학·소재·제약 산업의 연구개발 분야에서 활동합니다.',
  '생명과학과': '생명 현상을 분자와 세포 수준에서 연구합니다. 실험 설계와 데이터 해석 역량을 기르며 바이오·제약·연구기관으로 진출합니다.',
  '식품영양학과': '식품의 성분과 영양이 건강에 미치는 영향을 학습합니다. 영양 평가와 급식 관리 실무를 익혀 보건·식품 산업 분야에서 활동합니다.',
  '시각디자인학과': '메시지를 시각 언어로 전환하는 과정을 학습합니다. 타이포그래피, 브랜딩, 편집 실습을 통해 표현력을 기르며 디자인 스튜디오와 기업으로 진출합니다.',
  '음악학과': '연주와 창작, 음악 이론을 함께 학습합니다. 개인 실기와 앙상블을 병행하며 표현 역량을 기르고 공연·교육·음악 산업에서 활동합니다.',
  '체육학과': '운동의 생리학적 원리와 지도 방법을 학습합니다. 실기와 이론을 병행하여 지도 역량을 갖추고 스포츠 현장과 건강 관리 분야로 진출합니다.',
  '인공지능학과': '머신러닝과 딥러닝의 이론을 학습하고 실제 문제에 적용합니다. 수학적 기초와 구현 능력을 함께 갖추어 AI 연구와 서비스 개발 분야로 진출합니다.',
  '데이터사이언스학과': '통계와 프로그래밍을 결합해 데이터에서 의미를 도출합니다. 분석과 시각화, 모델링 역량을 기르며 다양한 산업의 데이터 직무로 진출합니다.',
  '문화콘텐츠학과': '콘텐츠의 기획부터 제작, 유통까지의 과정을 학습합니다. 스토리텔링과 매체 이해를 바탕으로 콘텐츠 산업 전반에서 활동합니다.',
};

// Major career paths
export const MAJOR_CAREERS: Record<string, string[]> = {
  // 샘플 데이터: 강의용 데모를 위해 작성한 예시 진로입니다.
  '국어국문학과': ['작가·에디터', '출판 기획자', '국어 교사', '콘텐츠 기획자'],
  '영어영문학과': ['통번역사', '해외 영업', '영어 교사', '국제 업무 담당자'],
  '사학과': ['학예연구사', '기록물 관리사', '역사 교사', '연구원'],
  '철학과': ['연구원', '정책 기획자', '논술 강사', '기획·전략 담당자'],
  '행정학과': ['공무원(행정)', '정책 연구원', '공기업 사무직', '공공기관 기획'],
  '심리학과': ['상담 전문가', '인사·교육 담당자', 'UX 리서처', '임상 연구원'],
  '사회복지학과': ['사회복지사', '복지기관 관리자', '사례 관리자', '공공 복지 담당자'],
  '미디어커뮤니케이션학과': ['방송 PD', '홍보 담당자', '기자', '콘텐츠 마케터'],
  '경영학과': ['마케팅 기획자', '경영 컨설턴트', '인사·교육 담당자', '창업가'],
  '경제학과': ['금융 사무원', '경제 분석가', '데이터 분석가', '정책 연구원'],
  '회계세무학과': ['회계사', '세무사', '재무 담당자', '내부 감사'],
  '국제통상학과': ['무역 담당자', '물류 관리자', '해외 영업', '국제기구 종사자'],
  '컴퓨터공학과': ['소프트웨어 개발자', 'AI 엔지니어', '서비스 기획자(PM)', '데이터 분석가'],
  '기계공학과': ['기계공학 기술자', '품질 관리자', '생산 관리자', '설계 엔지니어'],
  '전자공학과': ['전기·전자 기술자', '반도체 엔지니어', '임베디드 개발자', '품질 관리자'],
  '건축학과': ['건축가', '토목·건설 기술자', '인테리어 디자이너', '공간 기획자'],
  '수학과': ['보험계리사', '데이터 분석가', '수학 교사', '연구원'],
  '화학과': ['자연과학 연구원', '품질 관리자', '소재 개발자', '분석 전문가'],
  '생명과학과': ['임상 연구원', '자연과학 연구원', '바이오 품질 관리자', '제약 연구원'],
  '식품영양학과': ['영양사', '보건 관리자', '식품 품질 관리자', '식품 개발자'],
  '시각디자인학과': ['시각 디자이너', 'UX/UI 디자이너', '브랜드 디자이너', '아트 디렉터'],
  '음악학과': ['음악가', '음악 교사', '공연 기획자', '음향 감독'],
  '체육학과': ['스포츠 지도자', '체육 교사', '트레이너', '스포츠 기획자'],
  '인공지능학과': ['AI 엔지니어', '데이터 분석가', '소프트웨어 개발자', '연구원'],
  '데이터사이언스학과': ['데이터 분석가', 'AI 엔지니어', '서비스 기획자(PM)', '리서치 애널리스트'],
  '문화콘텐츠학과': ['콘텐츠 기획자', '방송 PD', '작가·에디터', '마케팅 기획자'],
};

// Holland's Hexagonal Model - Type Relationships
// Adjacent types share similarities, opposite types are contrasting
const HOLLAND_HEXAGON: Record<RiasecCode, { adjacent: RiasecCode[]; opposite: RiasecCode }> = {
  R: { adjacent: ['I', 'C'], opposite: 'S' },
  I: { adjacent: ['R', 'A'], opposite: 'E' },
  A: { adjacent: ['I', 'S'], opposite: 'C' },
  S: { adjacent: ['A', 'E'], opposite: 'R' },
  E: { adjacent: ['S', 'C'], opposite: 'I' },
  C: { adjacent: ['E', 'R'], opposite: 'A' },
};

// RIASEC Type-specific strengths, activities, and environments for richer explanations
const RIASEC_MATCH_CONTEXT: Record<RiasecCode, {
  coreStrengths: string[];
  typicalActivities: string[];
  learningStyle: string;
  workEnvironment: string;
  growthAreas: string[];
}> = {
  R: {
    coreStrengths: ['실용적 문제해결', '도구·기계 활용', '체계적 작업 수행', '손재주와 정밀함'],
    typicalActivities: ['제품 설계 및 제작', '기계 조작', '건설·조립 작업', '현장 실습'],
    learningStyle: '직접 해보며 배우는 실습 중심 학습',
    workEnvironment: '구체적 결과물이 보이는 실무 환경',
    growthAreas: ['기술적 전문성', '문제해결 능력', '프로젝트 완수력'],
  },
  I: {
    coreStrengths: ['분석적 사고', '지적 호기심', '논리적 추론', '깊이 있는 탐구'],
    typicalActivities: ['연구·실험 수행', '데이터 분석', '이론 검증', '문제 원인 규명'],
    learningStyle: '이론과 원리를 파악하는 탐구 중심 학습',
    workEnvironment: '자율적으로 연구할 수 있는 학문적 환경',
    growthAreas: ['전문 지식', '연구 역량', '비판적 사고력'],
  },
  A: {
    coreStrengths: ['창의적 표현', '독창성', '미적 감각', '비정형적 사고'],
    typicalActivities: ['디자인·창작', '예술적 표현', '컨셉 기획', '콘텐츠 제작'],
    learningStyle: '자유로운 실험과 표현을 통한 창작 중심 학습',
    workEnvironment: '창의성을 존중하는 자유로운 환경',
    growthAreas: ['예술적 역량', '창의적 문제해결', '자기표현력'],
  },
  S: {
    coreStrengths: ['대인관계', '공감능력', '협업 역량', '커뮤니케이션'],
    typicalActivities: ['상담·조언', '교육·지도', '팀 협업', '사회적 지원'],
    learningStyle: '토론과 협력을 통한 상호작용 중심 학습',
    workEnvironment: '사람들과 함께 일하는 협력적 환경',
    growthAreas: ['리더십', '갈등해결', '사회적 영향력'],
  },
  E: {
    coreStrengths: ['설득력', '추진력', '리더십', '목표 지향성'],
    typicalActivities: ['프로젝트 주도', '협상·영업', '조직 관리', '의사결정'],
    learningStyle: '실전 경험과 도전을 통한 성과 중심 학습',
    workEnvironment: '성과와 경쟁이 있는 역동적 환경',
    growthAreas: ['경영 역량', '네트워킹', '전략적 사고'],
  },
  C: {
    coreStrengths: ['정확성', '체계적 관리', '세부사항 주의', '효율성 추구'],
    typicalActivities: ['데이터 정리', '문서 관리', '절차 수립', '품질 검증'],
    learningStyle: '체계적 커리큘럼을 통한 단계적 학습',
    workEnvironment: '명확한 규칙과 절차가 있는 안정적 환경',
    growthAreas: ['전문 자격', '운영 역량', '시스템 관리'],
  },
};

// Major category contexts for more specific explanations
const MAJOR_CATEGORY_CONTEXT: Record<string, {
  category: string;
  fieldCharacteristics: string;
  keySkillAreas: string[];
}> = {
  // 샘플 데이터: 강의용 데모를 위해 작성한 예시입니다.
  '국어국문학과': { category: 'humanities', fieldCharacteristics: '언어와 문학의 깊이 있는 해석', keySkillAreas: ['문학 분석', '글쓰기', '언어 연구'] },
  '영어영문학과': { category: 'humanities', fieldCharacteristics: '영어권 언어와 문화의 이해', keySkillAreas: ['언어 능력', '문학 분석', '문화 이해'] },
  '사학과': { category: 'humanities', fieldCharacteristics: '사료 비판과 역사적 맥락의 재구성', keySkillAreas: ['자료 해석', '비판적 독해', '서술'] },
  '철학과': { category: 'humanities', fieldCharacteristics: '개념 분석과 논증의 구성', keySkillAreas: ['논리적 사고', '개념 분석', '윤리적 판단'] },
  '행정학과': { category: 'social', fieldCharacteristics: '공공 정책의 설계와 집행', keySkillAreas: ['정책 분석', '조직 관리', '행정 절차'] },
  '심리학과': { category: 'social', fieldCharacteristics: '인간 행동의 과학적 이해', keySkillAreas: ['실험 설계', '통계 분석', '상담'] },
  '사회복지학과': { category: 'social', fieldCharacteristics: '복지 욕구의 진단과 개입 설계', keySkillAreas: ['상담', '사례 관리', '자원 연계'] },
  '미디어커뮤니케이션학과': { category: 'social', fieldCharacteristics: '미디어의 생산과 사회적 영향 분석', keySkillAreas: ['콘텐츠 기획', '미디어 분석', '커뮤니케이션'] },
  '경영학과': { category: 'business', fieldCharacteristics: '조직 운영과 전략적 의사결정', keySkillAreas: ['전략 수립', '마케팅', '조직 관리'] },
  '경제학과': { category: 'business', fieldCharacteristics: '자원 배분과 시장 구조의 분석', keySkillAreas: ['계량 분석', '경제 모델링', '정책 평가'] },
  '회계세무학과': { category: 'business', fieldCharacteristics: '재무 정보의 기록과 검증', keySkillAreas: ['회계 처리', '세무 실무', '감사'] },
  '국제통상학과': { category: 'business', fieldCharacteristics: '국가 간 무역과 통상 규범', keySkillAreas: ['무역 실무', '외국어', '시장 분석'] },
  '컴퓨터공학과': { category: 'engineering', fieldCharacteristics: '논리적 알고리즘 설계와 시스템 구축', keySkillAreas: ['프로그래밍', '시스템 설계', '문제 분해'] },
  '기계공학과': { category: 'engineering', fieldCharacteristics: '기계 시스템의 설계와 최적화', keySkillAreas: ['설계', '해석', '제조 공정'] },
  '전자공학과': { category: 'engineering', fieldCharacteristics: '전자회로와 신호처리 기술 개발', keySkillAreas: ['회로 설계', '시스템 분석', '하드웨어 구현'] },
  '건축학과': { category: 'architecture', fieldCharacteristics: '공간의 기능성과 심미성을 융합한 설계', keySkillAreas: ['공간 설계', '구조 이해', '미적 표현'] },
  '수학과': { category: 'science', fieldCharacteristics: '추상적 구조의 엄밀한 탐구', keySkillAreas: ['논증', '수리적 모델링', '추상화'] },
  '화학과': { category: 'science', fieldCharacteristics: '물질의 구조와 반응 연구', keySkillAreas: ['실험 분석', '물질 합성', '품질 검증'] },
  '생명과학과': { category: 'science', fieldCharacteristics: '생명 현상의 분자적 이해', keySkillAreas: ['실험 설계', '데이터 해석', '분석 기술'] },
  '식품영양학과': { category: 'science', fieldCharacteristics: '식품 성분과 건강의 관계 분석', keySkillAreas: ['영양 평가', '위생 관리', '실험 분석'] },
  '시각디자인학과': { category: 'art', fieldCharacteristics: '메시지의 시각적 전환과 표현', keySkillAreas: ['시각 표현', '타이포그래피', '브랜딩'] },
  '음악학과': { category: 'art', fieldCharacteristics: '음악적 표현과 창작', keySkillAreas: ['연주', '작곡', '음악 해석'] },
  '체육학과': { category: 'art', fieldCharacteristics: '신체 활동의 원리와 지도', keySkillAreas: ['운동 지도', '체력 관리', '프로그램 설계'] },
  '인공지능학과': { category: 'engineering', fieldCharacteristics: '학습 알고리즘의 설계와 응용', keySkillAreas: ['머신러닝', '수리적 모델링', '구현'] },
  '데이터사이언스학과': { category: 'engineering', fieldCharacteristics: '데이터 기반의 문제 해결', keySkillAreas: ['통계 분석', '프로그래밍', '시각화'] },
  '문화콘텐츠학과': { category: 'art', fieldCharacteristics: '콘텐츠의 기획과 매체 확장', keySkillAreas: ['스토리텔링', '기획', '매체 이해'] },
};

// Simple deterministic hash based on string for consistent selection
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// 3-code position explanations for RIASEC combinations
const CODE_POSITION_EXPLANATIONS: Record<RiasecCode, {
  primary: string;      // When this is the 1st code (dominant)
  secondary: string;    // When this is the 2nd code (supportive)
  tertiary: string;     // When this is the 3rd code (influencing)
}> = {
  R: {
    primary: '현실적이고 실용적인 접근을 가장 중시합니다. 눈에 보이는 결과물을 만들고, 도구와 기술을 직접 다루는 활동에서 가장 큰 성취감을 느낍니다. 이론보다 실습을, 추상보다 구체를 선호하는 것이 핵심 특징입니다.',
    secondary: '주된 관심사를 현실에서 구현하는 실행력을 제공합니다. 아이디어를 실제로 작동하는 결과물로 바꾸는 능력이 있으며, 기술적 문제 해결에 강점이 있습니다.',
    tertiary: '학습과 활동에 실용성을 더합니다. 이론적 지식을 실제 상황에 적용하려는 성향이 있어, 배운 것을 현실에서 활용하는 데 관심을 기울입니다.',
  },
  I: {
    primary: '지적 호기심과 분석적 사고가 핵심입니다. 현상의 원리를 깊이 탐구하고, 논리적으로 문제를 분석하며, 증거에 기반한 결론을 도출하는 것을 중시합니다. 복잡한 문제를 체계적으로 풀어가는 과정 자체에서 만족을 얻습니다.',
    secondary: '주된 활동에 분석력과 비판적 사고를 더합니다. 단순히 실행하는 것을 넘어 "왜 그런지"를 이해하려 하며, 데이터와 논리에 기반한 의사결정을 선호합니다.',
    tertiary: '깊이 있는 학습과 근본 원리 이해에 대한 관심을 부여합니다. 표면적인 이해를 넘어 본질을 파악하려는 성향이 있어, 전문성을 키우는 데 도움이 됩니다.',
  },
  A: {
    primary: '창의성과 자기표현이 가장 중요합니다. 독창적인 아이디어를 구현하고, 틀에 박히지 않은 새로운 방식을 추구하며, 미적 감각을 활용한 창작 활동에서 가장 빛납니다. 자유로운 환경에서 영감을 발휘하는 것을 선호합니다.',
    secondary: '주된 관심사에 창의적 관점과 미적 감각을 더합니다. 기존의 방식에서 벗어나 새로운 해결책을 모색하며, 결과물의 심미적 완성도에도 관심을 기울입니다.',
    tertiary: '독창성과 유연한 사고를 학습과 활동에 불어넣습니다. 정해진 틀 안에서도 자신만의 색깔을 표현하려 하며, 다양한 관점에서 문제를 바라보는 경향이 있습니다.',
  },
  S: {
    primary: '사람과의 관계와 도움이 핵심 가치입니다. 타인을 돕고, 가르치고, 협력하는 활동에서 가장 큰 보람을 느낍니다. 공감 능력이 뛰어나며, 대인관계를 통해 사회적 가치를 만들어가는 것을 중시합니다.',
    secondary: '주된 활동에 협력적 태도와 대인관계 역량을 더합니다. 혼자보다 함께 일할 때 더 효과적이며, 팀원들과의 소통과 조화를 중요하게 생각합니다.',
    tertiary: '사회적 책임감과 공동체 의식을 부여합니다. 자신의 활동이 타인에게 미치는 영향을 고려하며, 관계 형성과 네트워킹에 자연스러운 관심을 보입니다.',
  },
  E: {
    primary: '리더십과 목표 달성이 핵심입니다. 사람들을 설득하고 이끌며, 조직이나 프로젝트를 주도하는 역할에서 능력을 발휘합니다. 도전적인 목표를 세우고 성과를 만들어내는 것에 열정을 가지고 있습니다.',
    secondary: '주된 관심사에 추진력과 실행력을 더합니다. 아이디어를 현실로 만들기 위해 적극적으로 움직이며, 기회를 포착하고 행동으로 옮기는 데 강점이 있습니다.',
    tertiary: '도전 정신과 성취 지향성을 부여합니다. 현재에 안주하지 않고 더 높은 목표를 향해 나아가려 하며, 경쟁적인 상황에서 동기부여를 받는 경향이 있습니다.',
  },
  C: {
    primary: '체계성과 정확성이 가장 중요합니다. 명확한 절차와 규칙 안에서 효율적으로 일하며, 세부사항을 꼼꼼하게 관리하는 데 탁월합니다. 안정적이고 예측 가능한 환경에서 높은 생산성을 발휘합니다.',
    secondary: '주된 활동에 조직력과 효율성을 더합니다. 계획을 세우고 체계적으로 실행하는 능력이 있으며, 데이터와 정보를 정리하고 관리하는 데 강점을 보입니다.',
    tertiary: '질서와 안정에 대한 선호를 부여합니다. 업무나 학습에서 구조화된 접근을 선호하며, 일관성과 정확성을 추구하는 성향이 있습니다.',
  },
};

// Generate rich match reason based on Holland theory and major context
function generateMatchReason(
  userScores: RiasecScores,
  majorVec: Partial<Record<string, number>>,
  majorName: string,
  displayName: string = '회원님'
): string {
  const dims: Array<keyof RiasecScores> = ['R', 'I', 'A', 'S', 'E', 'C'];

  // Find top 3 dimensions for user and major
  const userTop = [...dims]
    .map((d) => ({ dim: d, score: userScores[d] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const majorTop = [...dims]
    .map((d) => ({ dim: d, score: majorVec[d] || 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const userPrimary = userTop[0].dim;
  const userSecondary = userTop[1].dim;
  const majorPrimary = majorTop[0].dim;
  const majorSecondary = majorTop[1].dim;

  const userTopDims = userTop.map((t) => t.dim);
  const majorTopDims = majorTop.slice(0, 2).map((t) => t.dim);
  const overlap = userTopDims.filter((d) => majorTopDims.includes(d));

  // Get context data
  const userPrimaryCtx = RIASEC_MATCH_CONTEXT[userPrimary];
  const majorPrimaryCtx = RIASEC_MATCH_CONTEXT[majorPrimary];
  const majorCategoryCtx = MAJOR_CATEGORY_CONTEXT[majorName];
  const hexagon = HOLLAND_HEXAGON[userPrimary];

  // Use deterministic hash for consistent selections
  const hash = hashString(majorName + userPrimary + majorPrimary);

  // Calculate congruence level
  const isHighCongruence = overlap.length >= 2;
  const isMediumCongruence = overlap.length === 1;
  const isAdjacent = hexagon.adjacent.includes(majorPrimary);
  const isOpposite = hexagon.opposite === majorPrimary;

  // Build rich explanation
  const explanations: string[] = [];

  if (isHighCongruence) {
    // High congruence: Both primary types match
    const matchedTypes = overlap.map(d => RIASEC_LABELS[d].name).join('·');
    const userStrength = userPrimaryCtx.coreStrengths[hash % 2];
    const activity = majorPrimaryCtx.typicalActivities[hash % 2];

    explanations.push(
      `${matchedTypes} 성향이 전공의 핵심 요구역량과 정확히 일치합니다.`
    );

    if (majorCategoryCtx) {
      explanations.push(
        `${majorCategoryCtx.fieldCharacteristics}을(를) 다루는 이 전공에서 ${displayName}의 '${userStrength}' 강점이 '${activity}' 활동에 직접 발휘됩니다.`
      );
    } else {
      explanations.push(
        `${displayName}의 '${userStrength}' 강점이 전공 학습의 '${activity}' 활동에서 큰 시너지를 만듭니다.`
      );
    }

    explanations.push(
      `Holland 이론에 따르면, 이러한 높은 적합도는 학업 만족도와 성취도를 높이는 핵심 요인입니다.`
    );
  } else if (isMediumCongruence) {
    // Medium congruence: One type matches
    const matchedType = RIASEC_LABELS[overlap[0]];
    const userStrength = RIASEC_MATCH_CONTEXT[overlap[0]].coreStrengths[0];
    const nonOverlap = majorTopDims.find(d => !overlap.includes(d)) || majorSecondary;
    const growthType = RIASEC_LABELS[nonOverlap];
    const growthArea = RIASEC_MATCH_CONTEXT[nonOverlap].growthAreas[0];

    explanations.push(
      `${displayName}의 ${matchedType.name} 특성(${userStrength})이 이 전공의 주요 학습 활동과 맞닿아 있습니다.`
    );

    if (majorCategoryCtx) {
      explanations.push(
        `${majorCategoryCtx.fieldCharacteristics}을(를) 배우며, ${majorCategoryCtx.keySkillAreas.slice(0, 2).join(', ')} 역량을 키울 수 있습니다.`
      );
    }

    explanations.push(
      `또한 ${growthType.name} 요소를 통해 '${growthArea}' 능력도 함께 발전시킬 기회가 됩니다.`
    );
  } else if (isAdjacent) {
    // Adjacent types on Holland's hexagon - natural progression
    const userTypeLabel = RIASEC_LABELS[userPrimary];
    const majorTypeLabel = RIASEC_LABELS[majorPrimary];

    explanations.push(
      `${displayName}의 ${userTypeLabel.name} 성향은 ${majorTypeLabel.name} 중심의 이 전공과 자연스럽게 연결됩니다.`
    );

    explanations.push(
      `Holland 육각형 모델에서 이 두 유형은 인접해 있어, ${userPrimaryCtx.learningStyle}에서 ${majorPrimaryCtx.workEnvironment}으로의 확장이 원활합니다.`
    );

    if (majorCategoryCtx) {
      explanations.push(
        `${majorCategoryCtx.keySkillAreas[0]} 등의 역량을 기존 강점 위에 쌓아갈 수 있습니다.`
      );
    }
  } else if (isOpposite) {
    // Opposite types - complementary growth opportunity
    const userTypeLabel = RIASEC_LABELS[userPrimary];
    const majorTypeLabel = RIASEC_LABELS[majorPrimary];
    const userStrength = userPrimaryCtx.coreStrengths[0];
    const newArea = majorPrimaryCtx.growthAreas[0];

    explanations.push(
      `${userTypeLabel.name} 특성의 '${userStrength}' 강점을 ${majorTypeLabel.name} 영역에 적용하면 차별화된 경쟁력이 됩니다.`
    );

    explanations.push(
      `이 전공에서 '${newArea}' 같은 새로운 역량을 개발하면, 기존 강점과 결합해 독보적인 전문성을 갖출 수 있습니다.`
    );
  } else {
    // General case
    const userTypeLabel = RIASEC_LABELS[userPrimary];
    const majorTypeLabel = RIASEC_LABELS[majorPrimary];
    const userStrength = userPrimaryCtx.coreStrengths[hash % userPrimaryCtx.coreStrengths.length];

    explanations.push(
      `${displayName}의 ${userTypeLabel.name} 특성 중 '${userStrength}'이(가) 이 전공의 ${majorTypeLabel.name} 요소와 만나 시너지를 발휘합니다.`
    );

    if (majorCategoryCtx) {
      explanations.push(
        `${majorCategoryCtx.fieldCharacteristics}을(를) 학습하며 ${majorCategoryCtx.keySkillAreas.slice(0, 2).join(', ')} 역량을 강화할 수 있습니다.`
      );
    } else {
      explanations.push(
        `${majorPrimaryCtx.workEnvironment}에서 활동하며 새로운 관점과 역량을 개발할 기회입니다.`
      );
    }
  }

  return explanations.join(' ');
}

// Calculate similarity between user scores and major profile
// Uses cosine similarity on normalized profiles + profile-shape penalty
function calculateMajorMatch(userScores: RiasecScores, majorVec: Partial<Record<string, number>>): number {
  const dims: Array<keyof RiasecScores> = ['R', 'I', 'A', 'S', 'E', 'C'];
  const maxUser = Math.max(...dims.map(d => userScores[d])) || 1;
  const maxMajor = Math.max(...dims.map(d => majorVec[d] || 0)) || 1;

  // Normalize both to 0-1 relative to own max
  const userNorm = dims.map(d => userScores[d] / maxUser);
  const majorNorm = dims.map(d => (majorVec[d] || 0) / maxMajor);

  // Cosine similarity
  let dot = 0, magU = 0, magM = 0;
  for (let i = 0; i < 6; i++) {
    dot += userNorm[i] * majorNorm[i];
    magU += userNorm[i] * userNorm[i];
    magM += majorNorm[i] * majorNorm[i];
  }
  if (magU === 0 || magM === 0) return 0;
  const cosine = dot / (Math.sqrt(magU) * Math.sqrt(magM));

  // Profile-shape distance penalty: penalize when top dimensions don't align
  // Find user's top 3 dims and check if major emphasizes them too
  const userRanked = dims
    .map((d, i) => ({ dim: d, val: userNorm[i] }))
    .sort((a, b) => b.val - a.val);
  const majorRanked = dims
    .map((d, i) => ({ dim: d, val: majorNorm[i] }))
    .sort((a, b) => b.val - a.val);

  const userTop3 = new Set(userRanked.slice(0, 3).map(x => x.dim));
  const majorTop3 = new Set(majorRanked.slice(0, 3).map(x => x.dim));
  let overlap = 0;
  userTop3.forEach(d => { if (majorTop3.has(d)) overlap++; });
  const topBonus = overlap / 3; // 0, 0.33, 0.67, or 1.0

  // Weighted mean distance (Euclidean) — low = good match
  let sumSqDiff = 0;
  for (let i = 0; i < 6; i++) {
    const diff = userNorm[i] - majorNorm[i];
    sumSqDiff += diff * diff;
  }
  const dist = Math.sqrt(sumSqDiff / 6);
  const distScore = 1 - dist; // closer = higher

  // Final: blend cosine (shape), distScore (magnitude closeness), topBonus (peak alignment)
  return cosine * 0.4 + distScore * 0.3 + topBonus * 0.3;
}

// Cosine similarity between two RIASEC vectors
function cosineSimilarity(vecA: Partial<Record<string, number>>, vecB: Partial<Record<string, number>>): number {
  const dims = ['R', 'I', 'A', 'S', 'E', 'C'] as const;
  let dot = 0, magA = 0, magB = 0;
  dims.forEach(d => {
    const a = vecA[d] || 0;
    const b = vecB[d] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  });
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// Average RIASEC vector from a list of major keys
function averageInterestVector(majorKeys: string[]): Partial<Record<string, number>> {
  const dims = ['R', 'I', 'A', 'S', 'E', 'C'] as const;
  if (majorKeys.length === 0) return {};
  const sum: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  let count = 0;
  majorKeys.forEach(key => {
    const major = MAJORS.find(m => m.key === key);
    if (major) {
      dims.forEach(d => { sum[d] += major.vec[d] || 0; });
      count++;
    }
  });
  if (count === 0) return {};
  dims.forEach(d => { sum[d] /= count; });
  return sum;
}

const RiasecResult: React.FC<RiasecResultProps> = ({
  scores,
  onContinue,
  onSkip,
  onNavigate,
  onRestart,
  onStartSupplementary,
  participantName,
  supplementaryData,
  isComplete = false,
  interestedMajorKeys = [],
  userCollege,
  userMajorName,
  mode,
}) => {
  // Helper to get display name
  const displayName = participantName || '회원님';
  const dimensions: Array<keyof RiasecScores> = ['R', 'I', 'A', 'S', 'E', 'C'];
  const [selectedMajorIndex, setSelectedMajorIndex] = useState<number>(0);
  const [expandedProfiles, setExpandedProfiles] = useState<Set<number>>(new Set());
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [showPDFView, setShowPDFView] = useState<boolean>(false);
  const [applySupplementary, setApplySupplementary] = useState<boolean>(false);
  const [showAllInterests, setShowAllInterests] = useState<boolean>(false);
  const [showSupplementary, setShowSupplementary] = useState<boolean>(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  // PDF Export function - captures pages separately
  const handleExportPDF = useCallback(async () => {
    if (isGeneratingPDF) return;

    setIsGeneratingPDF(true);
    setShowPDFView(true);

    // Wait for PDF view to render
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      const page1Element = document.getElementById('pdf-page-1');
      const page2Element = document.getElementById('pdf-page-2');
      const page3Element = document.getElementById('pdf-page-3');
      const page4Element = document.getElementById('pdf-page-4');

      if (!page1Element || !page2Element) {
        throw new Error('PDF content not found');
      }

      // A4 dimensions in mm
      const a4Width = 210;
      const a4Height = 297;
      const margin = 8;
      const contentWidth = a4Width - (margin * 2);
      const contentHeight = a4Height - (margin * 2);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Capture and add Page 1
      const canvas1 = await html2canvas(page1Element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
      });

      const img1Data = canvas1.toDataURL('image/png');
      // Calculate dimensions - fit to page while maintaining aspect ratio
      let img1Width = contentWidth;
      let img1Height = (canvas1.height * contentWidth) / canvas1.width;

      // If height exceeds page, scale down to fit
      if (img1Height > contentHeight) {
        const scale = contentHeight / img1Height;
        img1Height = contentHeight;
        img1Width = contentWidth * scale;
      }

      // Center horizontally if scaled down
      const x1 = margin + (contentWidth - img1Width) / 2;
      pdf.addImage(
        img1Data,
        'PNG',
        x1,
        margin,
        img1Width,
        img1Height
      );

      // Add Page 2
      pdf.addPage();

      const canvas2 = await html2canvas(page2Element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
      });

      const img2Data = canvas2.toDataURL('image/png');
      // Calculate dimensions - fit to page while maintaining aspect ratio
      let img2Width = contentWidth;
      let img2Height = (canvas2.height * contentWidth) / canvas2.width;

      // If height exceeds page, scale down to fit
      if (img2Height > contentHeight) {
        const scale = contentHeight / img2Height;
        img2Height = contentHeight;
        img2Width = contentWidth * scale;
      }

      // Center horizontally if scaled down
      const x2 = margin + (contentWidth - img2Width) / 2;
      pdf.addImage(
        img2Data,
        'PNG',
        x2,
        margin,
        img2Width,
        img2Height
      );

      // Add Page 3 if supplementary data exists
      if (page3Element && supplementaryData) {
        pdf.addPage();

        const canvas3 = await html2canvas(page3Element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#FFFFFF',
        });

        const img3Data = canvas3.toDataURL('image/png');
        let img3Width = contentWidth;
        let img3Height = (canvas3.height * contentWidth) / canvas3.width;

        if (img3Height > contentHeight) {
          const scale = contentHeight / img3Height;
          img3Height = contentHeight;
          img3Width = contentWidth * scale;
        }

        const x3 = margin + (contentWidth - img3Width) / 2;
        pdf.addImage(
          img3Data,
          'PNG',
          x3,
          margin,
          img3Width,
          img3Height
        );
      }

      // Add Page 4 - 추천 직무
      if (page4Element) {
        pdf.addPage();

        const canvas4 = await html2canvas(page4Element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#FFFFFF',
        });

        const img4Data = canvas4.toDataURL('image/png');
        let img4Width = contentWidth;
        let img4Height = (canvas4.height * contentWidth) / canvas4.width;

        if (img4Height > contentHeight) {
          const scale = contentHeight / img4Height;
          img4Height = contentHeight;
          img4Width = contentWidth * scale;
        }

        const x4 = margin + (contentWidth - img4Width) / 2;
        pdf.addImage(
          img4Data,
          'PNG',
          x4,
          margin,
          img4Width,
          img4Height
        );
      }

      // Generate filename
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const filename = participantName
        ? `전공진로적합도_결과_${participantName}_${dateStr}.pdf`
        : `전공진로적합도_결과_${dateStr}.pdf`;

      pdf.save(filename);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsGeneratingPDF(false);
      setShowPDFView(false);
    }
  }, [isGeneratingPDF, participantName]);

  const toggleProfile = (index: number) => {
    setExpandedProfiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Calculate adjusted scores using z-score standardization
  // Weight: RIASEC 0.9, Self-efficacy 0.3
  const adjustedScores = useMemo(() => {
    if (!supplementaryData?.selfEfficacy) return scores;

    // 1. Calculate RIASEC z-scores
    const riasecValues = dimensions.map(d => scores[d]);
    const riasecMean = riasecValues.reduce((a, b) => a + b, 0) / riasecValues.length;
    const riasecStd = Math.sqrt(
      riasecValues.reduce((sum, val) => sum + Math.pow(val - riasecMean, 2), 0) / riasecValues.length
    ) || 1; // prevent division by zero

    // 2. Calculate self-efficacy z-scores
    const efficacyValues = dimensions.map(d => supplementaryData.selfEfficacy?.[d] || 3);
    const efficacyMean = efficacyValues.reduce((a, b) => a + b, 0) / efficacyValues.length;
    const efficacyStd = Math.sqrt(
      efficacyValues.reduce((sum, val) => sum + Math.pow(val - efficacyMean, 2), 0) / efficacyValues.length
    ) || 1;

    // 3. Combine with weights: RIASEC 0.9 + Efficacy 0.3
    const adjusted: RiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    dimensions.forEach(dim => {
      const riasecZ = (scores[dim] - riasecMean) / riasecStd;
      const efficacyZ = ((supplementaryData.selfEfficacy?.[dim] || 3) - efficacyMean) / efficacyStd;

      // Combined z-score
      const combinedZ = (riasecZ * 0.9) + (efficacyZ * 0.3);

      // Convert back to original scale (using RIASEC mean/std as reference)
      adjusted[dim] = Math.round(riasecMean + combinedZ * riasecStd);
    });

    return adjusted;
  }, [scores, supplementaryData?.selfEfficacy]);

  // Use adjusted or original scores based on toggle
  const activeScores = applySupplementary && supplementaryData ? adjustedScores : scores;

  const sortedDimensions = [...dimensions]
    .map(dim => ({ dim, score: activeScores[dim] }))
    .sort((a, b) => b.score - a.score);

  const top3 = sortedDimensions.slice(0, 3);
  const riasecCode = top3.map(t => t.dim).join('');

  // Field preference boost mapping
  const fieldToCollegeMap: Record<string, string[]> = {
    '공학': ['공과대학', 'ICT융합대학'],
    '자연과학': ['자연과학대학', 'ICT융합대학'],
    '사회과학': ['사회과학대학', '경영대학', '법과대학'],
    '의약/보건': ['약학대학', '자연과학대학'],
    '인문': ['인문대학'],
    '예술/체육': ['예술대학'],
    '경상': ['경영대학'],
  };

  // Calculate major match with supplementary boost
  const calculateAdjustedMajorMatch = (
    userScores: RiasecScores,
    majorVec: Partial<Record<string, number>>,
    majorCollege: string
  ) => {
    let baseScore = calculateMajorMatch(userScores, majorVec);

    if (applySupplementary && supplementaryData?.preferences?.fieldPreference) {
      const preferredColleges = fieldToCollegeMap[supplementaryData.preferences.fieldPreference] || [];
      if (preferredColleges.some(c => majorCollege.includes(c))) {
        baseScore *= 1.15; // 15% boost for preferred field
      }
    }

    return Math.min(baseScore, 1); // Cap at 1.0
  };

  // Original recommendations (without supplementary)
  const interestVec = useMemo(() => averageInterestVector(interestedMajorKeys), [interestedMajorKeys]);

  // SSO 사용자가 조건부제외 단과대학 소속인지 확인
  const isUserFromConditionalCollege = userCollege && CONDITIONAL_EXCLUSION_COLLEGES.includes(userCollege);

  const originalMajors = useMemo(() => {
    return MAJORS
      // 완전제외 필터 (외국인전용, 아너칼리지 등)
      .filter(major => !isAbsoluteExcludedMajor(major.name, major.key))
      // 폐과 필터 (25학년도 신입생 미모집 - 해당 학과 소속만 노출)
      .filter(major => shouldShowDiscontinuedMajor(major.name, major.key, userMajorName || undefined))
      // 조건부제외 필터
      .filter(major => {
        // 조건부제외 단과대학 소속 SSO 사용자: 본인 단과대학 전공만 표시
        if (isUserFromConditionalCollege) {
          return major.college === userCollege;
        }
        // 일반 SSO 사용자 또는 외부접속: 조건부제외 단과대학 전공 필터링
        if (!isConditionalExcludedCollege(major.college)) return true;
        // 외부접속(userCollege 없음)인 경우: 융합대학만 제외
        if (!userCollege) {
          return !STRICT_EXCLUSION_COLLEGES.includes(major.college!);
        }
        // 일반 단과대학 SSO 사용자: 조건부제외 단과대학 전공 제외
        return false;
      })
      .map(major => {
        let matchScore = calculateMajorMatch(scores, major.vec);
        // Apply interested major bonus
        if (interestedMajorKeys.length > 0) {
          if (interestedMajorKeys.includes(major.key)) {
            matchScore += 0.08; // Direct selection bonus
          } else if (Object.keys(interestVec).length > 0) {
            matchScore += cosineSimilarity(major.vec, interestVec) * 0.12; // Similarity bonus
          }
          matchScore = Math.min(matchScore, 1.0);
        }
        return {
          ...major,
          matchScore,
          description: MAJOR_DESCRIPTIONS[major.name] || `${major.name}에서는 ${major.college} 계열의 전문 지식과 역량을 키울 수 있습니다.`,
          matchReason: generateMatchReason(scores, major.vec, major.name, displayName),
        };
      })
      .filter(m => m.matchScore > 0.5)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
  }, [scores, displayName, interestedMajorKeys, interestVec, userCollege, userMajorName]);

  // Adjusted recommendations (with supplementary applied)
  const adjustedMajors = useMemo(() => {
    if (!supplementaryData) return originalMajors;

    return MAJORS
      // 완전제외 필터 (외국인전용, 아너칼리지 등)
      .filter(major => !isAbsoluteExcludedMajor(major.name, major.key))
      // 폐과 필터 (25학년도 신입생 미모집 - 해당 학과 소속만 노출)
      .filter(major => shouldShowDiscontinuedMajor(major.name, major.key, userMajorName || undefined))
      // 조건부제외 필터 (예술체육대학, 융합대학)
      .filter(major => {
        // 조건부제외 단과대학 소속 SSO 사용자: 본인 단과대학 전공만 표시
        if (isUserFromConditionalCollege) {
          return major.college === userCollege;
        }
        // 일반 SSO 사용자 또는 외부접속: 조건부제외 단과대학 전공 필터링
        if (!isConditionalExcludedCollege(major.college)) return true;
        // 외부접속(userCollege 없음)인 경우: 융합대학만 제외
        if (!userCollege) {
          return !STRICT_EXCLUSION_COLLEGES.includes(major.college!);
        }
        // 일반 단과대학 SSO 사용자: 조건부제외 단과대학 전공 제외
        return false;
      })
      .map(major => {
        let matchScore = calculateAdjustedMajorMatch(adjustedScores, major.vec, major.college);
        // Apply interested major bonus
        if (interestedMajorKeys.length > 0) {
          if (interestedMajorKeys.includes(major.key)) {
            matchScore += 0.08;
          } else if (Object.keys(interestVec).length > 0) {
            matchScore += cosineSimilarity(major.vec, interestVec) * 0.12;
          }
          matchScore = Math.min(matchScore, 1.0);
        }
        return {
          ...major,
          matchScore,
          description: MAJOR_DESCRIPTIONS[major.name] || `${major.name}에서는 ${major.college} 계열의 전문 지식과 역량을 키울 수 있습니다.`,
          matchReason: generateMatchReason(adjustedScores, major.vec, major.name, displayName),
        };
      })
      .filter(m => m.matchScore > 0.5)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
  }, [adjustedScores, supplementaryData, displayName, interestedMajorKeys, interestVec, userCollege, userMajorName]);

  // Active recommendations based on toggle
  const recommendedMajors = applySupplementary ? adjustedMajors : originalMajors;

  // Get selected major for dual radar chart
  const selectedMajor = recommendedMajors[selectedMajorIndex] || recommendedMajors[0];

  // 🆕 직무 추천 계산 (RIASEC + 전공 연관성)
  const recommendedRoles = useMemo(() => {
    const topMajor = recommendedMajors[0];
    // 전공 정보가 있으면 전공-직무 연관성 반영
    if (topMajor) {
      return recommendRoles(
        activeScores,
        8, // 상위 8개 직무
        topMajor.key,
        topMajor.cluster
      );
    }
    // 전공 정보가 없으면 순수 RIASEC 기반 추천
    return recommendRoles(activeScores, 8);
  }, [activeScores, recommendedMajors]);

  // Standardize both profiles to 0-100 scale based on their own max values
  // This makes the shapes comparable rather than the absolute values
  const userMax = Math.max(...dimensions.map(d => activeScores[d])) || 1;
  const majorMax = selectedMajor ? Math.max(...dimensions.map(d => selectedMajor.vec[d] || 0)) || 1 : 1;

  // Chart data with both profiles standardized to percentage of their own max
  const chartData = dimensions.map(dim => ({
    dimension: RIASEC_LABELS[dim].name,
    userScore: Math.round((activeScores[dim] / userMax) * 100),
    majorScore: selectedMajor ? Math.round(((selectedMajor.vec[dim] || 0) / majorMax) * 100) : 0,
  }));

  // PDF-specific: always use supplementary-applied scores as default in PDF
  // adjustedScores already falls back to `scores` when no supplementary selfEfficacy
  const pdfScores = adjustedScores;
  const pdfUserMax = Math.max(...dimensions.map(d => pdfScores[d])) || 1;
  const pdfSortedDimensions = [...dimensions]
    .map(dim => ({ dim, score: pdfScores[dim] }))
    .sort((a, b) => b.score - a.score);
  const pdfTop3 = pdfSortedDimensions.slice(0, 3);
  const pdfRiasecCode = pdfTop3.map(t => t.dim).join('');

  // Generate 3-code explanation
  const codeExplanation = {
    first: CODE_POSITION_EXPLANATIONS[top3[0].dim].primary,
    second: CODE_POSITION_EXPLANATIONS[top3[1].dim].secondary,
    third: CODE_POSITION_EXPLANATIONS[top3[2].dim].tertiary,
  };

  const pdfCodeExplanation = {
    first: CODE_POSITION_EXPLANATIONS[pdfTop3[0].dim].primary,
    second: CODE_POSITION_EXPLANATIONS[pdfTop3[1].dim].secondary,
    third: CODE_POSITION_EXPLANATIONS[pdfTop3[2].dim].tertiary,
  };

  // PDF-specific: job recommendations for both adjusted and original scores
  const pdfAdjustedRoles = useMemo(() => {
    const topMajor = adjustedMajors[0];
    if (topMajor) {
      return recommendRoles(pdfScores, 8, topMajor.key, topMajor.cluster);
    }
    return recommendRoles(pdfScores, 8);
  }, [pdfScores, adjustedMajors]);

  const pdfOriginalRoles = useMemo(() => {
    const topMajor = originalMajors[0];
    if (topMajor) {
      return recommendRoles(scores, 8, topMajor.key, topMajor.cluster);
    }
    return recommendRoles(scores, 8);
  }, [scores, originalMajors]);

  return (
    <div
      className="min-h-screen py-8 px-4 lg:py-12 lg:px-8"
      style={{ backgroundColor: COLORS.bg, wordBreak: 'keep-all' }}
    >

      {/* PDF Content Container */}
      <div ref={pdfContentRef} className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto relative"
        >
          {/* PDF Export Button - 결과 컨텐츠 우측 상단 */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            onClick={handleExportPDF}
            disabled={isGeneratingPDF}
            className="absolute top-0 right-0 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl font-medium text-sm transition-all duration-300"
            style={{
              backgroundColor: isGeneratingPDF ? '#F1F5F9' : COLORS.surface,
              color: isGeneratingPDF ? COLORS.muted : COLORS.text.primary,
              border: `1px solid ${COLORS.card.border}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            {isGeneratingPDF ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>생성 중...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>PDF 저장</span>
              </>
            )}
          </motion.button>
          {/* Participant Name Header */}
          {participantName && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <p className="text-sm mb-2" style={{ color: COLORS.text.muted }}>검사자</p>
              <h2
                className="text-2xl lg:text-3xl font-bold"
                style={{ color: COLORS.primary }}
              >
                {participantName}
              </h2>
              <p className="text-sm mt-2" style={{ color: COLORS.text.muted }}>
                검사일: {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </motion.div>
          )}

          {/* Hero Section - PC: Two columns */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl overflow-hidden mb-8"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.card.border}`,
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            }}
          >
            <div className="flex flex-col lg:flex-row">
              {/* Left: Profile Header with Code Explanation */}
              <div
                className="lg:w-1/2 px-6 py-8 lg:px-10 lg:py-12 relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)` }}
              >
                <div className="relative z-10">
                  {/* Header */}
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xs font-medium tracking-widest uppercase mb-4"
                    style={{ color: 'rgba(255,255,255,0.8)' }}
                  >
                    전공 진로 적합도 유형
                  </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-baseline gap-3 mb-6"
                >
                  <h1
                    className="text-5xl lg:text-6xl font-bold tracking-wider text-white"
                    style={{
                      fontFamily: "'Pretendard', sans-serif",
                      letterSpacing: '0.15em',
                      textShadow: '0 4px 30px rgba(0,0,0,0.3)',
                    }}
                  >
                    {riasecCode}
                  </h1>
                  <span
                    className="text-lg lg:text-xl font-medium"
                    style={{ color: 'rgba(255,255,255,0.8)' }}
                  >
                    형 인재입니다.
                  </span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-wrap gap-2 mb-8"
                >
                  {top3.map((t) => (
                    <span
                      key={t.dim}
                      className="px-4 py-2 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      {RIASEC_LABELS[t.dim].name}
                    </span>
                  ))}
                </motion.div>

                {/* 3-Code Explanation inside hero - Enhanced */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3 pt-6 border-t"
                  style={{ borderColor: 'rgba(255,255,255,0.2)' }}
                >
                  {/* First Code */}
                  <div
                    className="flex items-start gap-4 p-3 rounded-xl"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-lg"
                      style={{
                        backgroundColor: RIASEC_LABELS[top3[0].dim].color,
                        boxShadow: `0 4px 20px ${RIASEC_LABELS[top3[0].dim].color}50`,
                      }}
                    >
                      <span className="text-white">{top3[0].dim}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.95)' }}>
                        핵심 특성 · {RIASEC_LABELS[top3[0].dim].name}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                        {codeExplanation.first}
                      </p>
                    </div>
                  </div>

                  {/* Second Code */}
                  <div className="flex items-start gap-4 p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: RIASEC_LABELS[top3[1].dim].color }}
                    >
                      <span className="text-white">{top3[1].dim}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>
                        보조 특성 · {RIASEC_LABELS[top3[1].dim].name}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        {codeExplanation.second}
                      </p>
                    </div>
                  </div>

                  {/* Third Code */}
                  <div className="flex items-start gap-4 p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0"
                      style={{ backgroundColor: RIASEC_LABELS[top3[2].dim].color }}
                    >
                      <span className="text-white">{top3[2].dim}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        영향 특성 · {RIASEC_LABELS[top3[2].dim].name}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        {codeExplanation.third}
                      </p>
                    </div>
                  </div>
                </motion.div>

                <p className="text-xs font-medium tracking-wide mt-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  전공 진로 적합도 검사 · 15문항 결과
                </p>
              </div>
            </div>

            {/* Right: Radar Chart */}
            <div className="lg:w-1/2 p-6 lg:p-8 flex flex-col items-center justify-center" style={{ backgroundColor: COLORS.bg }}>
              {/* Supplementary Profile Toggle - only show when data exists */}
              {isComplete && supplementaryData && (
                <div className="w-full mb-4">
                  <button
                    onClick={() => setApplySupplementary(!applySupplementary)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300"
                    style={{
                      backgroundColor: applySupplementary ? `${COLORS.primary}10` : COLORS.surface,
                      border: `1px solid ${applySupplementary ? COLORS.primary : COLORS.card.border}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-5 rounded-full relative transition-all duration-300"
                        style={{
                          backgroundColor: applySupplementary ? COLORS.primary : '#CBD5E1',
                        }}
                      >
                        <div
                          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300"
                          style={{
                            left: applySupplementary ? '22px' : '2px',
                          }}
                        />
                      </div>
                      <span
                        className="text-sm font-medium"
                        style={{ color: applySupplementary ? COLORS.primary : COLORS.text.secondary }}
                      >
                        보완 프로파일 적용
                      </span>
                    </div>
                    {applySupplementary && (
                      <span
                        className="text-xs px-2 py-1 rounded-lg"
                        style={{ backgroundColor: COLORS.primary, color: '#FFFFFF' }}
                      >
                        적용됨
                      </span>
                    )}
                  </button>
                  <p className="text-xs mt-2 px-1" style={{ color: COLORS.text.muted }}>
                    자기효능감과 선호 분야를 반영하여 추천 결과를 조정합니다
                  </p>
                </div>
              )}

              <div className="w-full h-80 lg:h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={chartData} margin={{ top: 30, right: 50, bottom: 30, left: 50 }}>
                    <PolarGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                    <PolarAngleAxis
                      dataKey="dimension"
                      tick={{ fill: COLORS.text.secondary, fontSize: 14, fontWeight: 500 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fill: COLORS.text.muted, fontSize: 11 }}
                      tickCount={5}
                      axisLine={false}
                    />
                    {/* User profile */}
                    <Radar
                      name={applySupplementary && supplementaryData ? "보완 적용 프로파일" : "나의 프로파일"}
                      dataKey="userScore"
                      stroke={applySupplementary && supplementaryData ? COLORS.accent : COLORS.primary}
                      fill={applySupplementary && supplementaryData ? 'rgba(232, 184, 109, 0.2)' : COLORS.chart.fill}
                      strokeWidth={2}
                    />
                    {/* Major profile */}
                    {selectedMajor && (
                      <Radar
                        name={selectedMajor.name}
                        dataKey="majorScore"
                        stroke={COLORS.accent}
                        fill="rgba(251, 191, 36, 0.2)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    )}
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value}`, name]}
                      contentStyle={{
                        backgroundColor: COLORS.surface,
                        border: `1px solid ${COLORS.card.border}`,
                        borderRadius: '12px',
                        padding: '10px 14px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                      labelStyle={{ color: COLORS.text.primary }}
                      itemStyle={{ color: COLORS.text.secondary }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      formatter={(value) => (
                        <span style={{ color: COLORS.text.secondary, fontSize: '12px' }}>{value}</span>
                      )}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              {/* Major selector for dual chart */}
              {recommendedMajors.length > 1 && (
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {recommendedMajors.map((major, idx) => (
                    <button
                      key={major.key}
                      onClick={() => setSelectedMajorIndex(idx)}
                      className="px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300"
                      style={{
                        backgroundColor: selectedMajorIndex === idx ? COLORS.primary : COLORS.surface,
                        color: selectedMajorIndex === idx ? '#FFFFFF' : COLORS.text.secondary,
                        border: `1px solid ${selectedMajorIndex === idx ? COLORS.primary : COLORS.card.border}`,
                        boxShadow: selectedMajorIndex === idx ? `0 4px 12px ${COLORS.primary}30` : 'none',
                      }}
                    >
                      {idx + 1}. {major.name}
                    </button>
                  ))}
                </div>
              )}
              {/* Chart explanation */}
              <p className="text-center mt-4 px-4" style={{ color: COLORS.text.muted, fontSize: '10px', lineHeight: '1.4' }}>
                ※ 두 프로파일 모두 상대적 비율로 표준화되어 형태를 비교합니다.
                각 축의 100%는 해당 프로파일 내 가장 높은 점수를 기준으로 합니다.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Recommended Majors - Full Width with Enhanced Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl p-6 lg:p-8 mb-8"
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.card.border}`,
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          }}
        >
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2
                className="text-2xl lg:text-3xl font-bold"
                style={{
                  color: COLORS.primary,
                  fontFamily: "'Pretendard', sans-serif",
                }}
              >
                추천 학과
              </h2>
              <p className="text-sm mt-2" style={{ color: COLORS.text.muted }}>
                {applySupplementary && supplementaryData
                  ? '보완 프로파일 적용 · 자기효능감 및 선호 분야 반영'
                  : '전공 진로 적합도 검사 기반 맞춤 추천'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {applySupplementary && supplementaryData && (
                <span
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: `${COLORS.accent}15`,
                    color: COLORS.accent,
                    border: `1px solid ${COLORS.accent}30`,
                  }}
                >
                  보완 적용
                </span>
              )}
              <span
                className="text-xs font-bold px-4 py-2 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
                  color: '#FFFFFF',
                }}
              >
                TOP {recommendedMajors.length}
              </span>
            </div>
          </div>

          {/* Comparison indicator when supplementary changes recommendations */}
          {applySupplementary && supplementaryData && (
            (() => {
              const originalNames = originalMajors.map(m => m.name);
              const adjustedNames = adjustedMajors.map(m => m.name);
              const hasChanges = originalNames.join(',') !== adjustedNames.join(',');
              const newMajors = adjustedNames.filter(n => !originalNames.includes(n));

              if (!hasChanges) return null;

              return (
                <div
                  className="mb-6 p-4 rounded-xl"
                  style={{
                    backgroundColor: `${COLORS.accent}08`,
                    border: `1px solid ${COLORS.accent}20`,
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium" style={{ color: COLORS.primary }}>
                        보완 프로파일 적용으로 추천이 변경되었습니다
                      </p>
                      <p className="text-xs mt-1" style={{ color: COLORS.text.muted }}>
                        자기효능감과 선호 분야를 반영한 결과입니다
                      </p>
                    </div>
                    {newMajors.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: COLORS.text.muted }}>새로 추천:</span>
                        {newMajors.map((name, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 rounded-lg font-medium"
                            style={{
                              backgroundColor: COLORS.accent,
                              color: '#FFFFFF',
                            }}
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          )}

          {recommendedMajors.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {recommendedMajors.map((major, index) => {
                const matchPercent = (major.matchScore * 100).toFixed(0);
                const medalColors = [
                  { bg: COLORS.accent, text: '#FFFFFF', glow: `${COLORS.accent}40` },
                  { bg: '#94A3B8', text: '#FFFFFF', glow: 'rgba(148, 163, 184, 0.3)' },
                  { bg: '#CD7F32', text: '#FFFFFF', glow: 'rgba(205, 127, 50, 0.3)' },
                ];
                const medal = medalColors[index] || { bg: '#F1F5F9', text: COLORS.text.secondary, glow: 'none' };
                const careerPaths = MAJOR_CAREERS[major.name] || ['관련 직무 정보 준비중'];
                const isExpanded = expandedProfiles.has(index);

                return (
                  <motion.div
                    key={major.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="p-6 rounded-2xl transition-all duration-300 flex flex-col cursor-pointer relative overflow-hidden"
                    style={{
                      border: selectedMajorIndex === index ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.card.border}`,
                      backgroundColor: selectedMajorIndex === index ? `${COLORS.primary}08` : COLORS.surface,
                      boxShadow: selectedMajorIndex === index
                        ? `0 8px 24px ${COLORS.primary}20`
                        : '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                    onClick={() => setSelectedMajorIndex(index)}
                  >
                    {/* Top accent bar */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{
                        background: index === 0 ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)` : medal.bg,
                      }}
                    />

                    {/* Header row */}
                    <div className="flex items-start justify-between mb-5 mt-2">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl"
                          style={{
                            background: index === 0 ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)` : medal.bg,
                            color: medal.text,
                            boxShadow: `0 4px 12px ${medal.glow}`,
                          }}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg" style={{ color: COLORS.text.primary }}>
                            {major.name}
                          </h3>
                          <p className="text-xs mt-0.5" style={{ color: COLORS.text.muted }}>
                            {major.college}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className="text-2xl font-bold"
                          style={{ color: COLORS.primary }}
                        >
                          {matchPercent}%
                        </span>
                        <p className="text-xs" style={{ color: COLORS.text.muted }}>
                          적합도
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm leading-relaxed mb-5 flex-grow" style={{ color: COLORS.text.secondary }}>
                      {major.description}
                    </p>

                    {/* Career Paths */}
                    <div className="mb-5">
                      <h4 className="text-xs font-bold mb-3" style={{ color: COLORS.text.primary }}>
                        주요 진로
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {careerPaths.slice(0, 4).map((career, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 rounded-xl text-xs font-medium"
                            style={{
                              backgroundColor: `${COLORS.primary}20`,
                              color: COLORS.primary,
                              border: `1px solid ${COLORS.primary}30`,
                            }}
                          >
                            {career}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Match reason */}
                    <div
                      className="px-4 py-3 rounded-xl text-xs leading-relaxed mb-4"
                      style={{
                        backgroundColor: `${COLORS.secondary}15`,
                        color: COLORS.text.secondary,
                        border: `1px solid ${COLORS.secondary}25`,
                      }}
                    >
                      <span className="font-bold" style={{ color: COLORS.secondary }}>왜 맞을까요?</span> {major.matchReason}
                    </div>

                    {/* Collapsible RIASEC Profile */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProfile(index);
                      }}
                      className="w-full flex items-center justify-between py-3 px-4 rounded-xl text-xs font-medium transition-all duration-200"
                      style={{
                        color: COLORS.text.muted,
                        backgroundColor: '#F8FAFC',
                        border: `1px solid ${COLORS.card.border}`,
                      }}
                    >
                      <span>전공 적합도 프로파일 {isExpanded ? '숨기기' : '보기'}</span>
                      <motion.svg
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 space-y-2.5">
                            {dimensions.map(dim => {
                              const dimValue = (major.vec[dim] || 0) * 100;
                              const label = RIASEC_LABELS[dim];
                              return (
                                <div key={dim} className="flex items-center gap-3">
                                  <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                                    style={{ backgroundColor: label.color }}
                                  >
                                    {dim}
                                  </div>
                                  <div
                                    className="flex-1 h-2 rounded-full overflow-hidden"
                                    style={{ backgroundColor: '#E2E8F0' }}
                                  >
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${dimValue}%` }}
                                      transition={{ duration: 0.4 }}
                                      className="h-full rounded-full"
                                      style={{ backgroundColor: label.color }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium w-10 text-right" style={{ color: COLORS.text.secondary }}>
                                    {dimValue.toFixed(0)}%
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* 강의용 데모: 학과 홈페이지 외부 링크는 제공하지 않습니다. */}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#F1F5F9' }}>
                <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: COLORS.primary }}>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <p style={{ color: COLORS.text.muted }}>추천 학과를 계산 중입니다...</p>
            </div>
          )}
        </motion.div>

        {/* 🆕 추천 직무 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-3xl p-6 lg:p-8 mb-8"
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.card.border}`,
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <h2
                className="text-xl lg:text-2xl font-bold"
                style={{
                  color: COLORS.primary,
                  fontFamily: "'Pretendard', sans-serif",
                }}
              >
                추천 직무
              </h2>
              <p className="text-sm mt-1" style={{ color: COLORS.text.muted }}>
                전공 진로 적합도 검사 결과와 추천 전공을 기반으로 분석한 적합 직무입니다
              </p>
            </div>
            <span
              className="px-4 py-2 rounded-full text-sm font-semibold self-start"
              style={{
                background: `linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.primary} 100%)`,
                color: '#FFFFFF',
              }}
            >
              TOP {recommendedRoles.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedRoles.map((role, index) => {
              const matchPercent = Math.round(role.matchScore * 100);
              const workpediaUrl = getWorkpediaJobUrl(role.name);

              return (
                <motion.div
                  key={role.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="p-5 rounded-2xl transition-all duration-300 relative overflow-hidden"
                  style={{
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.card.border}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Top accent bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{
                      background: role.isRelatedToMajor
                        ? `linear-gradient(135deg, ${COLORS.accent} 0%, #F59E0B 100%)`
                        : `linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.primary} 100%)`,
                    }}
                  />

                  {/* Header */}
                  <div className="flex items-start justify-between mb-3 mt-1">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                        style={{
                          background: index < 3
                            ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`
                            : '#E2E8F0',
                          color: index < 3 ? '#FFFFFF' : COLORS.text.secondary,
                        }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-sm leading-tight" style={{ color: COLORS.text.primary }}>
                          {role.name.replace(/\s*\(.*?\)\s*/g, '').trim()}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Match Score */}
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="flex-1 h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: '#E2E8F0' }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${matchPercent}%` }}
                        transition={{ duration: 0.5, delay: 0.5 + index * 0.05 }}
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${COLORS.secondary} 0%, ${COLORS.primary} 100%)`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold" style={{ color: COLORS.primary }}>
                      {matchPercent}%
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {role.isRelatedToMajor && (
                      <span
                        className="px-2 py-1 rounded-lg text-xs font-medium"
                        style={{
                          backgroundColor: `${COLORS.accent}20`,
                          color: '#B45309',
                          border: `1px solid ${COLORS.accent}40`,
                        }}
                      >
                        ✨ 전공 연관
                      </span>
                    )}
                    {role.matchReasons.slice(0, 1).map((reason, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-lg text-xs"
                        style={{
                          backgroundColor: `${COLORS.primary}10`,
                          color: COLORS.text.secondary,
                        }}
                      >
                        {reason}
                      </span>
                    ))}
                  </div>

                  {/* Profile Strength */}
                  {role.profileStrength && (
                    <p className="text-xs leading-relaxed mb-3" style={{ color: COLORS.text.muted }}>
                      {role.profileStrength}
                    </p>
                  )}

                  {/* External Link */}
                  {workpediaUrl && (
                    <a
                      href={workpediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 hover:opacity-80"
                      style={{
                        color: COLORS.secondary,
                        backgroundColor: `${COLORS.secondary}10`,
                        border: `1px solid ${COLORS.secondary}20`,
                      }}
                    >
                      직업 상세정보
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </motion.div>
              );
            })}
          </div>

        </motion.div>

        {/* Top Type Descriptions - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-3xl p-6 lg:p-8 mb-8"
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.card.border}`,
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          }}
        >
          <h2
            className="text-xl lg:text-2xl font-bold mb-8"
            style={{
              color: COLORS.primary,
              fontFamily: "'Pretendard', sans-serif",
            }}
          >
            나의 주요 흥미 특성
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {top3.map((item, index) => {
              const label = RIASEC_LABELS[item.dim];
              return (
                <motion.div
                  key={item.dim}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="p-6 rounded-2xl transition-all duration-300 relative overflow-hidden"
                  style={{
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.card.border}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Top accent */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: label.color }}
                  />

                  <div className="flex items-center gap-4 mb-5 mt-1">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
                      style={{
                        backgroundColor: label.color,
                        boxShadow: `0 6px 20px ${label.color}50`,
                      }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: COLORS.text.primary }}>
                        {item.dim} · {label.name}
                      </h3>
                      <span className="text-xs" style={{ color: COLORS.text.muted }}>
                        {label.fullName}
                      </span>
                    </div>
                  </div>
                  <p
                    className="text-sm leading-relaxed mb-5"
                    style={{ color: COLORS.text.secondary }}
                  >
                    {label.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {label.careers.map(career => (
                      <span
                        key={career}
                        className="text-xs px-3 py-1.5 rounded-xl font-medium"
                        style={{
                          backgroundColor: `${label.color}20`,
                          color: label.color,
                          border: `1px solid ${label.color}30`,
                        }}
                      >
                        {career}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* 나머지 흥미 유형 펼치기 */}
          {sortedDimensions.length > 3 && (
            <div className="mt-5">
              <button
                onClick={() => setShowAllInterests(prev => !prev)}
                className="w-full flex items-center justify-between py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-80"
                style={{
                  color: COLORS.text.muted,
                  backgroundColor: '#F8FAFC',
                  border: `1px solid ${COLORS.card.border}`,
                }}
              >
                <span>나머지 흥미 유형 {showAllInterests ? '숨기기' : '보기'} ({sortedDimensions.length - 3}개)</span>
                <motion.svg
                  animate={{ rotate: showAllInterests ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>

              <AnimatePresence>
                {showAllInterests && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
                      {sortedDimensions.slice(3).map((item, index) => {
                        const label = RIASEC_LABELS[item.dim];
                        const overallRank = index + 4;
                        return (
                          <motion.div
                            key={item.dim}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.08 }}
                            whileHover={{ y: -3, transition: { duration: 0.2 } }}
                            className="p-5 rounded-2xl transition-all duration-300 relative overflow-hidden"
                            style={{
                              backgroundColor: COLORS.surface,
                              border: `1px solid ${COLORS.card.border}`,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                              opacity: 0.92,
                            }}
                          >
                            <div
                              className="absolute top-0 left-0 right-0 h-1"
                              style={{ backgroundColor: label.color, opacity: 0.6 }}
                            />

                            <div className="flex items-center gap-3 mb-4 mt-1">
                              <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
                                style={{
                                  backgroundColor: label.color,
                                  opacity: 0.85,
                                }}
                              >
                                {overallRank}
                              </div>
                              <div>
                                <h3 className="font-bold text-base" style={{ color: COLORS.text.primary }}>
                                  {item.dim} · {label.name}
                                </h3>
                                <span className="text-xs" style={{ color: COLORS.text.muted }}>
                                  {label.fullName}
                                </span>
                              </div>
                            </div>
                            <p
                              className="text-sm leading-relaxed mb-4"
                              style={{ color: COLORS.text.secondary }}
                            >
                              {label.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {label.careers.map(career => (
                                <span
                                  key={career}
                                  className="text-xs px-3 py-1 rounded-xl font-medium"
                                  style={{
                                    backgroundColor: `${label.color}15`,
                                    color: label.color,
                                    border: `1px solid ${label.color}25`,
                                  }}
                                >
                                  {career}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Supplementary Survey Results - Only shown when isComplete and supplementaryData exists */}
        {isComplete && supplementaryData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="rounded-3xl p-6 lg:p-8"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.card.border}`,
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            }}
          >
            <button
              onClick={() => setShowSupplementary(prev => !prev)}
              className="w-full flex items-center justify-between mb-6 transition-opacity hover:opacity-80"
            >
              <div className="flex items-center gap-3">
                <h3
                  className="text-xl lg:text-2xl font-bold"
                  style={{ color: COLORS.primary }}
                >
                  보완 프로파일 분석
                </h3>
                <span
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: `${COLORS.secondary}15`, color: COLORS.secondary }}
                >
                  심층 분석
                </span>
              </div>
              <div className="flex items-center gap-2" style={{ color: COLORS.text.muted }}>
                <span className="text-sm font-medium">{showSupplementary ? '숨기기' : '보기'}</span>
                <motion.svg
                  animate={{ rotate: showSupplementary ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {showSupplementary && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Value Scores Card */}
              {supplementaryData.valueScores && (
                <div
                  className="p-5 rounded-2xl"
                  style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.card.border}` }}
                >
                  <h4 className="font-semibold mb-3" style={{ color: COLORS.primary }}>
                    직업가치관
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(supplementaryData.valueScores)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 3)
                      .map(([key, score], idx) => {
                        const koreanLabels: Record<string, string> = {
                          achievement: '성취',
                          recognition: '인정',
                          independence: '자율',
                          social: '사회공헌',
                          security: '안정',
                          economic: '경제',
                          growth: '성장',
                        };
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm" style={{ color: COLORS.text.secondary }}>
                              {idx + 1}. {koreanLabels[key] || key}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E2E8F0' }}>
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${(score / 5) * 100}%`,
                                    backgroundColor: idx === 0 ? COLORS.accent : idx === 1 ? COLORS.secondary : COLORS.muted,
                                  }}
                                />
                              </div>
                              <span className="text-xs font-medium" style={{ color: COLORS.text.muted }}>
                                {score.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Career Decision Card */}
              {supplementaryData.careerDecision && (
                <div
                  className="p-5 rounded-2xl"
                  style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.card.border}` }}
                >
                  <h4 className="font-semibold mb-3" style={{ color: COLORS.primary }}>
                    진로결정 상태
                  </h4>
                  <div className="space-y-3">
                    <div
                      className="text-center py-3 px-4 rounded-xl"
                      style={{
                        backgroundColor: supplementaryData.careerDecision.level === '확정'
                          ? '#10B98120' : supplementaryData.careerDecision.level === '탐색'
                          ? `${COLORS.accent}20` : '#EF444420',
                        color: supplementaryData.careerDecision.level === '확정'
                          ? '#10B981' : supplementaryData.careerDecision.level === '탐색'
                          ? COLORS.accent : '#EF4444',
                      }}
                    >
                      <p className="text-lg font-bold">{supplementaryData.careerDecision.level}</p>
                      <p className="text-xs mt-1">결정 수준</p>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: COLORS.text.muted }}>확신도</span>
                      <span className="font-medium" style={{ color: COLORS.primary }}>
                        {Math.round(supplementaryData.careerDecision.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Self-Efficacy Card */}
              {supplementaryData.selfEfficacy && (
                <div
                  className="p-5 rounded-2xl"
                  style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.card.border}` }}
                >
                  <h4 className="font-semibold mb-3" style={{ color: COLORS.primary }}>
                    영역별 자기효능감
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {(['R', 'I', 'A', 'S', 'E', 'C'] as const).map((code) => {
                      const score = supplementaryData.selfEfficacy?.[code] || 0;
                      return (
                        <div
                          key={code}
                          className="text-center p-2 rounded-lg"
                          style={{ backgroundColor: `${RIASEC_LABELS[code].color}15` }}
                        >
                          <div
                            className="w-6 h-6 mx-auto rounded-md flex items-center justify-center text-xs font-bold text-white mb-1"
                            style={{ backgroundColor: RIASEC_LABELS[code].color }}
                          >
                            {code}
                          </div>
                          <p className="text-sm font-semibold" style={{ color: RIASEC_LABELS[code].color }}>
                            {score.toFixed(1)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Preferences Card */}
              {supplementaryData.preferences && (
                <div
                  className="p-5 rounded-2xl"
                  style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.card.border}` }}
                >
                  <h4 className="font-semibold mb-3" style={{ color: COLORS.primary }}>
                    선호 스타일
                  </h4>
                  <div className="space-y-2">
                    {supplementaryData.preferences.fieldPreference && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: `${COLORS.primary}10`, color: COLORS.primary }}>
                          분야
                        </span>
                        <span className="text-sm font-medium" style={{ color: COLORS.text.secondary }}>
                          {supplementaryData.preferences.fieldPreference}
                        </span>
                      </div>
                    )}
                    {supplementaryData.preferences.workStyle && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: `${COLORS.secondary}10`, color: COLORS.secondary }}>
                          업무
                        </span>
                        <span className="text-sm font-medium" style={{ color: COLORS.text.secondary }}>
                          {supplementaryData.preferences.workStyle}
                        </span>
                      </div>
                    )}
                    {supplementaryData.preferences.environmentPreference && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: `${COLORS.accent}10`, color: COLORS.accent }}>
                          환경
                        </span>
                        <span className="text-sm font-medium" style={{ color: COLORS.text.secondary }}>
                          {supplementaryData.preferences.environmentPreference}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Value Ranking Card */}
              {supplementaryData.valueRanking && Object.keys(supplementaryData.valueRanking).length > 0 && (
                <div
                  className="p-5 rounded-2xl"
                  style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.card.border}` }}
                >
                  <h4 className="font-semibold mb-3" style={{ color: COLORS.primary }}>
                    가치 우선순위
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(supplementaryData.valueRanking)
                      .sort(([, a], [, b]) => a - b)
                      .map(([value, rank]) => (
                        <div key={value} className="flex items-center gap-3">
                          <span
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{
                              backgroundColor: rank === 1 ? '#F59E0B' : rank === 2 ? '#94A3B8' : '#CD7F32',
                            }}
                          >
                            {rank}
                          </span>
                          <span className="text-sm" style={{ color: COLORS.text.secondary }}>
                            {value}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Role Model Card */}
              {supplementaryData.roleModel && (supplementaryData.roleModel.name || (supplementaryData.roleModel.traits && supplementaryData.roleModel.traits.length > 0)) && (
                <div
                  className="p-5 rounded-2xl"
                  style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.card.border}` }}
                >
                  <h4 className="font-semibold mb-3" style={{ color: COLORS.primary }}>
                    롤모델
                  </h4>
                  {supplementaryData.roleModel.name && (
                    <p className="text-lg font-semibold mb-2" style={{ color: COLORS.primary }}>
                      {supplementaryData.roleModel.name}
                    </p>
                  )}
                  {supplementaryData.roleModel.traits && supplementaryData.roleModel.traits.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {supplementaryData.roleModel.traits.map((trait, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{
                            backgroundColor: `${COLORS.accent}15`,
                            color: COLORS.accent,
                          }}
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Action Buttons - Conditional based on isComplete */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-3xl p-8 lg:p-12 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
            boxShadow: '0 8px 30px rgba(30, 58, 95, 0.2)',
          }}
        >
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="lg:max-w-lg">
              {isComplete ? (
                <>
                  <h2
                    className="text-2xl lg:text-3xl font-bold mb-4 text-white"
                    style={{ fontFamily: "'Pretendard', sans-serif" }}
                  >
                    {displayName}님의 프로파일 분석이 완료되었습니다
                  </h2>
                  <p className="leading-relaxed text-white/85">
                    전공 진로 적합도 검사와 보완 설문 결과를 바탕으로 맞춤형 진로 분석이 제공되었습니다
                  </p>
                </>
              ) : (
                <>
                  <h2
                    className="text-2xl lg:text-3xl font-bold mb-4 text-white"
                    style={{ fontFamily: "'Pretendard', sans-serif" }}
                  >
                    더 정확한 분석을 원하시나요?
                  </h2>
                  <p className="leading-relaxed text-white/85">
                    보완 설문을 통해 직업가치관, 자기효능감 등 추가적인 분석이 가능합니다
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {isComplete ? (
                <>
                  {/* 보완검사 안한 경우: 보완검사하기 버튼, 한 경우: 메인으로 버튼 */}
                  {!supplementaryData && onStartSupplementary ? (
                    <motion.button
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onStartSupplementary}
                      className="px-10 py-4 rounded-2xl font-semibold shadow-lg transition-all duration-300"
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: COLORS.primary,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                    >
                      보완검사하기
                    </motion.button>
                  ) : mode === 'external' ? null : onNavigate && (
                    <motion.button
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onNavigate('landing')}
                      className="px-10 py-4 rounded-2xl font-semibold shadow-lg transition-all duration-300"
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: COLORS.primary,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                    >
                      메인으로
                    </motion.button>
                  )}
                  {onRestart && (
                    <motion.button
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { localStorage.removeItem('pilot_survey_progress'); onRestart(); }}
                      className="px-10 py-4 rounded-2xl font-semibold transition-all duration-300"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    >
                      다시 검사하기
                    </motion.button>
                  )}
                </>
              ) : (
                <>
                  {onContinue && (
                    <motion.button
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onContinue}
                      className="px-10 py-4 rounded-2xl font-semibold shadow-lg transition-all duration-300"
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: COLORS.primary,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                    >
                      보완문항 응답하기
                    </motion.button>
                  )}
                  {onSkip && (
                    <motion.button
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onSkip}
                      className="px-10 py-4 rounded-2xl font-semibold transition-all duration-300"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    >
                      지금은 건너뛰기
                    </motion.button>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>

      </motion.div>
      </div> {/* End of pdfContentRef */}

      {/* PDF Export View - Hidden, rendered only during PDF generation */}
      {showPDFView && (
        <div
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            backgroundColor: '#FFFFFF',
          }}
        >
          {/* ==================== PAGE 1 ==================== */}
          <div
            id="pdf-page-1"
            style={{
              width: '800px',
              padding: '24px',
              backgroundColor: '#FFFFFF',
              fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
              wordBreak: 'keep-all',
            }}
          >
            {/* PDF Header */}
            <div style={{
              background: `linear-gradient(135deg, ${COLORS.pdf.primary} 0%, ${COLORS.pdf.secondary} 100%)`,
              padding: '16px 24px',
              borderRadius: '10px',
              marginBottom: '16px',
              color: 'white',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}>전공 진로 적합도 검사</p>
                  <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>전공 진로 적합도 검사 결과보고서</h1>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {participantName && (
                    <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{participantName}</p>
                  )}
                  <p style={{ fontSize: '11px', opacity: 0.8 }}>
                    {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 1: RIASEC Code & Chart Side by Side */}
            <div style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '14px',
              border: '1px solid #E2E8F0',
            }}>
              <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.pdf.primary, marginBottom: '12px' }}>
                1. 나의 흥미 프로파일
              </h2>

              <div style={{ display: 'flex', gap: '16px' }}>
                {/* Left: Code & Explanation */}
                <div style={{ flex: 1 }}>
                  {/* Big Code Display */}
                  <div style={{
                    background: `linear-gradient(135deg, ${COLORS.pdf.primary} 0%, ${COLORS.pdf.secondary} 100%)`,
                    borderRadius: '8px',
                    padding: '12px 20px',
                    color: 'white',
                    textAlign: 'center',
                    marginBottom: '12px',
                  }}>
                    <p style={{ fontSize: '8px', opacity: 0.7, marginBottom: '2px' }}>나의 흥미 유형 코드{supplementaryData ? ' (보완검사 적용)' : ''}</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '28px', fontWeight: 'bold', letterSpacing: '5px' }}>{pdfRiasecCode}</span>
                      <span style={{ fontSize: '14px', fontWeight: '500', opacity: 0.85 }}>형 인재입니다.</span>
                    </div>
                  </div>

                  {/* Code Explanation - Use SVG for perfect centering */}
                  {pdfTop3.map((t, idx) => (
                    <div key={t.dim} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      marginBottom: idx < 2 ? '8px' : 0,
                      padding: '8px',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                    }}>
                      {/* Badge with SVG for perfect centering */}
                      <svg width="24" height="24" style={{ flexShrink: 0 }}>
                        <rect width="24" height="24" rx="5" fill={RIASEC_LABELS[t.dim].color} />
                        <text x="12" y="12" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="11" fontWeight="bold">
                          {t.dim}
                        </text>
                      </svg>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '11px', fontWeight: '600', color: COLORS.pdf.primary, marginBottom: '1px' }}>
                          {idx === 0 ? '주요' : idx === 1 ? '보조' : '잠재'}: {RIASEC_LABELS[t.dim].name}
                        </p>
                        <p style={{ fontSize: '9px', color: COLORS.pdf.text.secondary, lineHeight: '1.3' }}>
                          {idx === 0 ? pdfCodeExplanation.first : idx === 1 ? pdfCodeExplanation.second : pdfCodeExplanation.third}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right: SVG Radar Chart */}
                <div style={{ width: '280px', flexShrink: 0 }}>
                  <svg viewBox="0 0 300 260" style={{ width: '100%', height: 'auto' }}>
                    {/* Background hexagon grid */}
                    {[100, 80, 60, 40, 20].map((r) => (
                      <polygon
                        key={r}
                        points={dimensions.map((_, i) => {
                          const angle = (Math.PI / 3) * i - Math.PI / 2;
                          const x = 150 + r * Math.cos(angle);
                          const y = 130 + r * Math.sin(angle);
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="1"
                      />
                    ))}

                    {/* Axis lines */}
                    {dimensions.map((_, i) => {
                      const angle = (Math.PI / 3) * i - Math.PI / 2;
                      return (
                        <line
                          key={i}
                          x1="150"
                          y1="130"
                          x2={150 + 100 * Math.cos(angle)}
                          y2={130 + 100 * Math.sin(angle)}
                          stroke="#E2E8F0"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* User profile polygon (supplementary-applied when available) */}
                    <polygon
                      points={dimensions.map((dim, i) => {
                        const angle = (Math.PI / 3) * i - Math.PI / 2;
                        const value = (pdfScores[dim] / pdfUserMax) * 100;
                        const x = 150 + value * Math.cos(angle);
                        const y = 130 + value * Math.sin(angle);
                        return `${x},${y}`;
                      }).join(' ')}
                      fill="rgba(30, 58, 95, 0.3)"
                      stroke={COLORS.pdf.primary}
                      strokeWidth="2"
                    />

                    {/* Major profile polygon (if selected) */}
                    {selectedMajor && (
                      <polygon
                        points={dimensions.map((dim, i) => {
                          const angle = (Math.PI / 3) * i - Math.PI / 2;
                          const value = ((selectedMajor.vec[dim] || 0) / majorMax) * 100;
                          const x = 150 + value * Math.cos(angle);
                          const y = 130 + value * Math.sin(angle);
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="rgba(232, 184, 109, 0.3)"
                        stroke={COLORS.pdf.accent}
                        strokeWidth="2"
                        strokeDasharray="4,2"
                      />
                    )}

                    {/* Data points */}
                    {dimensions.map((dim, i) => {
                      const angle = (Math.PI / 3) * i - Math.PI / 2;
                      const value = (pdfScores[dim] / pdfUserMax) * 100;
                      const x = 150 + value * Math.cos(angle);
                      const y = 130 + value * Math.sin(angle);
                      return (
                        <circle
                          key={dim}
                          cx={x}
                          cy={y}
                          r="4"
                          fill={COLORS.pdf.primary}
                        />
                      );
                    })}

                    {/* Labels */}
                    {dimensions.map((dim, i) => {
                      const angle = (Math.PI / 3) * i - Math.PI / 2;
                      const x = 150 + 115 * Math.cos(angle);
                      const y = 130 + 115 * Math.sin(angle);
                      return (
                        <g key={dim}>
                          <circle cx={x} cy={y} r="14" fill={RIASEC_LABELS[dim].color} />
                          <text
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="white"
                            fontSize="10"
                            fontWeight="bold"
                          >
                            {dim}
                          </text>
                        </g>
                      );
                    })}

                    {/* Legend - centered */}
                    <g transform="translate(150, 245)" textAnchor="middle">
                      <rect x="-70" y="-5" width="10" height="10" fill="rgba(30, 58, 95, 0.3)" stroke={COLORS.pdf.primary} strokeWidth="1" />
                      <text x="-55" y="0" fontSize="9" fill={COLORS.pdf.text.secondary} dominantBaseline="central" textAnchor="start">{supplementaryData ? '보정 프로파일' : '나의 프로파일'}</text>
                      {selectedMajor && (
                        <>
                          <rect x="15" y="-5" width="10" height="10" fill="rgba(232, 184, 109, 0.3)" stroke={COLORS.pdf.accent} strokeWidth="1" />
                          <text x="30" y="0" fontSize="9" fill={COLORS.pdf.text.secondary} dominantBaseline="central" textAnchor="start">{selectedMajor.name}</text>
                        </>
                      )}
                    </g>
                  </svg>
                </div>
              </div>
            </div>

            {/* Section 2: Score Details */}
            <div style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '10px',
              padding: '16px',
              border: '1px solid #E2E8F0',
            }}>
              <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.pdf.primary, marginBottom: '12px' }}>
                2. 유형별 상세 점수
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {pdfSortedDimensions.map((item, idx) => (
                  <div key={item.dim} style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '10px',
                    border: `2px solid ${idx < 3 ? RIASEC_LABELS[item.dim].color : '#E2E8F0'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      {/* Badge with SVG for perfect centering */}
                      <svg width="22" height="22" style={{ flexShrink: 0 }}>
                        <rect width="22" height="22" rx="5" fill={RIASEC_LABELS[item.dim].color} />
                        <text x="11" y="11" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="10" fontWeight="bold">
                          {item.dim}
                        </text>
                      </svg>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: COLORS.pdf.primary }}>
                        {RIASEC_LABELS[item.dim].name} ({RIASEC_LABELS[item.dim].fullName})
                      </span>
                      {idx < 3 && (
                        <svg width="38" height="16" style={{ marginLeft: 'auto' }}>
                          <rect width="38" height="16" rx="3" fill={RIASEC_LABELS[item.dim].color} />
                          <text x="19" y="8" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="8">
                            TOP {idx + 1}
                          </text>
                        </svg>
                      )}
                    </div>
                    <p style={{ fontSize: '9px', color: COLORS.pdf.text.secondary, marginBottom: '6px', lineHeight: '1.3' }}>
                      {RIASEC_LABELS[item.dim].description}
                    </p>
                    <div style={{
                      height: '5px',
                      backgroundColor: '#E2E8F0',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${(item.score / Math.max(...pdfSortedDimensions.map(d => d.score))) * 100}%`,
                        height: '100%',
                        backgroundColor: RIASEC_LABELS[item.dim].color,
                        borderRadius: '2px',
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                      <span style={{ fontSize: '8px', color: COLORS.muted }}>
                        대표 직업: {RIASEC_LABELS[item.dim].careers.slice(0, 3).join(', ')}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: '600', color: COLORS.primary }}>
                        {item.score.toFixed(1)}점
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ==================== PAGE 2: 추천 전공 (적용 전/후 비교) ==================== */}
          <div
            id="pdf-page-2"
            style={{
              width: '800px',
              padding: '24px',
              backgroundColor: '#FFFFFF',
              fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
              wordBreak: 'keep-all',
            }}
          >
            {/* Section Header */}
            <div style={{ marginBottom: '14px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '4px' }}>
                3. 추천 전공 분석
              </h2>
              {supplementaryData && (
                <p style={{ fontSize: '9px', color: COLORS.muted }}>
                  보완검사 적용 전/후 추천 전공을 비교합니다. 좌측은 보정 적용, 우측은 원래 적합도 점수 기반 추천입니다.
                </p>
              )}
            </div>

            {supplementaryData && adjustedMajors.length > 0 ? (
              /* ===== 2-Column: Left=적용후, Right=적용전 ===== */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {/* Left Column: 적용 후 */}
                <div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    marginBottom: '10px', paddingBottom: '6px', borderBottom: '2px solid #3B82F6',
                  }}>
                    <svg width="18" height="18"><rect width="18" height="18" rx="4" fill="#3B82F6" /><text x="9" y="9" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="10" fontWeight="bold">A</text></svg>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1E40AF' }}>보완검사 적용 후</span>
                  </div>
                  {adjustedMajors.slice(0, 5).map((major, idx) => {
                    const isNew = !originalMajors.some(m => m.name === major.name);
                    return (
                      <div key={`adj-${major.name}`} style={{
                        backgroundColor: '#EFF6FF', borderRadius: '10px', padding: '12px',
                        marginBottom: '8px', border: '2px solid #3B82F6',
                      }}>
                        {/* Header row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <div style={{
                            width: '26px', height: '26px', borderRadius: '6px',
                            background: 'linear-gradient(135deg, #2563EB, #60A5FA)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <span style={{ color: 'white', fontSize: '13px', fontWeight: 'bold' }}>{idx + 1}</span>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1E40AF', flex: 1 }}>{major.name}</span>
                          <span style={{ fontSize: '8px', color: '#6B7280', flexShrink: 0 }}>{major.college}</span>
                        </div>
                        {/* Score badges */}
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                          <span style={{
                            fontSize: '9px', fontWeight: '600', color: 'white', backgroundColor: '#3B82F6',
                            padding: '2px 8px', borderRadius: '8px',
                          }}>적합도 {Math.round(major.matchScore * 100)}%</span>
                          <span style={{
                            fontSize: '8px', fontWeight: '600', color: 'white', backgroundColor: '#60A5FA',
                            padding: '2px 6px', borderRadius: '4px',
                          }}>Applied</span>
                          {isNew && (
                            <span style={{
                              fontSize: '8px', fontWeight: 'bold', color: 'white', backgroundColor: '#10B981',
                              padding: '2px 6px', borderRadius: '4px',
                            }}>NEW</span>
                          )}
                        </div>
                        <div style={{
                          backgroundColor: 'white', borderRadius: '6px', padding: '8px',
                          marginBottom: '6px', border: '1px solid #BFDBFE',
                        }}>
                          <p style={{ fontSize: '8px', fontWeight: '600', color: '#6B7280', marginBottom: '3px' }}>전공 소개</p>
                          <p style={{ fontSize: '9px', color: '#374151', lineHeight: '1.5', margin: 0 }}>{major.description}</p>
                        </div>
                        <div style={{
                          backgroundColor: '#DBEAFE', borderRadius: '6px', padding: '8px',
                          borderLeft: '3px solid #3B82F6',
                        }}>
                          <p style={{ fontSize: '8px', fontWeight: '600', color: '#1E40AF', marginBottom: '3px' }}>왜 맞을까요?</p>
                          <p style={{ fontSize: '9px', color: '#1E40AF', lineHeight: '1.5', margin: 0 }}>{major.matchReason}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Column: 적용 전 */}
                <div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    marginBottom: '10px', paddingBottom: '6px', borderBottom: '2px solid #94A3B8',
                  }}>
                    <svg width="18" height="18"><rect width="18" height="18" rx="4" fill={COLORS.primary} /><text x="9" y="9" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="10" fontWeight="bold">B</text></svg>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: COLORS.primary }}>보완검사 적용 전</span>
                  </div>
                  {originalMajors.slice(0, 5).map((major, idx) => {
                    const retained = adjustedMajors.some(m => m.name === major.name);
                    return (
                      <div key={`orig-${major.name}`} style={{
                        backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '12px',
                        marginBottom: '8px', border: '1px solid #E2E8F0',
                      }}>
                        {/* Header row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <div style={{
                            width: '26px', height: '26px', borderRadius: '6px',
                            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <span style={{ color: 'white', fontSize: '13px', fontWeight: 'bold' }}>{idx + 1}</span>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: COLORS.primary, flex: 1 }}>{major.name}</span>
                          <span style={{ fontSize: '8px', color: '#6B7280', flexShrink: 0 }}>{major.college}</span>
                        </div>
                        {/* Score badges */}
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                          <span style={{
                            fontSize: '9px', fontWeight: '600', color: 'white', backgroundColor: COLORS.accent,
                            padding: '2px 8px', borderRadius: '8px',
                          }}>적합도 {Math.round(major.matchScore * 100)}%</span>
                          {retained && (
                            <span style={{
                              fontSize: '8px', fontWeight: 'bold', color: '#059669', backgroundColor: '#F0FDF4',
                              padding: '2px 6px', borderRadius: '4px', border: '1px solid #10B981',
                            }}>유지</span>
                          )}
                        </div>
                        <div style={{
                          backgroundColor: 'white', borderRadius: '6px', padding: '8px',
                          marginBottom: '6px', border: '1px solid #E2E8F0',
                        }}>
                          <p style={{ fontSize: '8px', fontWeight: '600', color: '#6B7280', marginBottom: '3px' }}>전공 소개</p>
                          <p style={{ fontSize: '9px', color: '#374151', lineHeight: '1.5', margin: 0 }}>{major.description}</p>
                        </div>
                        <div style={{
                          backgroundColor: '#F0FDF4', borderRadius: '6px', padding: '8px',
                          borderLeft: '3px solid #10B981',
                        }}>
                          <p style={{ fontSize: '8px', fontWeight: '600', color: '#166534', marginBottom: '3px' }}>왜 맞을까요?</p>
                          <p style={{ fontSize: '9px', color: '#15803D', lineHeight: '1.5', margin: 0 }}>{major.matchReason}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ===== Single column: no supplementary ===== */
              <div>
                <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '10px' }}>추천 전공</h3>
                {originalMajors.slice(0, 5).map((major, idx) => (
                  <div key={`orig-${major.name}`} style={{
                    backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '14px',
                    marginBottom: '10px', border: '1px solid #E2E8F0',
                    display: 'grid', gridTemplateColumns: '1fr 160px', gap: '12px',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '8px',
                          background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>{idx + 1}</span>
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.primary }}>{major.name}</span>
                            <span style={{ fontSize: '10px', color: '#6B7280' }}>{major.college}</span>
                            <span style={{
                              fontSize: '10px', fontWeight: '600', color: 'white', backgroundColor: COLORS.accent,
                              padding: '2px 8px', borderRadius: '10px',
                            }}>적합도 {Math.round(major.matchScore * 100)}%</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '10px', marginBottom: '6px', border: '1px solid #E2E8F0' }}>
                        <p style={{ fontSize: '9px', fontWeight: '600', color: '#6B7280', marginBottom: '3px' }}>전공 소개</p>
                        <p style={{ fontSize: '10px', color: '#374151', lineHeight: '1.5' }}>{major.description}</p>
                      </div>
                      <div style={{ backgroundColor: '#F0FDF4', borderRadius: '8px', padding: '10px', borderLeft: '3px solid #10B981' }}>
                        <p style={{ fontSize: '9px', color: '#166534', fontWeight: '600', marginBottom: '3px' }}>왜 맞을까요?</p>
                        <p style={{ fontSize: '10px', color: '#15803D', lineHeight: '1.5' }}>{major.matchReason}</p>
                      </div>
                    </div>
                    {/* Mini Radar for single-column mode */}
                    <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '8px', border: '1px solid #E2E8F0' }}>
                      <p style={{ fontSize: '8px', fontWeight: '600', color: '#6B7280', marginBottom: '4px', textAlign: 'center' }}>프로파일 비교</p>
                      <svg viewBox="0 0 160 130" style={{ width: '100%', height: 'auto' }}>
                        {[50, 35, 20].map((r) => (
                          <polygon key={r} points={dimensions.map((_, i) => { const angle = (Math.PI / 3) * i - Math.PI / 2; return `${80 + r * Math.cos(angle)},${55 + r * Math.sin(angle)}`; }).join(' ')} fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
                        ))}
                        <polygon points={dimensions.map((dim, i) => { const angle = (Math.PI / 3) * i - Math.PI / 2; const origMax = Math.max(...dimensions.map(d => scores[d])) || 1; const value = (scores[dim] / origMax) * 50; return `${80 + value * Math.cos(angle)},${55 + value * Math.sin(angle)}`; }).join(' ')} fill="rgba(30, 58, 95, 0.2)" stroke={COLORS.primary} strokeWidth="1.5" />
                        <polygon points={dimensions.map((dim, i) => { const angle = (Math.PI / 3) * i - Math.PI / 2; const majorMaxVal = Math.max(...dimensions.map(d => major.vec[d] || 0)) || 1; const value = ((major.vec[dim] || 0) / majorMaxVal) * 50; return `${80 + value * Math.cos(angle)},${55 + value * Math.sin(angle)}`; }).join(' ')} fill="rgba(232, 184, 109, 0.2)" stroke={COLORS.accent} strokeWidth="1.5" strokeDasharray="3,1" />
                        {dimensions.map((dim, i) => { const angle = (Math.PI / 3) * i - Math.PI / 2; return (<text key={dim} x={80 + 60 * Math.cos(angle)} y={55 + 60 * Math.sin(angle)} textAnchor="middle" dominantBaseline="central" fill={RIASEC_LABELS[dim].color} fontSize="8" fontWeight="bold">{dim}</text>); })}
                        <g transform="translate(10, 118)">
                          <rect x="0" y="0" width="8" height="8" fill="rgba(30, 58, 95, 0.2)" stroke={COLORS.primary} strokeWidth="0.5" />
                          <text x="12" y="4" fontSize="7" fill="#6B7280" dominantBaseline="central">나</text>
                          <rect x="30" y="0" width="8" height="8" fill="rgba(232, 184, 109, 0.2)" stroke={COLORS.accent} strokeWidth="0.5" />
                          <text x="42" y="4" fontSize="7" fill="#6B7280" dominantBaseline="central">전공</text>
                        </g>
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PDF Footer */}
            <div style={{
              borderTop: '2px solid #E2E8F0', paddingTop: '14px', marginTop: '10px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <p style={{ fontSize: '9px', color: COLORS.muted }}>진로교육 프로그램 · 추천 전공 분석</p>
            </div>
          </div>

          {/* ==================== PAGE 3: SUPPLEMENTARY PROFILE ==================== */}
          {supplementaryData && (
            <div
              id="pdf-page-3"
              style={{
                width: '800px',
                padding: '24px',
                backgroundColor: '#FFFFFF',
                fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
                wordBreak: 'keep-all',
              }}
            >
              {/* Page Header */}
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '8px' }}>
                  4. 보완 프로파일 분석
                </h2>
                <p style={{ fontSize: '10px', color: COLORS.muted }}>
                  심층 설문을 통해 수집된 직업가치관, 진로결정 수준, 자기효능감 등 추가 분석 결과입니다.
                </p>
              </div>

              {/* Two Column Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Column 1 */}
                <div>
                  {/* Value Scores Card */}
                  {supplementaryData.valueScores && (
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '16px',
                      border: '1px solid #E2E8F0',
                    }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '12px' }}>
                        직업가치관
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Object.entries(supplementaryData.valueScores)
                          .sort(([, a], [, b]) => b - a)
                          .map(([key, score], idx) => {
                            const koreanLabels: Record<string, string> = {
                              achievement: '성취',
                              recognition: '인정',
                              independence: '자율',
                              social: '사회공헌',
                              security: '안정',
                              economic: '경제',
                              growth: '성장',
                            };
                            return (
                              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '11px', color: COLORS.text.secondary }}>
                                  {idx + 1}. {koreanLabels[key] || key}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{
                                    width: '60px',
                                    height: '6px',
                                    borderRadius: '3px',
                                    backgroundColor: '#E2E8F0',
                                    overflow: 'hidden',
                                  }}>
                                    <div style={{
                                      width: `${(score / 5) * 100}%`,
                                      height: '100%',
                                      borderRadius: '3px',
                                      backgroundColor: idx < 3 ? COLORS.accent : COLORS.muted,
                                    }} />
                                  </div>
                                  <span style={{ fontSize: '10px', color: COLORS.text.muted, width: '24px', textAlign: 'right' }}>
                                    {score.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Self-Efficacy Card */}
                  {supplementaryData.selfEfficacy && (
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '16px',
                      border: '1px solid #E2E8F0',
                    }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '12px' }}>
                        영역별 자기효능감
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {(['R', 'I', 'A', 'S', 'E', 'C'] as const).map((code) => {
                          const efficacyScore = supplementaryData.selfEfficacy?.[code] || 0;
                          return (
                            <div
                              key={code}
                              style={{
                                textAlign: 'center',
                                padding: '10px 8px',
                                borderRadius: '8px',
                                backgroundColor: `${RIASEC_LABELS[code].color}15`,
                              }}
                            >
                              <div style={{
                                width: '24px',
                                height: '24px',
                                margin: '0 auto 6px',
                                borderRadius: '6px',
                                backgroundColor: RIASEC_LABELS[code].color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                <span style={{ color: 'white', fontSize: '11px', fontWeight: 'bold' }}>{code}</span>
                              </div>
                              <p style={{ fontSize: '12px', fontWeight: 'bold', color: RIASEC_LABELS[code].color }}>
                                {efficacyScore.toFixed(1)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      <p style={{ fontSize: '9px', color: COLORS.muted, marginTop: '10px', textAlign: 'center' }}>
                        적합도 점수와 결합하여 보정된 추천에 반영됩니다 (가중치: 0.3)
                      </p>
                    </div>
                  )}

                  {/* Value Ranking Card */}
                  {supplementaryData.valueRanking && Object.keys(supplementaryData.valueRanking).length > 0 && (
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #E2E8F0',
                    }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '12px' }}>
                        가치 우선순위
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Object.entries(supplementaryData.valueRanking)
                          .sort(([, a], [, b]) => a - b)
                          .map(([value, rank]) => (
                            <div key={value} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <svg width="22" height="22">
                                <circle cx="11" cy="11" r="11" fill={rank === 1 ? '#F59E0B' : rank === 2 ? '#94A3B8' : '#CD7F32'} />
                                <text x="11" y="11" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="10" fontWeight="bold">
                                  {rank}
                                </text>
                              </svg>
                              <span style={{ fontSize: '11px', color: COLORS.text.secondary }}>
                                {value}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Column 2 */}
                <div>
                  {/* Career Decision Card */}
                  {supplementaryData.careerDecision && (
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '16px',
                      border: '1px solid #E2E8F0',
                    }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '12px' }}>
                        진로결정 상태
                      </h3>
                      <div style={{
                        textAlign: 'center',
                        padding: '16px',
                        borderRadius: '10px',
                        backgroundColor: supplementaryData.careerDecision.level === '확정'
                          ? '#10B98120' : supplementaryData.careerDecision.level === '탐색'
                          ? `${COLORS.accent}20` : '#EF444420',
                        marginBottom: '12px',
                      }}>
                        <p style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: supplementaryData.careerDecision.level === '확정'
                            ? '#10B981' : supplementaryData.careerDecision.level === '탐색'
                            ? COLORS.accent : '#EF4444',
                          marginBottom: '4px',
                        }}>
                          {supplementaryData.careerDecision.level}
                        </p>
                        <p style={{ fontSize: '10px', color: COLORS.muted }}>결정 수준</p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: COLORS.text.muted }}>확신도</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '80px',
                            height: '6px',
                            borderRadius: '3px',
                            backgroundColor: '#E2E8F0',
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${supplementaryData.careerDecision.confidence * 100}%`,
                              height: '100%',
                              borderRadius: '3px',
                              backgroundColor: supplementaryData.careerDecision.level === '확정' ? '#10B981' : COLORS.accent,
                            }} />
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: COLORS.primary }}>
                            {Math.round(supplementaryData.careerDecision.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Preferences Card */}
                  {supplementaryData.preferences && (
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '16px',
                      border: '1px solid #E2E8F0',
                    }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '12px' }}>
                        선호 스타일
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {supplementaryData.preferences.fieldPreference && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{
                              fontSize: '10px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              backgroundColor: `${COLORS.primary}15`,
                              color: COLORS.primary,
                              fontWeight: '600',
                            }}>
                              분야
                            </span>
                            <span style={{ fontSize: '11px', color: COLORS.text.secondary }}>
                              {supplementaryData.preferences.fieldPreference}
                            </span>
                          </div>
                        )}
                        {supplementaryData.preferences.workStyle && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{
                              fontSize: '10px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              backgroundColor: `${COLORS.secondary}15`,
                              color: COLORS.secondary,
                              fontWeight: '600',
                            }}>
                              업무
                            </span>
                            <span style={{ fontSize: '11px', color: COLORS.text.secondary }}>
                              {supplementaryData.preferences.workStyle}
                            </span>
                          </div>
                        )}
                        {supplementaryData.preferences.environmentPreference && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{
                              fontSize: '10px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              backgroundColor: `${COLORS.accent}15`,
                              color: COLORS.accent,
                              fontWeight: '600',
                            }}>
                              환경
                            </span>
                            <span style={{ fontSize: '11px', color: COLORS.text.secondary }}>
                              {supplementaryData.preferences.environmentPreference}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Role Model Card */}
                  {supplementaryData.roleModel && (supplementaryData.roleModel.name || (supplementaryData.roleModel.traits && supplementaryData.roleModel.traits.length > 0)) && (
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #E2E8F0',
                    }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '12px' }}>
                        롤모델
                      </h3>
                      {supplementaryData.roleModel.name && (
                        <p style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '10px' }}>
                          {supplementaryData.roleModel.name}
                        </p>
                      )}
                      {supplementaryData.roleModel.traits && supplementaryData.roleModel.traits.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {supplementaryData.roleModel.traits.map((trait, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '10px',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                backgroundColor: `${COLORS.accent}15`,
                                color: COLORS.accent,
                              }}
                            >
                              {trait}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Adjusted Score Comparison */}
                  {supplementaryData.selfEfficacy && (
                    <div style={{
                      backgroundColor: '#EFF6FF',
                      borderRadius: '12px',
                      padding: '16px',
                      marginTop: '16px',
                      border: '1px solid #BFDBFE',
                    }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1E40AF', marginBottom: '12px' }}>
                        보정 점수 비교
                      </h3>
                      <p style={{ fontSize: '9px', color: '#3B82F6', marginBottom: '10px' }}>
                        적합도(0.9) + 자기효능감(0.3) Z-score 기반 보정
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {dimensions.map((dim) => {
                          const originalScore = scores[dim];
                          const adjustedScore = adjustedScores[dim];
                          const diff = adjustedScore - originalScore;
                          return (
                            <div key={dim} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '4px',
                                  backgroundColor: RIASEC_LABELS[dim].color,
                                  color: 'white',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}>
                                  {dim}
                                </span>
                                <span style={{ fontSize: '10px', color: COLORS.text.secondary }}>
                                  {RIASEC_LABELS[dim].name}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '10px', color: COLORS.muted }}>
                                  {originalScore.toFixed(1)}
                                </span>
                                <span style={{ fontSize: '10px', color: COLORS.muted }}>→</span>
                                <span style={{ fontSize: '10px', fontWeight: 'bold', color: COLORS.primary }}>
                                  {adjustedScore.toFixed(1)}
                                </span>
                                {diff !== 0 && (
                                  <span style={{
                                    fontSize: '9px',
                                    color: diff > 0 ? '#10B981' : '#EF4444',
                                    fontWeight: '600',
                                  }}>
                                    {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* PDF Footer */}
              <div style={{
                borderTop: '2px solid #E2E8F0',
                paddingTop: '14px',
                marginTop: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <p style={{ fontSize: '9px', color: COLORS.muted }}>
                  진로교육 프로그램 · 보완 프로파일 분석 결과
                </p>
              </div>
            </div>
          )}

          {/* ==================== PAGE 4: 추천 직무 ==================== */}
          <div
            id="pdf-page-4"
            style={{
              width: '800px',
              padding: '24px',
              backgroundColor: '#FFFFFF',
              fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
              wordBreak: 'keep-all',
            }}
          >
            {/* Page Header */}
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '4px' }}>
                {supplementaryData ? '5' : '4'}. 추천 직무
              </h2>
              <p style={{ fontSize: '10px', color: COLORS.muted }}>
                {supplementaryData
                  ? '검사 결과와 추천 전공을 기반으로 분석한 적합 직무입니다. 보완검사 적용 전/후를 비교합니다.'
                  : '검사 결과와 추천 전공을 기반으로 분석한 적합 직무입니다'}
              </p>
            </div>

            {supplementaryData ? (
              /* ===== 2-Column: Left=적용후, Right=적용전 ===== */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {/* Left: 적용 후 */}
                <div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    marginBottom: '10px', paddingBottom: '6px', borderBottom: '2px solid #3B82F6',
                  }}>
                    <svg width="18" height="18"><rect width="18" height="18" rx="4" fill="#3B82F6" /><text x="9" y="9" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="10" fontWeight="bold">A</text></svg>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1E40AF' }}>보완검사 적용 후</span>
                  </div>
                  {pdfAdjustedRoles.slice(0, 8).map((role, idx) => {
                    const matchPercent = Math.round(role.matchScore * 100);
                    const isNew = !pdfOriginalRoles.some(r => r.key === role.key);
                    return (
                      <div key={`adj-role-${role.key}`} style={{
                        backgroundColor: '#EFF6FF', borderRadius: '8px', padding: '10px',
                        marginBottom: '6px', border: '1.5px solid #BFDBFE',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '22px', height: '22px', borderRadius: '6px',
                            backgroundColor: idx < 3 ? '#3B82F6' : '#93C5FD',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>{idx + 1}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1E40AF' }}>
                                {role.name.replace(/\s*\(.*?\)\s*/g, '').trim()}
                              </span>
                              {role.isRelatedToMajor && (
                                <span style={{ fontSize: '7px', fontWeight: 'bold', color: '#B45309', backgroundColor: '#FEF3C7', padding: '1px 4px', borderRadius: '3px' }}>전공연관</span>
                              )}
                              {isNew && (
                                <span style={{ fontSize: '7px', fontWeight: 'bold', color: 'white', backgroundColor: '#10B981', padding: '1px 4px', borderRadius: '3px' }}>NEW</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ flex: 1, height: '5px', backgroundColor: '#DBEAFE', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${matchPercent}%`, height: '100%', backgroundColor: '#3B82F6', borderRadius: '3px' }} />
                              </div>
                              <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#2563EB' }}>{matchPercent}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right: 적용 전 */}
                <div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    marginBottom: '10px', paddingBottom: '6px', borderBottom: '2px solid #94A3B8',
                  }}>
                    <svg width="18" height="18"><rect width="18" height="18" rx="4" fill={COLORS.primary} /><text x="9" y="9" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="10" fontWeight="bold">B</text></svg>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: COLORS.primary }}>보완검사 적용 전</span>
                  </div>
                  {pdfOriginalRoles.slice(0, 8).map((role, idx) => {
                    const matchPercent = Math.round(role.matchScore * 100);
                    const retained = pdfAdjustedRoles.some(r => r.key === role.key);
                    return (
                      <div key={`orig-role-${role.key}`} style={{
                        backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '10px',
                        marginBottom: '6px', border: '1px solid #E2E8F0',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '22px', height: '22px', borderRadius: '6px',
                            backgroundColor: idx < 3 ? COLORS.primary : '#94A3B8',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>{idx + 1}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 'bold', color: COLORS.primary }}>
                                {role.name.replace(/\s*\(.*?\)\s*/g, '').trim()}
                              </span>
                              {role.isRelatedToMajor && (
                                <span style={{ fontSize: '7px', fontWeight: 'bold', color: '#B45309', backgroundColor: '#FEF3C7', padding: '1px 4px', borderRadius: '3px' }}>전공연관</span>
                              )}
                              {retained && (
                                <span style={{ fontSize: '7px', fontWeight: 'bold', color: '#059669', backgroundColor: '#F0FDF4', padding: '1px 4px', borderRadius: '3px', border: '1px solid #10B981' }}>유지</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ flex: 1, height: '5px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${matchPercent}%`, height: '100%', backgroundColor: role.isRelatedToMajor ? '#F59E0B' : COLORS.primary, borderRadius: '3px' }} />
                              </div>
                              <span style={{ fontSize: '10px', fontWeight: 'bold', color: COLORS.primary }}>{matchPercent}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ===== Single 2x4 grid: no supplementary ===== */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {pdfOriginalRoles.slice(0, 8).map((role, idx) => {
                  const matchPercent = Math.round(role.matchScore * 100);
                  return (
                    <div key={role.key} style={{
                      backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '14px',
                      border: role.isRelatedToMajor ? '2px solid #F59E0B' : '1px solid #E2E8F0',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '8px',
                          backgroundColor: idx < 3 ? COLORS.primary : '#94A3B8',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>{idx + 1}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.text.primary, margin: 0 }}>
                              {role.name.replace(/\s*\(.*?\)\s*/g, '').trim()}
                            </h3>
                            {role.isRelatedToMajor && (
                              <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#B45309', backgroundColor: '#FEF3C7', padding: '2px 6px', borderRadius: '4px' }}>전공연관</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <div style={{ flex: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${matchPercent}%`, height: '100%', backgroundColor: role.isRelatedToMajor ? '#F59E0B' : COLORS.primary, borderRadius: '3px' }} />
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: COLORS.primary }}>{matchPercent}%</span>
                          </div>
                          {role.matchReasons.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {role.matchReasons.slice(0, 2).map((reason, i) => (
                                <span key={i} style={{ fontSize: '9px', color: COLORS.text.secondary, backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>{reason}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* PDF Footer */}
            <div style={{
              borderTop: '2px solid #E2E8F0', paddingTop: '14px', marginTop: '20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <p style={{ fontSize: '9px', color: COLORS.muted }}>진로교육 프로그램 · 추천 직무 분석</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiasecResult;
