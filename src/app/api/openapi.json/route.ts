import type { NextRequest } from "next/server";

import { STATUS_CODES } from "@/constants/status-codes";
import { isApiDocsEnabled } from "@/lib/openapi/docs-enabled";
import { buildOpenApiDocument } from "@/lib/openapi/document";
import { RouteHandler } from "@/lib/route-handler";
import { ApiError } from "@/utils/api-error";

export const GET = RouteHandler(async (req: NextRequest) => {
  if (!isApiDocsEnabled()) throw ApiError.notFound();
  return Response.json(buildOpenApiDocument(req.nextUrl.origin), {
    status: STATUS_CODES.OK,
    headers: { "cache-control": "no-store" },
  });
});
