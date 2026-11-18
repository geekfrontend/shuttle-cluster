import { getInitials } from "./utils";
import { describe, expect, test } from "bun:test";

describe("getInitials", () => {
  test("first and last word", () => {
    expect(getInitials("Viktor AXELSEN")).toBe("VA");
    expect(getInitials("Anthony Sinisuka GINTING")).toBe("AG");
  });

  test("long names stay two letters", () => {
    expect(getInitials("A R Rohan Kumar ANANDAS RAJ KUMAR")).toBe("AK");
  });

  test("punctuation is skipped", () => {
    expect(getInitials("(CJ) YULIANTI")).toBe("CY");
    expect(getInitials("- HANTORO")).toBe("H");
    expect(getInitials("A.CHAIYUNG Panaphol")).toBe("AP");
  });

  test("single word and empty input", () => {
    expect(getInitials("  admin ")).toBe("A");
    expect(getInitials("   ")).toBe("?");
  });
});
