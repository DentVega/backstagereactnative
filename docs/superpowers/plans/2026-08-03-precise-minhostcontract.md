# Auto-derivar minHostContract preciso — Implementation Plan

> REQUIRED SUB-SKILL: superpowers:executing-plans (inline).

**Goal:** minHostContract preciso (opción B) — cada miniapp exige el mínimo host que provee lo que usa, vía un mapa `CAPABILITY_SINCE` publicado en el contract.

## Global Constraints
- Multi-repo: **PR 1** = `backstagereactnative` (host+contract), **PR 2** = `miniapp-template`. `main` de ambos exige PR.
- Rollout-safe: contract sin `capabilitySince` → el template cae a la opción A actual.
- Fail-loud: `gen-host-contract` aborta con mapa incompleto.
- Tests: `node --test` (scripts .mjs), jest/tsc (package). Trailer en cada commit.

---

## PR 1 — Host repo (`backstagereactnative`), branch `feat/capability-provenance`

### Task 1: `CAPABILITY_SINCE` en shared-deps
**Files:** `apps/host/shared-deps.mjs`, test `apps/host/scripts/__tests__/shared-deps.test.mjs`

- [ ] **Test:** que `CAPABILITY_SINCE` exista, con una entrada por cada `SHARED_DEP` y por los 4 natives:
```js
import { SHARED_DEPS, CONTRACT_VERSION, CAPABILITY_SINCE, buildMfShared } from "../../shared-deps.mjs";

test("CAPABILITY_SINCE cubre toda SHARED_DEP", () => {
  for (const d of SHARED_DEPS) assert.equal(typeof CAPABILITY_SINCE.shared[d.name], "string");
});
test("CAPABILITY_SINCE.native tiene los 4 nativos del host", () => {
  for (const n of ["@shopify/flash-list", "react-native-safe-area-context", "react-native-screens", "@callstack/repack"])
    assert.equal(typeof CAPABILITY_SINCE.native[n], "string");
});
```
- [ ] **Impl** — en `shared-deps.mjs`, después de `CONTRACT_VERSION`:
```js
/**
 * Procedencia de capabilities: en qué contractVersion se INTRODUJO cada singleton
 * y cada módulo nativo. Fuente para auto-derivar minHostContract preciso en las
 * miniapps. Al agregar una capability (bump minor de CONTRACT_VERSION), registrala
 * acá con ese contractVersion. gen-host-contract falla si falta alguna (fail-loud).
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
```
- [ ] `node --test apps/host/scripts/__tests__/shared-deps.test.mjs` verde. Commit.

### Task 2: publicar `capabilitySince` + check de completitud
**Files:** `apps/host/scripts/gen-host-contract.mjs`, test `apps/host/scripts/__tests__/gen-host-contract.test.mjs`

- [ ] **Test (node:test):**
```js
import { buildHostContract, parseAutolinkedNatives, requireNativeModules, missingProvenance } from "../gen-host-contract.mjs";

const SINCE = { shared: { react: "0.1.0" }, native: { "react-native-screens": "0.1.0" } };
test("missingProvenance: completo → []", () => {
  assert.deepEqual(missingProvenance(["react"], ["react-native-screens"], SINCE), []);
});
test("missingProvenance: detecta faltantes shared/native", () => {
  const m = missingProvenance(["react", "zustand"], ["react-native-mmkv"], SINCE);
  assert.deepEqual(m.sort(), ["native:react-native-mmkv", "shared:zustand"]);
});
test("buildHostContract incluye capabilitySince cuando se pasa", () => {
  const c = buildHostContract(SHARED_DEPS, fakePkg, { contractVersion: "1.0.0", capabilitySince: SINCE });
  assert.deepEqual(c.capabilitySince, SINCE);
  assert.equal(isHostContract(c), true);
});
```
(reusa `SHARED_DEPS`, `fakePkg`, `isHostContract` ya importados en el archivo).

