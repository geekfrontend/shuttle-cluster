import { CATEGORIES } from "./categories";
import { entryKey, evaluateMatch, gameWinner, isValidSide, slotGenders } from "./match-rules";
import { describe, expect, test } from "bun:test";

const category = (code: string) => CATEGORIES.find((item) => item.code === code) ?? CATEGORIES[0];
const g = (scoreA: number, scoreB: number) => ({ scoreA, scoreB });

describe("gameWinner", () => {
  test("21 with a two-point lead finishes the game", () => {
    expect(gameWinner(g(21, 15))).toBe("a");
    expect(gameWinner(g(19, 21))).toBe("b");
  });

  test("deuce needs a two-point lead, capped at 30", () => {
    expect(gameWinner(g(21, 20))).toBeNull();
    expect(gameWinner(g(22, 20))).toBe("a");
    expect(gameWinner(g(30, 29))).toBe("a");
    expect(gameWinner(g(29, 28))).toBeNull();
    expect(gameWinner(g(31, 29))).toBeNull();
  });

  test("unfinished or impossible scores have no winner", () => {
    expect(gameWinner(g(18, 15))).toBeNull();
    expect(gameWinner(g(25, 15))).toBeNull();
  });
});

describe("evaluateMatch", () => {
  test("two straight games", () => {
    expect(evaluateMatch([g(21, 15), g(21, 18)])).toEqual({ ok: true, winner: "a" });
  });

  test("rubber game decides a 1-1 match", () => {
    expect(evaluateMatch([g(21, 15), g(18, 21), g(19, 21)])).toEqual({ ok: true, winner: "b" });
  });

  test("a third game after 2-0 is rejected", () => {
    expect(evaluateMatch([g(21, 15), g(21, 18), g(21, 10)])).toEqual({ ok: false, error: { code: "extra_game" } });
  });

  test("1-1 without a third game is incomplete", () => {
    expect(evaluateMatch([g(21, 15), g(18, 21)])).toEqual({ ok: false, error: { code: "too_few_games" } });
  });

  test("points the game, not the match, for an invalid score", () => {
    expect(evaluateMatch([g(21, 15), g(21, 20)])).toEqual({ ok: false, error: { code: "game_invalid", game: 2 } });
  });

  test("retired match accepts an unfinished last game but needs a winner", () => {
    expect(evaluateMatch([g(21, 15), g(11, 4)], { retired: true })).toEqual({
      ok: false,
      error: { code: "winner_required" },
    });
    expect(evaluateMatch([g(21, 15), g(11, 4)], { retired: true, winner: "a" })).toEqual({ ok: true, winner: "a" });
    expect(evaluateMatch([], { retired: true, winner: "b" })).toEqual({ ok: true, winner: "b" });
  });
});

describe("isValidSide", () => {
  test("singles need one player of the category gender", () => {
    expect(isValidSide(category("MS"), ["male"])).toBe(true);
    expect(isValidSide(category("MS"), ["female"])).toBe(false);
    expect(isValidSide(category("WS"), ["female", "female"])).toBe(false);
  });

  test("mixed doubles need one man and one woman", () => {
    expect(isValidSide(category("XD"), ["female", "male"])).toBe(true);
    expect(isValidSide(category("XD"), ["male", "male"])).toBe(false);
    expect(slotGenders(category("XD"))).toEqual(["male", "female"]);
  });
});

test("entryKey ignores player order", () => {
  expect(entryKey("MD", ["b", "a"])).toBe(entryKey("MD", ["a", "b"]));
});
