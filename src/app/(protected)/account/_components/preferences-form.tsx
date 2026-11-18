"use client";

import { useRouter } from "next/navigation";

import { cn } from "cn";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { accountMessages } from "@/features/account/messages";
import { useUpdateLocale } from "@/features/workspace/hooks/use-update-locale";
import { workspaceMessages } from "@/features/workspace/messages";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { useMessages } from "@/lib/i18n/locale-provider";

/** Bahasa tersimpan di profil (`users.locale`); `null` = ikuti browser. */
export function PreferencesForm({ savedLocale }: { readonly savedLocale: Locale | null }) {
  const m = useMessages(accountMessages).preferences;
  const w = useMessages(workspaceMessages).language;
  const router = useRouter();
  const update = useUpdateLocale();

  const options: { value: Locale | null; label: string }[] = [
    ...LOCALES.map((locale) => ({ value: locale, label: w.options[locale] })),
    { value: null, label: m.auto },
  ];

  function select(value: Locale | null) {
    if (value === savedLocale) return;
    update.mutate(
      { locale: value },
      {
        onSuccess: () => {
          toast.success(m.saved);
          router.refresh();
        },
        onError: () => toast.error(w.failed),
      },
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{m.title}</CardTitle>
        <CardDescription>{m.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        <p className="font-medium text-xs" aria-hidden="true">
          {m.language}
        </p>
        <fieldset className="grid gap-1.5" disabled={update.isPending}>
          <legend className="sr-only">{m.language}</legend>
          {options.map((option) => {
            const selected = option.value === savedLocale;
            return (
              <label
                key={option.value ?? "auto"}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 border px-3 py-2 text-xs transition-colors hover:bg-muted has-disabled:cursor-not-allowed has-disabled:opacity-50 has-focus-visible:border-ring",
                  selected && "border-primary bg-primary/5",
                )}
              >
                <input
                  type="radio"
                  name="account-language"
                  className="sr-only"
                  checked={selected}
                  onChange={() => select(option.value)}
                />
                {option.label}
                {selected && <Check className="size-4 text-primary" aria-hidden="true" />}
              </label>
            );
          })}
        </fieldset>
      </CardContent>
    </Card>
  );
}
