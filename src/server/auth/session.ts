import { cache } from "react";

import { cookies } from "next/headers";

import { AUTH_CONFIG } from "@/config/auth-config";
import { prisma } from "@/db/client";
import type { UserRole } from "@/generated/prisma/client";
import { generateToken, hashToken } from "@/helpers/token.helper";
import type { RequestMeta } from "@/server/request-meta";
import { ApiError } from "@/utils/api-error";

export const SESSION_COOKIE = "shuttle_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const LAST_ACTIVE_THROTTLE_MS = 5 * 60 * 1000;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  locale: string | null;
  role: UserRole;
  mustChangePassword: boolean;
};

export type Session = { id: string; expiresAt: Date; user: SessionUser };

async function setSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function createSession(userId: string, meta: RequestMeta): Promise<{ expiresAt: Date }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({
    data: { userId, tokenHash: hashToken(token), expiresAt, ip: meta.ip, userAgent: meta.userAgent },
  });
  await setSessionCookie(token, expiresAt);
  return { expiresAt };
}

/** Session aktif dari cookie, atau null. Di-cache per request. */
export const getSession = cache(async (): Promise<Session | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      expiresAt: true,
      revokedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          locale: true,
          role: true,
          mustChangePassword: true,
          status: true,
          deletedAt: true,
          lastActiveAt: true,
        },
      },
    },
  });

  const now = new Date();
  if (!session || session.revokedAt || session.expiresAt <= now) return null;

  const { user } = session;
  if (user.deletedAt || user.status !== "active") return null;

  if (!user.lastActiveAt || now.getTime() - user.lastActiveAt.getTime() > LAST_ACTIVE_THROTTLE_MS) {
    await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: now } });
  }

  return {
    id: session.id,
    expiresAt: session.expiresAt,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      locale: user.locale,
      role: user.role,
      // Selama fitur ganti password nonaktif, flag di DB diabaikan (tidak ada paksaan ganti password).
      mustChangePassword: AUTH_CONFIG.passwordChangeEnabled && user.mustChangePassword,
    },
  };
});

/**
 * 401 tanpa session. Selama user wajib ganti password, semua endpoint
 * selain yang diizinkan (`allowPasswordChangePending`) mengembalikan 403.
 */
export async function requireSession(options: { allowPasswordChangePending?: boolean } = {}): Promise<Session> {
  const session = await getSession();
  if (!session) throw ApiError.unauthorized("auth.authentication_required");

  if (session.user.mustChangePassword && !options.allowPasswordChangePending) {
    throw ApiError.forbidden("auth.password_change_required");
  }
  return session;
}

/** Seperti `requireSession`, ditambah 403 jika user bukan admin. */
export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  if (session.user.role !== "admin") throw ApiError.forbidden("auth.admin_required");
  return session;
}

/** Rotasi token dan perpanjang masa berlaku session. */
export async function refreshSession(session: Session): Promise<{ expiresAt: Date }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.update({ where: { id: session.id }, data: { tokenHash: hashToken(token), expiresAt } });
  await setSessionCookie(token, expiresAt);
  return { expiresAt };
}

export async function revokeSession(sessionId: string) {
  await prisma.session.updateMany({ where: { id: sessionId, revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function revokeAllSessions(userId: string, options: { exceptSessionId?: string } = {}) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null, id: options.exceptSessionId ? { not: options.exceptSessionId } : undefined },
    data: { revokedAt: new Date() },
  });
}
