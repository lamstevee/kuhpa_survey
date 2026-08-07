import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import { RiasecScores } from '../../types/pilot';
import { RIASEC_DATA, RiasecCode } from '../../data/riasecData';
import { ClusterType } from '../../data/questionPool';
import RiasecTypeModal from './RiasecTypeModal';

interface RiasecResultProps {
  scores: RiasecScores;
  participantName?: string;
  interestedFields?: ClusterType[];
  onRestart: () => void;
}

const COLORS = {
  bg: '#FAFAF9',
  surface: '#FFFFFF',
  primary: '#1E3A5F',
  secondary: '#4A6FA5',
  text: { primary: '#1E293B', secondary: '#475569', muted: '#94A3B8' },
};

const DIM_ORDER: RiasecCode[] = ['R', 'I', 'A', 'S', 'E', 'C'];

export default function RiasecResult({ scores, participantName, interestedFields, onRestart }: RiasecResultProps) {
  const [selectedType, setSelectedType] = useState<RiasecCode | null>(null);

  const ranked = useMemo(() => {
    return [...DIM_ORDER].sort((a, b) => scores[b] - scores[a]);
  }, [scores]);

  const top3 = ranked.slice(0, 3);
  const maxScore = 5; // 각 역할은 5개 문항 중 최대 5점

  const chartData = DIM_ORDER.map((code) => ({
    role: RIASEC_DATA[code].name,
    score: scores[code],
  }));

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: COLORS.bg }}>
      <div className="max-w-3xl mx-auto py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <p className="text-sm font-medium mb-2" style={{ color: COLORS.secondary }}>
            KUHPA 신입 학회원 적성·흥미 검사 결과
          </p>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: COLORS.primary }}>
            {participantName ? `${participantName}님의 팀역할 프로파일` : '나의 팀역할 프로파일'}
          </h1>
        </motion.div>

        {/* Radar chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl shadow-lg p-6 mb-8"
          style={{ backgroundColor: COLORS.surface }}
        >
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <RadarChart data={chartData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="role" tick={{ fill: COLORS.text.secondary, fontSize: 13 }} />
                <PolarRadiusAxis angle={90} domain={[0, maxScore]} tick={false} axisLine={false} />
                <Radar
                  dataKey="score"
                  stroke={COLORS.primary}
                  fill={COLORS.primary}
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top 3 role cards */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.text.primary }}>
            나에게 가장 잘 맞는 역할 TOP 3
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {top3.map((code, idx) => {
              const data = RIASEC_DATA[code];
              return (
                <motion.button
                  key={code}
                  onClick={() => setSelectedType(code)}
                  whileHover={{ y: -3, boxShadow: `0 12px 24px ${data.color}25` }}
                  whileTap={{ scale: 0.98 }}
                  className="text-left p-5 rounded-2xl border-2"
                  style={{
                    backgroundColor: COLORS.surface,
                    borderColor: idx === 0 ? data.color : '#E5E7EB',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: data.color }}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-2xl">{data.emoji}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-1" style={{ color: COLORS.text.primary }}>
                    {data.name}
                  </h3>
                  <p className="text-xs" style={{ color: COLORS.text.muted }}>
                    {scores[code]} / {maxScore}점 · 자세히 보기
                  </p>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Interested fields */}
        {interestedFields && interestedFields.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl p-5 mb-10"
            style={{ backgroundColor: `${COLORS.primary}0A` }}
          >
            <h3 className="text-sm font-bold mb-3" style={{ color: COLORS.text.primary }}>
              관심 있는 학술분야
            </h3>
            <div className="flex flex-wrap gap-2">
              {interestedFields.map((field) => (
                <span
                  key={field}
                  className="px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{ backgroundColor: `${COLORS.primary}15`, color: COLORS.primary }}
                >
                  {field}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Restart */}
        <div className="text-center">
          <button
            onClick={onRestart}
            className="px-8 py-3 rounded-xl font-semibold text-white shadow-lg"
            style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)` }}
          >
            다시 시작하기
          </button>
          <p className="text-xs mt-3" style={{ color: COLORS.text.muted }}>
            결과는 학회 노트북의 responses/ 폴더에 저장되며, 조 편성 후 삭제됩니다.
          </p>
        </div>
      </div>

      <RiasecTypeModal
        typeCode={selectedType}
        isOpen={selectedType !== null}
        onClose={() => setSelectedType(null)}
      />
    </div>
  );
}
