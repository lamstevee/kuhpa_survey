import { MAJORS } from "../data/majorList";
import type { ClusterType } from "../data/questionPool";
import { DIMS, type Dim, type PreparedVector, clamp, prepareVector, getSortedDims, cosineSimilarity } from './riasecMath';

type RiasecResult = Partial<Record<Dim, number>>;

// ============================================================
// 추천 제외 정책
// ------------------------------------------------------------
// 원본에는 특정 기관의 모집 정책(전형 제한, 폐과, 계약학과 등)에 따른
// 상세 제외 목록이 있었습니다. 이 데모는 예시 전공 26개를 모두 동등하게
// 추천하므로 목록을 비워 두었습니다. 필요하면 아래 배열을 채우세요.
// ============================================================

const EXCLUDED_MAJOR_KEYWORDS: string[] = [];
const ABSOLUTE_EXCLUSION_KEYWORDS: string[] = [];
export const DISCONTINUED_MAJORS: string[] = [];
const DISCONTINUED_BUSINESS_MAJORS: string[] = [];
const CONDITIONAL_EXCLUSION_KEYWORDS_FUTURE: string[] = [];
export const CONDITIONAL_EXCLUSION_COLLEGES: string[] = [];
export const STRICT_EXCLUSION_COLLEGES: string[] = [];
const FUTURE_CONVERGENCE_KEYWORDS: string[] = [];


function isExcludedMajor(majorName: string): boolean {
  const normalized = majorName.toLowerCase();
  return EXCLUDED_MAJOR_KEYWORDS.some(keyword => normalized.includes(keyword));
}

export function isAbsoluteExcludedMajor(majorName: string, majorKey?: string): boolean {
  // 완전제외 키워드 체크
  const isAbsoluteExcluded = ABSOLUTE_EXCLUSION_KEYWORDS.some(keyword =>
    majorName.includes(keyword) || (majorKey && majorKey.includes(keyword))
  );
  // 경영대학 국제통상학과 체크 (사회과학대학 국제통상학전공은 제외)
  const isDiscontinuedBusiness = DISCONTINUED_BUSINESS_MAJORS.some(keyword =>
    majorName === keyword || (majorKey && majorKey === keyword)
  );
  return isAbsoluteExcluded || isDiscontinuedBusiness;
}

// 폐과 체크 (25학년도부터 신입생 미모집)
// 해당 학과 소속 SSO 학생에게만 노출됨
export function isDiscontinuedMajor(majorName: string, majorKey?: string): boolean {
  return DISCONTINUED_MAJORS.some(keyword =>
    majorName.includes(keyword) || (majorKey && majorKey.includes(keyword))
  );
}

// 폐과 필터링: SSO 사용자의 소속 학과와 비교
// userMajorName: SSO 사용자의 학과명/전공명
export function shouldShowDiscontinuedMajor(
  majorName: string,
  majorKey: string | undefined,
  userMajorName?: string
): boolean {
  // 폐과가 아니면 항상 표시
  if (!isDiscontinuedMajor(majorName, majorKey)) {
    return true;
  }
  // 폐과인 경우: 사용자가 해당 학과 소속인 경우에만 표시
  if (!userMajorName) {
    return false; // 외부접속은 폐과 비노출
  }
  // 사용자 학과명과 폐과 학과명 비교
  return DISCONTINUED_MAJORS.some(keyword =>
    userMajorName.includes(keyword) && majorName.includes(keyword)
  );
}

// 조건부제외: 융합대학 전공 키워드 체크
export function isFutureCollegeMajor(majorName: string, majorKey?: string): boolean {
  return CONDITIONAL_EXCLUSION_KEYWORDS_FUTURE.some(keyword =>
    majorName.includes(keyword) || (majorKey && majorKey.includes(keyword))
  );
}

// 조건부제외: 단과대학 기반 체크 (예술체육대학, 융합대학)
export function isConditionalExcludedCollege(majorCollege?: string): boolean {
  if (!majorCollege) return false;
  return CONDITIONAL_EXCLUSION_COLLEGES.includes(majorCollege);
}

function isFutureConvergenceMajor(majorName: string): boolean {
  return FUTURE_CONVERGENCE_KEYWORDS.some(keyword => majorName.includes(keyword));
}

interface MajorProfile {
  key: string;
  name: string;
  vec: Partial<Record<Dim, number>>;
  cluster?: ClusterType;
  college?: string;
  url?: string; // 전공 홈페이지 URL
}

export interface RecommendedMajor extends MajorProfile {
  matchScore: number;
  signature: string;
  reasons: string[];
  clusterBonus?: number; // 계열 일치 보너스
}

