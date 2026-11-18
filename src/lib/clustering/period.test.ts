import { defaultPeriod, matchingPreset, periodPresets, presetPeriod } from "./period";
import { describe, expect, test } from "bun:test";

const RANGE = { first: "2007-01-16", last: "2026-07-05" };

describe("presetPeriod", () => {
  test("last N months end at the latest data, not today", () => {
    expect(presetPeriod({ kind: "months", months: 12 }, RANGE)).toEqual({ from: "2025-07-06", to: "2026-07-05" });
    expect(presetPeriod({ kind: "months", months: 6 }, RANGE)).toEqual({ from: "2026-01-06", to: "2026-07-05" });
  });

  test("a year is clipped to the available data", () => {
    expect(presetPeriod({ kind: "year", year: 2025 }, RANGE)).toEqual({ from: "2025-01-01", to: "2025-12-31" });
    expect(presetPeriod({ kind: "year", year: 2026 }, RANGE)).toEqual({ from: "2026-01-01", to: "2026-07-05" });
    expect(presetPeriod({ kind: "year", year: 2007 }, RANGE)).toEqual({ from: "2007-01-16", to: "2007-12-31" });
  });

  test("month arithmetic stays inside short months", () => {
    expect(presetPeriod({ kind: "months", months: 1 }, { first: "2020-01-01", last: "2024-03-31" })).toEqual({
      from: "2024-03-01",
      to: "2024-03-31",
    });
  });

  test("never starts before the first data", () => {
    expect(presetPeriod({ kind: "months", months: 24 }, { first: "2025-03-01", last: "2026-07-05" })).toEqual({
      from: "2025-03-01",
      to: "2026-07-05",
    });
  });
});

test("periodPresets lists recent months, then years from newest", () => {
  const presets = periodPresets({ first: "2024-02-01", last: "2026-07-05" });
  expect(presets).toEqual([
    { kind: "months", months: 6 },
    { kind: "months", months: 12 },
    { kind: "months", months: 24 },
    { kind: "year", year: 2026 },
    { kind: "year", year: 2025 },
    { kind: "year", year: 2024 },
  ]);
});

test("default is the last 24 months and is recognised as a preset", () => {
  const period = defaultPeriod(RANGE);
  expect(period).toEqual({ from: "2024-07-06", to: "2026-07-05" });
  expect(matchingPreset(period, RANGE)).toEqual({ kind: "months", months: 24 });
  expect(matchingPreset({ from: "2024-02-03", to: "2024-05-01" }, RANGE)).toBeNull();
});
