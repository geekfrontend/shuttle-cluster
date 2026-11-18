import type { NextRequest } from "next/server";

import { handleError } from "@/utils/error-handler";

type RouteParams = Record<string, string>;
type RouteContext<P extends RouteParams> = { params: Promise<P> };
type Handler<P extends RouteParams> = (req: NextRequest, ctx: RouteContext<P>) => Promise<Response>;

/** Membungkus Route Handler: semua error (ApiError, ZodError, Prisma) diubah jadi envelope JSON. */
export function RouteHandler<P extends RouteParams = RouteParams>(handler: Handler<P>) {
  return async (req: NextRequest, ctx: RouteContext<P>): Promise<Response> => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      return handleError(error);
    }
  };
}
