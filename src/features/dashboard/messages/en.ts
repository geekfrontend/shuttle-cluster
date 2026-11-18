// Pesan dasbor (Server Component; datanya dari service di server).
export const en = {
  metaTitle: "Dashboard",
  greeting: "Welcome back, {name}",
  description: "Group badminton players by match performance.",
  quickLinks: "Quick links",
  links: {
    players: { title: "Players", description: "Players and their gender, country, and match count." },
    matches: { title: "Matches", description: "Match results per category with scores per game." },
    categories: { title: "Categories", description: "Performance clusters per category: MS, WS, MD, WD, XD." },
    users: { title: "Users", description: "Add accounts, change roles, or reset passwords." },
    account: { title: "Account", description: "Profile, language, and security." },
  },
};

export type DashboardMessages = typeof en;
