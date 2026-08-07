/**
 * 화면 4 · 프로젝트 마감 (제안서 15p, 인계 문서는 17p)
 * 마감은 기억이 아니라 체크리스트: AI가 분류하고, 사람이 승인하고,
 * 파기는 유예기간을 거친다 (Q1 대응 — 절대 자동 실행하지 않는다).
 */
import React, { useState } from "react";
import { CLOSE_ITEMS, CloseItemKey, NEEDS_REVIEW, StepProps } from "./data";
import { Button, C, Card, DandiMark } from "./ui";

function dateAfter(days: number) {
  const d = new Date(2026, 7, 7); // 2026-08-07
  d.setDate(d.getDate() + days);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function Step4Close({ state, set, next }: StepProps) {
  const [confirmingOriginals, setConfirmingOriginals] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);

  const approve = (key: CloseItemKey) => {
    if (!state.closed.includes(key)) set({ closed: [...state.closed, key] });
  };

  const requiredKeys = CLOSE_ITEMS.filter((i) => !i.keep).map((i) => i.key);
  const allDone = requiredKeys.every((k) => state.closed.includes(k));

  const pendingLabels = CLOSE_ITEMS.filter(
    (i) => !i.keep && !state.closed.includes(i.key)
  ).map((i) => `${i.label} — 승인 대기`);

  return (
    <Card
      title="행사가 끝났어요. 마감을 도와드릴게요"
      sub="항목을 확인하고 승인하면 실행됩니다 — 영구 삭제는 유예기간을 거쳐요"
      caption="링크 만료, 보관·통계화·파기 후보, 외부 사본 확인이 하나의 체크리스트로 정리됩니다. 파기는 운영자 최종 승인과 유예기간을 거칩니다."
    >
      <div className="space-y-3">
        {CLOSE_ITEMS.map((item) => {
          const approved = state.closed.includes(item.key);
          const isOriginals = item.key === "originals";
          return (
            <div
              key={item.key}
              className="p-4 rounded-md"
              style={{
                background: item.keep ? "#F3F7FF" : C.white,
                border: `1px solid ${item.keep ? "#D6E4FF" : C.border}`,
                borderLeft: `3px solid ${item.keep ? C.blue : approved ? C.green : C.border}`,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold">{item.label}</span>
                    {item.keep && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                        style={{ background: "#E7EFFF", color: C.blue }}
                      >
                        보관
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[12px]" style={{ color: C.sub }}>
                    {item.detail}
                  </p>
                  {approved && (
                    <p className="mt-2 text-[12px] leading-relaxed" style={{ color: "#0A7D3E" }}>
                      {item.done}
                    </p>
                  )}
                </div>

                <div className="flex-shrink-0">
                  {approved ? (
                    <span
                      className="px-3 py-1.5 rounded-md text-[13px] font-bold"
                      style={{ background: C.greenPale, color: "#0A7D3E" }}
                    >
                      완료
                    </span>
                  ) : isOriginals ? (
                    <Button variant="danger" onClick={() => setConfirmingOriginals(true)}>
                      {item.action}
                    </Button>
                  ) : (
                    <Button onClick={() => approve(item.key)}>{item.action}</Button>
                  )}
                </div>
              </div>

              {isOriginals && !approved && confirmingOriginals && (
                <div
                  className="mt-3 p-3 rounded-md flex items-center justify-between gap-4"
                  style={{ background: C.redPale, border: "1px solid #FFD9D9" }}
                >
                  <p className="text-[12px] leading-relaxed" style={{ color: C.text }}>
                    파기 예약 시 <strong>30일 유예기간</strong>이 적용됩니다. 유예기간 동안은
                    복구할 수 있고, 기간이 지나야 영구 삭제됩니다.
                  </p>
                  <div className="flex-shrink-0">
                    <Button
                      variant="danger"
                      onClick={() => {
                        approve(item.key);
                        setConfirmingOriginals(false);
                      }}
                    >
                      파기 예약
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        <p className="text-[12px] font-bold mb-2" style={{ color: C.mute }}>
          추가 확인 필요
        </p>
        <div
          className="flex items-start justify-between gap-4 p-4 rounded-md"
          style={{ background: "#FAFAFA", border: `1px dashed ${C.border}` }}
        >
          <div>
            <span className="text-[14px] font-bold" style={{ color: C.text }}>
              {NEEDS_REVIEW.label}
            </span>
            <p className="mt-1 text-[12px] leading-relaxed" style={{ color: C.sub }}>
              {NEEDS_REVIEW.reason}
            </p>
          </div>
          <span
            className="flex-shrink-0 px-3 py-1.5 rounded-md text-[13px] font-bold"
            style={{ background: "#FFF3D6", color: "#9A6B00" }}
          >
            확인 필요
          </span>
        </div>
      </div>

      <div className="mt-6 pt-5 flex items-center justify-between gap-3" style={{ borderTop: `1px solid ${C.line}` }}>
        <Button variant="ghost" onClick={() => setShowHandoff((v) => !v)}>
          다음 담당자 인계 문서 자동 생성
        </Button>
        <Button disabled={!allDone} onClick={next}>
          마감 실행
        </Button>
      </div>

      {showHandoff && (
        <div className="mt-4 p-4 rounded-md" style={{ background: "#FAFAFA", border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <DandiMark size={20} />
            <span className="text-[13px] font-bold">인계 문서 미리보기</span>
          </div>
          <dl className="text-[13px] space-y-2">
            <HandoffRow k="보관 자료" v="집계 통계 1건 · 지원자 143명 학교별 분포 (개인 식별 불가)" />
            <HandoffRow k="사용 목적" v={`${state.purposeText} · 결과보고용 집계`} />
            <HandoffRow k="접근자" v="행사 운영진 (보호공간 접근 기록 남음)" />
            <HandoffRow k="파기일" v={`원본 응답 143건 — ${dateAfter(30)} (30일 유예 후 영구 삭제)`} />
            <HandoffRow
              k="미처리 작업"
              v={
                pendingLabels.length
                  ? [...pendingLabels, `${NEEDS_REVIEW.label} — 확인 필요`].join(" · ")
                  : `${NEEDS_REVIEW.label} — 확인 필요`
              }
            />
          </dl>
        </div>
      )}
    </Card>
  );
}

function HandoffRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-[76px] flex-shrink-0 font-bold" style={{ color: C.sub }}>
        {k}
      </dt>
      <dd style={{ color: C.text }}>{v}</dd>
    </div>
  );
}
