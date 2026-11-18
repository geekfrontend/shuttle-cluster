import { prisma } from "@/db/client";
import type { Locale } from "@/lib/i18n/config";
import { writeAudit } from "@/server/audit/audit.service";

const profileSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  locale: true,
  role: true,
  mustChangePassword: true,
  lastActiveAt: true,
  createdAt: true,
} as const;

export function getMe(userId: string) {
  return prisma.user.findUniqueOrThrow({ where: { id: userId }, select: profileSelect });
}

export async function updateMe(
  userId: string,
  input: { name?: string; avatarUrl?: string | null; locale?: Locale | null },
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({ where: { id: userId }, data: input, select: profileSelect });
    await writeAudit(tx, { actorId: userId, action: "me.updated", targetType: "user", targetId: userId, after: input });
    return updated;
  });
}
