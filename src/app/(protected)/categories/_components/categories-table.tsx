import Link from "next/link";

import { ArrowRight, User, Users } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { clusteringMessages } from "@/features/clustering/messages";
import { CATEGORIES, categorySlug } from "@/lib/badminton/categories";
import { interpolate } from "@/lib/i18n/ui";
import { getLocale, getMessages } from "@/server/i18n";
import { getCategoryStats } from "@/server/services/category.service";

/** Lima kategori BWF beserta ringkasan datanya: jumlah pertandingan, unit, dan rentang tanggal. */
export async function CategoriesTable() {
  const [m, locale, stats] = await Promise.all([getMessages(clusteringMessages), getLocale(), getCategoryStats()]);
  const columns = m.overview.columns;
  const number = new Intl.NumberFormat(locale);
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  const formatDate = (value: string) => date.format(new Date(`${value}T00:00:00.000Z`));

  return (
    <div className="overflow-hidden border border-border/70 bg-background">
      <Table className="**:data-[slot=table-cell]:px-3 **:data-[slot=table-head]:px-3">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-8 w-20">{columns.code}</TableHead>
            <TableHead className="h-8">{columns.category}</TableHead>
            <TableHead className="h-8">{columns.unit}</TableHead>
            <TableHead className="h-8 text-right">{columns.matches}</TableHead>
            <TableHead className="h-8 text-right">{columns.units}</TableHead>
            <TableHead className="h-8">{columns.dataRange}</TableHead>
            <TableHead className="h-8 w-12">
              <span className="sr-only">{columns.category}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {CATEGORIES.map((category) => {
            const copy = m.categories[category.code];
            const href = `/categories/${categorySlug(category.code)}`;
            const UnitIcon = category.unitSize === 1 ? User : Users;
            const data = stats[category.code];
            return (
              <TableRow key={category.code}>
                <TableCell>
                  <span className="font-medium font-mono text-sm">{category.code}</span>
                </TableCell>
                <TableCell>
                  <Link href={href} className="grid leading-tight outline-none hover:underline focus-visible:underline">
                    <span className="font-medium text-sm">{copy.name}</span>
                    {copy.term !== copy.name && <span className="text-muted-foreground text-xs">{copy.term}</span>}
                  </Link>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground text-sm">
                    <UnitIcon className="size-3.5 shrink-0" aria-hidden="true" />
                    {copy.unit}
                  </span>
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {data ? number.format(data.matches) : <span className="text-muted-foreground">0</span>}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {data ? number.format(data.units) : <span className="text-muted-foreground">0</span>}
                </TableCell>
                <TableCell>
                  {data?.first && data.last ? (
                    <span className="text-muted-foreground text-sm tabular-nums">
                      {formatDate(data.first)} – {formatDate(data.last)}
                    </span>
                  ) : (
                    <Badge tone="inactive">{m.overview.noData}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    asChild
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Link href={href} aria-label={interpolate(m.overview.open, { category: copy.name })}>
                      <ArrowRight />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
