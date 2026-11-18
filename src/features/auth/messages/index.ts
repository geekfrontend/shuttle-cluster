import type { MessageCatalog } from "@/lib/i18n/ui";

import { type AuthMessages, en } from "./en";
import { id } from "./id";

export type { AuthMessages } from "./en";
export const authMessages = { en, id } satisfies MessageCatalog<AuthMessages>;
