import React, { useState } from 'react';
import { usePilotSurvey } from '../hooks/usePilotSurvey';
import PilotIntro from '../components/pilot/PilotIntro';
import RiasecQuestion from '../components/pilot/RiasecQuestion';
import RiasecResult from '../components/pilot/RiasecResult';
import InterestSelect from '../components/pilot/InterestSelect';
import { PilotResult } from '../types/pilot';
import { QUESTION_POOL } from '../data/questionPool';

interface PilotSurveyProps {
  onComplete?: (result: PilotResult) => void;
  onRestart?: () => void;
}

interface ParticipantInfo {
  name: string;
  studentId: string;
}

export default function PilotSurvey({ onComplete, onRestart }: PilotSurveyProps) {
  const [participantInfo, setParticipantInfo] = useState<ParticipantInfo>({ name: '', studentId: '' });

  const {
    phase,
    isLoading,
    error,
    result,
    startSurvey,
    resetSurvey,
    selectedClusters,
    toggleCluster,
    startRiasec,
    backToInterestSelect,
    riasecIndex,
    riasecScores,
    currentRiasecQuestion,
    riasecDisplayValue,
    answerRiasecQuestion,
    goToPreviousRiasec,
    riasecCanGoPrevious,
  } = usePilotSurvey({
    participantInfo: participantInfo.name ? participantInfo : undefined,
    onComplete,
  });

  if (phase === 'intro') {
    return (
      <PilotIntro
        onStart={startSurvey}
        participantInfo={participantInfo}
        onParticipantInfoChange={setParticipantInfo}
      />
    );
  }

  if (phase === 'interest_select') {
    return (
      <InterestSelect
        selectedClusters={selectedClusters}
        onSelectCluster={toggleCluster}
        onNext={startRiasec}
      />
    );
  }

  if (phase === 'riasec') {
    if (!currentRiasecQuestion) {
      return <LoadingScreen />;
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF9]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1E3A5F] border-t-transparent mb-4" />
        <p className="text-[#475569]">결과를 저장하고 있습니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF9] p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-[#1E293B] mb-2">오류가 발생했습니다</h2>
          <p className="text-[#475569] mb-6">{error}</p>
          <button
            onClick={resetSurvey}
            className="w-full py-3 rounded-xl font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #4A6FA5 100%)' }}
          >
            처음부터 다시 시작
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'complete' && result) {
    return (
      <RiasecResult
        scores={result.riasecScores}
        participantName={result.name}
        interestedFields={result.interestedFields}
        onRestart={() => {
          resetSurvey();
          onRestart?.();
        }}
      />
    );
  }

  return <LoadingScreen />;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#1E3A5F] border-t-transparent" />
    </div>
  );
}
