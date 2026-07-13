import {ScriptManager, Script} from '@callstack/repack/client';
import type {ChunkLoader, EntryComponent} from '@org/host-runtime';
import type {ResolveResponse} from '@org/miniapp-contract';

/**
 * The Module Federation v2 runtime instance, reached through the global it
 * publishes (`__FEDERATION__.__INSTANCES__`). We can't `import` the runtime by
 * specifier — React Native's Re.Pack resolver doesn't honour the
 * `@module-federation/enhanced/runtime` subpath export — but the instance is
 * already initialised in the bundle by ModuleFederationPluginV2.
 */
interface MFInstance {
  name?: string;
  registerRemotes: (
    remotes: Array<{name: string; entry: string; alias?: string; type?: string}>,
    options?: {force?: boolean},
  ) => void;
}

function getFederationHost(): MFInstance | undefined {
  const fed = (globalThis as {__FEDERATION__?: {__INSTANCES__?: MFInstance[]}})
    .__FEDERATION__;
  const instances = fed?.__INSTANCES__;
  if (!instances || instances.length === 0) return undefined;
  return instances.find((i) => i.name === 'host') ?? instances[0];
}

/**
 * Concrete Re.Pack / Module Federation adapter (ADR-009).
 *
 * The remote `account_dashboard` is declared in rspack.config with a dev URL.
 * At runtime we OVERRIDE it with the URL Backstage resolved, then consume the
 * exposed `./Entry`. Isolated so the loader logic stays testable.
 */

// container name → resolved container URL, and → base URL (dir) for its chunks.
const resolvedUrls = new Map<string, string>();
const resolvedBases = new Map<string, string>();
let resolverRegistered = false;

/**
 * Register a ScriptManager resolver. Three cases:
 *  1. The container entry itself (scriptId === container name) → the resolved URL.
 *  2. The remote's OWN split chunks — a remote container requests them and passes
 *     its name as `caller`; serve them from the remote's base URL (same dir as the
 *     container), NOT the host dev server. These are `<scriptId>.chunk.bundle`.
 *  3. Everything else = host-local chunks → dev server (dev) / filesystem (release).
 */
export function setupScriptManager(): void {
  if (resolverRegistered) return;
  resolverRegistered = true;
  ScriptManager.shared.addResolver(async (scriptId: string, caller?: string) => {
    // Our URLs already carry the full filename, so tell Re.Pack NOT to append a
    // chunk extension (default getRemoteURL runs them through webpackContext.u(),
    // which tacks on an extension → `…bundle.javascript` → 404).
    const asIs = {excludeExtension: true};
    // 1. Remote container entry.
    const containerUrl = resolvedUrls.get(scriptId);
    if (containerUrl !== undefined) {
      return {url: Script.getRemoteURL(containerUrl, asIs)};
    }
    // 2. A remote's own split chunk (caller is the remote container name).
    if (caller !== undefined && resolvedBases.has(caller)) {
      const base = resolvedBases.get(caller)!;
      return {url: Script.getRemoteURL(`${base}${scriptId}.chunk.bundle`, asIs)};
    }
    // 3. Host-local chunk.
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
    // Base dir the container's own chunks are served from (same dir as container).
    resolvedBases.set('account_dashboard', resolved.url.replace(/\/[^/]*$/, '/'));
    // MF v2's RepackCorePlugin loads the remote entry from `remoteInfo.entry`
    // (the STATIC rspack `remotes` URL) via ScriptManager.loadScript with an
    // explicit URL — which bypasses ScriptManager resolvers. So a resolver can't
    // redirect the entry. Instead re-register the remote at runtime with the
    // Backstage-resolved URL; `force` replaces the static entry. This is what
    // makes dynamic resolution (ADR-009) actually reach MF v2 on-device.
    getFederationHost()?.registerRemotes(
      [{name: 'account_dashboard', entry: resolved.url, type: 'global'}],
      {force: true},
    );
    // Static specifier so rspack wires the remote consumption; URL is dynamic.
    const mod = (await import('account_dashboard/Entry')) as {
      default: EntryComponent;
    };
    return mod.default;
  },
};
