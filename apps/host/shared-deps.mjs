/**
 * Fuente ÚNICA de los shared singletons del host (Module Federation).
 * Consumida por rspack.config.mjs (para el `shared` de MF) y por
 * scripts/gen-host-contract.mjs (para el Host Contract). Antes estaba duplicada.
 */

/**
 * Versión del CONTRATO del host — fuente única. NO es la versión de la app: bumpea
 * solo cuando cambia lo que el host provee. La consumen gen-host-contract (el contract
 * publicado) y el runtime (guard host-too-old, vía DefinePlugin __HOST_CONTRACT_VERSION__).
 *
 * Política de bump (semver del contrato):
 *   - minor (0.1.0 → 0.2.0): agregar un singleton o un módulo nativo (aditivo — las
 *     miniapps viejas siguen; las nuevas pueden requerirlo con `minHostContract`).
 *   - major (0.x.y → 1.0.0): quitar/cambiar-incompatible un singleton o native, o bump
 *     mayor de react-native (rompe miniapps que dependían de lo viejo).
 *   - patch: tweaks que NO afectan el contrato.
 */
export const CONTRACT_VERSION = "0.1.0";

export const SHARED_DEPS = [
  { name: "react", requiredVersion: "18.3.1" },
  { name: "react-native", requiredVersion: "0.76.6" },
  { name: "@tanstack/react-query", requiredVersion: "^5.0.0", provideVersion: true },
  { name: "@shopify/flash-list", requiredVersion: "^1.7.0", provideVersion: true },
  { name: "zustand", requiredVersion: "^5.0.0", provideVersion: true },
  { name: "@react-navigation/native", requiredVersion: "^7.0.0", provideVersion: true },
  { name: "@react-navigation/native-stack", requiredVersion: "^7.0.0", provideVersion: true },
  { name: "@dentvega/ui-kit", requiredVersion: "^0.1.0", provideVersion: true },
];

/**
 * Construye el objeto `shared` de ModuleFederationPluginV2 a partir de SHARED_DEPS.
 * Todos son singleton+eager (invariante del host). Los `provideVersion` advierten la
 * versión resuelta (`pkgVersion(name)`); react/react-native no la llevan (igual que hoy).
 */
export function buildMfShared(deps, pkgVersion) {
  const shared = {};
  for (const d of deps) {
    shared[d.name] = { singleton: true, eager: true };
    if (d.provideVersion) shared[d.name].version = pkgVersion(d.name);
    shared[d.name].requiredVersion = d.requiredVersion;
  }
  return shared;
}
