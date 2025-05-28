import { type RouteConfig } from "~/config.ts";

export interface Dependencies {
  readonly kv: Deno.Kv;
  readonly config: RouteConfig;
  readonly fetch: typeof fetch;
  readonly env: typeof Deno.env;
}

export interface CacheKey {
  readonly _tag: "CacheKey";
  readonly value: readonly ["cache", string];
}

export interface ImageBytes {
  readonly _tag: "ImageBytes";
  readonly value: ArrayBuffer;
}

export interface RouteKey {
  readonly _tag: "RouteKey";
  readonly value: string;
}

export const makeCacheKey = (key: string): CacheKey => ({
  _tag: "CacheKey",
  value: ["cache", key] as const,
});

export const makeImageBytes = (buffer: ArrayBuffer): ImageBytes => ({
  _tag: "ImageBytes",
  value: buffer,
});

export const makeRouteKey = (key: string): RouteKey => ({
  _tag: "RouteKey",
  value: key,
});
