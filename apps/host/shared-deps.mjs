/**
 * Fuente ÚNICA de los shared singletons del host (Module Federation).
 * Consumida por rspack.config.mjs (para el `shared` de MF) y por
 * scripts/gen-host-contract.mjs (para el Host Contract). Antes estaba duplicada.
 */
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
