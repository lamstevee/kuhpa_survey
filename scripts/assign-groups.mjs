#!/usr/bin/env node
// KUHPA 신입 학회원 조 편성
// responses/*.json 을 읽어 top 역할이 겹치지 않게 조를 나눈다.
//
// 사용법:
//   node scripts/assign-groups.mjs [--groups=N]
//   node scripts/assign-groups.mjs --selftest
//
// 알고리즘: top 역할 기준으로 정렬 후 라운드로빈(i % G)으로 배치한다.
// (80줄짜리 그리디 최적화안이 실측 시뮬레이션에서 이 5줄보다 더 나빴다 —
//  margin 정렬은 역할과 무관한 축이라 같은 역할을 흩어놓지 못했다.)

import { readdirSync, readFileSync } from "node:fs";

const DIMS = ["R", "I", "A", "S", "E", "C"];
const ROLE_NAMES = { R: "연결가", I: "분석가", A: "이론가", S: "조율가", E: "비평가", C: "정리가" };

// questionPool.ts의 15문항과 1:1 대응 — [문항id, A선택 시 역할, B선택 시 역할]
// 동점 시 "직접 대결" 문항의 승자로 tie-break 한다 (C(6,2)=15라 모든 쌍이 정확히 1번 대결한다).
const HEAD_TO_HEAD = [
  [1, "R", "I"], [2, "R", "A"], [3, "R", "S"], [4, "R", "E"], [5, "R", "C"],
  [6, "I", "A"], [7, "I", "S"], [8, "I", "E"], [9, "I", "C"],
  [10, "A", "S"], [11, "A", "E"], [12, "A", "C"],
  [13, "S", "E"], [14, "S", "C"],
  [15, "E", "C"],
];

function headToHeadWinner(dimX, dimY, riasecAnswers) {
  const row = HEAD_TO_HEAD.find(([, a, b]) => (a === dimX && b === dimY) || (a === dimY && b === dimX));
  if (!row || !riasecAnswers) return null;
  const [id, a, b] = row;
  const choice = riasecAnswers[id] ?? riasecAnswers[String(id)];
  if (choice !== "A" && choice !== "B") return null;
  return choice === "A" ? a : b;
}

// top 역할 산출. 동점 37.5% 실측 — 반드시 해소해야 조 편성이 의미가 있다.
export function resolveTopRole(scores, riasecAnswers) {
  const max = Math.max(...DIMS.map((d) => scores[d] ?? 0));
  const tied = DIMS.filter((d) => (scores[d] ?? 0) === max);
  if (tied.length === 1) return tied[0];
  if (tied.length === 2) {
    const winner = headToHeadWinner(tied[0], tied[1], riasecAnswers);
    if (winner) return winner;
  }
  // 3인 이상 순환 동점, 또는 대결 문항 응답 누락: 고정 순서(알파벳순) fallback — 항상 결정론적.
  return [...tied].sort()[0];
}

// 라운드로빈 조 편성 (핵심 로직, 5줄)
export function assign(people, groupCount) {
  const G = groupCount ?? Math.max(1, Math.ceil(people.length / 6));
  const sorted = [...people].sort((a, b) => a.top.localeCompare(b.top) || a.name.localeCompare(b.name));
  const groups = Array.from({ length: G }, () => []);
  sorted.forEach((p, i) => groups[i % G].push(p));
  return groups;
}

function loadResponses(dir = "responses") {
  let files;
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  const byCode = new Map(); // code 기준 dedupe — 재제출/중복 저장 방어
  for (const file of files) {
    let record;
    try {
      record = JSON.parse(readFileSync(`${dir}/${file}`, "utf-8"));
    } catch (e) {
      console.error(`[assign-groups] ${file} 읽기 실패, 건너뜀:`, e.message);
      continue;
    }
    const opts = record.options ?? {};
    if (!opts.riasecScores) {
      console.error(`[assign-groups] ${file}: riasecScores 없음, 건너뜀`);
      continue;
    }
    const code = record.code ?? file;
    const existing = byCode.get(code);
    // 파일명 접두사(Date.now())가 실제 저장 시각이므로 이걸로 최신 판단
    if (!existing || file > existing.file) {
      byCode.set(code, { file, record, opts });
    }
  }
  return [...byCode.values()].map(({ opts }, i) => ({
    name: opts.name || `참가자${i + 1}`,
    top: resolveTopRole(opts.riasecScores, opts.riasecAnswers),
    fields: opts.interestedFields ?? [],
  }));
}

