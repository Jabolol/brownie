import { function as F, readerTaskEither as RTE } from "fp-ts";
import { report } from "~/utils.ts";
import type {
  Dependencies,
  ImageBytes,
  RouteKey,
} from "~/source/domain/types.ts";
import type { CacheError } from "~/source/domain/errors.ts";
import { makeRouteKey } from "~/source/domain/types.ts";
import { getOrFetchImageBytes } from "~/source/services/image-cache.ts";

const extractRequestPath: (request: Request) => RouteKey = F.flow(
  (request: Request) => new URL(request.url),
  (url) => url.pathname,
  (pathname) => pathname.slice(1),
  makeRouteKey,
);

const createImageResponse = (bytes: ImageBytes): Response =>
  new Response(bytes.value, {
    headers: { "Content-Type": "image/svg+xml" },
  });

const createErrorResponse = (error: CacheError): Response =>
  new Response(error.error.message, { status: 500 });

export const handleRequest = (
  request: Request,
  ctx: Deno.ServeHandlerInfo,
): RTE.ReaderTaskEither<Dependencies, never, Response> => {
  const routeKey = extractRequestPath(request);

  return F.pipe(
    getOrFetchImageBytes(routeKey, false),
    RTE.map(createImageResponse),
    RTE.orElse((error) => RTE.right(createErrorResponse(error))),
    RTE.map((response) => report(request, response, ctx)),
  );
};

export { createErrorResponse, extractRequestPath };
