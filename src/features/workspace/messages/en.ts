import type { ContentLayout, NavbarStyle, SidebarCollapsible, SidebarVariant } from "@/lib/preferences/layout";
import type { ThemeMode } from "@/lib/preferences/theme";

// Pesan UI shell aplikasi (navigasi, header, menu akun) dan teks umum yang dipakai lintas fitur.
export const en = {
  nav: {
    groups: { administration: "Administration" },
    brandTagline: "Badminton performance clustering",
    items: {
      default: "Dashboard",
      users: "Users",
    },
  },
  account: {
    account: "Account",
    logout: "Log out",
    openMenu: "Open account menu",
  },
  language: {
    label: "Language",
    options: { id: "Bahasa Indonesia", en: "English" },
    failed: "Could not change the language.",
  },
  roles: { admin: "Admin", user: "User" },
  status: { active: "Active", locked: "Locked", deactivated: "Deactivated" },
  forbidden: {
    title: "No access",
    description: "Only admins can open this page.",
  },
  common: {
    /** Pengganti nilai kosong (bukan tanda "—"). */
    none: "None",
    period: "{start} to {end}",
    ongoing: "now",
    cancel: "Cancel",
    save: "Save",
    create: "Create",
    back: "Back",
    all: "All",
    actions: "Actions",
    loadFailed: "Failed to load data.",
    retry: "Retry",
    never: "Never",
    you: "You",
    optional: "Optional",
    passwordHint: "At least 12 characters.",
    loading: "Loading…",
    showPassword: "Show password",
    hidePassword: "Hide password",
  },
  table: {
    rowsPerPage: "Rows per page",
    pageOf: "Page {page} of {totalPages}",
    rows: "{total} row(s)",
    previous: "Prev",
    next: "Next",
    previousPage: "Go to previous page",
    nextPage: "Go to next page",
    firstPage: "Go to first page",
    lastPage: "Go to last page",
    reset: "Reset",
    view: "View",
    toggleColumns: "Toggle columns",
    clearFilters: "Clear filters",
    selectedCount: "{count} selected",
    multiHint: "Choose one or more",
    singleHint: "Choose one",
    empty: "No data yet",
    emptyDescription: "Data will appear here once it is added.",
    fetching: "Loading data…",
    filteredTitle: "No matching results",
    filteredDescription: "Nothing matches the current search or filters. Try another keyword or clear the filters.",
    viewDetails: "View details",
    viewItem: "View details of {name}",
    moreActions: "More actions for {name}",
  },
  theme: {
    current: "Current theme: {mode}. Click to cycle themes",
  },
  layout: {
    title: "Preferences",
    description: "Customize your dashboard layout preferences.",
    /** Aria-label per pilihan di grup toggle (mis. "Toggle Light"). */
    toggle: "Toggle {label}",
    themePreset: "Theme Preset",
    presetPlaceholder: "Preset",
    fonts: "Fonts",
    fontPlaceholder: "Select font",
    themeMode: "Theme Mode",
    modes: { light: "Light", dark: "Dark", system: "System" } satisfies Record<ThemeMode, string>,
    pageLayout: "Page Layout",
    layouts: { centered: "Centered", "full-width": "Full Width" } satisfies Record<ContentLayout, string>,
    navbarBehavior: "Navbar Behavior",
    navbarStyles: { sticky: "Sticky", scroll: "Scroll" } satisfies Record<NavbarStyle, string>,
    sidebarStyle: "Sidebar Style",
    sidebarVariants: { inset: "Inset", sidebar: "Sidebar", floating: "Floating" } satisfies Record<
      SidebarVariant,
      string
    >,
    sidebarCollapseMode: "Sidebar Collapse Mode",
    collapsibles: { icon: "Icon", offcanvas: "OffCanvas" } satisfies Record<SidebarCollapsible, string>,
    restoreDefaults: "Restore Defaults",
  },
};

export type WorkspaceMessages = typeof en;
