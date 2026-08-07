import React from "react";
import { StepProps } from "./data";
import { Card, Button, DandiSays, DandiMark, C } from "./ui";

type TimelineItem = { n: number; title: string; desc: string; danger?: boolean };

const TIMELINE: TimelineItem[] = [
  {
    n: 1,
    title: "네이버폼으로 접수",
    desc: "공모전 참가 신청 143건. 이름·학교·연락처·이메일·지원내용.",
  },
  {
    n: 2,
    title: "엑셀 전체 다운로드",
    desc: "가장 빠른 방법이라서, 응답 원본 전체를 내려받습니다.",
  },
  {
    n: 3,
    title: "단체방·메일로 전달",
    desc: "심사에 연락처는 필요 없지만, 지우는 일은 누구의 업무도 아닙니다.",
  },
  {
    n: 4,
    title: "행사 종료, 그리고 방치",
    desc: "파일은 여섯 사람의 노트북에 그대로 남습니다.",
    danger: true,
  },
];

const STATS = [
  { big: "447건", sub: "2025년 개인정보 유출 신고 (전년 대비 45.6%↑)" },
  { big: "25%", sub: "유출 원인 중 업무과실" },
  { big: "5%", sub: "유출 대응 매뉴얼 보유 민간기업" },
  { big: "0.34명", sub: "민간기업 평균 보호 전담 인력" },
];

export default function Step0Intro({ next }: StepProps) {
  return (
    <>
      <Card>
        <div className="flex items-center gap-3">
          <DandiMark size={44} />
          <span className="text-[32px] font-extrabold" style={{ color: C.text }}>
            단디
          </span>
        </div>
        <p className="mt-3 text-[18px] font-bold" style={{ color: C.text }}>
          일은 편하게, 개인정보는 단디.
        </p>
        <p className="mt-2 text-[14px] leading-relaxed" style={{ color: C.sub }}>
          AI가 자료를 목적에 맞게 정리하고, 필요한 정보만 안전하게 공유하며, 업무가 끝나면
          마감과 파기까지 돕는 개인정보 업무 도우미.
        </p>
        <p className="mt-4 text-[12px]" style={{ color: C.mute }}>
          NAVER PRIVACY CHALLENGE 2026 · 송리버 팀 강주민 · 송수현
        </p>
      </Card>

      <Card
        title="지금, 이렇게 하고 있진 않나요?"
        sub="민지 씨의 공모전 운영 4단계"
        caption="이 장면에 악인은 없습니다. 민지 씨의 목표는 행사를 잘 운영하는 것이지, 개인정보 관리가 아니었을 뿐입니다."
      >
        <div className="flex flex-col md:flex-row gap-2 items-stretch">
          {TIMELINE.map((item, i) => (
            <React.Fragment key={item.n}>
              <div
                className="flex-1 min-w-0 rounded-md p-4"
                style={{
                  background: item.danger ? C.redPale : C.white,
                  border: `1px solid ${item.danger ? C.red : C.border}`,
                }}
              >
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-bold"
                  style={{
                    background: item.danger ? C.red : "#EDEDED",
                    color: item.danger ? C.white : C.mute,
                  }}
                >
                  {item.n}
                </span>
                <p className="mt-2 text-[14px] font-bold" style={{ color: C.text }}>
                  {item.title}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed" style={{ color: C.sub }}>
                  {item.desc}
                </p>
              </div>
              {i < TIMELINE.length - 1 && (
                <div
                  className="flex items-center justify-center text-[16px] py-1 md:py-0"
                  style={{ color: C.mute }}
                >
                  <span className="hidden md:inline">→</span>
                  <span className="md:hidden">↓</span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </Card>

      <Card caption="출처: 개인정보보호위원회·KISA (2026)">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.sub}>
              <p className="text-[24px] font-extrabold" style={{ color: C.text }}>
                {s.big}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed" style={{ color: C.sub }}>
                {s.sub}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <DandiSays>
        같은 시나리오를 단디가 붙은 네이버폼에서 다시 해봅니다. 운영자가 하는 일의 순서는
        그대로이고, 각 단계의 기본값만 바뀝니다.
      </DandiSays>

      <div className="flex justify-end">
        <Button onClick={next}>단디로 다시 해보기</Button>
      </div>
    </>
  );
}
