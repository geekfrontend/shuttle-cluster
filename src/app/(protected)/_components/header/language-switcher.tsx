"use client";

import { useRouter } from "next/navigation";

import { Check, Languages } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpdateLocale } from "@/features/workspace/hooks/use-update-locale";
import { workspaceMessages } from "@/features/workspace/messages";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { useLocale, useMessages } from "@/lib/i18n/locale-provider";

/** Bahasa disimpan di profil user (`users.locale`), lalu halaman dirender ulang di server. */
export function LanguageSwitcher() {
  const m = useMessages(workspaceMessages).language;
  const locale = useLocale();
  const router = useRouter();
  const updateLocale = useUpdateLocale();

  function select(next: Locale) {
    if (next === locale) return;
    updateLocale.mutate({ locale: next }, { onSuccess: () => router.refresh(), onError: () => toast.error(m.failed) });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" disabled={updateLocale.isPending} aria-label={m.label}>
          <Languages />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel className="text-muted-foreground text-xs">{m.label}</DropdownMenuLabel>
        {LOCALES.map((option) => (
          <DropdownMenuItem key={option} onSelect={() => select(option)}>
            <span className="flex-1">{m.options[option]}</span>
            {option === locale && <Check />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
