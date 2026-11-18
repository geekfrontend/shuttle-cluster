import type { Tx } from "@/db/client";
import type { Prisma } from "@/generated/prisma/client";
import type { AuditAction } from "@/lib/audit-actions";
import { getRequestMeta } from "@/server/request-meta";

export type AuditEntry = {
  actorId?: string | null;
  action: AuditAction;
  targetType: string;
  targetId?: string | null;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
};

/** Tulis audit log. Panggil di dalam transaksi yang sama dengan mutasinya. Jangan pernah menyimpan password. */
export async function writeAudit(db: Tx, entry: AuditEntry): Promise<void> {
  const meta = await getRequestMeta();
  await db.auditLog.create({
    data: {
      actorId: entry.actorId ?? null,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId ?? null,
      before: entry.before,
      after: entry.after,
      ip: meta.ip,
      userAgent: meta.userAgent,
    },
  });
}
