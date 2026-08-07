// 전공-직무 연계 매핑 테이블
// 전공별로 관련 직무에 가중치 보너스 부여

import type { ClusterType } from './questionPool';

// 계열별 관련 직무 그룹
export const CLUSTER_CAREER_MAP: Record<ClusterType, {
  relatedOccupations: string[]; // OCC_ROLES의 name 키워드
  bonusWeight: number;
}> = {
  "인문": {
    relatedOccupations: [
      "편집", "작가", "번역", "통역", "기자", "언론", "출판",
      "교수", "강사", "교사", "학예사", "큐레이터", "문화",
      "홍보", "광고", "콘텐츠", "미디어"
    ],
    bonusWeight: 0.25
  },
  "사회": {
    relatedOccupations: [
      "상담", "복지", "행정", "정책", "공무원", "법률", "법무",
      "청소년", "아동", "교육", "심리", "사회",
      "인사", "HR", "노무", "조직", "NGO", "국제기구"
    ],
    bonusWeight: 0.25
  },
  "경상": {
    relatedOccupations: [
      "경영", "마케팅", "영업", "재무", "회계", "감사", "세무",
      "금융", "투자", "증권", "보험", "은행", "자산",
      "컨설팅", "전략", "기획", "창업", "사업개발",
      "무역", "통상", "물류", "유통"
    ],
    bonusWeight: 0.30
  },
  "공학": {
    relatedOccupations: [
      "엔지니어", "기술", "설계", "개발", "연구",
      "건설", "건축", "토목", "시공", "감리",
      "기계", "자동차", "로봇", "제조",
      "전기", "전자", "반도체", "통신", "네트워크",
      "화학", "소재", "에너지", "환경"
    ],
    bonusWeight: 0.30
  },
  "자연": {
    relatedOccupations: [
      "연구", "과학", "실험", "분석", "검사",
      "의약", "바이오", "생명", "생물", "화학",
      "물리", "수학", "통계", "데이터",
      "식품", "영양", "품질관리"
    ],
    bonusWeight: 0.25
  },
  "예체능": {
    relatedOccupations: [
      "디자이너", "디자인", "아티스트", "예술",
      "음악", "작곡", "연주", "가수", "보컬",
      "연극", "영화", "배우", "감독", "연출", "공연",
      "스포츠", "체육", "코치", "트레이너", "선수",
      "애니메이션", "게임", "영상", "미디어"
    ],
    bonusWeight: 0.30
  },
  "융합": {
    relatedOccupations: [
      "소프트웨어", "프로그래머", "개발자", "코딩",
      "데이터", "AI", "인공지능", "머신러닝",
      "IT", "정보", "시스템", "보안", "클라우드",
      "기획", "PM", "프로젝트", "UX", "UI"
    ],
    bonusWeight: 0.30
  }
};

// 전공 키워드 기반 세부 직무 매핑
export const MAJOR_KEYWORD_CAREER_MAP: Record<string, {
  keywords: string[];
  extraBonus: number;
}> = {
  // 경영계열 세부
  "경영정보": { keywords: ["IT", "정보", "시스템", "데이터", "분석"], extraBonus: 0.15 },
  "경영학": { keywords: ["경영", "마케팅", "전략", "기획", "컨설팅"], extraBonus: 0.10 },
  "회계": { keywords: ["회계", "감사", "세무", "재무"], extraBonus: 0.15 },
  "무역": { keywords: ["무역", "통상", "물류", "수출입", "글로벌"], extraBonus: 0.10 },
  "경제": { keywords: ["경제", "금융", "투자", "증권", "분석"], extraBonus: 0.10 },
  
  // 공학계열 세부
  "컴퓨터": { keywords: ["소프트웨어", "개발", "프로그래머", "IT", "시스템"], extraBonus: 0.15 },
  "전자": { keywords: ["전자", "반도체", "회로", "임베디드"], extraBonus: 0.15 },
  "기계": { keywords: ["기계", "제조", "설계", "자동화"], extraBonus: 0.15 },
  "건축": { keywords: ["건축", "설계", "시공", "인테리어", "공간"], extraBonus: 0.15 },
  "화학공학": { keywords: ["화학", "공정", "소재", "에너지"], extraBonus: 0.10 },
  
  // 사회계열 세부
  "심리": { keywords: ["상담", "심리", "치료", "임상"], extraBonus: 0.15 },
  "사회복지": { keywords: ["복지", "사회", "상담", "지원"], extraBonus: 0.15 },
  "행정": { keywords: ["행정", "공무원", "정책", "공공"], extraBonus: 0.10 },
  "법": { keywords: ["법률", "법무", "변호사", "법원"], extraBonus: 0.15 },
  
  // 예체능계열 세부
  "디자인": { keywords: ["디자이너", "그래픽", "UI", "UX", "시각"], extraBonus: 0.15 },
  "음악": { keywords: ["음악", "연주", "작곡", "가수"], extraBonus: 0.15 },
  "체육": { keywords: ["스포츠", "트레이너", "코치", "선수"], extraBonus: 0.15 },
  "영화": { keywords: ["영화", "감독", "연출", "제작"], extraBonus: 0.15 },
  
  // 자연계열 세부
  "생명": { keywords: ["바이오", "생명", "연구", "실험"], extraBonus: 0.10 },
  "화학": { keywords: ["화학", "분석", "연구", "실험"], extraBonus: 0.10 },
  "수학": { keywords: ["수학", "통계", "데이터", "분석"], extraBonus: 0.10 },
  "식품영양": { keywords: ["영양", "식품", "품질", "위생"], extraBonus: 0.10 }
};

/**
 * 전공 기반 직무 관련성 점수 계산
 * @param majorName 전공명
 * @param majorCluster 전공 계열
 * @param occupationName 직무명
 * @returns 관련성 보너스 점수 (0 ~ 0.45)
 */
export function getMajorCareerBonus(
  majorName: string,
  majorCluster: ClusterType,
  occupationName: string
): number {
  let bonus = 0;
  const occLower = occupationName.toLowerCase();
  
  // 1. 계열 기반 보너스
  const clusterMap = CLUSTER_CAREER_MAP[majorCluster];
  if (clusterMap) {
    const isRelated = clusterMap.relatedOccupations.some(keyword => 
      occLower.includes(keyword.toLowerCase())
    );
    if (isRelated) {
      bonus += clusterMap.bonusWeight;
    }
  }
  
  // 2. 전공 키워드 기반 추가 보너스
  for (const [majorKeyword, mapping] of Object.entries(MAJOR_KEYWORD_CAREER_MAP)) {
    if (majorName.includes(majorKeyword)) {
      const hasMatch = mapping.keywords.some(keyword =>
        occLower.includes(keyword.toLowerCase())
      );
      if (hasMatch) {
        bonus += mapping.extraBonus;
        break; // 첫 번째 매칭만 적용
      }
    }
  }
  
  // 최대 0.45로 제한
  return Math.min(bonus, 0.45);
}

/**
 * 직무가 특정 전공과 관련있는지 여부
 */
export function isCareerRelatedToMajor(
  majorName: string,
  majorCluster: ClusterType,
  occupationName: string
): boolean {
  return getMajorCareerBonus(majorName, majorCluster, occupationName) > 0;
}