function printGroups(groups) {
  groups.forEach((g, i) => {
    console.log(`\n[조 ${i + 1}] (${g.length}명)`);
    g.forEach((p) => console.log(`  ${p.name.padEnd(8)} ${ROLE_NAMES[p.top]}(${p.top})`));
    const roles = new Set(g.map((p) => p.top));
    if (roles.size < Math.min(6, g.length)) {
      console.log(`  ⚠ 역할 중복 있음 (겹치는 역할 수: ${g.length - roles.size})`);
    }
  });
}

function selftest() {
  const mk = (name, top) => ({ name, top });

  // 1) 균형: 18명 = 6역할 × 3명 → 3조, 각 조에 6역할이 정확히 1개씩
  const p18 = DIMS.flatMap((d) => [0, 1, 2].map((i) => mk(`${d}${i}`, d)));
  const g18 = assign(p18, 3);
  console.assert(g18.length === 3, "18명 → 3조여야 함");
  g18.forEach((g) => {
    console.assert(g.length === 6, "조 크기는 6이어야 함");
    console.assert(new Set(g.map((p) => p.top)).size === 6, "조마다 6역할이 정확히 1개씩이어야 함");
  });

  // 2) 동점 처리: 직접대결 문항(id=1, R vs I)에서 A를 고르면 R이 이겨야 함
  console.assert(resolveTopRole({ R: 3, I: 3, A: 0, S: 0, E: 0, C: 0 }, { 1: "A" }) === "R", "직접대결 승자는 R");
  console.assert(resolveTopRole({ R: 3, I: 3, A: 0, S: 0, E: 0, C: 0 }, { 1: "B" }) === "I", "직접대결 승자는 I");
  // 3인 이상 순환/응답없음 → 결정론적 fallback(알파벳순)
  console.assert(resolveTopRole({ R: 3, I: 3, A: 3, S: 0, E: 0, C: 0 }, {}) === "A", "3인 동점은 알파벳순 fallback");

  // 3) 결정론: 같은 입력 → 같은 출력 (readdir 순서 등에 흔들리면 안 됨)
  const a = JSON.stringify(assign(p18, 3));
  const b = JSON.stringify(assign(p18, 3));
  console.assert(a === b, "같은 입력은 항상 같은 조 편성을 내야 함");

  // 4) 비배수: 25명, 역할 편중 (I가 10명, 나머지 15명 고르게) → 조별 인원차 ≤1
  const p25 = [
    ...Array.from({ length: 10 }, (_, i) => mk(`I${i}`, "I")),
    ...DIMS.filter((d) => d !== "I").flatMap((d) => [0, 1, 2].map((i) => mk(`${d}${i}`, d))),
  ];
  console.assert(p25.length === 25, "25명 준비 확인");
  const g25 = assign(p25); // groupCount 미지정 → ceil(25/6) = 5
  console.assert(g25.length === 5, "25명 → 5조");
  const sizes = g25.map((g) => g.length).sort((x, y) => x - y);
  console.assert(sizes[sizes.length - 1] - sizes[0] <= 1, `조별 인원차 ≤1이어야 함 (실제: ${sizes})`);
  console.assert(g25.flat().length === 25, "인원 보존");

  console.log("selftest OK");
}

const args = process.argv.slice(2);
if (args.includes("--selftest")) {
  selftest();
} else {
  const groupsArg = args.find((a) => a.startsWith("--groups="));
  const groupCount = groupsArg ? parseInt(groupsArg.split("=")[1], 10) : undefined;

  const people = loadResponses();
  if (people.length === 0) {
    console.error("responses/ 폴더에 유효한 응답이 없습니다. 검사를 먼저 진행해 주세요.");
    process.exit(1);
  }
  console.log(`총 ${people.length}명의 응답을 읽었습니다.`);
  const groups = assign(people, groupCount);
  printGroups(groups);
}
