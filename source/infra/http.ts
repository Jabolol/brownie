import {
  function as F,
  readerTaskEither as RTE,
  taskEither as TE,
} from "fp-ts";
import type { Dependencies, ImageBytes } from "~/source/domain/types.ts";
import type { CacheError } from "~/source/domain/errors.ts";
import { makeImageBytes } from "~/source/domain/types.ts";
import { makeFetchError } from "~/source/domain/errors.ts";

export const fetchImageBytes =
  (url: string): RTE.ReaderTaskEither<Dependencies, CacheError, ImageBytes> =>
  (deps) =>
    F.pipe(
      TE.tryCatch(
        async () => {
          const response = await deps.fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response;
        },
        (reason) => makeFetchError(new Error(String(reason))),
      ),
      TE.chain((response) =>
        TE.tryCatch(
          () => response.arrayBuffer(),
          (reason) => makeFetchError(new Error(String(reason))),
        )
      ),
      TE.map(makeImageBytes),
    );
