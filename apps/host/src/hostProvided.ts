import type {HostProvided} from '@org/host-runtime';
import type {SemVer} from '@org/miniapp-contract';

/**
 * Concrete singleton versions the host provides through the Module Federation
 * shared scope. Used for version-skew evaluation before mounting a miniapp.
 * Keep in sync with rspack.config.mjs `shared`.
 */
export const HOST_PROVIDED: HostProvided = {
  react: '18.3.1' as SemVer,
  'react-native': '0.76.6' as SemVer,
  '@tanstack/react-query': '5.101.2' as SemVer,
  '@shopify/flash-list': '1.8.3' as SemVer,
};

/**
 * Base URL of the Backstage registry. Injected at build time by the rspack
 * DefinePlugin (from BACKSTAGE_URL); falls back to localhost for dev / jest.
 */
export const BACKSTAGE_BASE_URL =
  typeof __BACKSTAGE_URL__ !== 'undefined' ? __BACKSTAGE_URL__ : 'http://localhost:3999';
