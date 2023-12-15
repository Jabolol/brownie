interface RouteConfig {
  /**
   * Route mapping configuration object.
   */
  routes: Record<string, string>;
  /**
   * Cron schedule configuration object.
   */
  schedule: string | Deno.CronSchedule;
}

/**
 * The convention is to use brownie ingredients as paths.
 */
export const config: RouteConfig = {
  routes: {
    cocoa:
      "https://jabolo-stats.vercel.app/api?username=Jabolol&theme=dracula&hide_border=false&include_all_commits=false&count_private=true&show_icons=true",
    vanilla:
      "https://github-readme-streak-stats-eight-iota.vercel.app/?user=Jabolol&theme=dracula&hide_border=false",
  },
  schedule: "*/20 * * * *",
};
