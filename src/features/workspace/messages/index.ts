import type { MessageCatalog } from "@/lib/i18n/ui";

import { en, type WorkspaceMessages } from "./en";
import { id } from "./id";

export type { WorkspaceMessages } from "./en";
export const workspaceMessages = { en, id } satisfies MessageCatalog<WorkspaceMessages>;
