// 도착 문구 파싱과 시간대 판정은 순수 함수라 React Native 없이 그대로 돌릴 수 있다.
// `npm test` → node 내장 테스트 러너 + 타입 스트리핑.
import assert from "node:assert/strict";
import { test } from "node:test";

import { normalizeServiceKey, parseEtaSeconds } from "../src/api/seoulBus.ts";
import { formatClock, formatEta, formatEtaShort, isWithinSchedule } from "../src/lib/format.ts";

test("전광판 문구에서 남은 초를 읽는다", () => {
  assert.equal(parseEtaSeconds("3분30초후[2번째 전]", 210), 210);
  assert.equal(parseEtaSeconds("12분후[8번째 전]", 0), 720);
  assert.equal(parseEtaSeconds("곧 도착[1번째 전]", 12), 0);
});

test("탈 수 없는 상태는 예측을 비운다", () => {
  assert.equal(parseEtaSeconds("출발대기", 0), null);
  assert.equal(parseEtaSeconds("운행종료", 0), null);
  assert.equal(parseEtaSeconds("", 0), null);
});

test("문구가 없으면 traTime으로 대체한다", () => {
  assert.equal(parseEtaSeconds("", 95), 95);
});

test("남은 시간 표기", () => {
  assert.equal(formatEta(0), "곧 도착");
  assert.equal(formatEta(45), "45초");
  assert.equal(formatEta(210), "3분 30초");
  assert.equal(formatEta(720), "12분");
  assert.equal(formatEta(null), "—");
  assert.equal(formatEtaShort(210), "4분");
  assert.equal(formatEtaShort(20), "곧");
  assert.equal(formatClock(1050), "17:30");
});

test("인코딩된 인증키를 되돌린다", () => {
  assert.equal(normalizeServiceKey("ab%2Bcd%3D%3D"), "ab+cd==");
  assert.equal(normalizeServiceKey("  ab+cd==  "), "ab+cd==");
});

test("평일 17:00~23:00 알림 시간대", () => {
  const schedule = { days: [1, 2, 3, 4, 5], startMinute: 17 * 60, endMinute: 23 * 60 };
  assert.equal(isWithinSchedule(schedule, new Date("2026-08-26T18:30:00")), true); // 수
  assert.equal(isWithinSchedule(schedule, new Date("2026-08-26T09:00:00")), false);
  assert.equal(isWithinSchedule(schedule, new Date("2026-08-29T18:30:00")), false); // 토
});

test("자정을 넘긴 시간대는 시작한 날의 요일로 판정한다", () => {
  const schedule = { days: [5], startMinute: 23 * 60, endMinute: 60 }; // 금 23:00~01:00
  assert.equal(isWithinSchedule(schedule, new Date("2026-08-28T23:30:00")), true); // 금
  assert.equal(isWithinSchedule(schedule, new Date("2026-08-29T00:30:00")), true); // 토 새벽 = 금 퇴근
  assert.equal(isWithinSchedule(schedule, new Date("2026-08-29T02:00:00")), false);
  assert.equal(isWithinSchedule(schedule, new Date("2026-08-30T00:30:00")), false); // 일 새벽 = 토 퇴근
});

test("요일을 하나도 안 고르면 절대 울리지 않는다", () => {
  assert.equal(
    isWithinSchedule({ days: [], startMinute: 0, endMinute: 1439 }, new Date("2026-08-26T18:30:00")),
    false
  );
});
