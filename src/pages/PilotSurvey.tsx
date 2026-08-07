import React, { useState, useEffect, useRef } from 'react';
import { usePilotSurvey } from '../hooks/usePilotSurvey';
import PilotIntro from '../components/pilot/PilotIntro';
import LikertQuestion from '../components/pilot/LikertQuestion';
import SingleSelectQuestion from '../components/pilot/SingleSelectQuestion';
import MultiSelectQuestion from '../components/pilot/MultiSelectQuestion';
import RankingQuestion from '../components/pilot/RankingQuestion';
import FreeTextQuestion from '../components/pilot/FreeTextQuestion';
import RiasecQuestion from '../components/pilot/RiasecQuestion';
import RiasecResult from '../components/pilot/RiasecResult';
import InterestSelect from '../components/pilot/InterestSelect';
import MajorPreview from '../components/pilot/MajorPreview';
import PhoneCollection from '../components/pilot/PhoneCollection';
import { PilotResult as PilotResultType, RiasecScores, RiasecAnswer } from '../types/pilot';
import { getCollegeByDepartment, getCollegeByCode, CONDITIONAL_EXCLUSION_COLLEGES, CollegeName } from '../data/departmentCollegeMap';
import { QUESTION_POOL } from '../data/questionPool';

interface PilotSurveyProps {
  onNavigate?: (page: string) => void;
  onComplete?: (result: PilotResultType) => void;
  isLoggedIn?: boolean;
  currentStudentId?: string | null;
  mode?: 'external' | 'default' | 'sso';
  ssoData?: { membernum: string; membername: string; departcode?: string; departname?: string; majorcode?: string; majorname?: string };
  // 보완검사부터 시작할 때 사용
  initialRiasecScores?: RiasecScores;
  initialRiasecAnswers?: RiasecAnswer;
  startAtSupplementary?: boolean;
  /** 강의용 데모: 인트로의 이름·이메일·동의 입력을 비워둬도 시작 가능하게 합니다. */
  relaxValidation?: boolean;
}

interface ParticipantInfo {
  name: string;
  studentId: string;
  email: string;
}

