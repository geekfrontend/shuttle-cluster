import type { MessageCatalog } from "@/lib/i18n/ui";

import { type DashboardMessages, en } from "./en";
import { id } from "./id";

export type { DashboardMessages } from "./en";
export const dashboardMessages = { en, id } satisfies MessageCatalog<DashboardMessages>;
