import {
  array as A,
  function as F,
  option as O,
  reader as R,
  readerTaskEither as RTE,
} from "fp-ts";
import type {
  Dependencies,
  ImageBytes,
  RouteKey,
} from "~/source/domain/types.ts";
import type { CacheError } from "~/source/domain/errors.ts";
import { makeCacheKey, makeRouteKey } from "~/source/domain/types.ts";
import { getCachedBytes, setCachedBytes } from "~/source/infra/cache.ts";
import { fetchImageBytes } from "~/source/infra/http.ts";

const getUrlForRoute = (routeKey: RouteKey): R.Reader<Dependencies, string> =>
  R.asks((deps) =>
    F.pipe(
      deps.config.routes[routeKey.value],
      O.fromNullable,
      O.getOrElse(() => deps.env.get("FALLBACK_URL") ?? ""),
    )
  );

export const getOrFetchImageBytes = (
  routeKey: RouteKey,
  shouldOverwrite: boolean,
): RTE.ReaderTaskEither<Dependencies, CacheError, ImageBytes> => {
  const cacheKey = makeCacheKey(routeKey.value);

  return F.pipe(
    getUrlForRoute(routeKey),
    RTE.fromReader,
    RTE.chain((url) =>
      shouldOverwrite ? fetchImageBytes(url) : F.pipe(
        getCachedBytes(cacheKey),
        RTE.chain(
          O.fold(
            () => fetchImageBytes(url),
            (cachedBytes) => RTE.right(cachedBytes),
          ),
        ),
      )
    ),
    RTE.chainFirst((bytes) => setCachedBytes(cacheKey, bytes)),
  );
};

const processRouteEntry = (
  shouldOverwrite: boolean,
) =>
(
  [key, _]: readonly [string, string],
): RTE.ReaderTaskEither<Dependencies, CacheError, ImageBytes> =>
  getOrFetchImageBytes(makeRouteKey(key), shouldOverwrite);

export const processAllRoutes = (
  shouldOverwrite: boolean,
): RTE.ReaderTaskEither<Dependencies, CacheError, readonly ImageBytes[]> =>
  F.pipe(
    RTE.asks((deps: Dependencies) => Object.entries(deps.config.routes)),
    RTE.chain(F.flow(
      A.map(processRouteEntry(shouldOverwrite)),
      A.sequence(RTE.ApplicativeSeq),
    )),
  );
