import React from "react";
import { StepProps, PURPOSES, FIELDS } from "./data";
import { Card, Button, DandiSays, C } from "./ui";

export default function Step5Done({ state, set }: StepProps) {
  const purpose =
    PURPOSES.find((p) => p.key === (state.purpose ?? "review")) ?? PURPOSES[0];
  const purposeFields =
    purpose.fields.length > 0
      ? `${purpose.fields.map((f) => FIELDS[f].label).join("·")}만`
      : "집계 통계만";
  const recipients = state.share?.recipients.length ?? 3;
  const days = state.share?.days ?? 7;

  const rows = [
    {
      label: "외부로 나간 항목",
      before: "이름·전화번호·이메일 포함 5개 항목 전체",
      after: purposeFields,
    },
    {
      label: "공유 방식",
      before: "만료 없는 파일 전달",
      after: `지정 ${recipients}명 · ${days}일 후 자동 만료 · 회수 가능`,
    },
    {
      label: "파기",
      before: "누구의 업무도 아님",
      after: `마감 체크리스트에 포함 · 승인 ${state.closed.length}건 · 30일 유예`,
    },
    {
      label: "남은 사본",
      before: "여섯 사람의 노트북",
      after: state.closed.includes("external")
        ? "회수 요청 1건 추적 중 · 신규 사본 0건"
        : "외부 반출 1건 미회수 · 신규 사본 0건",
    },
  ];

  return (
    <>
      <Card title="2026 여름 공모전 · 마감 완료" sub="기존 경로와 단디를 붙인 경로의 결과 비교">
        <div className="rounded-md overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          <div
            className="grid grid-cols-[120px_1fr_1fr] text-[12px] font-bold"
            style={{ background: "#FAFAFA", color: C.sub }}
          >
            <div className="px-3 py-2.5" />
            <div className="px-3 py-2.5">기존 경로</div>
            <div className="px-3 py-2.5" style={{ color: "#0A7D3E" }}>
              단디
            </div>
          </div>
          {rows.map((r, i) => (
            <div
              key={r.label}
              className="grid grid-cols-[120px_1fr_1fr] text-[13px]"
              style={{ borderTop: i ? undefined : `1px solid ${C.line}` }}
            >
              <div
                className="px-3 py-3 font-bold flex items-center"
                style={{ color: C.text, borderTop: i ? `1px solid ${C.line}` : undefined }}
              >
                {r.label}
              </div>
              <div
                className="px-3 py-3 flex items-center"
                style={{ background: "#FAFAFA", color: C.mute, borderTop: i ? `1px solid ${C.line}` : undefined }}
              >
                {r.before}
              </div>
              <div
                className="px-3 py-3 flex items-center"
                style={{ background: C.greenPale, color: "#0A7D3E", borderTop: i ? `1px solid #CCEEDD` : undefined }}
              >
                {r.after}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <DandiSays tone="warn">
        이미 외부로 복사된 파일은 소급 통제할 수 없고, 원본 다운로드를 고집하는 예외를 강제로
        막지 않습니다. 목표는 완전 통제가 아니라 안전한 선택이 가장 빠르고 쉬운 선택이 되게
        만드는 것입니다.
        {state.rawDownloads > 0 && (
          <>
            <br />
            <br />
            이번 데모에서는 원본 다운로드를 {state.rawDownloads}회 선택했어요. 막지 않고 성과
            지표(원본 다운로드 비율)로 추적합니다.
          </>
        )}
      </DandiSays>

      <Card>
        <p
          className="text-center text-[22px] font-extrabold leading-relaxed py-6"
          style={{ color: C.text }}
        >
          사람들이 가장 편한 선택을 했을 때,
          <br />
          개인정보도 가장 안전해지도록.
        </p>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="ghost"
          onClick={() =>
            set({ step: 0, purpose: null, share: null, closed: [], rawDownloads: 0 })
          }
        >
          처음부터 다시
        </Button>
      </div>
    </>
  );
}
