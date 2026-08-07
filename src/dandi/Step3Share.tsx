/**
 * 화면 3 · 안전한 공유 (제안서 15p)
 * 공유는 "지정 수신자 + 자동 만료 + 다운로드 제한 + 회수"가 기본값이고,
 * 공개 링크는 사유를 적어야 여는 예외 경로다.
 */
import React, { useState } from "react";
import { PURPOSES, REVIEWERS, StepProps } from "./data";
import { Button, C, Card, DandiSays, FieldChip } from "./ui";

const DAY_OPTIONS = [3, 7, 30];
const BASE_DATE = new Date(2026, 7, 7); // 2026-08-07

function expiryLabel(days: number) {
  const d = new Date(BASE_DATE);
  d.setDate(d.getDate() + days);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function Step3Share({ state, set, next }: StepProps) {
  const purpose =
    PURPOSES.find((p) => p.key === state.purpose) ??
    PURPOSES.find((p) => p.key === "review")!;
  // 애초에 수집하지 않은 항목(주민등록번호 등)까지 "제외됨"으로 보여주면
  // 수집한 적 있다는 오해를 준다. 실제 수집 항목 중 빠진 것만 보여준다.
  const excluded = state.collected.filter((f) => !purpose.fields.includes(f));

  const [days, setDays] = useState(7);
  const [noDownload, setNoDownload] = useState(true);
  const [publicOpen, setPublicOpen] = useState(false);
  const [reason, setReason] = useState("");

  const startShare = () => {
    set({ share: { recipients: REVIEWERS, days, noDownload } });
    next();
  };

  return (
    <Card
      title="심사위원 3명에게 공유합니다"
      sub="기간이 지나면 링크가 자동으로 만료돼요"
      caption='수신자 지정·자동 만료·다운로드 제한·회수가 기본값입니다. 공유받은 사람에게 "삭제해 달라"고 따로 연락할 일이 구조적으로 줄어듭니다.'
    >
      <div className="space-y-5">
        {state.share && (
          <div
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-md"
            style={{ background: C.greenPale, border: "1px solid #CCEEDD" }}
          >
            <span className="text-[13px] font-bold" style={{ color: "#0A7D3E" }}>
              공유 중 · {state.share.days}일 후 만료 · 즉시 회수 가능
            </span>
            <Button variant="ghost" onClick={() => set({ share: null })}>
              회수
            </Button>
          </div>
        )}

        <div>
          <DlRow label="받는 사람">
            <span className="font-bold">{REVIEWERS.join(", ")}</span>
            <span className="ml-1.5" style={{ color: C.sub }}>
              (지정 3명)
            </span>
          </DlRow>
          <DlRow label="열람 기간">
            <div className="flex items-center gap-3 flex-wrap justify-end">
              <div
                className="inline-flex rounded-md overflow-hidden"
                style={{ border: `1px solid ${C.border}` }}
              >
                {DAY_OPTIONS.map((d, i) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className="px-3 py-1.5 text-[13px] font-bold"
                    style={{
                      background: days === d ? C.green : C.white,
                      color: days === d ? C.white : C.text,
                      borderLeft: i === 0 ? undefined : `1px solid ${C.border}`,
                    }}
                  >
                    {d}일
                  </button>
                ))}
              </div>
              <span className="text-[13px]" style={{ color: C.sub }}>
                {expiryLabel(days)} 자동 만료
              </span>
            </div>
          </DlRow>
          <DlRow label="다운로드 제한">
            <div className="flex items-center gap-2 justify-end">
              <Toggle on={noDownload} onClick={() => setNoDownload((v) => !v)} />
              <span className="text-[13px]" style={{ color: C.sub }}>
                (웹에서만 열람)
              </span>
            </div>
          </DlRow>
          <DlRow label="회수" last>
            <span className="text-[13px]" style={{ color: C.sub }}>
              언제든 즉시 회수 가능
            </span>
          </DlRow>
        </div>

        <div>
          <p className="text-[12px] font-bold mb-2" style={{ color: C.mute }}>
            이 자료에 포함되지 않은 정보
          </p>
          <div className="flex flex-wrap gap-2">
            {excluded.map((f) => (
              <FieldChip key={f} field={f} state="drop" />
            ))}
          </div>
        </div>

        <DandiSays>
          공개 링크 대신 지정 공유를 권장 설정으로 두었어요. 공개 링크가 꼭 필요하다면
          사유와 함께 만들 수 있어요.
        </DandiSays>

        <div>
          <button
            onClick={() => setPublicOpen((v) => !v)}
            className="text-[13px] underline"
            style={{ color: C.sub }}
          >
            공개 링크로 만들기
          </button>
          {publicOpen && (
            <div
              className="mt-3 p-4 rounded-md space-y-3"
              style={{ background: "#FAFAFA", border: `1px solid ${C.border}` }}
            >
              <label className="block text-[12px] font-bold" style={{ color: C.sub }}>
                공개 링크가 필요한 사유
              </label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="예: 외부 심사 플랫폼에 게시해야 함"
                className="w-full px-3 py-2 rounded-md text-[13px] outline-none"
                style={{ border: `1px solid ${C.border}` }}
              />
              <Button variant="danger" disabled={reason.trim().length === 0}>
                공개 링크 만들기
              </Button>
            </div>
          )}
        </div>

        <Button full onClick={startShare}>
          공유 시작
        </Button>
      </div>
    </Card>
  );
}

function DlRow({
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
      className="flex items-start justify-between gap-4 py-3"
      style={{ borderBottom: last ? undefined : `1px solid ${C.line}` }}
    >
      <span className="text-[13px] font-bold flex-shrink-0 pt-1" style={{ color: C.sub }}>
        {label}
      </span>
      <div className="text-[14px] text-right">{children}</div>
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-5 rounded-full relative transition-colors flex-shrink-0"
      style={{ background: on ? C.green : "#DDDDDD" }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
        style={{ left: on ? "18px" : "2px" }}
      />
    </button>
  );
}
