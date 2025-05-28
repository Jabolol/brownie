export type CacheError =
  | { readonly _tag: "FetchError"; readonly error: Error }
  | { readonly _tag: "CacheError"; readonly error: Error };

export const makeFetchError = (error: Error): CacheError => ({
  _tag: "FetchError",
  error,
});

export const makeCacheError = (error: Error): CacheError => ({
  _tag: "CacheError",
  error,
});
