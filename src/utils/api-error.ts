import { STATUS_CODES } from "@/constants/status-codes";
import type { MessageKey, MessageParams } from "@/lib/i18n/translate";

type ApiErrorOptions = {
  /** Nilai untuk placeholder `{name}` di pesan terjemahan. */
  params?: MessageParams;
  /** Detail tambahan yang dikirim ke klien (mis. error per field). */
  errors?: unknown;
};

/**
 * Error API membawa kunci pesan, bukan teks. Pesan diterjemahkan saat response dibuat
 * sesuai locale request, dan kunci dikirim sebagai `code` yang stabil untuk klien.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: MessageKey;
  readonly params?: MessageParams;
  readonly errors?: unknown;

  constructor(statusCode: number, code: MessageKey, options: ApiErrorOptions = {}) {
    super(code);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.params = options.params;
    this.errors = options.errors;
  }

  static badRequest(code: MessageKey = "error.bad_request", options?: ApiErrorOptions) {
    return new ApiError(STATUS_CODES.BAD_REQUEST, code, options);
  }

  static unauthorized(code: MessageKey = "error.unauthorized", options?: ApiErrorOptions) {
    return new ApiError(STATUS_CODES.UNAUTHORIZED, code, options);
  }

  static forbidden(code: MessageKey = "error.forbidden", options?: ApiErrorOptions) {
    return new ApiError(STATUS_CODES.FORBIDDEN, code, options);
  }

  static notFound(code: MessageKey = "error.not_found", options?: ApiErrorOptions) {
    return new ApiError(STATUS_CODES.NOT_FOUND, code, options);
  }

  static conflict(code: MessageKey = "error.conflict", options?: ApiErrorOptions) {
    return new ApiError(STATUS_CODES.CONFLICT, code, options);
  }

  static locked(code: MessageKey = "error.locked", options?: ApiErrorOptions) {
    return new ApiError(STATUS_CODES.LOCKED, code, options);
  }

  static tooManyRequests(code: MessageKey = "error.too_many_requests", options?: ApiErrorOptions) {
    return new ApiError(STATUS_CODES.TOO_MANY_REQUESTS, code, options);
  }

  static unavailable(code: MessageKey = "error.unavailable", options?: ApiErrorOptions) {
    return new ApiError(STATUS_CODES.SERVICE_UNAVAILABLE, code, options);
  }

  static server(code: MessageKey = "error.internal", options?: ApiErrorOptions) {
    return new ApiError(STATUS_CODES.INTERNAL_SERVER_ERROR, code, options);
  }
}
