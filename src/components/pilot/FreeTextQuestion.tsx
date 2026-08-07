import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PilotQuestion, PilotAnswer } from '../../types/pilot';

// Unified color palette
const COLORS = {
  bg: '#FAFAF9',
  surface: '#FFFFFF',
  primary: '#1E3A5F',
  secondary: '#4A6FA5',
  accent: '#8B5CF6', // purple for text input
  muted: '#94A3B8',
  text: {
    primary: '#1E293B',
    secondary: '#475569',
    muted: '#94A3B8',
  },
  button: {
    bg: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)',
    text: '#FFFFFF',
    glow: 'rgba(30, 58, 95, 0.2)',
  },
  disabled: {
    bg: '#F1F5F9',
    text: '#94A3B8',
    border: '#E2E8F0',
  }
};

interface FreeTextQuestionProps {
  question: PilotQuestion;
  value?: string;
  onChange: (value: PilotAnswer) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  questionNumber?: number;
  totalQuestions?: number;
}

export default function FreeTextQuestion({
  question,
  value = '',
  onChange,
  onNext,
  onPrevious,
  questionNumber = 1,
  totalQuestions = 1
}: FreeTextQuestionProps) {
  const maxLength = 200;
  const progress = (questionNumber / totalQuestions) * 100;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Keyboard shortcut for next (Ctrl/Cmd + Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && onNext) {
        onNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext]);

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
                    <span>자유 응답</span>
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
                    선택 질문입니다 · 건너뛰어도 됩니다
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* PC: Keyboard hints */}
              <div
                className="hidden lg:flex items-center gap-2 mt-8 pt-8 border-t flex-wrap"
                style={{ borderColor: '#E2E8F0' }}
              >
                <kbd
                  className="px-2 py-1 rounded-lg text-xs font-mono font-semibold"
                  style={{ backgroundColor: '#F1F5F9', color: COLORS.primary }}
                >
                  Ctrl
                </kbd>
                <span className="text-xs" style={{ color: COLORS.muted }}>+</span>
                <kbd
                  className="px-2 py-1 rounded-lg text-xs font-mono font-semibold"
                  style={{ backgroundColor: '#F1F5F9', color: COLORS.primary }}
                >
                  Enter
                </kbd>
                <span className="text-xs ml-2" style={{ color: COLORS.muted }}>
                  다음으로
                </span>
              </div>
            </div>

            {/* Right Column: Text Input */}
            <div className="flex-1 lg:max-w-lg">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="relative"
              >
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  maxLength={maxLength}
                  placeholder="자유롭게 작성해 주세요..."
                  className="w-full p-6 rounded-2xl outline-none transition-all duration-300 min-h-[200px] resize-none text-lg"
                  style={{
                    backgroundColor: COLORS.surface,
                    color: COLORS.text.primary,
                    border: `2px solid ${value ? COLORS.accent : '#E2E8F0'}`,
                    boxShadow: value ? `0 8px 24px ${COLORS.accent}20` : '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                />
                <div
                  className="absolute bottom-4 right-4 text-sm px-2 py-1 rounded-lg"
                  style={{
                    backgroundColor: value.length > maxLength * 0.8 ? `${COLORS.accent}20` : '#F8FAFC',
                    color: value.length > maxLength * 0.8 ? COLORS.accent : COLORS.muted,
                  }}
                >
                  {value.length}/{maxLength}
                </div>
              </motion.div>

              {/* Next button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNext?.()}
                className="w-full mt-6 py-4 rounded-2xl font-semibold text-lg transition-all duration-300"
                style={{
                  background: COLORS.button.bg,
                  color: COLORS.button.text,
                  boxShadow: `0 8px 24px ${COLORS.button.glow}`,
                }}
              >
                {value ? '다음으로' : '건너뛰기'}
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
                    border: '1px solid #E2E8F0',
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
                응답하지 않고 다음으로 넘어갈 수 있습니다
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
            이 질문은 선택 사항입니다
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: value ? COLORS.accent : COLORS.muted }}
              />
              <span className="text-xs" style={{ color: COLORS.text.secondary }}>
                {value ? `${value.length}자 입력됨` : '미입력'}
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
