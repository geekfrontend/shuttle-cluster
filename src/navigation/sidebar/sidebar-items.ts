import { LayoutDashboard, type LucideIcon, Users } from "lucide-react";

import type { WorkspaceMessages } from "@/features/workspace/messages";

export type NavBadge = "new" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  /** Hanya tampil untuk admin. Hanya penyaring UI; halaman dan API tetap memeriksa role sendiri. */
  adminOnly?: boolean;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  /** Hanya tampil untuk admin. Hanya penyaring UI; halaman dan API tetap memeriksa role sendiri. */
  adminOnly?: boolean;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  /** Kunci label di `workspaceMessages.nav.groups`. */
  labelKey?: keyof WorkspaceMessages["nav"]["groups"];
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    items: [
      {
        id: "default",
        title: "Default",
        url: "/",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 2,
    label: "Administration",
    labelKey: "administration",
    items: [
      {
        id: "users",
        title: "Users",
        url: "/users",
        icon: Users,
        adminOnly: true,
      },
    ],
  },
];
