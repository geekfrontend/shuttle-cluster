"use client";

import { Badge, type BadgeTone } from "@/components/shared/badge";
import type { UserRole, UserStatus } from "@/features/users/types";
import { workspaceMessages } from "@/features/workspace/messages";
import { useMessages } from "@/lib/i18n/locale-provider";

const STATUS_TONE: Record<UserStatus, BadgeTone> = {
  active: "success",
  locked: "danger",
  deactivated: "inactive",
};

export function UserStatusBadge({ status }: { readonly status: UserStatus }) {
  const m = useMessages(workspaceMessages).status;
  return <Badge tone={STATUS_TONE[status]}>{m[status]}</Badge>;
}

/** Role bukan status, jadi tanpa titik warna; admin ditonjolkan dengan aksen. */
export function UserRoleBadge({ role }: { readonly role: UserRole }) {
  const m = useMessages(workspaceMessages).roles;
  return (
    <Badge tone={role === "admin" ? "accent" : "neutral"} emphasis={role === "admin" ? "tint" : "outline"}>
      {m[role]}
    </Badge>
  );
}
