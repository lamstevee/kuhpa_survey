import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClusterType } from '../../data/questionPool';
import { MAJORS } from '../../data/majorList';
import { MAJOR_DESCRIPTIONS, MAJOR_CAREERS } from './RiasecResult';
import { RIASEC_DATA, RiasecCode } from '../../data/riasecData';
import { CollegeName, CONDITIONAL_EXCLUSION_COLLEGES } from '../../data/departmentCollegeMap';
import { shouldShowDiscontinuedMajor } from '../../utils/recommendMajors';

const DIMS: RiasecCode[] = ['R', 'I', 'A', 'S', 'E', 'C'];

function MiniRadar({ vec }: { vec: Partial<Record<string, number>> }) {
  const cx = 90, cy = 95, maxR = 60;
  const values = DIMS.map(d => vec[d] || 0);
  const maxVal = Math.max(...values, 0.01);

  const getXY = (i: number, r: number) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  return (
    <svg viewBox="0 0 180 200" className="w-full h-auto" style={{ maxWidth: 200 }}>
      {/* Grid */}
      {[1, 0.66, 0.33].map(scale => (
        <polygon
          key={scale}
          points={DIMS.map((_, i) => {
            const { x, y } = getXY(i, maxR * scale);
            return `${x},${y}`;
          }).join(' ')}
          fill="none" stroke="#E2E8F0" strokeWidth="1"
        />
      ))}
      {/* Axes */}
      {DIMS.map((_, i) => {
        const { x, y } = getXY(i, maxR);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#E2E8F0" strokeWidth="1" />;
      })}
      {/* Data polygon */}
      <polygon
        points={DIMS.map((d, i) => {
          const { x, y } = getXY(i, (values[i] / maxVal) * maxR);
          return `${x},${y}`;
        }).join(' ')}
        fill="rgba(30, 58, 95, 0.2)" stroke="#1E3A5F" strokeWidth="1.5"
      />
      {/* Data dots */}
      {DIMS.map((d, i) => {
        const { x, y } = getXY(i, (values[i] / maxVal) * maxR);
        return <circle key={d} cx={x} cy={y} r="3" fill="#1E3A5F" />;
      })}
      {/* Labels */}
      {DIMS.map((d, i) => {
        const { x, y } = getXY(i, maxR + 16);
        return (
          <g key={d}>
            <circle cx={x} cy={y} r="10" fill={RIASEC_DATA[d].color} />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize="8" fontWeight="bold">
              {d}
            </text>
          </g>
        );
      })}
    </svg>
  );
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

const CLUSTER_COLORS: Record<ClusterType, string> = {
  인문: '#F59E0B',
  사회: '#10B981',
  경상: '#3B82F6',
  공학: '#6366F1',
  자연: '#06B6D4',
  예체능: '#EC4899',
  융합: '#8B5CF6',
};

// 완전제외 전공 (외국인전용, 특별운영, 사회인재교육, 아너칼리지)
const ABSOLUTE_EXCLUSION_MAJOR_KEYS = [
  // 외국인 전용
  '글로벌한국어학',
  '글로벌비즈니스',
  '글로벌문화콘텐츠',
  // 특별운영/계약학과
  '창의융합인재',
  '계약학',
  // 융합대학 사회인 재교육
  '사회복지학',
  '부동산학',
  '법무행정',
  '심리치료',
  // 아너칼리지 (입학 전형으로만 입학 가능)
  '아너칼리지',
  '자율전공',
  '전공자유',
];

interface MajorPreviewProps {
  selectedClusters: ClusterType[];
  onStartRiasec: () => void;
  onBack: () => void;
  interestedMajorKeys: string[];
  onToggleMajor: (key: string) => void;
  userCollege?: CollegeName | null;  // SSO 사용자의 단과대학 (조건부 제외용)
  userMajorName?: string | null;     // SSO 사용자의 학과/전공명 (폐과 필터링용)
}

export default function MajorPreview({ selectedClusters, onStartRiasec, onBack, interestedMajorKeys, onToggleMajor, userCollege, userMajorName }: MajorPreviewProps) {
  const [selectedMajorKey, setSelectedMajorKey] = useState<string | null>(null);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  // 전공 필터링: 클러스터 + 제외 규칙 적용
  const filteredMajors = useMemo(() => {
    // SSO 사용자가 조건부제외 단과대학 소속인지 확인
    const isUserFromConditionalCollege = userCollege && CONDITIONAL_EXCLUSION_COLLEGES.includes(userCollege);

    return MAJORS.filter((major) => {
      // 1. 선택한 클러스터에 속하는지 확인
      if (!selectedClusters.includes(major.cluster)) {
        return false;
      }

      // 2. 완전제외 전공 필터
      if (ABSOLUTE_EXCLUSION_MAJOR_KEYS.some(key => major.key.includes(key) || major.name.includes(key.replace('전공', '').replace('학과', '')))) {
        return false;
      }

      // 2-1. 폐과 필터 (25학년도 신입생 미모집)
      // 해당 학과 소속 SSO 학생에게만 노출
      if (!shouldShowDiscontinuedMajor(major.name, major.key, userMajorName || undefined)) {
        return false;
      }

      // 3. 조건부제외 단과대학 소속 SSO 사용자: 본인 단과대학 전공만 표시
      if (isUserFromConditionalCollege) {
        // 예술체육대학 또는 융합대학 학생은 본인 단과대학 전공만 볼 수 있음
        return major.college === userCollege;
      }

      // 4. 일반 SSO 사용자 또는 외부접속: 조건부제외 단과대학 전공 필터링
      if (CONDITIONAL_EXCLUSION_COLLEGES.includes(major.college as CollegeName)) {
        // 외부접속(userCollege 없음)인 경우: 융합대학만 제외, 예술체육대학은 허용
        if (!userCollege) {
          if (major.college === '융합대학') {
            return false;
          }
          // 예술체육대학은 통과
        } else {
          // 일반 단과대학 SSO 사용자: 조건부제외 단과대학 전공 제외
          return false;
        }
      }

      return true;
    });
  }, [selectedClusters, userCollege, userMajorName]);

  const majorsByCollege = filteredMajors.reduce((acc, major) => {
    if (!acc[major.college]) {
      acc[major.college] = [];
    }
    acc[major.college].push(major);
    return acc;
  }, {} as Record<string, typeof filteredMajors>);

  const sortedColleges = Object.keys(majorsByCollege).sort();
  const totalMajors = filteredMajors.length;

  const selectedMajor = selectedMajorKey
    ? filteredMajors.find((m) => m.key === selectedMajorKey) ?? null
    : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      {/* Sticky Header */}
      <div
        className="sticky top-0 z-10 px-6 py-4 border-b"
        style={{ backgroundColor: COLORS.surface, borderColor: '#E2E8F0' }}
      >
        <div className="max-w-5xl mx-auto">
          <h1
            className="text-2xl md:text-3xl font-bold mb-3"
            style={{ color: COLORS.primary }}
          >
            관심 전공 미리보기
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {selectedClusters.map((cluster) => (
              <span
                key={cluster}
                className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: CLUSTER_COLORS[cluster] }}
              >
                {cluster}
              </span>
            ))}
            <span className="text-sm ml-2" style={{ color: COLORS.text.secondary }}>
              총 <strong style={{ color: COLORS.primary }}>{totalMajors}개</strong> 전공
            </span>
            {interestedMajorKeys.length > 0 && (
              <span className="text-sm ml-2 px-3 py-1 rounded-full font-semibold" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                관심 전공 {interestedMajorKeys.length}개 선택됨
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Guide Banner */}
      {interestedMajorKeys.length === 0 && (
        <div className="max-w-5xl mx-auto px-6 pt-5 pb-0">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="#F59E0B" stroke="none">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span>관심 있는 전공의 <strong>별 아이콘</strong>을 눌러 최대 5개까지 찜해 보세요!</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 pb-28">
        {sortedColleges.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg" style={{ color: COLORS.text.secondary }}>
              선택한 계열에 해당하는 전공이 없습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {sortedColleges.map((college, collegeIdx) => (
              <motion.section
                key={college}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: collegeIdx * 0.08, duration: 0.4 }}
              >
                <h2
                  className="text-lg md:text-xl font-bold mb-5 pb-2 border-b-2"
                  style={{ color: COLORS.primary, borderColor: COLORS.accent }}
                >
                  {college}
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {majorsByCollege[college].map((major, idx) => (
                    <motion.div
                      key={major.key}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: collegeIdx * 0.08 + idx * 0.03, duration: 0.3 }}
                      whileHover={{ y: -3, boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedMajorKey(major.key)}
                      className="text-left rounded-2xl p-4 transition-all cursor-pointer"
                      style={{
                        backgroundColor: COLORS.surface,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        border: interestedMajorKeys.includes(major.key) ? '2px solid #F59E0B' : '1px solid #E2E8F0',
                      }}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: CLUSTER_COLORS[major.cluster] }}
                            />
                            <h3
                              className="font-bold text-sm truncate"
                              style={{ color: COLORS.primary }}
                            >
                              {major.name}
                            </h3>
                          </div>
                          <p className="text-xs" style={{ color: COLORS.text.muted }}>
                            {major.college}
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleMajor(major.key); }}
                          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-colors"
                          style={{ backgroundColor: interestedMajorKeys.includes(major.key) ? '#FEF3C7' : 'transparent' }}
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill={interestedMajorKeys.includes(major.key) ? '#F59E0B' : 'none'} stroke={interestedMajorKeys.includes(major.key) ? '#F59E0B' : '#94A3B8'} strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>
        )}
      </div>

      {/* Modal Popup */}
      <AnimatePresence>
        {selectedMajor && (
          <>
            {/* Backdrop - z-index를 Layout 헤더(z-50)보다 높게 설정 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-black/40"
              onClick={() => setSelectedMajorKey(null)}
            />

            {/* Modal - z-index를 Layout 헤더(z-50)보다 높게 설정 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4"
              onClick={() => setSelectedMajorKey(null)}
            >
              <div
                className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl shadow-2xl"
                style={{ backgroundColor: COLORS.surface }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Top accent bar */}
                <div
                  className="h-1.5 rounded-t-3xl"
                  style={{
                    background: `linear-gradient(135deg, ${CLUSTER_COLORS[selectedMajor.cluster]} 0%, ${COLORS.secondary} 100%)`,
                  }}
                />

                <div className="p-6 md:p-8">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: CLUSTER_COLORS[selectedMajor.cluster] }}
                        >
                          {selectedMajor.cluster}
                        </span>
                      </div>
                      <h2
                        className="text-xl md:text-2xl font-bold mt-2"
                        style={{ color: COLORS.primary }}
                      >
                        {selectedMajor.name}
                      </h2>
                      <p className="text-sm mt-1" style={{ color: COLORS.text.muted }}>
                        {selectedMajor.college}
                      </p>
                      <button
                        onClick={() => onToggleMajor(selectedMajor.key)}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                        style={{
                          backgroundColor: interestedMajorKeys.includes(selectedMajor.key) ? '#FEF3C7' : '#F1F5F9',
                          color: interestedMajorKeys.includes(selectedMajor.key) ? '#D97706' : '#64748B',
                          border: `1px solid ${interestedMajorKeys.includes(selectedMajor.key) ? '#FDE68A' : '#E2E8F0'}`,
                        }}
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={interestedMajorKeys.includes(selectedMajor.key) ? '#F59E0B' : 'none'} stroke={interestedMajorKeys.includes(selectedMajor.key) ? '#F59E0B' : 'currentColor'} strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        {interestedMajorKeys.includes(selectedMajor.key) ? '관심 전공' : '관심 전공 추가'}
                      </button>
                    </div>

                    {/* Close button */}
                    <button
                      onClick={() => setSelectedMajorKey(null)}
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={COLORS.muted} strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="h-px mb-5" style={{ backgroundColor: '#E2E8F0' }} />

                  {/* Description */}
                  <p
                    className="text-sm leading-relaxed mb-6"
                    style={{ color: COLORS.text.secondary }}
                  >
                    {MAJOR_DESCRIPTIONS[selectedMajor.name]
                      || `${selectedMajor.name}에서는 ${selectedMajor.college} 계열의 전문 지식과 역량을 키울 수 있습니다.`}
                  </p>

                  {/* RIASEC Profile Radar */}
                  <div className="flex justify-center mb-4">
                    <div style={{ width: 180 }}>
                      <MiniRadar vec={selectedMajor.vec} />
                      <p className="text-center text-xs mt-1" style={{ color: COLORS.text.muted }}>
                        RIASEC 프로파일
                      </p>
                    </div>
                  </div>

                  {/* Career Paths */}
                  {(() => {
                    const careers = MAJOR_CAREERS[selectedMajor.name];
                    if (!careers || careers.length === 0) return null;
                    return (
                      <div className="mb-6">
                        <h4
                          className="text-xs font-bold mb-3"
                          style={{ color: COLORS.text.primary }}
                        >
                          주요 진로
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {careers.slice(0, 5).map((career, cIdx) => (
                            <span
                              key={cIdx}
                              className="px-3 py-1.5 rounded-xl text-xs font-medium"
                              style={{
                                backgroundColor: `${COLORS.primary}10`,
                                color: COLORS.primary,
                                border: `1px solid ${COLORS.primary}20`,
                              }}
                            >
                              {career}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 강의용 데모: 전공 홈페이지 외부 링크는 제공하지 않습니다. */}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Skip Confirm Modal */}
      <AnimatePresence>
        {showSkipConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-black/40"
              onClick={() => setShowSkipConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            >
              <div
                className="w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center"
                style={{ backgroundColor: COLORS.surface }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#FEF3C7' }}
                >
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#F59E0B" stroke="none">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <p
                  className="text-base font-medium leading-relaxed mb-6"
                  style={{ color: COLORS.text.primary }}
                >
                  관심 전공을 선택하면 더 정교한 정보로<br />검사결과를 받아볼 수 있습니다.
                </p>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowSkipConfirm(false)}
                    className="flex-1 py-3 rounded-xl font-semibold text-white transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
                    }}
                  >
                    선택하기
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowSkipConfirm(false);
                      onStartRiasec();
                    }}
                    className="flex-1 py-3 rounded-xl font-semibold transition-all border-2"
                    style={{
                      color: COLORS.text.secondary,
                      borderColor: '#E2E8F0',
                      backgroundColor: COLORS.surface,
                    }}
                  >
                    넘어가기
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Fixed Bottom Action Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 px-6 py-4 border-t z-20"
        style={{
          backgroundColor: COLORS.surface,
          borderColor: '#E2E8F0',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
        }}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
            className="flex-1 sm:flex-none sm:w-48 py-3.5 px-6 rounded-xl font-semibold text-base border-2 transition-all"
            style={{
              color: COLORS.primary,
              borderColor: COLORS.primary,
              backgroundColor: COLORS.surface,
            }}
          >
            다른 계열 보기
          </motion.button>

          <motion.button
            whileHover={{ y: -2, boxShadow: `0 12px 24px ${COLORS.primary}30` }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (interestedMajorKeys.length === 0) {
                setShowSkipConfirm(true);
              } else {
                onStartRiasec();
              }
            }}
            className="flex-1 py-3.5 px-6 rounded-xl font-bold text-base text-white shadow-lg transition-all"
            style={{
              background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
            }}
          >
            검사 시작하기
          </motion.button>
        </div>
      </div>
    </div>
  );
}
