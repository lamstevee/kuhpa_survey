import React, { useState } from "react";
import { StepProps, PURPOSES, RESPONSES, FIELDS, FieldKey } from "./data";
import { Card, Button, FieldChip, DandiSays, ResponseTable, C } from "./ui";

export default function Step2Build({ state, set, next }: StepProps) {
  const [rawConfirm, setRawConfirm] = useState(false);
  const [rawDone, setRawDone] = useState(false);

  const selKey = state.purpose ?? PURPOSES[0].key;
  const sel = PURPOSES.find((p) => p.key === selKey)!;
  const dropped = state.collected.filter((f) => !sel.fields.includes(f));

  return (
    <>
      <div
        className="px-4 py-2.5 mb-4 text-[13px] rounded-md"
        style={{ background: C.white, border: `1px solid ${C.border}`, color: C.sub }}
      >
        응답 관리 · 2026 여름 공모전 (응답 {RESPONSES.length}건)
      </div>

      <Card
        title="업무용 명단 만들기"
        sub="하려는 일을 고르면, 필요한 정보만 담아 만들어 드려요"
        caption='"엑셀 다운로드" 자리에 목적 선택이 기본으로 놓입니다. 제외·유지 항목이 미리보기로 표시되고, 판단 이유가 한 줄로 설명됩니다.'
      >
        <div className="grid grid-cols-2 gap-2.5">
          {PURPOSES.map((p) => {
            const on = p.key === selKey;
            return (
              <div
                key={p.key}
                onClick={() => set({ purpose: p.key })}
                className="relative cursor-pointer rounded-md px-4 py-3"
                style={{
                  border: `1px solid ${on ? C.green : C.border}`,
                  background: on ? C.greenPale : C.white,
                }}
              >
                {on && (
                  <span
                    className="absolute top-2.5 right-2.5 text-[11px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: C.green, color: C.white }}
                  >
                    선택됨
                  </span>
                )}
                <p className="text-[15px] font-extrabold" style={{ color: C.text }}>
                  {p.label}
                </p>
                <p className="mt-0.5 text-[12px]" style={{ color: C.sub }}>
                  {p.desc}
                </p>
                <p className="mt-1.5 text-[12px]" style={{ color: C.mute }}>
                  {p.aggregate
                    ? "집계 통계만"
                    : p.fields.map((f) => FIELDS[f].label).join(", ")}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <h3 className="text-[13px] font-bold mb-3" style={{ color: C.sub }}>
            미리보기
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {sel.fields.map((f) => (
              <FieldChip key={f} field={f} state="keep" />
            ))}
            {dropped.map((f) => (
              <FieldChip key={f} field={f} state="drop" />
            ))}
          </div>

          {sel.aggregate ? <AggregateStats /> : (
            <ResponseTable
              rows={RESPONSES.slice(0, 5)}
              show={sel.fields}
              hide={dropped}
              showCode
            />
          )}
        </div>

        <div className="mt-4">
          <DandiSays>{sel.reason}</DandiSays>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div>
            {!rawConfirm ? (
              <button
                onClick={() => setRawConfirm(true)}
                className="text-[13px] underline"
                style={{ color: C.mute }}
              >
                원본 전체 다운로드
              </button>
            ) : (
              <div
                className="max-w-md p-4 rounded-md text-[13px] leading-relaxed space-y-3"
                style={{ background: "#FAFAFA", border: `1px solid ${C.border}`, color: C.text }}
              >
                <p>
                  응답 {RESPONSES.length}건 원본 전체에는 이름·전화번호·이메일이
                  포함돼요. 대신 목적에 맞는 명단을 만들어 쓰는 게 더 안전해요.
                </p>
                {!rawDone ? (
                  <div className="flex gap-2">
                    <Button onClick={next}>{sel.label} 만들기</Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        set({ rawDownloads: state.rawDownloads + 1 });
                        setRawDone(true);
                      }}
                    >
                      그래도 원본 다운로드
                    </Button>
                  </div>
                ) : (
                  <p style={{ color: C.sub }}>
                    목적·보관기간 확인 후 안전 템플릿으로 저장되어 다음번
                    기본값이 바뀌어요.
                  </p>
                )}
              </div>
            )}
          </div>
          <Button onClick={next}>{sel.label} 만들기</Button>
        </div>
      </Card>
    </>
  );
}

function AggregateStats() {
  const total = RESPONSES.length;
  const counts = new Map<string, number>();
  for (const r of RESPONSES) {
    counts.set(r.school, (counts.get(r.school) ?? 0) + 1);
  }
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const max = Math.max(...rows.map((r) => r[1]));

  return (
    <div className="rounded-md p-4" style={{ border: `1px solid ${C.border}` }}>
      <p className="text-[13px] font-bold mb-3" style={{ color: C.text }}>
        총 지원자 {total}명 · 학교별 분포
      </p>
      <div className="space-y-2">
        {rows.map(([school, n]) => (
          <div key={school} className="flex items-center gap-2 text-[12px]">
            <span className="w-40 truncate" style={{ color: C.sub }}>
              {school}
            </span>
            <div className="flex-1 h-3 rounded" style={{ background: C.line }}>
              <div
                className="h-3 rounded"
                style={{ width: `${(n / max) * 100}%`, background: C.green }}
              />
            </div>
            <span className="w-8 text-right font-bold" style={{ color: C.text }}>
              {n}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
