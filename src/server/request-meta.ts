import { headers } from "next/headers";

export type RequestMeta = { ip: string | null; userAgent: string | null };

export async function getRequestMeta(): Promise<RequestMeta> {
  const list = await headers();
  const forwarded = list.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ip: forwarded || list.get("x-real-ip"),
    userAgent: list.get("user-agent"),
  };
}