- [ ] **Impl** — en `gen-host-contract.mjs`:
  - Import: `import { SHARED_DEPS, CONTRACT_VERSION, CAPABILITY_SINCE } from "../shared-deps.mjs";`
  - `buildHostContract` — sumar `capabilitySince` a las opts + al output:
    ```js
    export function buildHostContract(
      deps, resolveVersion,
      { contractVersion, nativeModules = [], generatedAt, hostCommit, capabilitySince },
    ) {
      const shared = {};
      for (const d of deps) shared[d.name] = resolveVersion(d.name);
      return {
        contractVersion,
        reactNative: resolveVersion("react-native"),
        shared,
        nativeModules,
        ...(capabilitySince !== undefined ? { capabilitySince } : {}),
        ...(generatedAt !== undefined ? { generatedAt } : {}),
        ...(hostCommit !== undefined ? { hostCommit } : {}),
      };
    }
    ```
  - Nueva función pura `missingProvenance` (después de `requireNativeModules`):
    ```js
    /** Capabilities (shared+native) sin entrada en capabilitySince. Vacío = completo. */
    export function missingProvenance(sharedNames, nativeNames, capabilitySince) {
      const cs = capabilitySince ?? { shared: {}, native: {} };
      const miss = [];
      for (const n of sharedNames) if (!(n in cs.shared)) miss.push(`shared:${n}`);
      for (const n of nativeNames) if (!(n in cs.native)) miss.push(`native:${n}`);
      return miss;
    }
    ```
  - CLI — tras `nativeModules = requireNativeModules(...)`, ANTES de buildHostContract:
    ```js
    const missing = missingProvenance(SHARED_DEPS.map((d) => d.name), nativeModules, CAPABILITY_SINCE);
    if (missing.length > 0) {
      console.error(
        `gen-host-contract: capabilities sin procedencia en CAPABILITY_SINCE: ${missing.join(", ")}. ` +
          `Agregá su contractVersion en shared-deps.mjs (bump minor).`,
      );
      process.exit(1);
    }
    ```
  - CLI — pasar `capabilitySince: CAPABILITY_SINCE` a buildHostContract (junto a contractVersion, nativeModules, generatedAt, hostCommit).

- [ ] `node --test apps/host/scripts/__tests__/gen-host-contract.test.mjs` verde. Correr `node scripts/gen-host-contract.mjs` (desde apps/host) → escribe el json con `capabilitySince` + 4 natives, sin abortar. Commit.

### Task 3: type `capabilitySince?` en el contract package
**Files:** `packages/miniapp-contract/src/types.ts`, test `packages/miniapp-contract/src/__tests__/host-contract.test.ts`

- [ ] **Impl** — en `HostContract` (después de `hostCommit?`):
```ts
  /** Procedencia (opcional): en qué contractVersion se introdujo cada capability. */
  readonly capabilitySince?: {
    readonly shared: Readonly<Record<string, string>>;
    readonly native: Readonly<Record<string, string>>;
  };
```
- [ ] **Test** — agregar a `host-contract.test.ts` un caso: un contract con `capabilitySince` → `isHostContract` true (los extras se ignoran).
- [ ] `pnpm --filter @dentvega/miniapp-contract test host-contract` + `typecheck` verdes. Commit.

**Cierre PR 1:** push branch → PR. `blast-radius` corre el chequeo COMPLETO (toca `apps/host/shared-deps.mjs`) → debe pasar (solo agrega metadata, no cambia singletons/natives). Merge → auto-publica el contract con `capabilitySince`.

---

## PR 2 — Template repo (`miniapp-template`), branch `feat/precise-minhostcontract`

### Task 4: derivación precisa en gen-manifest-shared
**Files:** `scripts/gen-manifest-shared.mjs`, test `scripts/__tests__/gen-manifest-shared.test.mjs`

