import type { ClusteringRequest } from "../types";

export const clusteringKeys = {
  all: () => ["clustering"] as const,
  run: (request: ClusteringRequest) => ["clustering", request] as const,
};
