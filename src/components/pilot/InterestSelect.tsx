import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ClusterType } from '../../data/questionPool';
import { CollegeName } from '../../data/departmentCollegeMap';

interface InterestSelectProps {
  selectedClusters: ClusterType[];
  onSelectCluster: (cluster: ClusterType) => void;
  onNext: () => void;
  userCollege?: CollegeName | null;  // SSO 사용자 소속 단과대학
}

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
};

const CLUSTERS = [
  {
    type: '인문' as ClusterType,
    description: '언어, 문학, 역사, 철학 등 인간과 문화를 탐구합니다',
  },
  {
    type: '사회' as ClusterType,
    description: '행정, 정치, 법, 사회복지 등 사회 구조를 이해합니다',
  },
  {
    type: '경상' as ClusterType,
    description: '경영, 경제, 회계, 무역 등 비즈니스를 배웁니다',
  },
  {
    type: '공학' as ClusterType,
    description: '기계, 전자, 건축, 화학공학 등 기술을 개발합니다',
  },
  {
    type: '자연' as ClusterType,
    description: '수학, 물리, 화학, 생물 등 자연 현상을 탐구합니다',
  },
  {
    type: '예체능' as ClusterType,
    description: '디자인, 음악, 체육, 영화 등 예술과 신체를 표현합니다',
  },
  {
    type: '융합' as ClusterType,
    description: 'AI, 소프트웨어, 데이터사이언스 등 미래 기술을 융합합니다',
  },
];

// 단과대학별 허용되는 계열 매핑
const COLLEGE_CLUSTER_MAP: Record<string, ClusterType[]> = {
  '예술체육대학': ['예체능'],
  '융합대학': ['사회', '경상', '예체능', '융합'],
};

export default function InterestSelect({
  selectedClusters,
  onSelectCluster,
  onNext,
  userCollege,
}: InterestSelectProps) {
  // 사용자 단과대학에 따라 필터링된 계열 목록
  const filteredClusters = useMemo(() => {
    if (userCollege && COLLEGE_CLUSTER_MAP[userCollege]) {
      const allowedTypes = COLLEGE_CLUSTER_MAP[userCollege];
      return CLUSTERS.filter(c => allowedTypes.includes(c.type));
    }
    return CLUSTERS;
  }, [userCollege]);

  const isSelected = (cluster: ClusterType) => selectedClusters.includes(cluster);
  const isMaxSelected = selectedClusters.length >= 3;
  const canProceed = selectedClusters.length > 0;

  const handleCardClick = (cluster: ClusterType) => {
    if (isSelected(cluster)) {
      // Always allow deselection
      onSelectCluster(cluster);
    } else if (selectedClusters.length < 3) {
      // Allow selection only if under limit
      onSelectCluster(cluster);
    }
  };

  // 제한된 계열만 표시되는 경우 안내 메시지
  const isRestricted = userCollege && COLLEGE_CLUSTER_MAP[userCollege];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: COLORS.bg }}
    >
      <div className="w-full max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            style={{ color: COLORS.primary }}
          >
            관심 있는 계열을 선택해 주세요
          </h1>
          <p
            className="text-base lg:text-lg mb-4"
            style={{ color: COLORS.text.secondary }}
          >
            {filteredClusters.length === 1
              ? '아래 계열을 선택하고 진행해 주세요'
              : `최대 ${Math.min(3, filteredClusters.length)}개까지 선택할 수 있습니다`}
          </p>

          {/* 제한 안내 */}
          {isRestricted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-block px-4 py-2 rounded-lg text-sm mb-4"
              style={{
                backgroundColor: '#FEF3C7',
                color: '#92400E',
                border: '1px solid #FDE68A',
              }}
            >
              📍 {userCollege} 소속 학생은 본인 단과대학 관련 계열만 선택 가능합니다
            </motion.div>
          )}

          <div
            className="inline-block px-4 py-2 rounded-full text-sm font-semibold"
            style={{
              backgroundColor: `${COLORS.primary}15`,
              color: COLORS.primary,
            }}
          >
            {selectedClusters.length}개 선택됨
          </div>
        </motion.div>

        {/* Cluster Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`grid gap-4 mb-12 ${
            filteredClusters.length === 1
              ? 'grid-cols-1 max-w-md mx-auto'
              : filteredClusters.length <= 4
                ? 'grid-cols-2 md:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto'
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          }`}
        >
          {filteredClusters.map((cluster, index) => {
            const selected = isSelected(cluster.type);
            const isDimmed = !selected && isMaxSelected;

            return (
              <motion.button
                key={cluster.type}
                onClick={() => handleCardClick(cluster.type)}
                whileHover={
                  !isDimmed
                    ? {
                        scale: 1.03,
                        boxShadow: `0 8px 24px ${COLORS.primary}20`,
                      }
                    : {}
                }
                whileTap={!isDimmed ? { scale: 0.97 } : {}}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                className="relative p-6 rounded-2xl transition-all duration-300 text-left"
                style={{
                  backgroundColor: selected
                    ? `${COLORS.primary}10`
                    : COLORS.surface,
                  border: selected
                    ? `3px solid ${COLORS.primary}`
                    : '2px solid #E5E7EB',
                  opacity: isDimmed ? 0.5 : 1,
                  cursor: isDimmed && !selected ? 'not-allowed' : 'pointer',
                }}
                disabled={isDimmed && !selected}
              >
                {/* Checkmark Badge */}
                {selected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: COLORS.primary }}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="#FFFFFF"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </motion.div>
                )}

                {/* Cluster Name */}
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: COLORS.primary }}
                >
                  {cluster.type}
                </h3>

                {/* Description */}
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: COLORS.text.secondary }}
                >
                  {cluster.description}
                </p>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Next Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <motion.button
            whileHover={
              canProceed
                ? { y: -2, boxShadow: `0 16px 32px ${COLORS.primary}25` }
                : {}
            }
            whileTap={canProceed ? { scale: 0.98 } : {}}
            onClick={onNext}
            disabled={!canProceed}
            className="px-12 py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: canProceed
                ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`
                : '#CBD5E1',
            }}
          >
            선택한 계열의 전공 살펴보기
          </motion.button>

          {!canProceed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm mt-4"
              style={{ color: COLORS.muted }}
            >
              최소 1개 이상의 계열을 선택해 주세요
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
