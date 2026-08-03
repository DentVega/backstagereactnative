import type {HostProvided} from '@dentvega/host-runtime';
import type {SemVer} from '@dentvega/miniapp-contract';

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
 * contractVersion de ESTE binario del host — habilita el guard host-too-old:
 * una miniapp que declara `minHostContract` con un contractVersion mayor a este
 * no se monta (fallback "actualizá la app"). Inyectado en build-time por el
 * DefinePlugin desde la fuente única `shared-deps.mjs` (CONTRACT_VERSION); el
 * fallback es solo para jest/dev sin bundler.
 */
export const HOST_CONTRACT_VERSION =
  typeof __HOST_CONTRACT_VERSION__ !== 'undefined' ? __HOST_CONTRACT_VERSION__ : '0.1.0';

/**
 * Base URL of the Backstage registry. Injected at build time by the rspack
 * DefinePlugin (from BACKSTAGE_URL); falls back to localhost for dev / jest.
 */
export const BACKSTAGE_BASE_URL =
  typeof __BACKSTAGE_URL__ !== 'undefined' ? __BACKSTAGE_URL__ : 'http://localhost:3999';
