import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PilotQuestion, PilotAnswer } from '../../types/pilot';
import { LIKERT_LABELS } from '../../data/pilotQuestions';

// Unified color palette (matching RiasecQuestion)
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
  selected: {
    bg: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)',
    text: '#FFFFFF',
    glow: 'rgba(30, 58, 95, 0.2)',
  },
  unselected: {
    bg: '#FFFFFF',
    text: '#334155',
    border: '#E2E8F0',
    hover: '#F8FAFC',
  }
};

interface LikertQuestionProps {
  question: PilotQuestion;
  value?: number;
  onChange: (value: PilotAnswer) => void;
  onAutoAdvance?: () => void;
  onPrevious?: () => void;
  questionNumber?: number;
  totalQuestions?: number;
}

export default function LikertQuestion({
  question,
  value,
  onChange,
  onAutoAdvance,
  onPrevious,
  questionNumber = 1,
  totalQuestions = 1
}: LikertQuestionProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const progress = (questionNumber / totalQuestions) * 100;

  // Keyboard support for 1-5 keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimating) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= 5) {
        handleSelect(num);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onChange, onAutoAdvance, isAnimating]);

  const handleSelect = (optValue: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    onChange(optValue);

    // Auto-advance after a short delay for visual feedback
    if (onAutoAdvance) {
      setTimeout(() => {
        onAutoAdvance();
        setIsAnimating(false);
      }, 300);
    } else {
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

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
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">

            {/* Left Column: Question Area */}
            <div className="flex-1 lg:max-w-xl mb-10 lg:mb-0">
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
                    <span>{question.area === 'value' ? '직업가치관' :
                           question.area === 'decision' ? '진로결정' :
                           question.area === 'efficacy' ? '자기효능감' :
                           question.area === 'practical' ? '현실고려' : '설문'}</span>
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

                  {/* PC: Instruction hint */}
                  <p
                    className="hidden lg:block mt-6 text-sm"
                    style={{ color: COLORS.muted }}
                  >
                    1~5 숫자를 선택해 주세요 (1: 전혀 아니다 ~ 5: 매우 그렇다)
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* PC: Keyboard hints */}
              <div
                className="hidden lg:flex items-center gap-2 mt-8 pt-8 border-t flex-wrap"
                style={{ borderColor: '#E2E8F0' }}
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <div key={num} className="flex items-center gap-1">
                    <kbd
                      className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold"
                      style={{ backgroundColor: '#F1F5F9', color: COLORS.primary }}
                    >
                      {num}
                    </kbd>
                    <span className="text-xs mr-3" style={{ color: COLORS.muted }}>
                      {LIKERT_LABELS[num - 1]?.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Choice Cards */}
            <div className="flex-1 lg:max-w-md">
              <div className="grid grid-cols-5 gap-3 lg:gap-4">
                {LIKERT_LABELS.map(({ value: optValue, label }, idx) => {
                  const isSelected = value === optValue;

                  return (
                    <motion.button
                      key={optValue}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.03 + idx * 0.02, duration: 0.12 }}
                      whileHover={{
                        y: -4,
                        boxShadow: isSelected
                          ? `0 16px 32px ${COLORS.selected.glow}`
                          : '0 8px 24px rgba(0,0,0,0.08)'
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSelect(optValue)}
                      disabled={isAnimating}
                      className="aspect-square rounded-2xl transition-all duration-300 relative overflow-hidden group flex flex-col items-center justify-center"
                      style={{
                        background: isSelected ? COLORS.selected.bg : COLORS.unselected.bg,
                        color: isSelected ? COLORS.selected.text : COLORS.unselected.text,
                        border: `2px solid ${isSelected ? 'transparent' : COLORS.unselected.border}`,
                        boxShadow: isSelected
                          ? `0 12px 24px ${COLORS.selected.glow}`
                          : '0 2px 8px rgba(0,0,0,0.04)',
                      }}
                    >
                      {/* Hover overlay */}
                      {!isSelected && (
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ background: 'linear-gradient(135deg, rgba(30,58,95,0.02) 0%, rgba(74,111,165,0.04) 100%)' }}
                        />
                      )}

                      {/* Number */}
                      <span
                        className="text-3xl lg:text-4xl font-bold relative z-10"
                        style={{
                          color: isSelected ? '#FFFFFF' : COLORS.primary,
                        }}
                      >
                        {optValue}
                      </span>

                      {/* Selection check mark */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                          >
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>

              {/* Labels below buttons */}
              <div className="mt-4 flex justify-between text-xs px-1" style={{ color: COLORS.muted }}>
                <span>전혀 아니다</span>
                <span>매우 그렇다</span>
              </div>

              {/* Previous button */}
              {onPrevious && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={onPrevious}
                  className="w-full mt-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2"
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

              {/* Mobile: Auto-advance hint */}
              <p
                className="text-center text-xs mt-4"
                style={{ color: COLORS.muted }}
              >
                숫자를 선택하면 자동으로 다음 문항으로 이동합니다
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
            키보드 숫자키 1~5로도 응답할 수 있습니다
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: COLORS.primary }}
              />
              <span className="text-xs" style={{ color: COLORS.text.secondary }}>
                {questionNumber}번 문항
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