- [ ] **Test (node:test):**
```js
import semver from "semver";
import { deriveMinContractVersion, reactNativeFloor } from "../gen-manifest-shared.mjs";

const SINCE = {
  shared: { react: "0.1.0", "react-native": "0.1.0", "react-native-reanimated": "0.2.0" },
  native: { "react-native-reanimated": "0.2.0", "react-native-mmkv": "0.3.0" },
};

test("deriveMinContractVersion: máximo de los since usados", () => {
  assert.equal(deriveMinContractVersion(["react", "react-native"], [], SINCE), "0.1.0");
  assert.equal(deriveMinContractVersion(["react-native-reanimated"], [], SINCE), "0.2.0");
  assert.equal(deriveMinContractVersion([], ["react-native-mmkv"], SINCE), "0.3.0");
  assert.equal(deriveMinContractVersion(["react"], ["react-native-mmkv"], SINCE), "0.3.0"); // max
});
test("deriveMinContractVersion: ignora lo que no mapea; vacío → 0.0.0", () => {
  assert.equal(deriveMinContractVersion(["no-existe"], [], SINCE), "0.0.0");
});
test("reactNativeFloor: floor del requiredRange (^0.76.6 → 0.76.6)", () => {
  const shared = [{ name: "react-native", requiredRange: "^0.76.6", singleton: true }];
  assert.equal(reactNativeFloor(shared, "9.9.9"), "0.76.6");
});
test("reactNativeFloor: sin react-native → fallback", () => {
  assert.equal(reactNativeFloor([{ name: "react", requiredRange: "^18.0.0" }], "0.76.6"), "0.76.6");
});
```

- [ ] **Impl** — en `gen-manifest-shared.mjs`:
  - Import (arriba): `import semver from "semver";`
  - Helpers puros (después de `deriveShared`):
    ```js
    /** El mínimo contractVersion que provee todas las capabilities usadas (max de sus "since"). */
    export function deriveMinContractVersion(usedShared, usedNative, capabilitySince) {
      const cs = capabilitySince ?? { shared: {}, native: {} };
      const versions = [
        ...usedShared.map((n) => cs.shared[n]),
        ...usedNative.map((n) => cs.native[n]),
      ].filter(Boolean);
      if (versions.length === 0) return "0.0.0";
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
  - CLI — reemplazar la línea actual de minHostContract:
    ```js
    // ANTES:
    // manifest.minHostContract = { reactNative: contract.reactNative, contractVersion: contract.contractVersion };
    // DESPUÉS (preciso, con fallback rollout-safe):
    manifest.nativeModules = miniappNativeModules();
    const usedShared = manifest.shared.map((s) => s.name);
    if (contract.capabilitySince) {
      manifest.minHostContract = {
        reactNative: reactNativeFloor(manifest.shared, contract.reactNative),
        contractVersion: deriveMinContractVersion(usedShared, manifest.nativeModules, contract.capabilitySince),
      };
    } else {
      manifest.minHostContract = { reactNative: contract.reactNative, contractVersion: contract.contractVersion };
    }
    ```
    > Ojo el orden: `manifest.nativeModules` debe computarse ANTES de derivar (la derivación lo usa). En el CLI actual `nativeModules` se setea después de `minHostContract`; moverlo arriba.

- [ ] `node --test scripts/__tests__/gen-manifest-shared.test.mjs` verde. Commit → push → PR (el template no tiene blast-radius; su check es su CI si lo tuviera — mergear normal). Merge.

---

## Operacional (post-merge, fuera del código)
1. Confirmar que el contract live trae `capabilitySince` (curl /api/host-contract).
2. Re-sync del template en cada miniapp (botón "Actualizar desde template" / dispatch `template-sync.yml`) → PR de sync → merge → trae el nuevo gen-manifest-shared.
3. Re-publish de cada miniapp → su manifest queda con minHostContract preciso.
4. Verificar en un `/api/resolve?id=<id>` que el manifest tiene `minHostContract` derivado.
