import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft, User, Users } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { clusteringMessages } from "@/features/clustering/messages";
import { DEFAULT_CLUSTERING_FILTERS } from "@/features/clustering/types";
import { categoryFromSlug } from "@/lib/badminton/categories";
import { interpolate } from "@/lib/i18n/ui";
import { getMessages } from "@/server/i18n";
import { runClustering } from "@/server/services/clustering.service";

import { ClusteringScreen } from "./_components/clustering-screen";

type Props = {
  readonly params: Promise<{ code: string }>;
  readonly searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = categoryFromSlug((await params).code);
  if (!category) return {};
  const m = await getMessages(clusteringMessages);
  return { title: m.categories[category.code].name };
}

export default async function Page({ params, searchParams }: Props) {
  const category = categoryFromSlug((await params).code);
  if (!category) notFound();

  // Hasil filter default dihitung di server, supaya halaman langsung berisi tanpa menunggu request kedua.
  const [m, initialData, { tab }] = await Promise.all([
    getMessages(clusteringMessages),
    runClustering({ category: category.code, ...DEFAULT_CLUSTERING_FILTERS }),
    searchParams,
  ]);
  const copy = m.categories[category.code];
  const UnitIcon = category.unitSize === 1 ? User : Users;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="grid gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl tracking-tight">{copy.name}</h2>
              <span className="border px-1.5 py-0.5 font-medium font-mono text-muted-foreground text-xs">
                {category.code}
              </span>
            </div>
            <p className="inline-flex items-center gap-1.5 text-muted-foreground">
              <UnitIcon className="size-4 shrink-0" aria-hidden="true" />
              {interpolate(m.detail.unit, { unit: copy.unit })}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/categories">
              <ArrowLeft data-icon="inline-start" />
              {m.detail.back}
            </Link>
          </Button>
        </div>
        <Separator />
      </div>

      <ClusteringScreen category={category} initialData={initialData} initialTab={tab} />
    </div>
  );
}
