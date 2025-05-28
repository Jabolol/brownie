import { config } from "~/config.ts";
import { createDependencies, runCronJob, runHandler } from "~/source/app.ts";

const main = async (): Promise<void> => {
  const deps = await createDependencies();

  Deno.cron("refresh kv store", config.schedule, () => runCronJob(deps)());

  if (import.meta.main) {
    console.log("Starting server...");
    Deno.serve(runHandler(deps));
  }
};

if (import.meta.main) {
  main().catch(console.error);
}
