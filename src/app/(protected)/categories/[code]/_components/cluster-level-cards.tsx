import { Badge, type BadgeTone } from "@/components/shared/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clusteringMessages } from "@/features/clustering/messages";
import { CLUSTER_LEVELS, type ClusterLevel } from "@/lib/badminton/categories";
import { getMessages } from "@/server/i18n";

/** Tingkat performa, bukan baik/buruk: berkembang = perlu perhatian (warning), bukan gagal (danger). */
const LEVEL_TONE: Record<ClusterLevel, BadgeTone> = {
  dominant: "success",
  competitive: "progress",
  developing: "warning",
};

/** Tiga kartu cluster (Dominan, Kompetitif, Berkembang). Jumlah anggota diisi setelah clustering dijalankan. */
export async function ClusterLevelCards({ entity }: { readonly entity: string }) {
  const m = await getMessages(clusteringMessages);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {CLUSTER_LEVELS.map((level) => {
        const copy = m.levels[level];
        return (
          <Card key={level}>
            <CardHeader className="gap-1.5 border-b">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm">{copy.name}</CardTitle>
                <Badge tone={LEVEL_TONE[level]}>{copy.tier}</Badge>
              </div>
              <CardDescription>{copy.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-0.5">
              <p className="flex items-baseline gap-1.5">
                <span className="font-medium text-3xl text-muted-foreground tabular-nums tracking-tight">—</span>
                <span className="text-muted-foreground text-xs">{entity}</span>
              </p>
              <p className="text-muted-foreground text-xs">{m.detail.noResult}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
