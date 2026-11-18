import { redirect } from "next/navigation";

import type { Metadata } from "next";

import { authMessages } from "@/features/auth/messages";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { getSession } from "@/server/auth/session";
import { getMessages } from "@/server/i18n";

import { LoginForm } from "./_components/login-form";
import { LoginVisual } from "./_components/login-visual";

export async function generateMetadata(): Promise<Metadata> {
  const m = await getMessages(authMessages);
  return {
    title: m.login.metaTitle,
    description: m.login.metaDescription,
    alternates: {
      canonical: "/login",
    },
  };
}

export default async function Login({
  searchParams,
}: {
  readonly searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const next = safeRedirectPath((await searchParams).next);

  // Sudah login → tidak perlu melihat form lagi.
  const session = await getSession();
  if (session) redirect(next);

  const m = await getMessages(authMessages);

  return (
    // Desktop: tepat setinggi viewport (tanpa scroll halaman); panel form scroll sendiri bila layar pendek.
    // Mobile: panel visual disembunyikan, form mengisi minimal setinggi layar.
    <section className="flex min-h-dvh flex-col bg-background p-3 text-foreground antialiased lg:h-dvh">
      <div className="grid flex-1 gap-3 lg:min-h-0 lg:grid-cols-[0.94fr_1.06fr]">
        <div className="flex overflow-y-auto rounded-none border bg-card px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
          <div className="m-auto w-full max-w-md">
            <h1 className="font-medium text-3xl tracking-tight sm:text-4xl">{m.login.title}</h1>
            <p className="mt-3 text-lg text-muted-foreground leading-snug">{m.login.subtitle}</p>

            <div className="mt-10">
              <LoginForm next={next} />
            </div>
          </div>
        </div>

        <LoginVisual />
      </div>
    </section>
  );
}
