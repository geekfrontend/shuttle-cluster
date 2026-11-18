"use client";

import Link from "next/link";

import { Command } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { workspaceMessages } from "@/features/workspace/messages";
import { useMessages } from "@/lib/i18n/locale-provider";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { useNavGroups } from "./use-nav-groups";

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { readonly user: { name: string; email: string; avatar: string } }) {
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.values.sidebar_variant,
      sidebarCollapsible: s.values.sidebar_collapsible,
      isSynced: s.isSynced,
    })),
  );

  const navGroups = useNavGroups();
  const m = useMessages(workspaceMessages).nav;
  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader className="h-12 justify-center border-sidebar-border border-b py-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-10 gap-2.5 px-1 hover:bg-transparent active:bg-transparent group-data-[collapsible=icon]:p-0!"
            >
              <Link prefetch={false} href="/">
                <span className="flex aspect-square size-7 shrink-0 items-center justify-center bg-primary text-primary-foreground group-data-[collapsible=icon]:size-8">
                  <Command className="size-3.5" />
                </span>
                <span className="grid flex-1 leading-tight">
                  <span className="truncate font-semibold text-sm tracking-tight">{APP_CONFIG.name}</span>
                  <span className="truncate text-[0.625rem] text-sidebar-foreground/60">{m.brandTagline}</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navGroups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
