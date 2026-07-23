/** Injected by rspack DefinePlugin (host rspack.config.mjs). */
declare const __BACKSTAGE_URL__: string | undefined;
/** Dev-mount (Mode 1): capabilities of the local miniapp at DEV_MINIAPP_PATH. */
declare const __DEV_MINIAPP_CAPS__: string[];
/** Dev remotes (Mode 2): raw "id=url,id2=url2" from DEV_REMOTES env. */
declare const __DEV_REMOTES__: string;

/**
 * Dev-mount (Mode 1): rspack alias to a local miniapp's `src/Entry` (or the
 * `NoMiniapp` placeholder), resolved by `apps/host/rspack.config.mjs` from
 * `DEV_MINIAPP_PATH`. Not a real package — type-only shape for tsc.
 */
declare module '@dev-miniapp' {
  import type {ComponentType} from 'react';
  import type {MiniappEntryProps} from '@dentvega/miniapp-contract';
  const Entry: ComponentType<MiniappEntryProps>;
  export default Entry;
}
