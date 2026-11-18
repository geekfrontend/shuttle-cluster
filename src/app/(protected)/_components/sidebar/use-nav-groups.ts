"use client";

import { useMemo } from "react";

import { workspaceMessages } from "@/features/workspace/messages";
import { useMessages } from "@/lib/i18n/locale-provider";
import { type NavGroup, sidebarItems } from "@/navigation/sidebar/sidebar-items";

import { useIsAdmin } from "../workspace/workspace-provider";

/** Menu sidebar yang sudah diterjemahkan dan disaring sesuai role user. */
export function useNavGroups(): NavGroup[] {
  const m = useMessages(workspaceMessages).nav;
  const isAdmin = useIsAdmin();

  return useMemo(() => {
    const allowed = (item: { adminOnly?: boolean }) => !item.adminOnly || isAdmin;
    const titleOf = (id: string, fallback: string) => m.items[id as keyof typeof m.items] ?? fallback;

    return sidebarItems
      .map((group) => ({
        ...group,
        label: group.labelKey ? m.groups[group.labelKey] : group.label,
        items: group.items.filter(allowed).map((item) =>
          item.subItems
            ? {
                ...item,
                title: titleOf(item.id, item.title),
                subItems: item.subItems.filter(allowed).map((sub) => ({ ...sub, title: titleOf(sub.id, sub.title) })),
              }
            : { ...item, title: titleOf(item.id, item.title) },
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [m, isAdmin]);
}
