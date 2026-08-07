import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RIASEC_TYPES, RiasecCode } from '../../data/riasecData';
import RiasecTypeModal from './RiasecTypeModal';

interface ParticipantInfo {
  name: string;
  studentId: string;
}

interface PilotIntroProps {
  onStart: () => void;
  participantInfo: ParticipantInfo;
  onParticipantInfoChange: (info: ParticipantInfo) => void;
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

export default function PilotIntro({ onStart, participantInfo, onParticipantInfoChange }: PilotIntroProps) {
  const { name, studentId } = participantInfo;
  const isValidName = name.trim().length >= 2;

  const [selectedType, setSelectedType] = useState<RiasecCode | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);

  const canStart = isValidName && consentChecked;

  const handleChange = (field: keyof ParticipantInfo, value: string) => {
    onParticipantInfoChange({ ...participantInfo, [field]: value });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: COLORS.bg }}
    >
      <div className="w-full max-w-5xl flex flex-col lg:flex-row lg:items-stretch lg:gap-12">
        {/* Left Column: Hero Section */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 flex flex-col justify-center lg:pr-8 mb-10 lg:mb-0"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1
              className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6"
              style={{ color: COLORS.primary, fontFamily: "'Pretendard', sans-serif" }}
            >
              KUHPA 신입 학회원<br />
              적성·흥미 검사
            </h1>
            <p
              className="text-base lg:text-lg leading-relaxed max-w-md"
              style={{ color: COLORS.text.secondary }}
            >
              논문 리딩 세션에서 내가 자연스럽게 맡는 역할을 확인하고,
              관심 있는 학술분야를 알아보세요. 조 편성에 참고 자료로 활용됩니다.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="hidden lg:block mt-10"
          >
            <p className="text-xs font-medium mb-4" style={{ color: COLORS.muted }}>
              논문 리딩 세션 6가지 팀역할
            </p>
            <div className="flex gap-2">
              {RIASEC_TYPES.map((type) => (
                <motion.button
                  key={type.code}
                  onClick={() => setSelectedType(type.code as RiasecCode)}
                  whileHover={{ scale: 1.05, boxShadow: `0 4px 12px ${type.color}30` }}
                  whileTap={{ scale: 0.98 }}
                  className="w-10 h-10 rounded-lg cursor-pointer flex items-center justify-center text-white text-sm font-bold transition-all duration-200"
                  style={{ backgroundColor: type.color }}
                  title={type.name}
                >
                  {type.emoji}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column: Action Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:w-[420px] flex-shrink-0"
        >
          <div
            className="rounded-3xl shadow-lg p-8 lg:p-10 h-full flex flex-col"
            style={{ backgroundColor: COLORS.surface }}
          >
            <div className="text-center lg:text-left mb-6">
              <h2 className="text-xl lg:text-2xl font-bold mb-2" style={{ color: COLORS.primary }}>
                검사 시작하기
              </h2>
              <p className="text-sm" style={{ color: COLORS.muted }}>총 15문항 · 2~3분</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.text.primary }}>
                이름 <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="홍길동"
                className="w-full p-3.5 rounded-xl border-2 outline-none transition-all text-base"
                style={{
                  borderColor: name ? (isValidName ? COLORS.primary : '#F87171') : '#E2E8F0',
                  backgroundColor: COLORS.surface,
                  color: COLORS.text.primary,
                }}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.text.primary }}>
                학번 <span style={{ color: COLORS.muted }}>(선택)</span>
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => handleChange('studentId', e.target.value)}
                placeholder="동명이인 구분용"
                className="w-full p-3.5 rounded-xl border-2 outline-none transition-all text-base"
                style={{
                  borderColor: studentId ? COLORS.primary : '#E2E8F0',
                  backgroundColor: COLORS.surface,
                  color: COLORS.text.primary,
                }}
              />
            </div>

            {/* Role badges - Mobile only */}
            <div className="lg:hidden mb-6">
              <p className="text-xs font-medium mb-3" style={{ color: COLORS.muted }}>
                논문 리딩 세션 6가지 팀역할
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {RIASEC_TYPES.map((type) => (
                  <motion.button
                    key={type.code}
                    onClick={() => setSelectedType(type.code as RiasecCode)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-9 h-9 rounded-lg cursor-pointer flex items-center justify-center text-white text-xs font-bold transition-all duration-200"
                    style={{ backgroundColor: type.color }}
                    title={type.name}
                  >
                    {type.emoji}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Consent */}
            <div
              className="mb-6 p-5 rounded-xl border"
              style={{ backgroundColor: COLORS.bg, borderColor: '#E2E8F0' }}
            >
              <h3 className="text-sm font-bold mb-3" style={{ color: COLORS.text.primary }}>
                고려대학교 보건의료경영학회(KUHPA) 신입 학회원 적성·흥미 검사
              </h3>
              <div
                className="p-3 rounded-lg mb-4 overflow-y-auto text-xs leading-relaxed"
                style={{ backgroundColor: COLORS.surface, border: '1px solid #E2E8F0', maxHeight: '150px', color: COLORS.text.secondary }}
              >
                <p className="mb-2"><strong>1. 수집 항목:</strong> 이름, 학번(선택), 검사 응답</p>
                <p className="mb-2"><strong>2. 이용 목적:</strong> 논문 리딩 세션 조 편성 및 역할 배분</p>
                <p className="mb-2"><strong>3. 보관 기간:</strong> 조 편성 완료 후 즉시 삭제</p>
                <p className="mb-2"><strong>4. 제3자 제공:</strong> 없음. 이 검사는 학회 노트북에서만 실행되며 외부로 전송되지 않습니다.</p>
                <p>이 검사는 공인된 심리검사가 아니며, 조별 역할 배분을 돕기 위한 참고 자료입니다. 결과가 개인의 능력이나 적성을 평가하지 않습니다.</p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="w-5 h-5 rounded border-2 accent-blue-600"
                />
                <span className="text-sm font-medium" style={{ color: COLORS.text.primary }}>
                  위 내용에 동의합니다 <span style={{ color: '#EF4444' }}>(필수)</span>
                </span>
              </label>
            </div>

            <motion.button
              whileHover={canStart ? { y: -2, boxShadow: `0 16px 32px ${COLORS.primary}25` } : {}}
              whileTap={canStart ? { scale: 0.98 } : {}}
              onClick={onStart}
              disabled={!canStart}
              className="w-full py-4 px-8 rounded-xl font-bold text-lg text-white shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: canStart
                  ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`
                  : '#CBD5E1',
              }}
            >
              검사 시작하기
            </motion.button>
          </div>
        </motion.div>
      </div>

      <RiasecTypeModal
        typeCode={selectedType}
        isOpen={selectedType !== null}
        onClose={() => setSelectedType(null)}
      />
    </div>
  );
}
