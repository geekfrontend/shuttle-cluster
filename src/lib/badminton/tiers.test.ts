import { tierLevel } from "./tiers";
import { expect, test } from "bun:test";

test("maps both eras onto the same five levels", () => {
  expect(tierLevel("HSBC BWF World Tour Super 1000")).toBe(5);
  expect(tierLevel("HSBC BWF World Tour Finals")).toBe(5);
  expect(tierLevel("Grade 1 – Individual Tournaments")).toBe(5);
  expect(tierLevel("World Superseries Premier")).toBe(4);
  expect(tierLevel("HSBC BWF World Tour Super 750")).toBe(4);
  expect(tierLevel("World Superseries")).toBe(3);
  expect(tierLevel("HSBC BWF World Tour Super 500")).toBe(3);
  expect(tierLevel("Grand Prix Gold")).toBe(2);
  expect(tierLevel("HSBC BWF World Tour Super 300")).toBe(2);
  expect(tierLevel("Grand Prix")).toBe(1);
  expect(tierLevel("BWF Tour Super 100")).toBe(1);
});

test("unknown or empty tiers have no level", () => {
  expect(tierLevel(null)).toBeNull();
  expect(tierLevel("")).toBeNull();
  expect(tierLevel("Club championship")).toBeNull();
});
