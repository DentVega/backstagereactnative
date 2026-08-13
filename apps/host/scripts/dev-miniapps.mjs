/**
 * Dev-mount (Mode 1) path parsing — pure, no filesystem. Shared by
 * rspack.config.mjs (to build the `@dev-miniapp-N` aliases + `__DEV_MINIAPPS__`
 * metadata) and its unit test. Keeping it pure lets us test it with node:test.
 */

/** Max local miniapps dev-mountable at once (fixed slots → static imports). */
export const MAX_DEV_MINIAPPS = 6;

/**
 * Ordered, deduped, trimmed list of local miniapp paths to dev-mount, capped at
 * `max`. `pathsCsv` (DEV_MINIAPP_PATHS, comma-separated) takes precedence; falls
 * back to the single `singlePath` (DEV_MINIAPP_PATH) for back-compat.
 */
export function parseDevMiniappPaths(pathsCsv, singlePath, max = MAX_DEV_MINIAPPS) {
  const source =
    pathsCsv && pathsCsv.trim()
      ? pathsCsv.split(',')
      : singlePath
        ? [singlePath]
        : [];
  const seen = new Set();
  const out = [];
  for (const raw of source) {
    const p = (raw ?? '').trim();
    if (!p || seen.has(p)) continue;
    seen.add(p);
    out.push(p);
    if (out.length >= max) break;
  }
  return out;
}

/** Fallback display name for the picker, from a miniapp path (basename, sans `miniapp-`). */
export function devMiniappName(p) {
  const base = String(p).replace(/[/\\]+$/, '').split(/[/\\]/).pop() ?? '';
  return base.replace(/^miniapp[-_]/, '') || base || 'miniapp';
}
