# Runtime guard `host-too-old` — Implementation Plan

> REQUIRED SUB-SKILL: superpowers:executing-plans (inline).

**Goal:** Enforcear `minHostContract` al montar — un host viejo rechaza (fallback `host-too-old`) una miniapp que exige un contract más nuevo.

## Global Constraints
- Repo `backstagereactnative`. `main` exige PR → todo en el branch `feat/host-too-old-guard`, un PR al final.
- Backward-compatible: sin `minHostContract` o sin `hostContractVersion` → no-op.
- `host-too-old` es **permanente** (no retryable). Tests: jest por package.
- Trailer en cada commit (Co-Authored-By + Claude-Session).

---

### Task 1: `gteVersion` en el contract package
**Files:** `packages/miniapp-contract/src/shared.ts`, `.../src/index.ts`, test `.../src/__tests__/shared.test.ts`

- [ ] **Test (agregar a shared.test.ts):**
```ts
import { gteVersion } from "../shared";
describe("gteVersion", () => {
  it("igual → true", () => expect(gteVersion("1.0.0", "1.0.0")).toBe(true));
  it("mayor → true", () => { expect(gteVersion("1.2.0","1.1.9")).toBe(true); expect(gteVersion("0.2.0","0.1.5")).toBe(true); });
  it("menor → false", () => { expect(gteVersion("0.1.0","0.2.0")).toBe(false); expect(gteVersion("1.0.0","1.0.1")).toBe(false); });
  it("parse inválido → false", () => expect(gteVersion("x","1.0.0")).toBe(false));
});
```
- [ ] **Impl** — en `shared.ts`, después de `satisfiesRange` (reusa `parseTriple`):
```ts
/** a >= b (semver). Parse inválido → false. */
export function gteVersion(a: string, b: string): boolean {
  const pa = parseTriple(a);
  const pb = parseTriple(b);
  if (pa === null || pb === null) return false;
  if (pa[0] !== pb[0]) return pa[0] > pb[0];
  if (pa[1] !== pb[1]) return pa[1] > pb[1];
  return pa[2] >= pb[2];
}
```
- [ ] **Export** — en `index.ts`, sumar `gteVersion` a la línea de `export { satisfiesRange, satisfiesShared }`.
- [ ] Correr `pnpm --filter @dentvega/miniapp-contract test shared` + `typecheck`. Commit.

---

### Task 2: `host-too-old` en loaderState + el chequeo en evaluate
**Files:** `packages/host-runtime/src/loaderState.ts`, `.../src/evaluate.ts`, test `.../src/__tests__/loader.test.ts`

- [ ] **loaderState.ts:** sumar `"host-too-old"` al type `FallbackReason` (NO tocar `RETRYABLE_REASONS` → queda permanente).
- [ ] **Test (loader.test.ts, en el describe de evaluateManifest o uno nuevo):**
```ts
const withMin = (rn: string, cv: string) => ({
  ...validManifest,
  shared: [{name:'react-native', requiredRange:'^0.76.0', singleton:true}],
  minHostContract: { reactNative: rn, contractVersion: cv },
});
describe('evaluateManifest — minHostContract (host-too-old)', () => {
  it('host más nuevo/igual → ok', () => {
    expect(evaluateManifest(withMin('0.76.0','0.1.0'), hostProvided, '0.1.0')).toMatchObject({ok:true});
  });
  it('host viejo en contractVersion → host-too-old', () => {
    expect(evaluateManifest(withMin('0.76.0','0.2.0'), hostProvided, '0.1.0')).toMatchObject({ok:false, reason:'host-too-old'});
  });
  it('host viejo en react-native → host-too-old', () => {
    expect(evaluateManifest(withMin('0.80.0','0.1.0'), hostProvided, '0.1.0')).toMatchObject({ok:false, reason:'host-too-old'});
  });
  it('sin hostContractVersion → no-op (ok)', () => {
    expect(evaluateManifest(withMin('0.80.0','0.2.0'), hostProvided)).toMatchObject({ok:true});
  });
  it('sin minHostContract → ok', () => {
    expect(evaluateManifest(validManifest, hostProvided, '0.1.0')).toMatchObject({ok:true});
  });
});
```
> `hostProvided` en loader.test.ts declara `react-native: 0.76.6`. `validManifest` ya existe.

