import type { Metadata } from "next";

import { clusteringMessages } from "@/features/clustering/messages";
import { getMessages } from "@/server/i18n";

import { CategoriesTable } from "./_components/categories-table";

export async function generateMetadata(): Promise<Metadata> {
  const m = await getMessages(clusteringMessages);
  return { title: m.overview.metaTitle, alternates: { canonical: "/categories" } };
}

export default async function Page() {
  const m = await getMessages(clusteringMessages);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-3xl tracking-tight">{m.overview.title}</h2>
        <p className="text-muted-foreground">{m.overview.description}</p>
      </div>
      <CategoriesTable />
    </div>
  );
}
