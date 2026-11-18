import { STATUS_CODES } from "@/constants/status-codes";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { type MessageKey, type MessageParams, translate } from "@/lib/i18n/translate";
import { getLocale } from "@/server/i18n";

type SuccessBody<T> = { success: true; code: MessageKey; message: string; statusCode: number; data?: T };
type ErrorBody = { success: false; code: MessageKey; message: string; statusCode: number; errors?: unknown };

// BigInt (uang dalam minor units) tidak bisa di-serialize JSON secara default.
function replacer(_key: string, value: unknown) {
  return typeof value === "bigint" ? value.toString() : value;
}

async function resolveLocale(): Promise<Locale> {
  try {
    return await getLocale();
  } catch {
    return DEFAULT_LOCALE;
  }
}

function json(body: SuccessBody<unknown> | ErrorBody, locale: Locale, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("content-language", locale);
  headers.set("cache-control", "no-store");
  headers.append("vary", "Accept-Language, X-Locale");
  return new Response(JSON.stringify(body, replacer), { ...init, status: body.statusCode, headers });
}

type SuccessOptions = { params?: MessageParams; statusCode?: number; init?: ResponseInit };

/**
 * Envelope respons API. `code` adalah kunci pesan yang stabil (untuk logika klien),
 * `message` adalah terjemahannya sesuai locale request.
 */
export const ApiResponse = {
  async success<T>(code: MessageKey, data?: T, options: SuccessOptions = {}): Promise<Response> {
    const locale = await resolveLocale();
    const statusCode = options.statusCode ?? STATUS_CODES.OK;
    const message = translate(locale, code, options.params);
    return json({ success: true, code, message, statusCode, data }, locale, options.init);
  },

  ok<T>(code: MessageKey, data?: T, options?: Omit<SuccessOptions, "statusCode">): Promise<Response> {
    return ApiResponse.success(code, data, { ...options, statusCode: STATUS_CODES.OK });
  },

  created<T>(code: MessageKey, data?: T, options?: Omit<SuccessOptions, "statusCode">): Promise<Response> {
    return ApiResponse.success(code, data, { ...options, statusCode: STATUS_CODES.CREATED });
  },

  async error(
    code: MessageKey,
    statusCode: number,
    options: { params?: MessageParams; errors?: unknown } = {},
  ): Promise<Response> {
    const locale = await resolveLocale();
    const message = translate(locale, code, options.params);
    return json({ success: false, code, message, statusCode, errors: options.errors }, locale);
  },
};
