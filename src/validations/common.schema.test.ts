import { z } from "zod";

import { csvListSchema } from "./common.schema";
import { describe, expect, test } from "bun:test";

const schema = z.object({ status: csvListSchema(z.enum(["active", "ended"])) });

describe("csvListSchema", () => {
  test("absent stays undefined", () => {
    expect(schema.parse({})).toEqual({});
  });

  test("splits comma-separated values and trims them", () => {
    expect(schema.parse({ status: "active" })).toEqual({ status: ["active"] });
    expect(schema.parse({ status: "active, ended" })).toEqual({ status: ["active", "ended"] });
  });

  test("rejects unknown values and empty lists", () => {
    expect(schema.safeParse({ status: "active,bogus" }).success).toBe(false);
    expect(schema.safeParse({ status: "," }).success).toBe(false);
  });

  test("documents the query param as a string listing the allowed values", () => {
    const json = z.toJSONSchema(schema, { io: "input", unrepresentable: "any" }) as {
      properties: Record<string, { type?: string; description?: string }>;
    };
    expect(json.properties.status.type).toBe("string");
    expect(json.properties.status.description).toContain("`active`, `ended`");
  });
});