function getSignature(vector: Record<Dim, number>) {
  const sorted = getSortedDims(vector);
  const primary = sorted[0] ?? 'R';
  const secondary = sorted[1] ?? sorted[0] ?? 'R';
  return `${primary}>${secondary}`;
}

function buildReasons(topDims: Dim[], majorVec: Record<Dim, number>) {
  const labels: Record<Dim, string> = {
    R: "현장형",
    I: "탐구형",
    A: "예술형",
    S: "사회형",
    E: "진취형",
    C: "사무형",
    V: "가치형"
  };

  return topDims
    .filter((dim) => majorVec[dim] >= 0.55)
    .map((dim) => `${labels[dim]} 강점`);
}

interface RecommendOptions {
  limit?: number;
  clusterScores?: Partial<Record<ClusterType, number>>; // 🆕 계열 점수
  grade?: number; // 학년 (1학년인 경우 융합대학 전공 제외)
  userCollege?: string; // SSO 사용자의 단과대학 (조건부제외용)
}

// 🆕 인접 계열 매핑 (유사한 계열 간 부분 보너스)
const ADJACENT_CLUSTERS: Record<ClusterType, ClusterType[]> = {
  "인문": ["사회", "예체능"],
  "사회": ["인문", "경상"],
  "경상": ["사회", "융합"],
  "공학": ["자연", "융합"],
  "자연": ["공학", "융합"],
  "예체능": ["인문", "융합"],
  "융합": ["공학", "자연", "경상"]
};

