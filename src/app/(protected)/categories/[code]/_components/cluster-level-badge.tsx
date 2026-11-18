"use client";

import { Badge, type BadgeTone } from "@/components/shared/badge";
import { clusteringMessages } from "@/features/clustering/messages";
import type { ClusterLevel } from "@/lib/badminton/categories";
import { useMessages } from "@/lib/i18n/locale-provider";

/** Tingkat performa, bukan baik/buruk: berkembang = perlu perhatian (warning), bukan gagal (danger). */
export const LEVEL_TONE: Record<ClusterLevel, BadgeTone> = {
  dominant: "success",
  competitive: "progress",
  developing: "warning",
};

/** Nama cluster (Dominan/Kompetitif/Berkembang) dengan warna tingkatnya. */
export function ClusterLevelBadge({ level }: { readonly level: ClusterLevel }) {
  const m = useMessages(clusteringMessages).levels;
  return <Badge tone={LEVEL_TONE[level]}>{m[level].name}</Badge>;
}
