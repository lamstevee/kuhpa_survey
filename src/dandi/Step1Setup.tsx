import React, { useState } from "react";
import {
  StepProps,
  FIELDS,
  FieldKey,
  RECOMMENDED,
  EXCLUDED_AT_SETUP,
} from "./data";
import { Card, Button, FieldChip, DandiSays, C } from "./ui";

const inputCls =
  "w-full px-3 py-2 text-[14px] rounded-md border border-[#E5E5E5] focus:border-[#03C75A] focus:outline-none";

export default function Step1Setup({ state, set, next }: StepProps) {
  const [rrnWarn, setRrnWarn] = useState(false);

  function toggle(field: FieldKey) {
    const on = state.collected.includes(field);
    if (!on && field === "rrn") {
      setRrnWarn(true);
      return;
    }
    setRrnWarn(false);
    set({
      collected: on
        ? state.collected.filter((f) => f !== field)
        : [...state.collected, field],
    });
  }

  return (
    <Card
      title="이 폼의 개인정보, 어떻게 쓰이나요?"
      sub="답변에 따라 수집 항목과 마감 일정을 추천해 드려요"
      caption="목적·종료 시점·공유 대상을 폼 생성 시점에 확정합니다. 과잉 수집은 만들어지기 전에 걸러지고, 마감 일정이 이때 함께 예약됩니다."
    >
      <div className="space-y-0 rounded-md border" style={{ borderColor: C.border }}>
        <Row label="사용 목적">
          <input
            className={inputCls}
            value={state.purposeText}
            onChange={(e) => set({ purposeText: e.target.value })}
          />
        </Row>
        <Row label="프로젝트 종료">
          <input
            className={inputCls}
            value={state.endText}
            onChange={(e) => set({ endText: e.target.value })}
          />
        </Row>
        <Row label="주요 공유 대상" last>
          <div className="px-3 py-2 text-[14px]" style={{ color: C.text }}>
            운영진 · 심사위원
          </div>
        </Row>
      </div>

      <div className="mt-6">
        <h3 className="text-[13px] font-bold mb-3" style={{ color: C.sub }}>
          추천 수집 항목
        </h3>
        <div className="flex flex-wrap gap-2">
          {RECOMMENDED.map((k) => (
            <FieldChip
              key={k}
              field={k}
              state={state.collected.includes(k) ? "keep" : "drop"}
              onClick={() => toggle(k)}
            />
          ))}
          {EXCLUDED_AT_SETUP.map((k) => (
            <FieldChip
              key={k}
              field={k}
              state={state.collected.includes(k) ? "keep" : "drop"}
              note={FIELDS[k].note}
              onClick={() => toggle(k)}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <DandiSays>
          공모전 운영에는 주민등록번호와 집 주소가 필요하지 않아 제외했어요.
          주민등록번호는 법령상 처리 근거가 확인되는 경우에만 추가할 수 있어요.
        </DandiSays>
        {rrnWarn && (
          <DandiSays tone="warn">
            주민등록번호는 법령상 처리 근거가 확인되는 경우에만 추가할 수 있어요.
          </DandiSays>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost">직접 설정</Button>
        <Button
          onClick={() => {
            set({ collected: state.collected });
            next();
          }}
        >
          이대로 시작
        </Button>
      </div>
    </Card>
  );
}

function Row({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className="grid grid-cols-[120px_1fr] items-center gap-3 px-4 py-3"
      style={{ borderBottom: last ? undefined : `1px solid ${C.line}` }}
    >
      <span className="text-[13px] font-bold" style={{ color: C.sub }}>
        {label}
      </span>
      {children}
    </div>
  );
}