export function recommendMajors(
  careerTestResult: RiasecResult | null | undefined,
  options: RecommendOptions = {}
): RecommendedMajor[] {
  const limit = Math.max(1, options.limit ?? 5);
  const clusterScores = options.clusterScores;
  const grade = options.grade;
  const userCollege = options.userCollege;

  if (!careerTestResult) {
    return [];
  }

  const userVector = prepareVector(careerTestResult);
  if (userVector.magnitude === 0) {
    return [];
  }

  const sortedUserDims = getSortedDims(userVector.vector);
  const topDims = sortedUserDims.slice(0, 3) as Dim[];
  const lowDims = sortedUserDims.filter((dim) => userVector.vector[dim] <= 0.2);
  const primaryDim = sortedUserDims[0];

  const scoredMajors = MAJORS
    // Filter out excluded majors (medical-related)
    .filter((major) => !isExcludedMajor(major.name))
    // Filter out absolute exclusion majors (외국인전용, 아너칼리지 등)
    .filter((major) => !isAbsoluteExcludedMajor(major.name, major.key))
    // Filter out conditional exclusion by college
    .filter((major) => {
      // 전공의 단과대학이 조건부제외 대상이 아니면 통과
      if (!isConditionalExcludedCollege(major.college)) return true;

      // 외부접속(userCollege 없음)인 경우
      if (!userCollege) {
        // 융합대학만 제외, 예술체육대학은 허용
        return !STRICT_EXCLUSION_COLLEGES.includes(major.college!);
      }

      // SSO접속(userCollege 있음)인 경우: 본인 소속 단과대학만 추천
      return userCollege === major.college;
    })
    // Filter out future convergence majors for freshmen (grade 1)
    .filter((major) => grade !== 1 || !isFutureConvergenceMajor(major.name))
    .map((major) => {
    const majorVector = prepareVector(major.vec);
    if (majorVector.magnitude === 0) {
      return null;
    }

    const baseCos = cosineSimilarity(userVector.normalized, majorVector.normalized);

    const synergy = topDims.reduce((score, dim, idx) => {
      const userVal = userVector.vector[dim];
      if (userVal < 0.35) {
        return score;
      }
      const weight = idx === 0 ? 0.35 : idx === 1 ? 0.25 : 0.15;
      const closeness = 1 - Math.min(1, Math.abs(userVal - majorVector.vector[dim]));
      return score + weight * closeness;
    }, 0);

    const shortagePenalty = topDims.reduce((penalty, dim) => {
      const userVal = userVector.vector[dim];
      const majorVal = majorVector.vector[dim];
      if (userVal >= 0.5 && majorVal < userVal * 0.55) {
        return penalty + (userVal - majorVal) * 0.25;
      }
      return penalty;
    }, 0);

    const overloadPenalty = lowDims.reduce((penalty, dim) => {
      const majorVal = majorVector.vector[dim];
      if (majorVal >= 0.55) {
        return penalty + (majorVal - 0.55) * 0.4;
      }
      return penalty;
    }, 0);

    const balancePenalty = DIMS.reduce((penalty, dim) => {
      return penalty + Math.abs(userVector.vector[dim] - majorVector.vector[dim]) * 0.03;
    }, 0);

    const diversityBonus =
      majorVector.vector[primaryDim] >= 0.6 ? 0.02 * (majorVector.vector[primaryDim] - 0.6) * 10 : 0;

    // 🆕 계열 일치도 보너스 계산
    let clusterBonus = 0;
    if (clusterScores && major.cluster) {
      const majorCluster = major.cluster as ClusterType;
      const userClusterScore = clusterScores[majorCluster] || 0;
      
      if (userClusterScore >= 0.7) {
        // 정확히 일치하는 계열에 높은 보너스
        clusterBonus = 0.15;
      } else if (userClusterScore >= 0.4) {
        // 어느 정도 관심 있는 계열에 중간 보너스
        clusterBonus = 0.08;
      } else {
        // 인접 계열 체크
        const adjacentClusters = ADJACENT_CLUSTERS[majorCluster] || [];
        const hasAdjacentInterest = adjacentClusters.some(adj => (clusterScores[adj] || 0) >= 0.5);
        if (hasAdjacentInterest) {
          clusterBonus = 0.05;
        }
      }
    }

    // 🆕 점수 공식 수정: 계열 일치도 반영 (30%)
    // 기존: baseCos * 0.55 + synergy * 0.35
    // 변경: baseCos * 0.45 + synergy * 0.25 + clusterBonus (최대 0.30)
    const rawScore = clusterScores 
      ? baseCos * 0.45 + synergy * 0.25 + clusterBonus * 2 + diversityBonus - (shortagePenalty + overloadPenalty + balancePenalty)
      : baseCos * 0.55 + synergy * 0.35 + diversityBonus - (shortagePenalty + overloadPenalty + balancePenalty);
    
    const normalizedScore = Math.max(0, Math.min(1, rawScore));

    return {
      ...major,
      matchScore: Math.round(normalizedScore * 100),
      rawScore: normalizedScore,
      signature: getSignature(majorVector.vector),
      reasons: buildReasons(topDims, majorVector.vector),
      clusterBonus: clusterBonus
    };
  })
    // TS 5.5+ 는 이 형태의 filter 콜백에서 타입 술어를 자동 추론하므로
    // 잘못된 수동 술어(RecommendedMajor & { rawScore: number }) 대신 사용합니다.
    .filter((major) => major !== null)
    .sort((a, b) => {
      if (b.rawScore === a.rawScore) {
        return a.name.localeCompare(b.name, "ko");
      }
      return b.rawScore - a.rawScore;
    })
    .map(({ rawScore, ...rest }) => rest);

  if (scoredMajors.length === 0) {
    return [];
  }

  const signatureBuckets = new Map<string, RecommendedMajor[]>();
  scoredMajors.forEach((major) => {
    if (!signatureBuckets.has(major.signature)) {
      signatureBuckets.set(major.signature, []);
    }
    signatureBuckets.get(major.signature)!.push(major);
  });

  const bucketLeaders = Array.from(signatureBuckets.entries())
    .map(([signature, majors]) => ({
      signature,
      leader: majors[0]
    }))
    .sort((a, b) => b.leader.matchScore - a.leader.matchScore);

  const recommendations: RecommendedMajor[] = [];
  const usedKeys = new Set<string>();

  bucketLeaders.forEach(({ leader }) => {
    if (recommendations.length >= limit) return;
    if (!usedKeys.has(leader.key)) {
      recommendations.push(leader);
      usedKeys.add(leader.key);
    }
  });

  if (recommendations.length < limit) {
    scoredMajors.forEach((major) => {
      if (recommendations.length >= limit) return;
      if (!usedKeys.has(major.key)) {
        recommendations.push(major);
        usedKeys.add(major.key);
      }
    });
  }

  if (recommendations.length < limit) {
    MAJORS
      .filter((major) => !isExcludedMajor(major.name))
      .filter((major) => !isAbsoluteExcludedMajor(major.name, major.key))
      .filter((major) => {
        if (!isConditionalExcludedCollege(major.college)) return true;
        if (!userCollege) {
          return !STRICT_EXCLUSION_COLLEGES.includes(major.college!);
        }
        return userCollege === major.college;
      })
      .forEach((major) => {
        if (recommendations.length >= limit) return;
        if (!usedKeys.has(major.key)) {
          recommendations.push({
            ...major,
            matchScore: 0,
            signature: getSignature(prepareVector(major.vec).vector),
            reasons: []
          });
          usedKeys.add(major.key);
        }
      });
  }

  return recommendations.slice(0, limit);
}

