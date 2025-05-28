import { function as F, readerTaskEither as RTE } from "fp-ts";
import type { Dependencies } from "~/source/domain/types.ts";
import type { CacheError } from "~/source/domain/errors.ts";
import { processAllRoutes } from "~/source/services/image-cache.ts";

export const cronJob: RTE.ReaderTaskEither<Dependencies, CacheError, void> = F
  .pipe(
    processAllRoutes(true),
    RTE.map(F.constVoid),
  );