export default function PilotSurvey({
  onNavigate,
  onComplete,
  isLoggedIn = false,
  currentStudentId,
  mode = 'default',
  ssoData,
  initialRiasecScores,
  initialRiasecAnswers,
  startAtSupplementary = false,
  relaxValidation = false,
}: PilotSurveyProps) {
  const [participantInfo, setParticipantInfo] = useState<ParticipantInfo>({
    name: ssoData?.membername || '',
    studentId: ssoData?.membernum || currentStudentId || '',
    email: '',
  });

  // SSO 사용자의 단과대학 (조건부 제외 필터용)
  // 개발 테스트용: URL 파라미터로 테스트 가능
  //   ?testCollege=예술체육대학 (단과대학명)
  //   ?testCode=106001 (학과/전공 코드)
  const urlParams = new URLSearchParams(window.location.search);
  const testCollege = urlParams.get('testCollege') as CollegeName | null;
  const testCode = urlParams.get('testCode');

  // 단과대학 매핑 (우선순위: testCollege > testCode > SSO코드 > SSO이름)
  const collegeFromCode = ssoData?.departcode || ssoData?.majorcode
    ? getCollegeByCode(ssoData.departcode, ssoData.majorcode)
    : null;
  const collegeFromName = ssoData?.departname
    ? getCollegeByDepartment(ssoData.departname, ssoData.majorname)
    : null;

  const userCollege: CollegeName | null = testCollege
    || (testCode ? getCollegeByCode(testCode) : null)
    || collegeFromCode
    || collegeFromName;

  // SSO 사용자의 학과/전공명 (폐과 필터링용)
  const userMajorName = ssoData?.departname || ssoData?.majorname || null;

  // 🔍 디버깅: 현재 접속 정보 및 필터링 기준
  useEffect(() => {
    const filterBasis = testCollege ? 'URL(testCollege)'
      : testCode ? 'URL(testCode)'
      : collegeFromCode ? 'SSO코드'
      : collegeFromName ? 'SSO이름'
      : '없음(외부접속)';

    console.group('🎓 전공 적합도 검사 - 접속 정보');
    console.log('📍 접속 모드:', mode);
    console.log('👤 학번:', ssoData?.membernum || participantInfo.studentId || '(없음)');
    console.log('👤 이름:', ssoData?.membername || participantInfo.name || '(없음)');
    console.log('🏫 학과코드:', ssoData?.departcode || '(없음)');
    console.log('🏫 학과명:', ssoData?.departname || '(없음)');
    console.log('📚 전공코드:', ssoData?.majorcode || '(없음)');
    console.log('📚 전공명:', ssoData?.majorname || '(없음)');
    console.log('─────────────────────────────');
    console.log('🎯 매핑된 단과대학:', userCollege || '(없음 - 외부접속)');
    console.log('📊 필터링 기준:', filterBasis);
    console.log('─────────────────────────────');
    console.log('🚫 필터링 적용:');
    if (!userCollege) {
      console.log('  • 완전제외 전공 제외');
      console.log('  • 융합대학 제외');
      console.log('  • 예술체육대학 허용');
    } else if (userCollege === '융합대학') {
      console.log('  • 완전제외 전공 제외');
      console.log('  • 융합대학만 표시');
    } else if (userCollege === '예술체육대학') {
      console.log('  • 완전제외 전공 제외');
      console.log('  • 예술체육대학만 표시');
    } else {
      console.log('  • 완전제외 전공 제외');
      console.log('  • 예술체육대학 제외');
      console.log('  • 융합대학 제외');
    }
    console.groupEnd();
  }, [mode, ssoData, participantInfo, userCollege, testCollege, testCode, collegeFromCode, collegeFromName]);

  const {
    phase,
    currentIndex,
    currentQuestion,
    answers,
    activeQuestions,
    result,
    isLoading,
    error,
    startSurvey,
    answerQuestion,
    goToNext,
    forceGoToNext,
    goToPrevious,
    canGoPrevious,
    resetSurvey,
    riasecIndex,
    riasecAnswers,
    riasecScores,
    currentRiasecQuestion,
    riasecDisplayValue,
    answerRiasecQuestion,
    goToPreviousRiasec,
    riasecCanGoPrevious,
    startSupplementary,
    skipSupplementary,
    selectedClusters,
    toggleCluster,
    startMajorPreview,
    startRiasecFromPreview,
    backToInterestSelect,
    interestedMajorKeys,
    toggleInterestedMajor,
    startPhoneCollection,
    completePhoneCollection,
  } = usePilotSurvey({
    // SSO 사용자는 ssoData에서 자동 설정, 로그인 사용자는 studentId만, 비로그인은 name+email 필요
    participantInfo: mode === 'sso' && ssoData
      ? { name: ssoData.membername, studentId: ssoData.membernum, email: '' }
      : isLoggedIn && currentStudentId
        ? { name: '', studentId: currentStudentId, email: '' }
        : (participantInfo.name && participantInfo.email ? participantInfo : undefined),
    onComplete,
    skipIntro: isLoggedIn || startAtSupplementary || mode === 'sso',
    initialRiasecScores,
    initialRiasecAnswers,
    startAtSupplementary,
    department: ssoData?.departname,
    major: ssoData?.majorname,
    source: mode === 'sso' ? 'sso' : mode === 'external' ? 'external' : 'direct',
    mode,
  });

  // 외부/SSO 사용자: RIASEC 문항 완료 후(riasec_result) 결과 보기 전에 phone_collection으로 이동
  const [phoneCollected, setPhoneCollected] = useState(false);
  const shouldCollectPhone = mode === 'external' || mode === 'sso';

  useEffect(() => {
    // riasec_result에 도달하면 phone_collection으로 먼저 이동 (아직 수집 안 한 경우)
    if (shouldCollectPhone && phase === 'riasec_result' && !phoneCollected) {
      startPhoneCollection();
    }
  }, [shouldCollectPhone, phase, phoneCollected, startPhoneCollection]);

  // Auto-reset if phase state is inconsistent (e.g. after HMR or corrupt localStorage)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPhaseDataReady =
    phase === 'intro' ||
    phase === 'interest_select' ||
    phase === 'major_preview' ||
    phase === 'phone_collection' ||
    (phase === 'riasec' && !!currentRiasecQuestion) ||
    (phase === 'riasec_result' && !!riasecScores) ||
    (phase === 'supplementary' && !!currentQuestion) ||
    (phase === 'complete' && !!result && !!result.riasecScores);

  useEffect(() => {
    if (!isPhaseDataReady && !isLoading) {
      resetTimerRef.current = setTimeout(() => {
        console.warn('Auto-resetting: phase data not ready after 1s. phase:', phase);
        localStorage.removeItem('pilot_survey_progress');
        resetSurvey();
      }, 1000);
    }
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [isPhaseDataReady, isLoading, phase, resetSurvey]);

  // Intro phase
  if (phase === 'intro') {
    return (
      <PilotIntro
        onStart={startSurvey}
        participantInfo={participantInfo}
        onParticipantInfoChange={setParticipantInfo}
        mode={mode}
        ssoData={ssoData}
        relaxValidation={relaxValidation}
      />
    );
  }

  // Interest Select phase
  if (phase === 'interest_select') {
    return (
      <InterestSelect
        selectedClusters={selectedClusters}
        onSelectCluster={toggleCluster}
        onNext={startMajorPreview}
        userCollege={userCollege}
      />
    );
  }

  // Major Preview phase
  if (phase === 'major_preview') {
    return (
      <MajorPreview
        selectedClusters={selectedClusters}
        onStartRiasec={startRiasecFromPreview}
        onBack={backToInterestSelect}
        interestedMajorKeys={interestedMajorKeys}
        onToggleMajor={toggleInterestedMajor}
        userCollege={userCollege}
        userMajorName={userMajorName}
      />
    );
  }

  // RIASEC phase - RiasecQuestion is already a full-screen component
  if (phase === 'riasec') {
    if (!currentRiasecQuestion) {
      // riasecIndex not yet updated (e.g. during localStorage restore) — wait for next render
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#1E3A5F] border-t-transparent"></div>
        </div>
      );
    }
    return (
      <RiasecQuestion
        question={currentRiasecQuestion}
        value={riasecDisplayValue}
        onChange={answerRiasecQuestion}
        onPrevious={goToPreviousRiasec}
        canGoPrevious={riasecCanGoPrevious}
        questionNumber={riasecIndex + 1}
        totalQuestions={QUESTION_POOL.length}
        onBackToCluster={backToInterestSelect}
      />
    );
  }

  // RIASEC Result phase (휴대폰 수집 후 표시됨)
  if (phase === 'riasec_result') {
    if (!riasecScores) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#1E3A5F] border-t-transparent"></div>
        </div>
      );
    }

    return (
      <RiasecResult
        scores={riasecScores}
        onContinue={startSupplementary}
        onSkip={skipSupplementary}
        participantName={participantInfo.name || undefined}
        interestedMajorKeys={interestedMajorKeys}
        userCollege={userCollege}
        userMajorName={userMajorName}
        mode={mode}
      />
    );
  }

  // Supplementary phase - All question types get full-screen treatment
  if (phase === 'supplementary') {
    if (!currentQuestion) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#1E3A5F] border-t-transparent"></div>
        </div>
      );
    }
    const commonProps = {
      questionNumber: currentIndex + 1,
      totalQuestions: activeQuestions.length,
      onPrevious: canGoPrevious ? goToPrevious : undefined,
    };

    switch (currentQuestion.type) {
      case 'likert':
        return (
          <LikertQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            value={answers[currentQuestion.id] as number}
            onChange={answerQuestion}
            onAutoAdvance={forceGoToNext}
            {...commonProps}
          />
        );

      case 'single':
        return (
          <SingleSelectQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            value={answers[currentQuestion.id] as string}
            onChange={answerQuestion}
            onAutoAdvance={forceGoToNext}
            {...commonProps}
          />
        );

      case 'multi':
        return (
          <MultiSelectQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            value={answers[currentQuestion.id] as string[]}
            onChange={answerQuestion}
            onNext={goToNext}
            {...commonProps}
          />
        );

      case 'ranking':
        return (
          <RankingQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            value={answers[currentQuestion.id] as Record<string, number>}
            onChange={answerQuestion}
            onNext={goToNext}
            {...commonProps}
          />
        );

      case 'freetext':
        return (
          <FreeTextQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            value={answers[currentQuestion.id] as string}
            onChange={answerQuestion}
            onNext={goToNext}
            {...commonProps}
          />
        );

      default:
        return null;
    }
  }

  // Phone collection phase (for external users)
  if (phase === 'phone_collection') {
    return (
      <PhoneCollection
        participantName={participantInfo.name || undefined}
        onSubmit={(phone) => {
          // TODO: Save phone to DB if needed
          console.log('Phone submitted:', phone);
          setPhoneCollected(true);
          completePhoneCollection(phone);
        }}
        onSkip={() => {
          setPhoneCollected(true);
          completePhoneCollection();
        }}
      />
    );
  }

  // Complete phase - render RiasecResult with supplementary data
  if (phase === 'complete') {
    if (!result || !result.riasecScores) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#1E3A5F] border-t-transparent"></div>
        </div>
      );
    }
    // Map career decision status to display text
    const decisionLevelMap: Record<string, string> = {
      decided: '확정',
      exploring: '탐색',
      undecided: '미결정',
    };

    // Build supplementary data if not skipped
    const supplementaryData = result.skippedSupplementary ? undefined : {
      valueScores: result.valueScores,
      careerDecision: result.careerDecision ? {
        level: decisionLevelMap[result.careerDecision.status] || '탐색',
        confidence: result.careerDecision.score / 5, // Convert 1-5 scale to 0-1
      } : undefined,
      selfEfficacy: result.selfEfficacy,
      preferences: {
        fieldPreference: result.preferences?.fieldPreference,
        workStyle: result.preferences?.workStyle,
        environmentPreference: result.preferences?.workEnvironment,
      },
      roleModel: result.roleModel,
      valueRanking: result.valueRanking,
    };

    return (
      <RiasecResult
        scores={result.riasecScores}
        participantName={result.name || participantInfo.name || undefined}
        supplementaryData={supplementaryData}
        isComplete={true}
        onNavigate={onNavigate}
        onRestart={resetSurvey}
        interestedMajorKeys={interestedMajorKeys}
        userCollege={userCollege}
        mode={mode}
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF9]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1E3A5F] border-t-transparent mb-4"></div>
        <p className="text-[#475569]">결과를 저장하고 있습니다...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF9] p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1E293B] mb-2">오류가 발생했습니다</h2>
          <p className="text-[#475569] mb-6">{error}</p>
          <button
            onClick={goToNext}
            className="w-full py-3 rounded-xl font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #4A6FA5 100%)' }}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // Default fallback - log for debugging and auto-reset
  console.warn('PilotSurvey fallback reached. phase:', phase, 'result:', !!result, 'riasecScores:', !!riasecScores, 'currentQuestion:', !!currentQuestion);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF9] p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-[#1E293B] mb-2">이전 검사 데이터에 문제가 있습니다</h2>
        <p className="text-sm text-[#475569] mb-6">저장된 진행 상태를 불러올 수 없습니다.<br />처음부터 다시 시작해 주세요.</p>
        <button
          onClick={() => {
            localStorage.removeItem('pilot_survey_progress');
            resetSurvey();
          }}
          className="w-full py-3 rounded-xl font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #4A6FA5 100%)' }}
        >
          처음부터 시작하기
        </button>
      </div>
    </div>
  );
}
