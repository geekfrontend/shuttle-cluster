import type { MessageCatalog } from "@/lib/i18n/ui";

import { type AccountMessages, en } from "./en";
import { id } from "./id";

export type { AccountMessages } from "./en";
export const accountMessages = { en, id } satisfies MessageCatalog<AccountMessages>;
