# Auto-derivar `minHostContract` preciso (capability provenance) — Diseño

**Fecha:** 2026-08-03
**Estado:** Diseño aprobado — listo para plan
**Owner:** DentVega
**Repos:** `backstagereactnative` (fuente + contract) · `miniapp-template` (derivación) · miniapps (re-sync)

## 1. Contexto y objetivo

El runtime guard `host-too-old` (ya implementado) enforcea `minHostContract` al montar.
Hoy `gen-manifest-shared.mjs` del template **ya lo auto-deriva**, pero con la opción
**A (conservadora)**: `minHostContract = { reactNative: contract.reactNative,
contractVersion: contract.contractVersion }` — el host **al día del build**. Es
**over-strict**: una miniapp que solo usa capabilities viejas pero se buildeó con un
contract nuevo exige un host innecesariamente nuevo → hosts viejos la rechazan de más.

Objetivo: **opción B (precisa)** — cada miniapp exige el **mínimo** host que provee las
capabilities que **realmente usa**. Requiere una línea de tiempo "capability → en qué
contractVersion se introdujo", que se publica en el contract y consume el build de la miniapp.

## 2. Decisiones tomadas

1. **`CAPABILITY_SINCE`** (mapa de procedencia) vive en `apps/host/shared-deps.mjs` (fuente
   única, junto a `SHARED_DEPS` + `CONTRACT_VERSION`). Hoy todo `0.1.0` (baseline).
2. **Se publica en el contract** (`capabilitySince`) → el build de la miniapp lo fetchea.
3. **`contractVersion` de minHostContract = preciso**: el máximo (semver) de las versiones
   en que se introdujeron las capabilities que la miniapp usa.
4. **`reactNative` de minHostContract = opción ii**: el floor del `requiredRange` de
   react-native de la miniapp (ej. `^0.76.6` → `0.76.6`), no el del host. Coherente con
   "exigí solo lo que necesitás". (El skew de RN igual lo cubre el chequeo de `shared`.)
5. **Rollout-safe:** si el contract no trae `capabilitySince` → el template cae a la A
   actual. Nada rompe durante la transición.
6. **Fail-loud:** `gen-host-contract` aborta si una `SHARED_DEP` o un nativo autolinkeado
   no tiene entrada en `CAPABILITY_SINCE` (no publicar un mapa incompleto).

## 3. Componentes

