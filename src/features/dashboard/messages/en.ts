// Pesan dasbor (Server Component; datanya dari service di server).
export const en = {
  metaTitle: "Dashboard",
  greeting: "Welcome back, {name}",
  description: "Group badminton players by match performance.",
  quickLinks: "Quick links",
  links: {
    users: { title: "Users", description: "Add accounts, change roles, or reset passwords." },
    account: { title: "Account", description: "Profile, language, and security." },
  },
};

export type DashboardMessages = typeof en;
