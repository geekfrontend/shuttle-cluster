// Pengaturan pribadi user yang sedang login.
export const en = {
  page: {
    metaTitle: "Account",
    title: "Account",
    description: "Your personal settings.",
  },
  tabs: { profile: "Profile", preferences: "Preferences", security: "Security" },
  profile: {
    title: "Profile",
    description: "How other users see you.",
    name: "Full name",
    email: "Email",
    emailHint: "Used to sign in. Contact an admin to change it.",
    save: "Save profile",
  },
  preferences: {
    title: "Preferences",
    description: "Only affects what you see.",
    language: "Language",
    auto: "Follow browser",
    saved: "Language updated.",
  },
  security: {
    title: "Security",
    description: "Sign-in details for your account.",
    password: "Password",
    passwordDisabled: "Changing your password is temporarily disabled. Ask an admin to reset it.",
    created: "Account created",
    lastActive: "Last active",
  },
};

export type AccountMessages = typeof en;
