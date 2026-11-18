import type { ReactNode } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { cn } from "cn";

import { AppSidebar } from "@/app/(protected)/_components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getPreference } from "@/server/server-actions";
import { getWorkspace } from "@/server/workspace/workspace";

import { AccountMenu } from "./_components/header/account-menu";
import { LanguageSwitcher } from "./_components/header/language-switcher";
import { LayoutControls } from "./_components/header/layout-controls";
import { ThemeSwitcher } from "./_components/header/theme-switcher";
import { WorkspaceProvider } from "./_components/workspace/workspace-provider";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  // Guard sesungguhnya: proxy.ts hanya mengecek keberadaan cookie, di sini session divalidasi ke DB.
  const workspace = await getWorkspace();
  if (!workspace) redirect("/login");

  const { user } = workspace;

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const [variant, collapsible] = await Promise.all([
    getPreference("sidebar_variant"),
    getPreference("sidebar_collapsible"),
  ]);

  return (
    <WorkspaceProvider workspace={workspace}>
      <SidebarProvider
        defaultOpen={defaultOpen}
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 68)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant={variant} collapsible={collapsible} user={user} />
        <SidebarInset
          className={cn(
            "[html[data-content-layout=centered]_&>*]:mx-auto",
            "[html[data-content-layout=centered]_&>*]:w-full",
            "[html[data-content-layout=centered]_&>*]:max-w-screen-2xl",
            "peer-data-[variant=inset]:border",
            "[--dashboard-header-height:--spacing(12)]",
            "min-w-0 overflow-x-clip",
          )}
        >
          <header
            className={cn(
              "flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
              // Handle sticky navbar style with conditional classes so blur, background, z-index, and rounded-none corners remain consistent across all SidebarVariant layouts.
              "[html[data-navbar-style=sticky]_&]:sticky [html[data-navbar-style=sticky]_&]:top-0 [html[data-navbar-style=sticky]_&]:z-50 [html[data-navbar-style=sticky]_&]:overflow-hidden [html[data-navbar-style=sticky]_&]:rounded-t-[inherit] [html[data-navbar-style=sticky]_&]:bg-background/50 [html[data-navbar-style=sticky]_&]:backdrop-blur-md",
            )}
          >
            <div className="flex w-full items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-1 lg:gap-2">
                <SidebarTrigger className="-ml-1" />
              </div>
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <LayoutControls />
                <ThemeSwitcher />
                <AccountMenu user={user} />
              </div>
            </div>
          </header>
          {/* Pages can set data-content-padding="false" to render full-bleed app layouts. */}
          <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden p-4 has-data-[content-padding=false]:p-0 md:p-6 md:has-data-[content-padding=false]:p-0">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </WorkspaceProvider>
  );
}
