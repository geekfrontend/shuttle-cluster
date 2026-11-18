"use client";

import { AppLoading } from "@/components/shared/app-loading";
import { APP_CONFIG } from "@/config/app-config";
import { workspaceMessages } from "@/features/workspace/messages";
import { useMessages } from "@/lib/i18n/locale-provider";

/** Fallback Suspense Next.js saat segmen route dimuat (layar penuh). */
export default function Loading() {
  const m = useMessages(workspaceMessages).common;
  return <AppLoading brand={APP_CONFIG.name} label={m.loading} fullScreen />;
}
