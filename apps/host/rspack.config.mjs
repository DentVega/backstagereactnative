import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Repack from '@callstack/repack';
import rspack from '@rspack/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      remotes: {
        account_dashboard:
          'account_dashboard@http://localhost:8081/account_dashboard.container.js.bundle',
      },
      shared: {
        react: {singleton: true, eager: true, requiredVersion: '18.3.1'},
        'react-native': {singleton: true, eager: true, requiredVersion: '0.76.6'},
        '@tanstack/react-query': {singleton: true, requiredVersion: '^5.0.0'},
        '@shopify/flash-list': {singleton: true, requiredVersion: '^1.7.0'},
        zustand: {singleton: true, requiredVersion: '^5.0.0'},
        '@react-navigation/native': {singleton: true, requiredVersion: '^7.0.0'},
        '@react-navigation/native-stack': {
          singleton: true,
          requiredVersion: '^7.0.0',
        },
      },
    }),
  ],
});
