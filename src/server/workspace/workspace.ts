import { cache } from "react";

import type { UserRole } from "@/generated/prisma/client";
import { getSession } from "@/server/auth/session";

/** Data yang dikirim ke client (serializable). */
export type Workspace = {
  user: { id: string; name: string; email: string; avatar: string; role: UserRole };
};

/** Workspace untuk request ini: user yang sedang login. `null` jika tidak ada session. Di-cache per request. */
export const getWorkspace = cache(async (): Promise<Workspace | null> => {
  const session = await getSession();
  if (!session) return null;

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      avatar: session.user.avatarUrl ?? "",
      role: session.user.role,
    },
  };
});
