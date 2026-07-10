import {ScriptManager, Script} from '@callstack/repack/client';
import type {ChunkLoader, EntryComponent} from '@org/host-runtime';
import type {ResolveResponse} from '@org/miniapp-contract';

/**
 * Concrete Re.Pack / Module Federation adapter (ADR-009).
 *
 * The remote `account_dashboard` is declared in rspack.config with a dev URL;
 * here we OVERRIDE that URL at runtime with the one Backstage resolved, then
 * consume the exposed `./Entry`. Isolated so the loader logic stays testable.
 */

// container name → resolved chunk URL (set just before importing).
const resolvedUrls = new Map<string, string>();
let resolverRegistered = false;

/** Register a ScriptManager resolver that serves Backstage-resolved URLs. */
export function setupScriptManager(): void {
  if (resolverRegistered) return;
  resolverRegistered = true;
  ScriptManager.shared.addResolver(async (scriptId: string, _caller?: string) => {
    // Federation remotes resolved via Backstage: match by known container names.
    for (const [container, url] of resolvedUrls) {
      if (scriptId === container || scriptId.startsWith(container)) {
        return {url: Script.getRemoteURL(url)};
      }
    }
    // Everything else is a LOCAL split chunk (vendors-*, async app chunks).
    // With the Module Federation async boundary these load through the
    // ScriptManager too, so they must resolve to the dev server in dev and to
    // the bundled filesystem location in release builds.
    return {
      url: __DEV__
        ? Script.getDevServerURL(scriptId)
        : Script.getFileSystemURL(scriptId),
    };
  });
}

export const repackChunkLoader: ChunkLoader = {
  async load(resolved: ResolveResponse): Promise<EntryComponent> {
    setupScriptManager();
    // `account_dashboard` is the MF container name (matches manifest.id).
    resolvedUrls.set('account_dashboard', resolved.url);
    // Static specifier so rspack wires the remote consumption; URL is dynamic.
    const mod = (await import('account_dashboard/Entry')) as {
      default: EntryComponent;
    };
    return mod.default;
  },
};
