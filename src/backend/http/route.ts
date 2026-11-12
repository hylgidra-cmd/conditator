import type { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "./errors";
import { assertSameOrigin } from "./request";

type Handler<C> = (request: NextRequest, context: C) => Promise<NextResponse>;

/** API route o'rami: xatolarni yagona formatga keltiradi, o'zgartiruvchi so'rovlarda Origin ni tekshiradi. */
export function route<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (request, context) => {
    try {
      if (request.method !== "GET" && request.method !== "HEAD")
        assertSameOrigin(request);
      return await handler(request, context);
    } catch (error) {
      return errorResponse(error, request);
    }
  };
}
