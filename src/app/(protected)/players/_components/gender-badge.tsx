"use client";

import { Badge } from "@/components/shared/badge";
import { playersMessages } from "@/features/players/messages";
import type { Gender } from "@/features/players/types";
import { useMessages } from "@/lib/i18n/locale-provider";

/** Gender adalah kategori, bukan status — badge netral tanpa titik warna. */
export function GenderBadge({ gender }: { readonly gender: Gender }) {
  const m = useMessages(playersMessages).genders;
  return <Badge tone="neutral">{m[gender]}</Badge>;
}
