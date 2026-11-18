import Link from "next/link";

import { Lock } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { authMessages } from "@/features/auth/messages";
import { getMessages } from "@/server/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const m = await getMessages(authMessages);
  return {
    title: m.unauthorized.metaTitle,
    robots: { index: false, follow: false },
    alternates: { canonical: "/unauthorized" },
  };
}

export default async function UnauthorizedPage() {
  const m = await getMessages(authMessages);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <Empty className="max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Lock />
          </EmptyMedia>
          <EmptyTitle>{m.unauthorized.title}</EmptyTitle>
          <EmptyDescription>{m.unauthorized.description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/" prefetch={false}>
              {m.unauthorized.action}
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
