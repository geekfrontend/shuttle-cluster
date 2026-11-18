import { apiData, withQuery } from "@/lib/api-client";

import type { ClusteringRequest, ClusteringResult } from "../types";

export function getClustering(request: ClusteringRequest): Promise<ClusteringResult> {
  return apiData(
    withQuery("/api/clustering", {
      ...request,
      mainDraw: String(request.mainDraw),
    }),
  );
}
