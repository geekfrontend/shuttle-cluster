import { AUTH_CONFIG } from "@/config/auth-config";
import { prisma } from "@/db/client";
import { hashPassword, verifyDummyPassword, verifyPassword } from "@/helpers/password.helper";
import { writeAudit } from "@/server/audit/audit.service";
import { createSession, revokeAllSessions, revokeSession, type Session } from "@/server/auth/session";
import type { RequestMeta } from "@/server/request-meta";
import { ApiError } from "@/utils/api-error";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function login(input: { email: string; password: string }, meta: RequestMeta) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      status: true,
      deletedAt: true,
      lockUntil: true,
      failedLoginAttempts: true,
      mustChangePassword: true,
      role: true,
    },
  });

  if (!user || user.deletedAt || user.status === "deactivated") {
    await verifyDummyPassword(input.password);
    throw ApiError.unauthorized("auth.invalid_credentials");
  }

  const now = new Date();
  if (user.status === "locked" || (user.lockUntil && user.lockUntil > now)) {
    const minutes = user.lockUntil
      ? Math.max(1, Math.ceil((user.lockUntil.getTime() - now.getTime()) / 60_000))
      : LOCK_MINUTES;
    throw ApiError.locked("auth.account_locked", { params: { minutes } });
  }

  if (!(await verifyPassword(input.password, user.passwordHash))) {
    const attempts = user.failedLoginAttempts + 1;
    const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: shouldLock
          ? { failedLoginAttempts: 0, lockUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000) }
          : { failedLoginAttempts: attempts },
      });
      await writeAudit(tx, {
        actorId: user.id,
        action: shouldLock ? "auth.locked" : "auth.login_failed",
        targetType: "user",
        targetId: user.id,
      });
    });
    throw ApiError.unauthorized("auth.invalid_credentials");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockUntil: null, lastActiveAt: now },
    });
    await writeAudit(tx, { actorId: user.id, action: "auth.login", targetType: "user", targetId: user.id });
  });
  const { expiresAt } = await createSession(user.id, meta);

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    mustChangePassword: AUTH_CONFIG.passwordChangeEnabled && user.mustChangePassword,
    expiresAt,
  };
}

export async function logout(session: Session) {
  await revokeSession(session.id);
  await prisma.$transaction(async (tx) => {
    await writeAudit(tx, {
      actorId: session.user.id,
      action: "auth.logout",
      targetType: "user",
      targetId: session.user.id,
    });
  });
}

export async function changePassword(session: Session, input: { currentPassword: string; newPassword: string }) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
    throw ApiError.badRequest("auth.current_password_incorrect", { errors: { currentPassword: ["invalid"] } });
  }
  if (input.currentPassword === input.newPassword) {
    throw ApiError.badRequest("auth.password_reused", { errors: { newPassword: ["reused"] } });
  }

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: session.user.id }, data: { passwordHash, mustChangePassword: false } });
    await writeAudit(tx, {
      actorId: session.user.id,
      action: "auth.password_changed",
      targetType: "user",
      targetId: session.user.id,
    });
  });
  // Session lain (device lain) dicabut; session saat ini tetap berlaku.
  await revokeAllSessions(session.user.id, { exceptSessionId: session.id });
}
