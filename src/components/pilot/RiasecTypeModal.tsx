import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RIASEC_DATA, RiasecCode } from '../../data/riasecData';

interface RiasecTypeModalProps {
  typeCode: RiasecCode | null;
  isOpen: boolean;
  onClose: () => void;
}

// Color palette
const COLORS = {
  bg: '#FAFAF9',
  surface: '#FFFFFF',
  primary: '#1E3A5F',
  text: {
    primary: '#1E293B',
    secondary: '#475569',
    muted: '#94A3B8',
  },
};

export default function RiasecTypeModal({ typeCode, isOpen, onClose }: RiasecTypeModalProps) {
  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!typeCode) return null;

  const typeData = RIASEC_DATA[typeCode];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="riasec-modal-title"
              className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl pointer-events-auto"
              style={{ backgroundColor: COLORS.surface }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with type color */}
              <div
                className="sticky top-0 px-6 py-5 rounded-t-2xl"
                style={{
                  background: `linear-gradient(135deg, ${typeData.color} 0%, ${typeData.color}DD 100%)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{typeData.emoji}</span>
                    <div>
                      <h2
                        id="riasec-modal-title"
                        className="text-2xl font-bold text-white"
                        style={{ fontFamily: "'Pretendard', sans-serif" }}
                      >
                        {typeData.code} - {typeData.name}
                      </h2>
                      <p className="text-white/80 text-sm">{typeData.fullName}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors"
                    aria-label="닫기"
                  >
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: COLORS.text.secondary }}
                  >
                    {typeData.description}
                  </p>
                </div>

                {/* Core Traits */}
                <Section title="핵심 특성" color={typeData.color}>
                  <ul className="space-y-2">
                    {typeData.coreTraits.map((trait, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: `${typeData.color}20` }}
                        >
                          <svg
                            className="w-3 h-3"
                            fill={typeData.color}
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                        <span
                          className="text-sm"
                          style={{ color: COLORS.text.secondary }}
                        >
                          {trait}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Section>

                {/* Work Preferences */}
                <Section title="선호 업무" color={typeData.color}>
                  <ul className="space-y-2">
                    {typeData.workPreferences.map((pref, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2"
                          style={{ backgroundColor: typeData.color }}
                        />
                        <span
                          className="text-sm"
                          style={{ color: COLORS.text.secondary }}
                        >
                          {pref}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Section>

                {/* Ideal Environments */}
                <Section title="적합 환경" color={typeData.color}>
                  <div className="flex flex-wrap gap-2">
                    {typeData.idealEnvironments.map((env, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${typeData.color}15`,
                          color: typeData.color,
                        }}
                      >
                        {env}
                      </span>
                    ))}
                  </div>
                </Section>

                {/* Representative Careers */}
                <Section title="대표 직업" color={typeData.color}>
                  <div className="grid grid-cols-2 gap-2">
                    {typeData.representativeCareers.map((career, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg"
                        style={{ backgroundColor: COLORS.bg }}
                      >
                        <span className="text-sm" style={{ color: typeData.color }}>
                          {typeData.emoji}
                        </span>
                        <span
                          className="text-sm font-medium"
                          style={{ color: COLORS.text.primary }}
                        >
                          {career}
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 px-6 py-4 bg-gradient-to-t from-white via-white to-transparent">
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:shadow-lg"
                  style={{ backgroundColor: typeData.color }}
                >
                  닫기
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Section component
function Section({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3
        className="text-sm font-semibold mb-3 flex items-center gap-2"
        style={{ color: COLORS.primary }}
      >
        <span
          className="w-1 h-4 rounded-full"
          style={{ backgroundColor: color }}
        />
        {title}
      </h3>
      {children}
    </div>
  );
}