- [ ] **evaluate.ts:** import `gteVersion`; nuevo 3er param; chequeo tras el skew:
```ts
import { isManifest, gteVersion, satisfiesShared, type Manifest, type SemVer } from "@dentvega/miniapp-contract";
...
export function evaluateManifest(
  manifest: unknown,
  hostProvided: HostProvided,
  hostContractVersion?: string,
): EvaluateResult {
  if (!isManifest(manifest)) return { ok: false, reason: "invalid-manifest", detail: "bad manifest shape" };
  const skew = satisfiesShared(hostProvided, manifest.shared);
  if (!skew.compatible) {
    const bad = skew.entries.filter((e) => e.status !== "ok").map((e) => `${e.name}(${e.status})`).join(", ");
    return { ok: false, reason: "skew", detail: `incompatible: ${bad}` };
  }
  const min = manifest.minHostContract;
  if (min !== undefined && hostContractVersion !== undefined) {
    const cvOk = gteVersion(hostContractVersion, min.contractVersion);
    const rnOk = gteVersion(hostProvided["react-native"] ?? "", min.reactNative);
    if (!cvOk || !rnOk) {
      const why = [!cvOk ? `contract ${hostContractVersion}<${min.contractVersion}` : null,
                   !rnOk ? `rn ${hostProvided["react-native"]}<${min.reactNative}` : null].filter(Boolean).join("; ");
      return { ok: false, reason: "host-too-old", detail: `host too old: ${why}` };
    }
  }
  return { ok: true, manifest };
}
```
- [ ] Correr `pnpm --filter @dentvega/host-runtime test loader` + typecheck. Commit.

---

### Task 3: Plumbing (useMiniapp + MiniappHost) + copy + component test
**Files:** `packages/host-runtime/src/useMiniapp.ts`, `.../src/MiniappHost.tsx`, test `.../src/__tests__/MiniappHost.test.tsx`

- [ ] **useMiniapp.ts:** `UseMiniappDeps` suma `hostContractVersion?: string`; extraer `const { ..., hostContractVersion } = deps;` NO (está en deps.hostContractVersion — usar `deps.hostContractVersion`); pasar a `evaluateManifest(resolved.manifest, hostProvided, deps.hostContractVersion)`; sumar `deps.hostContractVersion` a las deps del `useEffect`.
- [ ] **MiniappHost.tsx:** `MiniappHostProps` suma `hostContractVersion?: string`; pasar `hostContractVersion: props.hostContractVersion` a `useMiniapp({...})`; `FALLBACK_COPY` suma `"host-too-old": "Actualizá la app para usar esta miniapp.",`.
- [ ] **Test (MiniappHost.test.tsx, en el describe de retry UX o uno nuevo):**
```ts
it("host-too-old → fallback SIN botón Reintentar", async () => {
  const m = {...manifest(compatibleShared), minHostContract: { reactNative: "0.76.0", contractVersion: "0.2.0" }};
  render(
    <ThemeProvider scheme="light">
      <MiniappHost id={ID} resolveClient={mockResolve(resolvedWith(m))} chunkLoader={mockChunk}
        hostProvided={hostProvided} capabilities={grant} hostContractVersion="0.1.0" retry={{backoffMs:0}} />
    </ThemeProvider>,
  );
  expect(await screen.findByText(/Actualizá la app/)).toBeOnTheScreen();
  expect(screen.queryByText("Reintentar")).toBeNull();
});
```
- [ ] Correr `pnpm --filter @dentvega/host-runtime test MiniappHost` + suite del package + typecheck. Commit.

---

### Task 4: Activar en apps/host
**Files:** `apps/host/src/hostProvided.ts`, `apps/host/src/screens/MiniappScreen.tsx`

- [ ] **hostProvided.ts:** sumar `export const HOST_CONTRACT_VERSION = "0.1.0"; // sync con host package.json version`.
- [ ] **MiniappScreen.tsx:** importar `HOST_CONTRACT_VERSION` y pasarlo al `<MiniappHost ... hostContractVersion={HOST_CONTRACT_VERSION} />`.
- [ ] `pnpm --filter @app/host typecheck` (o el typecheck del host) limpio. Commit.

---

## Cierre
1. Suite completa de los packages tocados + typechecks verdes.
2. Push branch → PR (blast-radius NO toca deps del host → corre y pasa skippeando). Merge.
