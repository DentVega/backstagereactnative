import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import * as Repack from '@callstack/repack';
import rspack from '@rspack/core';
import { SHARED_DEPS, CONTRACT_VERSION, buildMfShared } from './shared-deps.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Under pnpm the shared deps live in deeply-nested `.pnpm` paths whose version
// webpack can't always auto-detect ("No version specified..."), which breaks the
// `eager` share provision and makes them fall back to `loadShareSync` (fatal).
// Resolve the real installed version so each eager share is provided correctly.
const pkgVersion = (name) => require(`${name}/package.json`).version;

// Dev-mount (Mode 1): resolve @dev-miniapp to a local miniapp's Entry when
// DEV_MINIAPP_PATH is set, else a harmless placeholder. Read its declared
// capabilities so the dev grant satisfies the Entry gate.
const devMiniappPath = process.env.DEV_MINIAPP_PATH;
const devMiniappEntry = devMiniappPath
  ? path.resolve(devMiniappPath, 'src/Entry')
  : path.resolve(__dirname, 'src/dev/NoMiniapp');
let devMiniappCaps = [];
if (devMiniappPath) {
  try {
    devMiniappCaps =
      require(path.resolve(devMiniappPath, 'manifest.json')).capabilities ?? [];
  } catch {
    devMiniappCaps = [];
  }
}

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
      '@dev-miniapp': devMiniappEntry,
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
      __DEV_MINIAPP_CAPS__: JSON.stringify(devMiniappCaps),
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
