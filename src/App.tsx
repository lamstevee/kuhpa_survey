import React, { useState } from "react";
import PilotSurvey from "./pages/PilotSurvey";
import { PilotResult } from "./types/pilot";

/**
 * 강의용 데모 앱
 *
 * 원본 hsmatching 프로젝트에서 아래 세 가지만 발췌했습니다.
 *   1. 랜딩(인트로)     — PilotIntro : "전공 진로 적합도 검사" 소개 + 참가자 정보
 *   2. 검사             — 관심계열 선택 → 전공 미리보기 → RIASEC 15문항 → 보완문항
 *   3. 검사 프로파일 결과 — RiasecResult
 *
 * 로그인/대시보드/관리자/SSO/DB 연동은 모두 제외했습니다.
 *
 * 참고: 예전 외부 공개 랜딩(src/pages/PublicLanding.tsx)도 함께 보관되어 있지만
 * 이 데모의 흐름에서는 사용하지 않습니다. (인트로 화면이 곧 첫 화면입니다.)
 */
export default function App() {
  // 결과 화면의 "메인으로"를 눌렀을 때 처음부터 다시 시작하기 위한 리마운트 키
  const [surveyKey, setSurveyKey] = useState(0);

  const restart = () => {
    // 이전 진행 상태가 남아 있으면 중간부터 복원되므로 데모에서는 항상 초기화
    localStorage.removeItem("pilot_survey_progress");
    setSurveyKey((k) => k + 1);
    window.scrollTo(0, 0);
  };

  const handleComplete = (result: PilotResult) => {
    // 데모에서는 별도 후처리 없이 결과 화면이 그대로 유지됩니다.
    console.log("[강의용 데모] 검사 완료:", result);
  };

  return (
    <PilotSurvey
      key={surveyKey}
      onNavigate={(page) => {
        // 결과 화면의 "메인으로" 버튼 → 인트로부터 다시 시작
        if (page === "landing") restart();
      }}
      onComplete={handleComplete}
      isLoggedIn={false}
      currentStudentId={null}
      // 강의 시연용: 인트로의 이름·이메일·동의 화면은 그대로 보여주되,
      // 비워둔 채로도 "검사 시작"을 누를 수 있게 합니다.
      // 원래의 필수 입력 검증을 보여주려면 이 줄을 지우세요.
      relaxValidation
    />
  );
}
