import type { MessageCatalog } from "@/lib/i18n/ui";

import { en, type UsersMessages } from "./en";
import { id } from "./id";

export type { UsersMessages } from "./en";
export const usersMessages = { en, id } satisfies MessageCatalog<UsersMessages>;
