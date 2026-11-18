// Kelola pengguna — hanya admin.
export const en = {
  list: {
    metaTitle: "Users",
    title: "Users",
    description: "Accounts that can sign in, and their role.",
    searchPlaceholder: "Search name or email…",
    role: "Role",
    status: "Status",
    add: "Add user",
    empty: "No users yet",
    emptyDescription: "Add an account so someone else can sign in.",
    columns: {
      user: "User",
      role: "Role",
      status: "Status",
      lastActive: "Last active",
      created: "Created",
    },
  },
  rowActions: {
    makeAdmin: "Make admin",
    makeUser: "Change to user",
    deactivate: "Deactivate",
    activate: "Activate",
    resetPassword: "Reset password",
  },
  deactivate: {
    title: "Deactivate {name}?",
    description: "{name} can no longer sign in and is signed out on every device. You can activate the account again.",
    confirm: "Deactivate",
  },
  create: {
    title: "Add user",
    description: "Create an account with an initial password. Share the password with the user yourself.",
    email: "Email",
    emailInvalid: "Enter a valid email address.",
    name: "Name",
    nameRequired: "Enter a name.",
    password: "Initial password",
    role: "Role",
    roleHint: "Admins can manage users. Users have regular access.",
    submit: "Add user",
  },
  reset: {
    title: "Reset password for {name}",
    description: "Set a temporary password. The account is unlocked and signed out on every device.",
    password: "New password",
    submit: "Reset password",
  },
};

export type UsersMessages = typeof en;
