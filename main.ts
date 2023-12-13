import { report } from "~/utils.ts";
import { config } from "~/config.ts";
import { function as func, option, task, taskEither } from "fp-ts";

/**
 * Fetches the bytes from the specified URL.
 * @param url - The URL to fetch the bytes from.
 * @returns A promise that resolves to an ArrayBuffer.
 */
const fetchBytes = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch resource");
  return response.arrayBuffer();
};

/**
 * Retrieves the value from the config.routes object based on the request URL.
 * If the value is not found, it falls back to the value of the `FALLBACK_URL` environment variable.
 * @param request - The request object.
 * @returns The retrieved value or the fallback URL.
 */
const retrieve = func.flow(
  taskEither.tryCatchK(
    fetchBytes,
    (reason) => new Error(String(reason)),
  ),
);

/**
 * Retrieves the path of the request URL given the request object.
 * @param request - The request object.
 * @returns The path of the request URL.
 */
const path = func.flow(
  (request: Request) => new URL(request.url),
  (url) => url.pathname,
  (pathname) => pathname.slice(1),
  (pathname) => config.routes[pathname],
  option.fromNullable,
  option.getOrElse(() => Deno.env.get("FALLBACK_URL")!),
);

/**
 * Builds a task that transforms the input taskEither into a task that resolves to a Response object.
 * @param input - The input taskEither.
 * @returns A task that resolves to a Response object.
 */
const build = (
  input: taskEither.TaskEither<Error, ArrayBuffer>,
) =>
  func.pipe(
    input,
    taskEither.map<ArrayBuffer, Response>((bytes) =>
      new Response(bytes, { headers: { "Content-Type": "image/svg+xml" } })
    ),
    taskEither.getOrElse<Error, Response>((error) =>
      task.of(new Response(error.message))
    ),
  );

/**
 * Handles the incoming request and returns a task that reports the request and response.
 * @param request - The incoming request object.
 * @param ctx - The Deno.ServeHandlerInfo object.
 * @returns A task that reports the request and response.
 */
const handler = (request: Request, ctx: Deno.ServeHandlerInfo) =>
  func.pipe(
    request,
    path,
    retrieve,
    build,
    task.map((response) => report(request, response, ctx)),
  )();

Deno.serve(handler);
