import { isLocale, LOCALE_HEADER } from "@/lib/i18n/config";

type ApiEnvelope<T> =
  | { success: true; code: string; message: string; statusCode: number; data?: T }
  | { success: false; code: string; message: string; statusCode: number; errors?: unknown };

/** Error dari API: `code` stabil untuk logika, `message` sudah diterjemahkan server. */
export class ApiClientError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly fieldErrors: Record<string, string[]>;

  constructor(code: string, message: string, statusCode: number, errors?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.statusCode = statusCode;
    this.fieldErrors = toFieldErrors(errors);
  }
}

function toFieldErrors(errors: unknown): Record<string, string[]> {
  if (!errors || typeof errors !== "object") return {};
  const result: Record<string, string[]> = {};
  for (const [field, value] of Object.entries(errors)) {
    if (Array.isArray(value)) result[field] = value.filter((item): item is string => typeof item === "string");
  }
  return result;
}

/** Locale UI aktif (dari `<html lang>`), dikirim ke API supaya pesan server sebahasa dengan UI. */
function currentLocale(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const lang = document.documentElement.lang;
  return isLocale(lang) ? lang : undefined;
}

/** Panggil API internal (same-origin, cookie session ikut otomatis). Gagal → ApiClientError. */
export async function apiFetch<T = unknown>(
  path: string,
  options: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown } = {},
): Promise<{ data: T | undefined; message: string; code: string }> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: options.method ?? "GET",
      headers: {
        ...(options.body === undefined ? {} : { "content-type": "application/json" }),
        ...(currentLocale() ? { [LOCALE_HEADER]: currentLocale() } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: "same-origin",
    });
  } catch {
    throw new ApiClientError("error.network", "Network error. Please check your connection.", 0);
  }

  const envelope = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!envelope)
    throw new ApiClientError("error.internal", response.statusText || "Unexpected response", response.status);
  if (!envelope.success) {
    throw new ApiClientError(envelope.code, envelope.message, envelope.statusCode, envelope.errors);
  }
  return { data: envelope.data, message: envelope.message, code: envelope.code };
}

/** Nama file dari `Content-Disposition` (`filename*` UTF-8 diutamakan). */
function fileNameOf(response: Response, fallback: string) {
  const header = response.headers.get("content-disposition") ?? "";
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header);
  // biome-ignore lint/suspicious/noUnnecessaryConditions: `exec` mengembalikan null bila header tidak cocok.
  if (encoded !== null) return decodeURIComponent(encoded[1]);
  const plain = /filename="([^"]+)"/i.exec(header);
  // biome-ignore lint/suspicious/noUnnecessaryConditions: `exec` mengembalikan null bila header tidak cocok.
  return plain === null ? fallback : plain[1];
}

/** Unduh file dari API (mis. laporan). Sukses = badan respons biner; gagal = envelope JSON → ApiClientError. */
export async function apiFile(path: string, fallbackName: string): Promise<{ blob: Blob; fileName: string }> {
  let response: Response;
  try {
    response = await fetch(path, {
      credentials: "same-origin",
      headers: currentLocale() ? { [LOCALE_HEADER]: currentLocale() as string } : undefined,
    });
  } catch {
    throw new ApiClientError("error.network", "Network error. Please check your connection.", 0);
  }
  if (!response.ok) {
    const envelope = (await response.json().catch(() => null)) as ApiEnvelope<unknown> | null;
    if (envelope && !envelope.success) {
      throw new ApiClientError(envelope.code, envelope.message, envelope.statusCode, envelope.errors);
    }
    throw new ApiClientError("error.internal", response.statusText || "Unexpected response", response.status);
  }
  return { blob: await response.blob(), fileName: fileNameOf(response, fallbackName) };
}

/** Tambahkan query string; nilai kosong/undefined dilewati. Daftar dikirim dipisah koma (`status=a,b`). */
export function withQuery(
  path: string,
  params: Record<string, string | number | readonly string[] | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const text = Array.isArray(value) ? value.join(",") : value;
    if (text !== undefined && text !== "") search.set(key, String(text));
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

/** Data wajib ada di respons sukses. */
export async function apiData<T>(path: string, options?: Parameters<typeof apiFetch>[1]): Promise<T> {
  const { data } = await apiFetch<T>(path, options);
  if (data === undefined) throw new ApiClientError("error.internal", "Empty response", 500);
  return data;
}

/** Kirim `FormData` (mis. upload file). Content-Type diisi otomatis oleh browser (multipart boundary). */
export async function apiUpload<T = unknown>(
  path: string,
  form: FormData,
): Promise<{ data: T | undefined; message: string; code: string }> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      body: form,
      credentials: "same-origin",
      headers: currentLocale() ? { [LOCALE_HEADER]: currentLocale() as string } : undefined,
    });
  } catch {
    throw new ApiClientError("error.network", "Network error. Please check your connection.", 0);
  }
  const envelope = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!envelope)
    throw new ApiClientError("error.internal", response.statusText || "Unexpected response", response.status);
  if (!envelope.success)
    throw new ApiClientError(envelope.code, envelope.message, envelope.statusCode, envelope.errors);
  return { data: envelope.data, message: envelope.message, code: envelope.code };
}
