import type { MessageCatalog } from "@/lib/i18n/ui";

import { en, type PlayersMessages } from "./en";
import { id } from "./id";

export type { PlayersMessages } from "./en";
export const playersMessages = { en, id } satisfies MessageCatalog<PlayersMessages>;
