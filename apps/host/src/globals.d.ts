/** Injected by rspack DefinePlugin (host rspack.config.mjs). */
declare const __BACKSTAGE_URL__: string | undefined;
/** Dev-mount (Mode 1): active local miniapps (name + caps) for the Dev Mount picker. */
declare const __DEV_MINIAPPS__: { name: string; capabilities: string[] }[];
/** Dev remotes (Mode 2): raw "id=url,id2=url2" from DEV_REMOTES env. */
declare const __DEV_REMOTES__: string;
/** contractVersion del host (shared-deps.mjs CONTRACT_VERSION) → guard host-too-old. */
declare const __HOST_CONTRACT_VERSION__: string | undefined;

/**
 * Dev-mount (Mode 1): rspack aliases `@dev-miniapp-0`..`@dev-miniapp-5` to each
 * local miniapp's `src/Entry` (or the `NoMiniapp` placeholder for empty slots),
 * resolved by `apps/host/rspack.config.mjs` from DEV_MINIAPP_PATHS /
 * DEV_MINIAPP_PATH. Not real packages — type-only shape for tsc (wildcard).
 */
declare module '@dev-miniapp-*' {
  import type {ComponentType} from 'react';
  import type {MiniappEntryProps} from '@dentvega/miniapp-contract';
  const Entry: ComponentType<MiniappEntryProps>;
  export default Entry;
}
