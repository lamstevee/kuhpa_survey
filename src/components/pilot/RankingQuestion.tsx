import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PilotQuestion, PilotAnswer } from '../../types/pilot';

// Unified color palette
const COLORS = {
  bg: '#FAFAF9',
  surface: '#FFFFFF',
  primary: '#1E3A5F',
  secondary: '#4A6FA5',
  accent: '#F59E0B', // amber for ranking
  muted: '#94A3B8',
  text: {
    primary: '#1E293B',
    secondary: '#475569',
    muted: '#94A3B8',
  },
  selected: {
    bg: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
    text: '#FFFFFF',
    glow: 'rgba(245, 158, 11, 0.2)',
  },
  unselected: {
    bg: '#FFFFFF',
    text: '#334155',
    border: '#E2E8F0',
    hover: '#F8FAFC',
  },
  disabled: {
    bg: '#F1F5F9',
    text: '#94A3B8',
    border: '#E2E8F0',
  }
};

interface RankingQuestionProps {
  question: PilotQuestion;
  value?: Record<string, number>;
  onChange: (value: PilotAnswer) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  questionNumber?: number;
  totalQuestions?: number;
}

export default function RankingQuestion({
  question,
  value = {},
  onChange,
  onNext,
  onPrevious,
  questionNumber = 1,
  totalQuestions = 1
}: RankingQuestionProps) {
  const options = question.options || [];
  const maxRank = question.maxRank || 3;
  const selectedCount = Object.keys(value).length;
  const progress = (questionNumber / totalQuestions) * 100;
  const canProceed = selectedCount === maxRank;

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key);
      if (num >= 1 && num <= options.length) {
        handleSelect(options[num - 1]);
      }
      if (e.key === 'Enter' && canProceed && onNext) {
        onNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, value, canProceed, onNext]);

  const handleSelect = (option: string) => {
    const currentValue = { ...value };

    if (option in currentValue) {
      const removedRank = currentValue[option];
      delete currentValue[option];
      for (const key in currentValue) {
        if (currentValue[key] > removedRank) {
          currentValue[key]--;
        }
      }
    } else if (selectedCount < maxRank) {
      currentValue[option] = selectedCount + 1;
    }

    onChange(currentValue);
  };

  const getRank = (option: string): number | null => {
    return value[option] || null;
  };

  const rankedItems = Object.entries(value)
    .sort(([, a], [, b]) => a - b)
    .map(([option]) => option);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: COLORS.bg }}
    >
      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-slate-200">
          <motion.div
            className="h-full"
            style={{ background: `linear-gradient(90deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`, width: `${progress}%` }}
            layout
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-16 lg:py-12">
        <div className="w-full max-w-4xl">
          <div className="flex flex-col lg:flex-row lg:items-start lg:gap-16">

            {/* Left Column: Question Area */}
            <div className="flex-1 lg:max-w-md mb-10 lg:mb-0">
              {/* Question Counter */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="flex items-center gap-4">
                  <span
                    className="inline-block px-4 py-2 rounded-full text-sm font-semibold"
                    style={{
                      backgroundColor: `${COLORS.primary}10`,
                      color: COLORS.primary,
                    }}
                  >
                    {questionNumber} / {totalQuestions}
                  </span>
                  <div className="hidden lg:flex items-center gap-2 text-xs" style={{ color: COLORS.muted }}>
                    <span>보완 설문</span>
                    <span>·</span>
                    <span>순위 선택</span>
                  </div>
                </div>
              </motion.div>

              {/* Question Text */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                >
                  <h1
                    className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight lg:leading-snug"
                    style={{
                      color: COLORS.primary,
                      fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {question.text}
                  </h1>

                  <p
                    className="mt-4 text-sm"
                    style={{ color: COLORS.accent }}
                  >
                    {maxRank}개를 순서대로 선택해 주세요 · {selectedCount}/{maxRank} 선택됨
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Selected ranking preview */}
              {selectedCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 rounded-2xl"
                  style={{
                    backgroundColor: `${COLORS.accent}10`,
                    border: `1px solid ${COLORS.accent}30`,
                  }}
                >
                  <p className="text-sm font-medium mb-3" style={{ color: COLORS.accent }}>
                    선택 순위
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {rankedItems.map((option, idx) => (
                      <motion.span
                        key={option}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                        style={{
                          backgroundColor: COLORS.surface,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        }}
                      >
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{
                            background: COLORS.selected.bg,
                            color: COLORS.selected.text,
                          }}
                        >
                          {idx + 1}
                        </span>
                        <span style={{ color: COLORS.text.primary }}>{option}</span>
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* PC: Keyboard hints */}
              <div
                className="hidden lg:flex items-center gap-2 mt-8 pt-8 border-t flex-wrap"
                style={{ borderColor: '#E2E8F0' }}
              >
                {options.slice(0, 6).map((_, idx) => (
                  <kbd
                    key={idx}
                    className="px-2 py-1 rounded-lg text-xs font-mono font-semibold"
                    style={{ backgroundColor: '#F1F5F9', color: COLORS.primary }}
                  >
                    {idx + 1}
                  </kbd>
                ))}
                <span className="text-xs ml-2" style={{ color: COLORS.muted }}>
                  순서대로 선택
                </span>
                <kbd
                  className="px-2 py-1 rounded-lg text-xs font-mono font-semibold ml-4"
                  style={{ backgroundColor: '#F1F5F9', color: COLORS.primary }}
                >
                  Enter
                </kbd>
                <span className="text-xs ml-1" style={{ color: COLORS.muted }}>
                  다음
                </span>
              </div>
            </div>

            {/* Right Column: Choice Cards */}
            <div className="flex-1 lg:max-w-lg">
              <div className="space-y-3">
                {options.map((option, idx) => {
                  const rank = getRank(option);
                  const isSelected = rank !== null;
                  const isDisabled = !isSelected && selectedCount >= maxRank;

                  return (
                    <motion.button
                      key={option}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.03 + idx * 0.02, duration: 0.12 }}
                      whileHover={!isDisabled ? {
                        y: -2,
                        boxShadow: isSelected
                          ? `0 16px 32px ${COLORS.selected.glow}`
                          : '0 8px 24px rgba(0,0,0,0.08)'
                      } : {}}
                      whileTap={!isDisabled ? { scale: 0.98 } : {}}
                      onClick={() => handleSelect(option)}
                      className="w-full text-left p-5 lg:p-6 rounded-2xl transition-all duration-300 relative overflow-hidden group"
                      style={{
                        background: isSelected
                          ? COLORS.selected.bg
                          : isDisabled
                            ? COLORS.disabled.bg
                            : COLORS.unselected.bg,
                        color: isSelected
                          ? COLORS.selected.text
                          : isDisabled
                            ? COLORS.disabled.text
                            : COLORS.unselected.text,
                        border: `2px solid ${isSelected ? 'transparent' : isDisabled ? COLORS.disabled.border : COLORS.unselected.border}`,
                        boxShadow: isSelected
                          ? `0 12px 24px ${COLORS.selected.glow}`
                          : '0 2px 8px rgba(0,0,0,0.04)',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {/* Hover overlay */}
                      {!isSelected && !isDisabled && (
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.02) 0%, rgba(217,119,6,0.04) 100%)' }}
                        />
                      )}

                      <div className="flex items-center gap-4 relative z-10">
                        {/* Rank badge */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                          style={{
                            backgroundColor: isSelected
                              ? 'rgba(255,255,255,0.25)'
                              : isDisabled
                                ? COLORS.disabled.border
                                : `${COLORS.accent}15`,
                            color: isSelected ? '#FFFFFF' : isDisabled ? COLORS.disabled.text : COLORS.accent,
                          }}
                        >
                          {rank || (idx + 1)}
                        </div>

                        {/* Option text */}
                        <span className="text-base lg:text-lg font-medium flex-1">
                          {option}
                        </span>

                        {/* Rank indicator */}
                        {isSelected && (
                          <span
                            className="text-xs px-2 py-1 rounded-full"
                            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                          >
                            {rank}순위
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Next button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={canProceed ? { scale: 1.02 } : {}}
                whileTap={canProceed ? { scale: 0.98 } : {}}
                onClick={() => canProceed && onNext?.()}
                disabled={!canProceed}
                className="w-full mt-6 py-4 rounded-2xl font-semibold text-lg transition-all duration-300"
                style={{
                  background: canProceed ? COLORS.selected.bg : COLORS.disabled.bg,
                  color: canProceed ? COLORS.selected.text : COLORS.disabled.text,
                  boxShadow: canProceed ? `0 8px 24px ${COLORS.selected.glow}` : 'none',
                  cursor: canProceed ? 'pointer' : 'not-allowed',
                }}
              >
                {canProceed ? '다음으로' : `${maxRank - selectedCount}개 더 선택해 주세요`}
              </motion.button>

              {/* Previous button */}
              {onPrevious && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={onPrevious}
                  className="w-full mt-3 py-3 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: '#F1F5F9',
                    color: COLORS.text.secondary,
                    border: `1px solid ${COLORS.unselected.border}`,
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  이전 문항
                </motion.button>
              )}

              <p
                className="text-center text-xs mt-4"
                style={{ color: COLORS.muted }}
              >
                선택을 취소하려면 해당 항목을 다시 클릭하세요
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Info - PC version */}
      <div
        className="hidden lg:block fixed bottom-0 left-0 right-0 py-4"
        style={{ backgroundColor: 'rgba(250, 250, 249, 0.9)', backdropFilter: 'blur(8px)' }}
      >
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs" style={{ color: COLORS.muted }}>
            순서대로 클릭하면 순위가 매겨집니다 · 다시 클릭하면 취소
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: COLORS.accent }}
              />
              <span className="text-xs" style={{ color: COLORS.text.secondary }}>
                {selectedCount}/{maxRank} 선택
              </span>
            </div>
            <div
              className="w-32 h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: '#E2E8F0' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: COLORS.primary,
                }}
              />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.primary }}>
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
