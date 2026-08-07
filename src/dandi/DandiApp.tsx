/**
 * 단디 프로토타입 셸 — 네이버폼 안에 얹힌 얇은 레이어라는 설정.
 * 상단 GNB + 좌측 스텝 네비 + 본문. 스텝 컴포넌트는 state/set/next만 받는다.
 */
import React, { useState } from "react";
import { DandiState, INITIAL_STATE } from "./data";
import { C, DandiMark } from "./ui";
import Step0Intro from "./Step0Intro";
import Step1Setup from "./Step1Setup";
import Step2Build from "./Step2Build";
import Step3Share from "./Step3Share";
import Step4Close from "./Step4Close";
import Step5Done from "./Step5Done";

const STEPS = [
  { label: "문제 장면", sub: "지금의 기본 경로" },
  { label: "프로젝트 설정", sub: "목적·종료·공유 대상" },
  { label: "업무용 자료 생성", sub: "목적별 최소정보" },
  { label: "안전한 공유", sub: "지정·만료·회수" },
  { label: "프로젝트 마감", sub: "링크·보관·파기" },
  { label: "마무리", sub: "무엇이 달라졌나" },
];

const SCREENS = [Step0Intro, Step1Setup, Step2Build, Step3Share, Step4Close, Step5Done];

export default function DandiApp() {
  const [state, setState] = useState<DandiState>(INITIAL_STATE);
  const set = (patch: Partial<DandiState>) => setState((s) => ({ ...s, ...patch }));
  const go = (step: number) => {
    set({ step });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const Screen = SCREENS[state.step];

  return (
    // 나눔고딕만 사용한다. 설문 앱(index.css)과 폰트를 섞지 않으려고 셸에서만 지정.
    <div
      className="min-h-screen"
      style={{ background: C.bg, color: C.text, fontFamily: "'Nanum Gothic', sans-serif" }}
    >
      <Gnb />

      <div className="max-w-[1180px] mx-auto px-6 py-8 flex gap-8 items-start">
        <nav className="w-[220px] flex-shrink-0 sticky top-[72px] hidden lg:block">
          <p className="text-[12px] font-bold mb-3 px-1" style={{ color: C.mute }}>
            데모 진행
          </p>
          <ol
            className="rounded-lg overflow-hidden"
            style={{ background: C.white, border: `1px solid ${C.border}` }}
          >
            {STEPS.map((s, i) => {
              const active = i === state.step;
              const done = i < state.step;
              return (
                <li key={s.label}>
                  <button
                    onClick={() => go(i)}
                    className="w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-[#FAFAFA]"
                    style={{
                      borderTop: i ? `1px solid ${C.line}` : undefined,
                      background: active ? C.greenPale : undefined,
                    }}
                  >
                    <span
                      className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center"
                      style={{
                        background: active || done ? C.green : "#EDEDED",
                        color: active || done ? C.white : C.mute,
                      }}
                    >
                      {done ? "✓" : i}
                    </span>
                    <span>
                      <span
                        className="block text-[13px] font-bold"
                        style={{ color: active ? "#0A7D3E" : C.text }}
                      >
                        {s.label}
                      </span>
                      <span className="block text-[11px] mt-0.5" style={{ color: C.mute }}>
                        {s.sub}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 px-1 text-[11px] leading-relaxed" style={{ color: C.mute }}>
            NAVER PRIVACY CHALLENGE 2026
            <br />
            송리버 팀 · 강주민 · 송수현
          </p>
        </nav>

        <main className="flex-1 min-w-0 space-y-5">
          <Screen state={state} set={set} next={() => go(Math.min(state.step + 1, SCREENS.length - 1))} />
        </main>
      </div>
    </div>
  );
}

function Gnb() {
  return (
    <header
      className="sticky top-0 z-10"
      style={{ background: C.white, borderBottom: `1px solid ${C.border}` }}
    >
      <div className="max-w-[1180px] mx-auto px-6 h-[60px] flex items-center gap-3">
        <span className="text-[20px] font-extrabold" style={{ color: C.green }}>
          NAVER
        </span>
        <span className="text-[17px] font-bold">폼</span>
        <span className="w-px h-4 mx-1" style={{ background: C.border }} />
        <span className="text-[14px]" style={{ color: C.sub }}>
          2026 여름 공모전
        </span>
        <span className="flex-1" />
        <span
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-bold"
          style={{ background: C.greenPale, color: "#0A7D3E" }}
        >
          <DandiMark size={18} />
          단디 켜짐
        </span>
      </div>
    </header>
  );
}
