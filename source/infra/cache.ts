import {
  function as F,
  option as O,
  readerTaskEither as RTE,
  taskEither as TE,
} from "fp-ts";
import type {
  CacheKey,
  Dependencies,
  ImageBytes,
} from "~/source/domain/types.ts";
import type { CacheError } from "~/source/domain/errors.ts";
import { makeImageBytes } from "~/source/domain/types.ts";
import { makeCacheError } from "~/source/domain/errors.ts";

export const getCachedBytes = (
  cacheKey: CacheKey,
): RTE.ReaderTaskEither<Dependencies, CacheError, O.Option<ImageBytes>> =>
(deps) =>
  F.pipe(
    TE.tryCatch(
      () => deps.kv.get<ArrayBuffer>(cacheKey.value),
      (reason) => makeCacheError(new Error(String(reason))),
    ),
    TE.map(F.flow(
      ({ value }) => value,
      O.fromNullable,
      O.map(makeImageBytes),
    )),
  );

export const setCachedBytes = (
  cacheKey: CacheKey,
  bytes: ImageBytes,
): RTE.ReaderTaskEither<Dependencies, CacheError, Deno.KvCommitResult> =>
(deps) =>
  TE.tryCatch(
    () => deps.kv.set(cacheKey.value, bytes.value),
    (reason) => makeCacheError(new Error(String(reason))),
  );
