import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RIASEC_TYPES, RiasecCode } from '../../data/riasecData';
import RiasecTypeModal from './RiasecTypeModal';

interface ParticipantInfo {
  name: string;
  studentId: string;
  email: string;
}

interface PilotIntroProps {
  onStart: () => void;
  participantInfo: ParticipantInfo;
  onParticipantInfoChange: (info: ParticipantInfo) => void;
  mode?: 'external' | 'default' | 'sso';
  ssoData?: { membernum: string; membername: string; departcode?: string; departname?: string; majorcode?: string; majorname?: string };
  /**
   * 강의용 데모 옵션.
   * 이름·이메일·동의 UI는 그대로 보여주되, 비워둬도 검사를 시작할 수 있게 합니다.
   * (실제 운영에서는 false로 두어 원래의 필수 검증을 유지하세요.)
   */
  relaxValidation?: boolean;
}

// Unified color palette
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

export default function PilotIntro({ onStart, participantInfo, onParticipantInfoChange, mode = 'default', ssoData, relaxValidation = false }: PilotIntroProps) {
  const { name, studentId, email } = participantInfo;
  const isValidEmail = email.includes('@') && email.includes('.');
  const isValidName = name.trim().length >= 2;

  const [selectedType, setSelectedType] = useState<RiasecCode | null>(null);
  const [isStudent, setIsStudent] = useState(mode !== 'external');
  const [consentChecked, setConsentChecked] = useState(false);
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [consent3, setConsent3] = useState(false);

  const canStartSso = consent1 && consent2; // consent3 is optional
  // 강의용 데모(relaxValidation)에서는 입력·동의를 비워둬도 시작할 수 있습니다.
  const canStart = relaxValidation
    ? true
    : mode === 'sso'
      ? canStartSso
      : (isValidName && isValidEmail && consentChecked);

  const handleChange = (field: keyof ParticipantInfo, value: string) => {
    onParticipantInfoChange({ ...participantInfo, [field]: value });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: COLORS.bg }}
    >
      {/* PC: Two-column layout / Mobile: Single column */}
      <div className="w-full max-w-5xl flex flex-col lg:flex-row lg:items-stretch lg:gap-12">

        {/* Left Column: Hero Section */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 flex flex-col justify-center lg:pr-8 mb-10 lg:mb-0"
        >
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1
              className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6"
              style={{ color: COLORS.primary, fontFamily: "'Pretendard', sans-serif" }}
            >
              전공<br />
              진로 적합도 검사
            </h1>
            <p
              className="text-base lg:text-lg leading-relaxed max-w-md"
              style={{ color: COLORS.text.secondary }}
            >
              Holland의 RIASEC 이론을 기반으로 나의 진로 흥미 유형을 파악하고,
              나에게 적합한 전공을 추천받아 보세요.
            </p>
          </motion.div>

          {/* RIASEC Types Grid - PC only */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="hidden lg:block mt-10"
          >
            <p className="text-xs font-medium mb-4" style={{ color: COLORS.muted }}>
              RIASEC 6가지 진로 흥미 유형
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
                >
                  {type.code}
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
            {/* Header */}
            <div className="text-center lg:text-left mb-6">
              <h2
                className="text-xl lg:text-2xl font-bold mb-2"
                style={{ color: COLORS.primary }}
              >
                검사 시작하기
              </h2>
              <p className="text-sm" style={{ color: COLORS.muted }}>
                총 15문항
              </p>
            </div>

            {/* SSO Info Card or Name Input */}
            {mode === 'sso' && ssoData ? (
              <div className="mb-4 p-4 rounded-xl border-2" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#22C55E' }}>
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold mb-2" style={{ color: '#166534' }}>SSO 인증 완료</p>
                    <div className="space-y-1 text-sm" style={{ color: '#15803D' }}>
                      <p><span className="font-semibold">이름:</span> {ssoData.membername}</p>
                      <p><span className="font-semibold">학번:</span> {ssoData.membernum}</p>
                      {ssoData.departname && <p><span className="font-semibold">학과:</span> {ssoData.departname}</p>}
                      {ssoData.majorname && <p><span className="font-semibold">전공:</span> {ssoData.majorname}</p>}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: COLORS.text.primary }}
                >
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
            )}

            {/* Student Toggle - hidden in SSO mode */}
            {mode === 'default' && (
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isStudent}
                    onChange={(e) => {
                      setIsStudent(e.target.checked);
                      if (!e.target.checked) {
                        handleChange('studentId', '');
                      }
                    }}
                    className="w-5 h-5 rounded border-2 accent-blue-600"
                  />
                  <span className="text-sm font-medium" style={{ color: COLORS.text.primary }}>
                    재학생/졸업생입니다
                  </span>
                </label>
              </div>
            )}

            {/* Student ID Input (conditional) - hidden in external and SSO mode */}
            {isStudent && mode !== 'external' && mode !== 'sso' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: COLORS.text.primary }}
                >
                  학번
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => handleChange('studentId', e.target.value)}
                  className="w-full p-3.5 rounded-xl border-2 outline-none transition-all text-base"
                  style={{
                    borderColor: studentId ? COLORS.primary : '#E2E8F0',
                    backgroundColor: COLORS.surface,
                    color: COLORS.text.primary,
                  }}
                />
              </motion.div>
            )}

            {/* Email Input - hidden in SSO mode */}
            {mode !== 'sso' && (
              <div className="mb-6">
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: COLORS.text.primary }}
                >
                  이메일 주소 <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="example@email.com"
                  className="w-full p-3.5 rounded-xl border-2 outline-none transition-all text-base"
                  style={{
                    borderColor: email ? (isValidEmail ? COLORS.primary : '#F87171') : '#E2E8F0',
                    backgroundColor: COLORS.surface,
                    color: COLORS.text.primary,
                  }}
                />
              </div>
            )}

            {/* RIASEC Types - Mobile only */}
            <div className="lg:hidden mb-6">
              <p className="text-xs font-medium mb-3" style={{ color: COLORS.muted }}>
                RIASEC 6가지 진로 흥미 유형
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
                  >
                    {type.code}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-2.5 mb-6 flex-grow">
              {[
                { text: '나의 진로 흥미 유형 분석', check: true },
                { text: 'RIASEC 6가지 차원 점수', check: true },
                { text: mode === 'external' ? '맞춤형 학과 추천' : '맞춤형 학과 추천', check: true },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${COLORS.secondary}20` }}
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke={COLORS.secondary}
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm" style={{ color: COLORS.text.secondary }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Consent Section */}
            {mode === 'sso' ? (
              <div className="mb-6">
                {/* 동의 1: 개인정보 수집·이용 (필수) */}
                <div className="mb-3">
                  <div
                    className="p-3 rounded-lg mb-2 overflow-y-auto text-xs leading-relaxed"
                    style={{
                      backgroundColor: COLORS.surface,
                      border: `1px solid #E2E8F0`,
                      maxHeight: '120px',
                      color: COLORS.text.secondary,
                    }}
                  >
                    <p className="font-bold mb-1">개인정보 수집·이용 동의</p>
                    <p className="mb-1"><strong>1. 수집 항목:</strong></p>
                    <p className="mb-1">- 학교 정보 시스템을 통해 제공받는 정보: 학번, 이름, 학과(코드/명), 전공(코드/명)</p>
                    <p className="mb-1">- 서비스 이용 중 생성되는 정보: 진로적성검사(RIASEC) 응답 및 결과, 핵심역량진단 응답 및 결과, 전공능력진단 결과, 롤모델 선택 정보, 커리큘럼 설계 내역</p>
                    <p className="mb-1">- 자동 수집 정보: 서비스 이용 기록(접속 일시, 접속 기기 정보)</p>
                    <p className="mb-1"><strong>2. 수집 목적:</strong> 진로 흥미 유형 분석 및 결과 제공, 핵심역량 진단·분석, 전공 적합도 매칭·추천, 졸업생 롤모델 매칭, 커리큘럼 설계 지원</p>
                    <p className="mb-1"><strong>3. 보유 기간:</strong> 재학 기간 중 보관하며, 구체적인 보관 및 파기 기준은 기관 개인정보 처리방침에 따릅니다. 단, 동의 철회 시 지체 없이 파기합니다.</p>
                    <p><strong>4. 동의 거부 시:</strong> 서비스 이용이 제한됩니다. 동의는 자발적이며, 거부에 따른 학업상 불이익은 없습니다.</p>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent1}
                      onChange={(e) => setConsent1(e.target.checked)}
                      className="w-5 h-5 rounded border-2 accent-blue-600"
                    />
                    <span className="text-sm font-medium" style={{ color: COLORS.text.primary }}>
                      위 내용에 동의합니다 <span style={{ color: '#EF4444' }}>(필수)</span>
                    </span>
                  </label>
                </div>

                {/* 동의 2: 제3자 제공 (필수) */}
                <div className="mb-3">
                  <div
                    className="p-3 rounded-lg mb-2 overflow-y-auto text-xs leading-relaxed"
                    style={{
                      backgroundColor: COLORS.surface,
                      border: `1px solid #E2E8F0`,
                      maxHeight: '120px',
                      color: COLORS.text.secondary,
                    }}
                  >
                    <p className="font-bold mb-1">개인정보 제3자 제공 동의</p>
                    <p className="mb-1"><strong>1. 제공받는 자:</strong> 진로상담 담당 부서</p>
                    <p className="mb-1"><strong>2. 제공 항목:</strong> 학번, 이름, 검사 참여 여부, 진로적성검사(RIASEC) 결과 요약, 핵심역량진단 결과 요약, 전공 매칭 결과</p>
                    <p className="mb-1"><strong>3. 제공 목적:</strong> 재학생 진로교육 운영 및 진로상담 지원</p>
                    <p><strong>4. 보유 기간:</strong> 기관 개인정보 처리방침에 따름</p>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent2}
                      onChange={(e) => setConsent2(e.target.checked)}
                      className="w-5 h-5 rounded border-2 accent-blue-600"
                    />
                    <span className="text-sm font-medium" style={{ color: COLORS.text.primary }}>
                      위 내용에 동의합니다 <span style={{ color: '#EF4444' }}>(필수)</span>
                    </span>
                  </label>
                </div>

                {/* 동의 3: 연구 목적 (선택) */}
                <div className="mb-3">
                  <div
                    className="p-3 rounded-lg mb-2 overflow-y-auto text-xs leading-relaxed"
                    style={{
                      backgroundColor: COLORS.surface,
                      border: `1px solid #E2E8F0`,
                      maxHeight: '100px',
                      color: COLORS.text.secondary,
                    }}
                  >
                    <p className="font-bold mb-1">연구 목적 활용 동의</p>
                    <p className="mb-1"><strong>1. 활용 항목:</strong> 검사 응답 결과, 역량진단 결과, 전공 매칭 결과 (비식별 처리)</p>
                    <p className="mb-1"><strong>2. 활용 목적:</strong> 진로교육 연구 및 프로그램 개선을 위한 통계 분석</p>
                    <p><strong>3. 보유 기간:</strong> 연구 목적 달성 시까지 (비식별 처리된 통계 데이터는 별도 보관 가능)</p>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent3}
                      onChange={(e) => setConsent3(e.target.checked)}
                      className="w-5 h-5 rounded border-2 accent-blue-600"
                    />
                    <span className="text-sm font-medium" style={{ color: COLORS.text.primary }}>
                      위 내용에 동의합니다 <span style={{ color: '#64748B' }}>(선택)</span>
                    </span>
                  </label>
                </div>
              </div>
            ) : (
              <div
                className="mb-6 p-5 rounded-xl border"
                style={{
                  backgroundColor: COLORS.bg,
                  borderColor: '#E2E8F0',
                }}
              >
                <h3
                  className="text-sm font-bold mb-3"
                  style={{ color: COLORS.text.primary }}
                >
                  개인정보 수집 및 이용 동의
                </h3>
                <div
                  className="p-3 rounded-lg mb-4 overflow-y-auto text-xs leading-relaxed"
                  style={{
                    backgroundColor: COLORS.surface,
                    border: `1px solid #E2E8F0`,
                    maxHeight: '150px',
                    color: COLORS.text.secondary,
                  }}
                >
                  <p className="mb-2">
                    <strong>1. 수집 항목:</strong> 이름, 이메일 주소, 검사 응답 결과, 기기 정보
                  </p>
                  <p className="mb-2">
                    <strong>2. 수집 목적:</strong> 진로 흥미 유형 검사 결과 제공 및 진로교육 연구
                  </p>
                  <p className="mb-2">
                    <strong>3. 보유 기간:</strong> 검사일로부터 90일 후 자동 파기
                  </p>
                  <p className="mb-2">
                    <strong>4. 동의 거부 시 불이익:</strong> 본 검사 참여가 제한됩니다. 동의는 자발적이며, 동의 거부 시 불이익은 없습니다.
                  </p>
                  <p>
                    <strong>5.</strong> 개인정보는 「개인정보보호법」에 따라 안전하게 처리되며, 수집 목적 외 제3자 제공은 하지 않습니다.
                  </p>
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
            )}

            {/* Start Button */}
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

            <p className="text-xs text-center mt-4" style={{ color: COLORS.muted }}>
              수집된 정보는 연구 목적으로만 사용되며,<br />
              개인정보보호법에 따라 안전하게 관리됩니다.
            </p>
          </div>
        </motion.div>
      </div>

      {/* RIASEC Type Modal */}
      <RiasecTypeModal
        typeCode={selectedType}
        isOpen={selectedType !== null}
        onClose={() => setSelectedType(null)}
      />
    </div>
  );
}
