import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import * as Repack from '@callstack/repack';
import rspack from '@rspack/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Under pnpm the shared deps live in deeply-nested `.pnpm` paths whose version
// webpack can't always auto-detect ("No version specified..."), which breaks the
// `eager` share provision and makes them fall back to `loadShareSync` (fatal).
// Resolve the real installed version so each eager share is provided correctly.
const pkgVersion = (name) => require(`${name}/package.json`).version;

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
      shared: {
        react: {singleton: true, eager: true, requiredVersion: '18.3.1'},
        'react-native': {singleton: true, eager: true, requiredVersion: '0.76.6'},
        '@tanstack/react-query': {
          singleton: true,
          eager: true,
          version: pkgVersion('@tanstack/react-query'),
          requiredVersion: '^5.0.0',
        },
        '@shopify/flash-list': {
          singleton: true,
          eager: true,
          version: pkgVersion('@shopify/flash-list'),
          requiredVersion: '^1.7.0',
        },
        zustand: {
          singleton: true,
          eager: true,
          version: pkgVersion('zustand'),
          requiredVersion: '^5.0.0',
        },
        '@react-navigation/native': {
          singleton: true,
          eager: true,
          version: pkgVersion('@react-navigation/native'),
          requiredVersion: '^7.0.0',
        },
        '@react-navigation/native-stack': {
          singleton: true,
          eager: true,
          version: pkgVersion('@react-navigation/native-stack'),
          requiredVersion: '^7.0.0',
        },
        // Provide the design-system/theming lib to the share scope so remotes use
        // the host's ThemeProvider/ThemeContext (stateful → must be a singleton).
        '@org/ui-kit': {
          singleton: true,
          eager: true,
          version: pkgVersion('@org/ui-kit'),
          requiredVersion: '^0.1.0',
        },
      },
    }),
  ],
});
