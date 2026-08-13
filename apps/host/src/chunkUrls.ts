/**
 * Pure helpers to build the URLs for a remote miniapp's own split chunks.
 *
 * A remote container resolves to a URL that MAY carry a query string: the dev
 * server (`webpack-start`, dev-loop Mode 2) only serves assets at
 * `?platform=<p>`, whereas a published chunk (R2 / Backstage) carries none. The
 * container's own split chunks live in the same directory, so we derive the base
 * dir AND re-append the SAME query to each chunk URL. Dropping the query 404s the
 * chunks on the dev server (the container loads, its chunks don't). Kept pure and
 * repack-free so it's unit-testable — see chunkLoader.ts for the resolver wiring.
 */

/** Split a resolved container URL into its chunk base dir and query string. */
export function chunkBaseAndQuery(containerUrl: string): {
  base: string;
  query: string;
} {
  const q = containerUrl.indexOf('?');
  const pathPart = q === -1 ? containerUrl : containerUrl.slice(0, q);
  const query = q === -1 ? '' : containerUrl.slice(q);
  return {base: pathPart.replace(/\/[^/]*$/, '/'), query};
}

/** URL for a remote's own split chunk `<scriptId>.chunk.bundle`, carrying the query. */
export function remoteChunkUrl(
  base: string,
  scriptId: string,
  query: string,
): string {
  return `${base}${scriptId}.chunk.bundle${query}`;
}

/**
 * A resolved URL points at the miniapp DEV server (dev-loop Mode 2) iff it carries
 * a query string — published chunks (R2 / Backstage) never do. Dev-server scripts
 * must load with `cache: false` so each app reload refetches fresh code; otherwise
 * Re.Pack serves the on-disk cached bundle (default `cache: true`) and edits never
 * show up, even after a reload.
 */
export function isDevServerUrl(url: string): boolean {
  return url.includes('?');
}
