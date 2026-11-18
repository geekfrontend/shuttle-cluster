import { prisma, type Tx } from "@/db/client";
import { anyOf } from "@/db/where";
import type { Prisma, UserRole, UserStatus } from "@/generated/prisma/client";
import { hashPassword } from "@/helpers/password.helper";
import { type Pagination, toPage, toSkipTake } from "@/lib/pagination";
import { writeAudit } from "@/server/audit/audit.service";
import { revokeAllSessions, type Session } from "@/server/auth/session";
import { ApiError } from "@/utils/api-error";

// Kelola pengguna — hanya admin (`requireAdmin` di route handler).

const userSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  role: true,
  status: true,
  lastActiveAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

type UserFilter = { q?: string; role?: UserRole[]; status?: UserStatus[] };

export async function listUsers(pagination: Pagination, filter: UserFilter) {
  const where = {
    deletedAt: null,
    role: anyOf(filter.role),
    status: anyOf(filter.status),
    ...(filter.q
      ? {
          OR: [
            { name: { contains: filter.q, mode: "insensitive" as const } },
            { email: { contains: filter.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  } satisfies Prisma.UserWhereInput;

  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, select: userSelect, orderBy: { name: "asc" }, ...toSkipTake(pagination) }),
    prisma.user.count({ where }),
  ]);
  return toPage(items, total, pagination);
}

/** Akun baru dengan password awal. Tidak ada register publik; hanya admin yang membuat akun. */
export async function createUser(
  actor: Session,
  input: { email: string; name: string; password: string; role: UserRole },
) {
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) throw ApiError.conflict("users.email_taken");

  const passwordHash = await hashPassword(input.password);
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: input.email, name: input.name, role: input.role, passwordHash, mustChangePassword: true },
      select: userSelect,
    });
    await writeAudit(tx, {
      actorId: actor.user.id,
      action: "users.create",
      targetType: "user",
      targetId: user.id,
      after: { email: user.email, name: user.name, role: user.role },
    });
    return user;
  });
}

async function findUser(db: Tx, userId: string) {
  const user = await db.user.findFirst({ where: { id: userId, deletedAt: null }, select: userSelect });
  if (!user) throw ApiError.notFound("users.not_found");
  return user;
}

/** Minimal satu admin aktif harus tersisa, supaya pengelolaan pengguna tidak terkunci. */
async function assertNotLastAdmin(db: Tx, userId: string) {
  const others = await db.user.count({
    where: { id: { not: userId }, role: "admin", status: "active", deletedAt: null },
  });
  if (others === 0) throw ApiError.conflict("users.last_admin");
}

export async function updateUser(
  actor: Session,
  userId: string,
  input: { name?: string; role?: UserRole; status?: "active" | "deactivated" },
) {
  const isSelf = userId === actor.user.id;
  // Role & status sendiri tidak diubah di sini, supaya admin tidak mengunci dirinya sendiri.
  if (isSelf && (input.role !== undefined || input.status !== undefined)) {
    throw ApiError.forbidden("users.cannot_modify_self");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const before = await findUser(tx, userId);
    const losesAdmin =
      before.role === "admin" &&
      before.status === "active" &&
      ((input.role !== undefined && input.role !== "admin") || input.status === "deactivated");
    if (losesAdmin) await assertNotLastAdmin(tx, userId);

    const user = await tx.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        role: input.role,
        status: input.status,
        // Mengaktifkan kembali juga membuka kunci login.
        ...(input.status === "active" ? { failedLoginAttempts: 0, lockUntil: null } : {}),
      },
      select: userSelect,
    });
    await writeAudit(tx, {
      actorId: actor.user.id,
      action: "users.update",
      targetType: "user",
      targetId: userId,
      before: { name: before.name, role: before.role, status: before.status },
      after: input,
    });
    return user;
  });

  if (input.status === "deactivated") await revokeAllSessions(userId);
  return updated;
}

/**
 * Reset password lupa. Password sementara di-set, user wajib menggantinya saat login (bila fitur ganti
 * password aktif), kunci login dibuka, dan semua session user dicabut.
 */
export async function resetPassword(actor: Session, userId: string, input: { password: string }) {
  // Password sendiri diganti lewat PATCH /api/me/password (butuh password lama).
  if (userId === actor.user.id) throw ApiError.forbidden("users.cannot_modify_self");

  const passwordHash = await hashPassword(input.password);
  await prisma.$transaction(async (tx) => {
    const target = await findUser(tx, userId);
    await tx.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: true,
        failedLoginAttempts: 0,
        lockUntil: null,
        status: target.status === "locked" ? "active" : target.status,
      },
    });
    await writeAudit(tx, {
      actorId: actor.user.id,
      action: "users.password_reset",
      targetType: "user",
      targetId: userId,
    });
  });
  await revokeAllSessions(userId);
}
