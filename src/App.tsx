import React, { useState } from "react";
import PilotSurvey from "./pages/PilotSurvey";
import { PilotResult } from "./types/pilot";

/**
 * KUHPA 신입 학회원 적성·흥미 검사
 * 인트로 → 관심 학술분야 선택 → RIASEC 15문항 → 결과
 */
export default function App() {
  // 결과 화면의 "다시 시작"을 눌렀을 때 처음부터 다시 시작하기 위한 리마운트 키
  const [surveyKey, setSurveyKey] = useState(0);

  const restart = () => {
    localStorage.removeItem("pilot_survey_progress");
    setSurveyKey((k) => k + 1);
    window.scrollTo(0, 0);
  };

  const handleComplete = (result: PilotResult) => {
    console.log("[KUHPA] 검사 완료:", result);
  };

  return (
    <PilotSurvey
      key={surveyKey}
      onComplete={handleComplete}
      onRestart={restart}
    />
  );
}
