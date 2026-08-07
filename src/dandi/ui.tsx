/**
 * 네이버 스타일 UI 프리미티브. 색·간격·라운드는 여기서만 정의한다.
 */
import React from "react";
import { FIELDS, FieldKey } from "./data";

export const C = {
  green: "#03C75A",
  greenDark: "#02B351",
  greenPale: "#EAF9F0",
  text: "#222222",
  sub: "#767676",
  mute: "#A6A6A6",
  border: "#E5E5E5",
  line: "#F0F0F0",
  bg: "#F5F6F8",
  white: "#FFFFFF",
  red: "#F03E3E",
  redPale: "#FFF0F0",
  blue: "#2F6FED",
};

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  full,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  full?: boolean;
}) {
  const style: React.CSSProperties =
    variant === "primary"
      ? { background: disabled ? "#D5D5D5" : C.green, color: C.white, border: "1px solid transparent" }
      : variant === "danger"
      ? { background: C.white, color: C.red, border: `1px solid ${C.red}` }
      : { background: C.white, color: C.text, border: `1px solid ${C.border}` };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-5 py-3 rounded-md text-[15px] font-bold transition-opacity disabled:cursor-not-allowed hover:opacity-90"
      style={{ ...style, width: full ? "100%" : undefined }}
    >
      {children}
    </button>
  );
}

export function Card({
  title,
  sub,
  children,
  caption,
}: {
  title?: string;
  sub?: string;
  children: React.ReactNode;
  caption?: string;
}) {
  return (
    <section
      className="rounded-lg"
      style={{ background: C.white, border: `1px solid ${C.border}` }}
    >
      {title && (
        <header className="px-6 pt-6 pb-4">
          <h2 className="text-[19px] font-extrabold" style={{ color: C.text }}>
            {title}
          </h2>
          {sub && (
            <p className="mt-1.5 text-[13px]" style={{ color: C.sub }}>
              {sub}
            </p>
          )}
        </header>
      )}
      <div className="px-6 pb-6">{children}</div>
      {caption && (
        <p
          className="px-6 py-3 text-[12px] leading-relaxed rounded-b-lg"
          style={{ background: "#FAFAFA", color: C.sub, borderTop: `1px solid ${C.line}` }}
        >
          {caption}
        </p>
      )}
    </section>
  );
}

/** 수집/제외 항목 칩. state: 유지 / 제외 / 중립 */
export function FieldChip({
  field,
  state = "keep",
  onClick,
  note,
}: {
  field: FieldKey;
  state?: "keep" | "drop" | "plain";
  onClick?: () => void;
  note?: string;
}) {
  const s =
    state === "keep"
      ? { bg: C.greenPale, fg: "#0A7D3E", bd: "#B7E9CC" }
      : state === "drop"
      ? { bg: "#FAFAFA", fg: C.mute, bd: C.border }
      : { bg: C.white, fg: C.text, bd: C.border };

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold ${
        onClick ? "cursor-pointer" : ""
      }`}
      style={{
        background: s.bg,
        color: s.fg,
        border: `1px solid ${s.bd}`,
        textDecoration: state === "drop" ? "line-through" : undefined,
      }}
    >
      {state === "keep" && <Dot />}
      {state === "drop" && <span style={{ color: C.mute }}>✕</span>}
      {FIELDS[field].label}
      {note && (
        <em className="not-italic font-normal" style={{ color: C.mute }}>
          · {note}
        </em>
      )}
    </span>
  );
}

function Dot() {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full"
      style={{ background: C.green }}
    />
  );
}

/** 단디 말풍선 — 화면 안에서 판단 이유를 한 줄로 설명한다 (원칙 1·2) */
export function DandiSays({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "warn";
}) {
  const bd = tone === "warn" ? "#FFD9D9" : "#CCEEDD";
  const bg = tone === "warn" ? C.redPale : C.greenPale;
  return (
    <div
      className="flex gap-3 p-4 rounded-lg"
      style={{ background: bg, border: `1px solid ${bd}` }}
    >
      <DandiMark />
      <p className="text-[13px] leading-relaxed pt-0.5" style={{ color: C.text }}>
        {children}
      </p>
    </div>
  );
}

export function DandiMark({ size = 24 }: { size?: number }) {
  return (
    <span
      className="flex-shrink-0 inline-flex items-center justify-center rounded-md font-extrabold text-white"
      style={{ width: size, height: size, background: C.green, fontSize: size * 0.5 }}
    >
      단
    </span>
  );
}

/** 응답 표. hidden 항목은 마스킹해서 "빠졌다"는 사실 자체를 보여준다. */
export function ResponseTable({
  rows,
  show,
  hide = [],
  showCode = false,
}: {
  rows: Record<string, string | number>[];
  show: FieldKey[];
  hide?: FieldKey[];
  showCode?: boolean;
}) {
  const cols: FieldKey[] = [...show, ...hide];
  return (
    <div className="overflow-x-auto" style={{ border: `1px solid ${C.border}`, borderRadius: 6 }}>
      <table className="w-full text-[13px] whitespace-nowrap">
        <thead>
          <tr style={{ background: "#FAFAFA" }}>
            {showCode && <Th>접수번호</Th>}
            {cols.map((f) => (
              <Th key={f} dim={hide.includes(f)}>
                {FIELDS[f].label}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderTop: `1px solid ${C.line}` }}>
              {showCode && <Td>{r.code}</Td>}
              {cols.map((f) =>
                hide.includes(f) ? (
                  <Td key={f} dim>
                    제외됨
                  </Td>
                ) : (
                  <Td key={f}>{String(r[f] ?? "")}</Td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, dim }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <th
      className="text-left font-bold px-3 py-2.5"
      style={{ color: dim ? C.mute : C.sub, textDecoration: dim ? "line-through" : undefined }}
    >
      {children}
    </th>
  );
}

function Td({ children, dim }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <td
      className="px-3 py-2.5 max-w-[240px] truncate"
      style={{ color: dim ? C.mute : C.text, background: dim ? "#FAFAFA" : undefined }}
    >
      {children}
    </td>
  );
}
