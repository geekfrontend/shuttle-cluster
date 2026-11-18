import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft, FileSpreadsheet, User, Users } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { clusteringMessages } from "@/features/clustering/messages";
import { categoryFromSlug } from "@/lib/badminton/categories";
import { interpolate } from "@/lib/i18n/ui";
import { getMessages } from "@/server/i18n";

import { ClusterLevelCards } from "./_components/cluster-level-cards";

type Props = { readonly params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = categoryFromSlug((await params).code);
  if (!category) return {};
  const m = await getMessages(clusteringMessages);
  return { title: m.categories[category.code].name };
}

export default async function Page({ params }: Props) {
  const category = categoryFromSlug((await params).code);
  if (!category) notFound();

  const m = await getMessages(clusteringMessages);
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

      <section className="grid gap-3" aria-labelledby="levels-title">
        <div>
          <h3 id="levels-title" className="font-medium text-base">
            {m.detail.levelsTitle}
          </h3>
          <p className="text-muted-foreground text-sm">{m.detail.levelsDescription}</p>
        </div>
        <ClusterLevelCards entity={m.entities[category.format]} />
      </section>

      <Empty className="min-h-72 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileSpreadsheet />
          </EmptyMedia>
          <EmptyTitle>{m.detail.emptyTitle}</EmptyTitle>
          <EmptyDescription>{interpolate(m.detail.emptyDescription, { category: copy.name })}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
