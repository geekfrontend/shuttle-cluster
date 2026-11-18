import { z } from "zod";

import { STATUS_CODES } from "@/constants/status-codes";
import { Prisma } from "@/generated/prisma/client";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { validationErrors } from "@/lib/i18n/translate";
import { getLocale } from "@/server/i18n";

import { ApiError } from "./api-error";
import { ApiResponse } from "./api-response";
import { logger } from "./logger";

export async function handleError(error: unknown): Promise<Response> {
  if (error instanceof ApiError) {
    return ApiResponse.error(error.code, error.statusCode, { params: error.params, errors: error.errors });
  }

  if (error instanceof z.ZodError) {
    // ZodError yang lolos tanpa `validateRequest`: tetap diformat dalam locale request.
    const locale = await getLocale().catch(() => DEFAULT_LOCALE);
    return ApiResponse.error("error.validation_failed", STATUS_CODES.BAD_REQUEST, {
      errors: validationErrors(error, locale),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return ApiResponse.error("error.already_exists", STATUS_CODES.CONFLICT, {
        errors: { target: error.meta?.target },
      });
    }
    if (error.code === "P2025") {
      return ApiResponse.error("error.not_found", STATUS_CODES.NOT_FOUND);
    }
  }

  if (isConnectionError(error)) {
    // Koneksi database lewat WebSocket (Neon) bisa putus sesaat; klien sebaiknya mencoba lagi, bukan
    // menampilkan "kesalahan internal" yang terdengar permanen.
    logger.error("Database connection error", { error: describeError(error) });
    return ApiResponse.error("error.unavailable", STATUS_CODES.SERVICE_UNAVAILABLE);
  }

  logger.error("Unhandled API error", { error: describeError(error) });
  return ApiResponse.error("error.internal", STATUS_CODES.INTERNAL_SERVER_ERROR);
}

/**
 * Ringkasan error yang bisa dibaca di log. Nilai yang dilempar tidak selalu `Error`: driver Neon melempar
 * `ErrorEvent` dari WebSocket, yang kalau di-`String()` hanya menjadi "[object ErrorEvent]" tanpa petunjuk
 * apa pun. Bentuk seperti itu dibongkar isinya, termasuk `cause`/`error` di dalamnya.
 */
export function describeError(error: unknown, depth = 0): unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error.cause !== undefined && depth < 2 ? { cause: describeError(error.cause, depth + 1) } : {}),
    };
  }
  if (error && typeof error === "object") {
    const event = error as { type?: unknown; message?: unknown; error?: unknown; code?: unknown };
    const fields = {
      kind: Object.prototype.toString.call(error).slice(8, -1),
      ...(typeof event.type === "string" ? { type: event.type } : {}),
      ...(typeof event.message === "string" ? { message: event.message } : {}),
      ...(typeof event.code === "string" ? { code: event.code } : {}),
      ...(event.error !== undefined && depth < 2 ? { error: describeError(event.error, depth + 1) } : {}),
    };
    // Objek tanpa satu pun field yang dikenal: tidak ada gunanya, kembalikan bentuk teksnya saja.
    return Object.keys(fields).length > 1 ? fields : String(error);
  }
  return String(error);
}

/** Kegagalan menghubungi database (WebSocket putus, koneksi ditolak), bukan kesalahan logika aplikasi. */
export function isConnectionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (!error || typeof error !== "object") return false;
  const event = error as { type?: unknown; constructor?: { name?: string } };
  if (event.constructor?.name === "ErrorEvent" || event.type === "error") return true;
  const message = error instanceof Error ? error.message : "";
  return /ECONNRESET|ECONNREFUSED|ETIMEDOUT|socket hang up|Connection terminated/i.test(message);
}
