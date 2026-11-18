import { Contact, LayoutDashboard, LayoutList, type LucideIcon, Swords, Trophy, Users } from "lucide-react";

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
    label: "Data",
    labelKey: "data",
    items: [
      { id: "players", title: "Players", url: "/players", icon: Contact },
      { id: "matches", title: "Matches", url: "/matches", icon: Swords },
    ],
  },
  {
    id: 3,
    label: "Clustering",
    labelKey: "clustering",
    items: [
      {
        id: "categories",
        title: "Categories",
        icon: Trophy,
        subItems: [
          { id: "categories-all", title: "All categories", url: "/categories", icon: LayoutList },
          { id: "category-ms", title: "Men's singles", url: "/categories/ms" },
          { id: "category-ws", title: "Women's singles", url: "/categories/ws" },
          { id: "category-md", title: "Men's doubles", url: "/categories/md" },
          { id: "category-wd", title: "Women's doubles", url: "/categories/wd" },
          { id: "category-xd", title: "Mixed doubles", url: "/categories/xd" },
        ],
      },
    ],
  },
  {
    id: 4,
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
