import { ApiReference } from "@scalar/nextjs-api-reference";

import { isApiDocsEnabled } from "@/lib/openapi/docs-enabled";

const reference = ApiReference({
  url: "/api/openapi.json",
  pageTitle: "ShuttleCluster API",
});

// Scalar API Reference untuk spec di /api/openapi.json.
export function GET() {
  if (!isApiDocsEnabled()) return new Response("Not found", { status: 404 });
  return reference();
}
