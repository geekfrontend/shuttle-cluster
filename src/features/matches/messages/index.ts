import type { MessageCatalog } from "@/lib/i18n/ui";

import { en, type MatchesMessages } from "./en";
import { id } from "./id";

export type { MatchesMessages } from "./en";
export const matchesMessages = { en, id } satisfies MessageCatalog<MatchesMessages>;
