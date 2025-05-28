import { function as F, task as T, taskEither as TE } from "fp-ts";
import { config } from "~/config.ts";
import type { Dependencies } from "~/source/domain/types.ts";
import { createErrorResponse } from "~/source/handlers/http.ts";
import { handleRequest } from "~/source/handlers/http.ts";
import { cronJob } from "~/source/handlers/cron.ts";

export const createDependencies = async (): Promise<Dependencies> => ({
  kv: await Deno.openKv(),
  config,
  fetch,
  env: Deno.env,
});

export const runCronJob = (deps: Dependencies): T.Task<void> =>
  F.pipe(
    cronJob(deps),
    TE.fold(
      (error) => T.of(console.error("Cron job failed:", error)),
      () => T.of(console.log("Cron job completed successfully")),
    ),
  );

export const runHandler =
  (deps: Dependencies) =>
  (request: Request, ctx: Deno.ServeHandlerInfo): Promise<Response> =>
    F.pipe(
      handleRequest(request, ctx)(deps),
      TE.fold(
        (error) => T.of(createErrorResponse(error)),
        (response) => T.of(response),
      ),
    )();
