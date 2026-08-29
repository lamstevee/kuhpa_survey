export const colors = {
  bg: "#0E1116",
  surface: "#171C24",
  surfaceAlt: "#1F2630",
  border: "#2A323E",
  text: "#F2F5F9",
  textDim: "#93A0B4",
  textFaint: "#5F6C80",
  accent: "#4C8DFF",
  accentSoft: "#1B2C4A",
  soon: "#FF7A59",
  ok: "#38D39F",
  warn: "#F5B546",
  danger: "#FF6B6B",
};

/** 서울 버스 노선 유형별 색 — 실제 차량 도색과 같게 맞췄다. */
const ROUTE_COLORS: Record<string, string> = {
  간선: "#2F6BD8",
  지선: "#4C9A2A",
  마을: "#53B332",
  순환: "#F99D1C",
  광역: "#C4262E",
  공항: "#0F9D9D",
  인천: "#2F6BD8",
  경기: "#2F6BD8",
};

export function routeColor(routeType: string): string {
  return ROUTE_COLORS[routeType] ?? "#5A6B84";
}

/** 남은 시간에 따라 "뛰어야 하나"를 색으로. */
export function etaColor(seconds: number | null): string {
  if (seconds == null) return colors.textFaint;
  if (seconds <= 90) return colors.soon;
  if (seconds <= 240) return colors.warn;
  return colors.ok;
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };
