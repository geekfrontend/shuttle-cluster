"use client";

import { Badge } from "@/components/shared/badge";
import { clusteringMessages } from "@/features/clustering/messages";
import type { ClusterLevel } from "@/lib/badminton/categories";
import { LEVEL_COLOR } from "@/lib/clustering/chart";
import { useMessages } from "@/lib/i18n/locale-provider";

/** Titik warna tingkat cluster — sama dengan warna seri di chart. */
export function LevelDot({ level }: { readonly level: ClusterLevel }) {
  return <span aria-hidden="true" className="size-1.5 shrink-0" style={{ background: LEVEL_COLOR[level] }} />;
}

/** Nama cluster (Dominan/Kompetitif/Berkembang) dengan titik warna yang sama dengan chart. */
export function ClusterLevelBadge({ level }: { readonly level: ClusterLevel }) {
  const m = useMessages(clusteringMessages).levels;
  return (
    <Badge tone="neutral">
      <LevelDot level={level} />
      {m[level].name}
    </Badge>
  );
}
