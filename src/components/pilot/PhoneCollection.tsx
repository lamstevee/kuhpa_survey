import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface PhoneCollectionProps {
  onSubmit: (phone: string) => void;
  onSkip: () => void;
  participantName?: string;
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

export default function PhoneCollection({ onSubmit, onSkip, participantName }: PhoneCollectionProps) {
  const [phone, setPhone] = useState('');
  const [isValid, setIsValid] = useState(false);

  const formatPhone = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^0-9]/g, '');

    // 010-0000-0000 형식으로 포맷
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);

    // 유효성 검사: 010-0000-0000 형식 (11자리)
    const numbers = formatted.replace(/[^0-9]/g, '');
    setIsValid(numbers.length === 11 && numbers.startsWith('010'));
  };

  const handleSubmit = () => {
    if (isValid) {
      onSubmit(phone);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: COLORS.bg }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div
          className="rounded-3xl shadow-lg p-8"
          style={{ backgroundColor: COLORS.surface }}
        >
          {/* 완료 아이콘 */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${COLORS.secondary}15` }}
          >
            <svg
              className="w-10 h-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke={COLORS.secondary}
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </motion.div>

          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: COLORS.primary }}
            >
              검사가 완료되었습니다!
            </h1>
            <p className="text-sm" style={{ color: COLORS.text.secondary }}>
              {participantName ? `${participantName}님의 ` : ''}결과 확인을 위해<br />
              휴대폰 번호를 입력해 주세요.
            </p>
          </div>

          {/* 휴대폰 번호 입력 */}
          <div className="mb-6">
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: COLORS.text.primary }}
            >
              휴대폰 번호
            </label>
            <input
              type="tel"
              value={phone}
              onChange={handleChange}
              placeholder="010-0000-0000"
              maxLength={13}
              className="w-full p-4 rounded-xl border-2 outline-none transition-all text-lg text-center tracking-wider"
              style={{
                borderColor: phone ? (isValid ? COLORS.primary : '#F87171') : '#E2E8F0',
                backgroundColor: COLORS.surface,
                color: COLORS.text.primary,
              }}
            />
            {phone && !isValid && (
              <p className="text-xs mt-2 text-center" style={{ color: '#F87171' }}>
                올바른 휴대폰 번호를 입력해 주세요
              </p>
            )}
          </div>

          {/* 기프티콘 이벤트 안내 */}
          <div
            className="mb-4 p-4 rounded-xl text-sm"
            style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}
          >
            <p className="flex items-start gap-2" style={{ color: '#92400E' }}>
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="#F59E0B" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span>
                <strong>기프티콘 이벤트 참여 안내</strong><br />
                휴대폰 번호를 입력하시면 기프티콘을 보내드립니다.<br />
                <span style={{ fontSize: '0.75rem' }}>※ 복수 응답 시 1건만 지급됩니다.</span>
              </span>
            </p>
          </div>

          {/* 안내 문구 */}
          <div
            className="mb-6 p-4 rounded-xl text-sm"
            style={{ backgroundColor: COLORS.bg, color: COLORS.text.secondary }}
          >
            <p className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                입력하신 번호는 이벤트 경품 발송 목적으로만 사용되며, 발송 이후 개인정보는 파기됩니다.
              </span>
            </p>
          </div>

          {/* 버튼 */}
          <div className="space-y-3">
            <motion.button
              whileHover={isValid ? { y: -2 } : {}}
              whileTap={isValid ? { scale: 0.98 } : {}}
              onClick={handleSubmit}
              disabled={!isValid}
              className="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isValid
                  ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`
                  : '#CBD5E1',
              }}
            >
              결과 확인하기
            </motion.button>

            <button
              onClick={onSkip}
              className="w-full py-3 text-sm font-medium transition-colors"
              style={{ color: COLORS.muted }}
            >
              건너뛰고 결과 보기
            </button>
            <p className="text-xs text-center mt-2" style={{ color: '#EF4444' }}>
              * 미입력 시 기프티콘 이벤트에 참여할 수 없습니다
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
