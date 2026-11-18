import { getEnv } from "@/configs/env";

import { createHmac, randomBytes } from "node:crypto";

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Yang disimpan di DB hanya HMAC token, sehingga bocornya tabel sessions tidak memberi token yang valid. */
export function hashToken(token: string): string {
  return createHmac("sha256", getEnv().SESSION_SECRET).update(token).digest("hex");
}