### 3.1 `apps/host/shared-deps.mjs` — `CAPABILITY_SINCE`
```js
export const CAPABILITY_SINCE = {
  shared: {
    react: "0.1.0", "react-native": "0.1.0", "@tanstack/react-query": "0.1.0",
    "@shopify/flash-list": "0.1.0", zustand: "0.1.0",
    "@react-navigation/native": "0.1.0", "@react-navigation/native-stack": "0.1.0",
    "@dentvega/ui-kit": "0.1.0",
  },
  native: {
    "@shopify/flash-list": "0.1.0", "react-native-safe-area-context": "0.1.0",
    "react-native-screens": "0.1.0", "@callstack/repack": "0.1.0",
  },
};
```
Doc: al agregar una capability (bump minor de `CONTRACT_VERSION` por la política #3),
registrala acá con ese contractVersion.

### 3.2 `apps/host/scripts/gen-host-contract.mjs`
- `buildHostContract` acepta `capabilitySince` en opts y lo incluye (sigue pura).
- **Check de completitud** (pura + testeable): toda `SHARED_DEP` name debe estar en
  `capabilitySince.shared`, y todo nativo detectado en `capabilitySince.native`:
  ```js
  export function missingProvenance(sharedNames, nativeNames, capabilitySince) {
    const miss = [];
    for (const n of sharedNames) if (!(n in capabilitySince.shared)) miss.push(`shared:${n}`);
    for (const n of nativeNames) if (!(n in capabilitySince.native)) miss.push(`native:${n}`);
    return miss;
  }
  ```
  CLI: si `missingProvenance(...).length > 0` → `console.error` + `process.exit(1)`
  (salvo un opt-out si hiciera falta; por ahora sin opt-out — el mapa DEBE estar completo).
- El CLI pasa `capabilitySince: CAPABILITY_SINCE` a `buildHostContract`.

### 3.3 Contract package — `packages/miniapp-contract/src/types.ts`
```ts
readonly capabilitySince?: {
  readonly shared: Readonly<Record<string, string>>;
  readonly native: Readonly<Record<string, string>>;
};
```
Opcional (backward-compat; `isHostContract` ignora extras → Backstage lo guarda/sirve
sin cambios, igual que `generatedAt`).

### 3.4 Backstage — sin cambios
`PUT` hace `save(body)` completo; `GET` sirve `capabilitySince` transparente.

### 3.5 `miniapp-template/scripts/gen-manifest-shared.mjs`
Usa `semver` (ya es dep del template, lo usa `check-compat`). Helpers puros:
```js
/** El mínimo contractVersion que provee todas las capabilities usadas (max de sus "since"). */
export function deriveMinContractVersion(usedShared, usedNative, capabilitySince) {
  const cs = capabilitySince ?? { shared: {}, native: {} };
  const versions = [
    ...usedShared.map((n) => cs.shared[n]),
    ...usedNative.map((n) => cs.native[n]),
  ].filter(Boolean);
  if (versions.length === 0) return "0.0.0"; // no usa capabilities del host → cualquier host
  return semver.rsort([...versions])[0];
}

/** Floor del requiredRange de react-native del manifest.shared (opción ii). */
export function reactNativeFloor(sharedEntries, fallback) {
  const rn = sharedEntries.find((s) => s.name === "react-native");
  if (!rn) return fallback;
  const min = semver.minVersion(rn.requiredRange);
  return min ? min.version : fallback;
}
```
En el CLI, tras derivar `manifest.shared` + `manifest.nativeModules`:
```js
const usedShared = manifest.shared.map((s) => s.name);
if (contract.capabilitySince) {
  manifest.minHostContract = {
    reactNative: reactNativeFloor(manifest.shared, contract.reactNative),
    contractVersion: deriveMinContractVersion(usedShared, manifest.nativeModules, contract.capabilitySince),
  };
} else {
  // Rollout-safe: contract viejo sin capabilitySince → opción A (como hoy).
  manifest.minHostContract = { reactNative: contract.reactNative, contractVersion: contract.contractVersion };
}
```

### 3.6 Miniapps — operacional
Re-sync del template (Capa 2, botón "Actualizar desde template") → cada miniapp recibe el
nuevo `gen-manifest-shared` → re-publish → su manifest queda con el `minHostContract` preciso.

## 4. Data flow
```
apps/host/shared-deps.mjs  CAPABILITY_SINCE
  → gen-host-contract (check completitud) → contract.capabilitySince → PUT Backstage
Backstage GET /api/host-contract  (sirve capabilitySince)
  → miniapp CI: gen-manifest-shared fetchea el contract
     → deriveMinContractVersion(usedShared, usedNative, capabilitySince) + reactNativeFloor
     → manifest.minHostContract preciso
  → runtime guard host-too-old lo enforcea al montar
```

## 5. Manejo de errores / edge
- Mapa incompleto (falta una capability) → `gen-host-contract` aborta (fail-loud).
- Contract sin `capabilitySince` (viejo) → template cae a A (rollout-safe).
- Miniapp que no usa ninguna capability del host (imposible en la práctica — usa react-native)
  → `deriveMinContractVersion` devuelve `"0.0.0"` (cualquier host).
- Nativo que la miniapp usa pero el host no tiene → ignorado en la derivación (no está en
  `capabilitySince.native`); su incompatibilidad la caza el gate de natives, no este guard.

## 6. Testing
- **Host:** `missingProvenance` (detecta faltantes shared/native; vacío si completo);
  `buildHostContract` incluye `capabilitySince`; CLI aborta con mapa incompleto (node:test).
- **Template:** `deriveMinContractVersion` (max de used; ignora los que no mapean; vacío → "0.0.0");
  `reactNativeFloor` (`^0.76.6` → `0.76.6`; sin RN → fallback); integración de gen-manifest-shared
  (con `capabilitySince` → preciso; sin → A). node:test.
- **Contract package:** el type compila; `isHostContract` acepta un contract con `capabilitySince`.

## 7. Fuera de alcance (YAGNI)
- **Remove de una capability** (major bump): sacar la entrada de `CAPABILITY_SINCE` — las
  miniapps que la usaban dejan de derivar bien, pero eso es justo lo que un major rompe
  (se maneja con el gate de skew/natives + el major del contract). No hay lógica especial.
- **Historial de removes** (qué versión sacó qué) — YAGNI.
- Auto-abrir PRs de re-sync a toda la flota (el re-sync sigue por miniapp / botón).
