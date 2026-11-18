import Link from "next/link";

import { ArrowUpRight, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type QuickLink = { href: string; icon: LucideIcon; title: string; description: string };

export function QuickLinks({ title, links }: { readonly title: string; readonly links: QuickLink[] }) {
  if (links.length === 0) return null;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-1 px-2">
        {links.map(({ href, icon: Icon, title: linkTitle, description }) => (
          <Link key={href} href={href} className="group flex items-center gap-3 p-2 transition-colors hover:bg-muted">
            <span className="flex size-8 shrink-0 items-center justify-center bg-primary/10 text-primary">
              <Icon className="size-4" />
            </span>
            <span className="grid min-w-0 flex-1 leading-tight">
              <span className="truncate font-medium">{linkTitle}</span>
              <span className="truncate text-muted-foreground text-xs">{description}</span>
            </span>
            <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
