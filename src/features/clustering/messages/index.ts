import type { MessageCatalog } from "@/lib/i18n/ui";

import { type ClusteringMessages, en } from "./en";
import { id } from "./id";

export type { ClusteringMessages } from "./en";
export const clusteringMessages = { en, id } satisfies MessageCatalog<ClusteringMessages>;
