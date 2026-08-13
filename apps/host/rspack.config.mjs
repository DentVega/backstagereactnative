import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import * as Repack from '@callstack/repack';
import rspack from '@rspack/core';
import { SHARED_DEPS, CONTRACT_VERSION, buildMfShared } from './shared-deps.mjs';
import {
  MAX_DEV_MINIAPPS,
  parseDevMiniappPaths,
  devMiniappName,
} from './scripts/dev-miniapps.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Under pnpm the shared deps live in deeply-nested `.pnpm` paths whose version
// webpack can't always auto-detect ("No version specified..."), which breaks the
// `eager` share provision and makes them fall back to `loadShareSync` (fatal).
// Resolve the real installed version so each eager share is provided correctly.
const pkgVersion = (name) => require(`${name}/package.json`).version;

// Dev-mount (Mode 1): alias @dev-miniapp-0..N-1 to local miniapps' `src/Entry`
// (empty slots → the NoMiniapp placeholder). Reads DEV_MINIAPP_PATHS (CSV) or the
// legacy single DEV_MINIAPP_PATH. Each active slot's {name, capabilities} (from
// its manifest.json) is injected as __DEV_MINIAPPS__ for the Dev Mount picker.
const devMiniappPaths = parseDevMiniappPaths(
  process.env.DEV_MINIAPP_PATHS,
  process.env.DEV_MINIAPP_PATH,
);
const noMiniappEntry = path.resolve(__dirname, 'src/dev/NoMiniapp');
const devMiniappAliases = {};
for (let i = 0; i < MAX_DEV_MINIAPPS; i++) {
  const p = devMiniappPaths[i];
  devMiniappAliases[`@dev-miniapp-${i}`] = p
    ? path.resolve(p, 'src/Entry')
    : noMiniappEntry;
}
const devMiniapps = devMiniappPaths.map((p) => {
  let name = devMiniappName(p);
  let capabilities = [];
  try {
    const manifest = require(path.resolve(p, 'manifest.json'));
    if (typeof manifest.id === 'string' && manifest.id) name = manifest.id;
    capabilities = manifest.capabilities ?? [];
  } catch {
    // path or manifest missing → keep the basename name + no caps
  }
  return { name, capabilities };
});

/**
 * Rspack configuration enhanced with Re.Pack defaults for React Native.
 *
 * Learn about Rspack configuration: https://rspack.dev/config/
 * Learn about Re.Pack configuration: https://re-pack.dev/docs/guides/configuration
 */

export default Repack.defineRspackConfig({
  context: __dirname,
  entry: './index.js',
  resolve: {
    ...Repack.getResolveOptions(),
    alias: {
      ...devMiniappAliases,
    },
  },
  module: {
    rules: [
      {
        test: /\.[cm]?[jt]sx?$/,
        type: 'javascript/auto',
        use: {
          loader: '@callstack/repack/babel-swc-loader',
          parallel: true,
          options: {},
        },
      },
      ...Repack.getAssetTransformRules(),
    ],
  },
  plugins: [
    new Repack.RepackPlugin(),
    // Inject the Backstage URL at build time (env-aware; dev falls back in code).
    new rspack.DefinePlugin({
      __BACKSTAGE_URL__: JSON.stringify(
        process.env.BACKSTAGE_URL ?? 'http://localhost:3999',
      ),
      __DEV_MINIAPPS__: JSON.stringify(devMiniapps),
      __DEV_REMOTES__: JSON.stringify(process.env.DEV_REMOTES ?? ''),
      // contractVersion del host (fuente única shared-deps.mjs) → guard host-too-old.
      __HOST_CONTRACT_VERSION__: JSON.stringify(CONTRACT_VERSION),
    }),
    /**
     * Module Federation v2 — the host container.
     * Bolt 4: consumes the `account_dashboard` remote. Its URL is a dev default;
     * the real URL is overridden at runtime by a ScriptManager resolver that
     * queries Backstage /api/resolve (see src/chunkLoader.ts, ADR-009).
     */
    new Repack.plugins.ModuleFederationPluginV2({
      name: 'host',
      // DTS type-hint streaming and the MF dev websocket are web/Node-only
      // devtools. Their runtime plugin (`dynamicRemoteTypeHints`) calls
      // `new (isomorphic-ws)()` at startup, which crashes Hermes with
      // "Cannot read property 'prototype' of undefined". Disable in React Native.
      dts: false,
      dev: false,
      remotes: {
        account_dashboard:
          'account_dashboard@http://localhost:8081/account_dashboard.container.js.bundle',
      },
      // All host-consumed singletons are `eager` so they are included in the
      // initial bundle. This keeps the synchronous entry (index.js) working —
      // without it, non-eager shared deps trigger `loadShareSync` (fatal) or get
      // split into async chunks that race AppRegistry.registerComponent. The
      // remote `account_dashboard` still consumes them from the shared scope.
      shared: buildMfShared(SHARED_DEPS, pkgVersion),
    }),
  ],
});
