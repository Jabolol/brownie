import { report } from "~/utils.ts";
import { config } from "~/config.ts";
import {
  array,
  either,
  function as func,
  option,
  task,
  taskEither,
} from "fp-ts";

const kv = await Deno.openKv();

/**
 * This cron job retrieves the bytes of the images from the URLs specified in the configuration object and stores them in the KV store.
 */
const cron = async () => {
  const raw: either.Either<Error, [string, ArrayBuffer]>[] = await func.pipe(
    config.routes,
    Object.entries<string>,
    array.map(([key]) => [key, retrieve(option.some(true))(key)] as const),
    array.map(([key, value]) =>
      func.pipe(
        value,
        taskEither.map((bytes) => [key, bytes] as const),
      )
    ),
    array.sequence(task.ApplicativeSeq),
  )();

  const result = func.pipe(
    raw,
    array.map(
      either.map(
        ([key, value]) => kv.set(["cache", key], value),
      ),
    ),
    array.sequence(either.Applicative),
    either.match(
      (error) => {
        throw new Error(`Failed to process array: ${error}`);
      },
      (elem: Promise<Deno.KvCommitResult>[]) => elem,
    ),
  );

  await Promise.all(result);
};

/**
 * Retrieves the bytes of an image from the specified URL and stores it in the KV store.
 * If the image is already cached, it retrieves it from the cache instead.
 * @param key - The key to use for the cache defined in the configuration object.
 * @param overwrite - An optional flag indicating whether to overwrite the cached image. Defaults to `option.none`.
 * @returns A `taskEither` that resolves to the retrieved bytes of the image.
 */
export const fetchBytes = async (
  key: string,
  overwrite: option.Option<boolean> = option.none,
) => {
  const url = func.pipe(
    key,
    (key) => config.routes[key],
    option.fromNullable,
    option.getOrElse(() => Deno.env.get("FALLBACK_URL")!),
  );

  const cache = func.pipe(
    kv.get<ArrayBuffer>(["cache", key]),
    taskEither.of,
    taskEither.flatMap((promise) => taskEither.fromTask(() => promise)),
    taskEither.flatMap(func.flow(
      ({ value }) => value,
      option.fromNullable,
      option.match(
        () => data,
        (value) => taskEither.right(value),
      ),
    )),
  );

  const data = func.pipe(
    url,
    taskEither.tryCatchK(
      () => fetch(url),
      (reason) => new Error(String(reason)),
    ),
    taskEither.map((response) => response.arrayBuffer()),
    taskEither.flatMap((promise) => taskEither.fromTask(() => promise)),
  );

  const result = await func.pipe(
    overwrite,
    option.match(
      () => cache,
      (overwrite) => overwrite ? data : cache,
    ),
  )();

  return taskEither.fromEither(result);
};

/**
 * Retrieves the value from the config.routes object based on the request URL.
 * If the value is not found, it falls back to the value of the `FALLBACK_URL` environment variable.
 * @param request - The request object.
 * @returns The retrieved value or the fallback URL.
 */
const retrieve = (overwrite: option.Option<boolean>) =>
  func.flow(
    taskEither.tryCatchK(
      (url: string) => fetchBytes(url, overwrite),
      (reason) => new Error(String(reason)),
    ),
    taskEither.flatten,
  );

/**
 * Retrieves the path of the request URL given the request object.
 * @param request - The request object.
 * @returns The path of the request URL.
 */
export const path = func.flow(
  (request: Request) => new URL(request.url),
  (url) => url.pathname,
  (pathname) => pathname.slice(1),
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
    retrieve(option.none),
    build,
    task.map((response) => report(request, response, ctx)),
  )();

Deno.cron("refresh kv store", config.schedule, cron);

if (import.meta.main) {
  Deno.serve(handler);
}
