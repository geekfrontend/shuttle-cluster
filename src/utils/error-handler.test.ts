import { describeError, isConnectionError } from "./error-handler";
import { describe, expect, test } from "bun:test";

/** Nilai yang dilempar driver Neon bukan `Error`, jadi log harus tetap memuat isinya. */
class FakeErrorEvent {
  type = "error";
  message = "socket closed unexpectedly";
  error = new Error("ws failure");
}

describe("describeError", () => {
  test("membongkar Error beserta penyebabnya", () => {
    const error = new Error("gagal", { cause: new Error("penyebab") });
    const result = describeError(error) as { message: string; cause: { message: string } };
    expect(result.message).toBe("gagal");
    expect(result.cause.message).toBe("penyebab");
  });

  test("membongkar objek mirip ErrorEvent, bukan '[object ErrorEvent]'", () => {
    const result = describeError(new FakeErrorEvent()) as { message: string; error: { message: string } };
    expect(result.message).toBe("socket closed unexpectedly");
    expect(result.error.message).toBe("ws failure");
  });

  test("objek tanpa field yang dikenal jatuh ke bentuk teks", () => {
    expect(describeError({ foo: 1 })).toBe("[object Object]");
  });
});

describe("isConnectionError", () => {
  test("mengenali event error WebSocket", () => {
    expect(isConnectionError(new FakeErrorEvent())).toBe(true);
  });

  test("mengenali koneksi yang terputus dari pesannya", () => {
    expect(isConnectionError(new Error("socket hang up"))).toBe(true);
    expect(isConnectionError(new Error("ECONNRESET while reading"))).toBe(true);
  });

  test("tidak menganggap error biasa sebagai masalah koneksi", () => {
    expect(isConnectionError(new Error("nama wajib diisi"))).toBe(false);
  });
});
