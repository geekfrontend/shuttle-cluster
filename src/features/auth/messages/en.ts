// Sumber bentuk pesan UI fitur auth. Locale lain wajib punya kunci yang sama (dicek lewat tipe `AuthMessages`).
export const en = {
  login: {
    metaTitle: "Login",
    metaDescription: "Sign in to your ShuttleCluster account.",
    title: "Login",
    subtitle: "Enter the email and password provided by your administrator.",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    emailInvalid: "Please enter a valid email address.",
    passwordLabel: "Password",
    passwordRequired: "Please enter your password.",
    submit: "Login",
  },
  feedback: {
    invalidTitle: "Login failed",
    lockedTitle: "Account temporarily locked",
    rateLimitedTitle: "Too many attempts",
    networkTitle: "No connection",
    networkDescription: "Could not reach the server. Check your connection and try again.",
    genericTitle: "Something went wrong",
    genericDescription: "Please try again in a moment.",
    successTitle: "Signed in",
    successDescription: "Taking you to your workspace…",
  },
  visual: {
    headlineTop: "Match data,",
    headlineBottom: "clear player tiers",
    subtitle: "Group badminton players by match performance with K-Means clustering.",
    matchesAnalysed: "Matches analysed",
    topCluster: "High-performance cluster",
    topClusterPlayers: "{count} players",
    winRate: "Average win rate",
    winRateValue: "Men's singles · {value}",
  },
  unauthorized: {
    metaTitle: "Unauthorized",
    title: "Unauthorized access",
    description:
      "You do not have permission to view the requested content. Please contact the site administrator if you believe this is an error.",
    action: "Go to homepage",
  },
};

export type AuthMessages = typeof en;
