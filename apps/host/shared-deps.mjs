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

/**
 * Procedencia de capabilities: en qué contractVersion se INTRODUJO cada singleton
 * y cada módulo nativo. Fuente para auto-derivar minHostContract PRECISO en las
 * miniapps (el mínimo host que provee lo que la miniapp usa). Al agregar una
 * capability (bump minor de CONTRACT_VERSION, política #3), registrala acá con ese
 * contractVersion. gen-host-contract falla si falta alguna (fail-loud).
 */
export const CAPABILITY_SINCE = {
  shared: {
    react: "0.1.0",
    "react-native": "0.1.0",
    "@tanstack/react-query": "0.1.0",
    "@shopify/flash-list": "0.1.0",
    zustand: "0.1.0",
    "@react-navigation/native": "0.1.0",
    "@react-navigation/native-stack": "0.1.0",
    "@dentvega/ui-kit": "0.1.0",
  },
  native: {
    "@shopify/flash-list": "0.1.0",
    "react-native-safe-area-context": "0.1.0",
    "react-native-screens": "0.1.0",
    "@callstack/repack": "0.1.0",
  },
};

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

/**
 * Runtime deps que el host bundlea — NO son singletons compartidos ni módulos nativos.
 * Mantener al día con package.json: el check de reconciliación (reconcileDeps) exige que
 * TODA runtime dep esté en SHARED_DEPS, en CAPABILITY_SINCE.native, o acá.
 */
export const BUNDLED_DEPS = ["@dentvega/host-runtime", "@dentvega/miniapp-contract"];

/**
 * Reconcilia las runtime deps del host contra su clasificación (shared | native | bundled).
 * Devuelve las violaciones (listas vacías = OK). Pura y testeable.
 *   - unclassified: deps del package.json sin clasificar → agregá una decisión consciente.
 *   - phantomShared: nombres en SHARED_DEPS que ya no son deps reales.
 *   - staleBundled:  nombres en BUNDLED_DEPS que ya no son deps reales.
 *   - conflicting:   un nombre en SHARED_DEPS y BUNDLED_DEPS a la vez (contradicción).
 * (No se exige native ⊆ deps: hay natives autolinkeados que son devDeps, ej. @callstack/repack.)
 */
export function reconcileDeps(dependencies, { shared, native, bundled }) {
  const classified = new Set([...shared, ...native, ...bundled]);
  const depSet = new Set(dependencies);
  return {
    unclassified: dependencies.filter((d) => !classified.has(d)),
    phantomShared: shared.filter((n) => !depSet.has(n)),
    staleBundled: bundled.filter((n) => !depSet.has(n)),
    conflicting: shared.filter((n) => bundled.includes(n)),
  };
}
