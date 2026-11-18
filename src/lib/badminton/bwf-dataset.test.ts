import {
  type BwfMatch,
  checkSides,
  displayName,
  inferGenders,
  parseBwfRow,
  parseBwfScore,
  toBwfRows,
} from "./bwf-dataset";
import { describe, expect, test } from "bun:test";

const HEADER = [
  "date",
  "discipline",
  "tournament",
  "tier",
  "round",
  "host_location",
  "team1",
  "team2",
  "winner",
  "score",
];

function row(overrides: Record<string, string> = {}) {
  return {
    date: "2024-06-09",
    discipline: "MS",
    tournament: "Indonesia Open 2024",
    tier: "HSBC BWF World Tour Super 1000",
    round: "Final",
    team1: "Viktor AXELSEN",
    team2: "Anthony Sinisuka GINTING",
    winner: "1",
    score: "21-18 19-21 21-17",
    ...overrides,
  };
}

function parsed(overrides: Record<string, string> = {}): BwfMatch {
  const result = parseBwfRow(row(overrides));
  if (!result.ok) throw new Error(result.reason);
  return result.match;
}

describe("toBwfRows", () => {
  test("maps cells by header", () => {
    const [first] = toBwfRows([HEADER, ["2024-06-09", "MS", "X", "T", "R32", "Indonesia", "A", "B", "1", "21-1 21-2"]]);
    expect(first?.team2).toBe("B");
  });

  test("rejects a file without the required columns", () => {
    expect(() => toBwfRows([["date", "team1"]])).toThrow("Missing columns");
  });
});

describe("parseBwfRow", () => {
  test("finished match", () => {
    const match = parsed();
    expect(match.winner).toBe("a");
    expect(match.retired).toBe(false);
    expect(match.games).toHaveLength(3);
    expect(match.qualification).toBe(false);
  });

  test("unfinished score becomes a retired match with the dataset winner", () => {
    const match = parsed({ score: "21-11 17-21 3-11", winner: "1" });
    expect(match.retired).toBe(true);
    expect(match.winner).toBe("a");
  });

  test("doubles sides are split on ' / '", () => {
    expect(parsed({ discipline: "XD", team1: "A / B", team2: "C / D" }).sides).toEqual([
      ["A", "B"],
      ["C", "D"],
    ]);
  });

  test("qualification rounds are flagged", () => {
    expect(parsed({ round: "Q Qual. R32" }).qualification).toBe(true);
  });

  test("skips experimental 5x11 scoring and impossible scores", () => {
    expect(parseBwfRow(row({ score: "11-8 7-11 11-7 11-9" }))).toEqual({ ok: false, reason: "experimental_scoring" });
    expect(parseBwfRow(row({ score: "11-7 11-4 11-3" }))).toEqual({ ok: false, reason: "experimental_scoring" });
    expect(parseBwfRow(row({ score: "12-10 12-10 3-3" }))).toEqual({ ok: false, reason: "experimental_scoring" });
    // Satu game belum selesai di format 21 poin tetap dianggap retired, bukan format percobaan.
    expect(parsed({ score: "12-10" }).retired).toBe(true);
    expect(parseBwfRow(row({ score: "21-15 21-18 21-10" }))).toEqual({ ok: false, reason: "invalid_score" });
    expect(parseBwfRow(row({ score: "21-15 21-18", winner: "2" }))).toEqual({ ok: false, reason: "winner_mismatch" });
  });

  test("rejects malformed rows", () => {
    expect(parseBwfRow(row({ discipline: "XX" }))).toEqual({ ok: false, reason: "invalid_row" });
    expect(parseBwfRow(row({ discipline: "MD", team1: "A" }))).toEqual({ ok: false, reason: "invalid_row" });
    expect(parseBwfRow(row({ team2: "Viktor AXELSEN" }))).toEqual({ ok: false, reason: "same_player" });
  });
});

test("parseBwfScore", () => {
  expect(parseBwfScore("21-15 17-21")).toEqual([
    { scoreA: 21, scoreB: 15 },
    { scoreA: 17, scoreB: 21 },
  ]);
  expect(parseBwfScore("")).toEqual([]);
  expect(parseBwfScore("21:15")).toBeNull();
});

test("displayName drops the disambiguation suffix", () => {
  expect(displayName("LEE Hyun Il [52731]")).toBe("LEE Hyun Il");
  expect(displayName("LEE Hyun Il")).toBe("LEE Hyun Il");
  expect(displayName(". CAROLINE")).toBe("CAROLINE");
  expect(displayName("- HANTORO")).toBe("HANTORO");
});

describe("inferGenders", () => {
  test("from discipline, then mixed-doubles partners", () => {
    const matches = [
      parsed({ discipline: "MS", team1: "M1", team2: "M2" }),
      parsed({ discipline: "WS", team1: "W1", team2: "W2" }),
      // W1 sudah diketahui putri → X1 putra; M2 putra → X2 putri.
      parsed({ discipline: "XD", team1: "W1 / X1", team2: "X2 / M2", score: "21-10 21-10" }),
    ];
    const { genders, conflicts } = inferGenders(matches);
    expect(genders.get("X1")).toBe("male");
    expect(genders.get("X2")).toBe("female");
    expect(conflicts).toEqual([]);
    expect(checkSides(matches[2] as BwfMatch, genders)).toBeNull();
  });

  test("known genders win and conflicts are reported", () => {
    const matches = [
      parsed({ discipline: "MS", team1: "P", team2: "M2" }),
      parsed({ discipline: "WS", team1: "P", team2: "W2" }),
    ];
    const { genders, conflicts } = inferGenders(matches, new Map([["P", "female"]]));
    expect(genders.get("P")).toBe("female");
    expect(conflicts).toEqual(["P"]);
  });

  test("mixed-doubles pairs with no known player stay unknown", () => {
    const match = parsed({ discipline: "XD", team1: "A / B", team2: "C / D" });
    const { genders } = inferGenders([match]);
    expect(checkSides(match, genders)).toBe("unknown_gender");
  });
});
