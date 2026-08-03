# UX de errores en el host — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retry self-contained + auto-retry (1×, backoff) en fallas transitorias, sin botón de retry en fallas permanentes, en el loader del host.

**Architecture:** `useMiniapp` corre un loop de intentos (auto-retry 1× en razones retryables) y expone `reload()` + `retrying`; `MiniappHost` muestra "Reintentar" solo en razones retryables (`onRetry ?? reload`) y "Reintentando…" durante el auto-retry.

**Tech Stack:** TypeScript, React Native, jest + @testing-library/react-native, package `host-runtime`.

## Global Constraints

- **Owner:** DentVega. **Repo:** `backstagereactnative`, package `packages/host-runtime`. Commits **locales** (push tras la review final). Directo a `main`.
- **Backward-compatible:** `props.onRetry` sigue funcionando (si se pasa, tiene precedencia sobre el `reload` built-in). `useMiniapp` sigue devolviendo `state` + `Entry` (suma `reload` + `retrying`).
- **Clasificación:** retryable = `resolve-failed` | `download-failed` | `integrity-failed`; permanente = `skew` | `invalid-manifest`.
- **Defaults:** `maxAuto = 1`, `backoffMs = 800`. Config vía `retry?: { maxAuto?; backoffMs? }`.
- **Cancelación:** respetar `cancelled.current` después del `resolve`, `verify`, `load` y **después del sleep** del backoff.
- Preservar el `console.warn("[miniapp] load failed:", detail)`.
- Test framework: **jest** (`pnpm --filter @dentvega/host-runtime test`).
- Commits con trailer:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01MPXCf3ev2d17B2N5RgKVJS
  ```

---

### Task 1: `isRetryable` en `loaderState.ts`

**Files:**
- Modify: `packages/host-runtime/src/loaderState.ts`
- Test: `packages/host-runtime/src/__tests__/loader.test.ts` (agregar un describe)

**Interfaces:**
- Produces: `isRetryable(reason: FallbackReason): boolean`.

- [ ] **Step 1: Test que falla** — agregar al final de `loader.test.ts`:
```ts
import { isRetryable } from '../loaderState';

describe('isRetryable', () => {
  it('transitorias son retryable', () => {
    expect(isRetryable('resolve-failed')).toBe(true);
    expect(isRetryable('download-failed')).toBe(true);
    expect(isRetryable('integrity-failed')).toBe(true);
  });
  it('permanentes no son retryable', () => {
    expect(isRetryable('skew')).toBe(false);
    expect(isRetryable('invalid-manifest')).toBe(false);
  });
});
```

- [ ] **Step 2: Correr — falla** (`pnpm --filter @dentvega/host-runtime test loader`).

- [ ] **Step 3: Impl** — en `loaderState.ts`, después del type `FallbackReason`:
```ts
const RETRYABLE_REASONS: ReadonlySet<FallbackReason> = new Set([
  "resolve-failed",
  "download-failed",
  "integrity-failed",
]);

/** Retryable = transient (network/CDN/partial download); permanent = skew / invalid-manifest. */
export function isRetryable(reason: FallbackReason): boolean {
  return RETRYABLE_REASONS.has(reason);
}
```

- [ ] **Step 4: Correr — pasa** + `pnpm --filter @dentvega/host-runtime typecheck` limpio.
- [ ] **Step 5: Commit**
```bash
git add packages/host-runtime/src/loaderState.ts packages/host-runtime/src/__tests__/loader.test.ts
git commit  # feat(host-runtime): isRetryable — classify transient vs permanent fallbacks  (+ trailer)
```

---

### Task 2: `useMiniapp` — retry loop + reload + retrying

**Files:**
- Modify: `packages/host-runtime/src/useMiniapp.ts`

**Interfaces:**
- Consumes: `isRetryable`, `FallbackReason` de `./loaderState`.
- Produces: `UseMiniappDeps.retry?`, `UseMiniappResult { state, Entry, reload, retrying }`.

- [ ] **Step 1: Reemplazar el archivo entero** — `packages/host-runtime/src/useMiniapp.ts`:
```ts
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { MiniappId } from "@dentvega/miniapp-contract";
import {
  initialLoaderState,
  isRetryable,
  nextLoaderState,
  type FallbackReason,
  type LoaderState,
} from "./loaderState";
import { evaluateManifest, type HostProvided } from "./evaluate";
import type { ResolveClient } from "./ResolveClient";
import type { ChunkLoader, EntryComponent } from "./ChunkLoader";
import { noopVerifier, type IntegrityVerifier } from "./integrity";

export interface UseMiniappDeps {
  id: MiniappId;
  resolveClient: ResolveClient;
  chunkLoader: ChunkLoader;
  hostProvided: HostProvided;
  integrity?: IntegrityVerifier;
  /** Auto-retry en fallas transitorias. Defaults: maxAuto=1, backoffMs=800. */
  retry?: { maxAuto?: number; backoffMs?: number };
}

export interface UseMiniappResult {
  state: LoaderState;
  Entry: EntryComponent | null;
  /** Re-corre el pipeline (retry manual, budget de auto-retry fresco). */
  reload: () => void;
  /** True mientras un auto-retry está en vuelo (para mostrar "Reintentando…"). */
  retrying: boolean;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * Drives resolve → evaluate → verify → load → mount, mapping every failure to a
 * fallback state (never throws into the React tree). Auto-retries transient
 * failures (isRetryable) up to `maxAuto` times with a backoff before giving up.
 */
export function useMiniapp(deps: UseMiniappDeps): UseMiniappResult {
  const { id, resolveClient, chunkLoader, hostProvided } = deps;
  const integrity = deps.integrity ?? noopVerifier;
  const maxAuto = deps.retry?.maxAuto ?? 1;
  const backoffMs = deps.retry?.backoffMs ?? 800;

  const [state, dispatch] = useReducer(nextLoaderState, initialLoaderState);
  const [Entry, setEntry] = useState<EntryComponent | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const cancelled = useRef(false);

  const reload = useCallback(() => setAttempt((a) => a + 1), []);

  useEffect(() => {
    cancelled.current = false;
    setRetrying(false);

    (async () => {
      for (let tryNo = 0; ; tryNo++) {
        if (tryNo > 0) setRetrying(true);
        dispatch({ type: "start" });

        let failure: { reason: FallbackReason; detail: string } | null = null;
        let component: EntryComponent | null = null;
        try {
          const resolved = await resolveClient.resolve({ id });
          if (cancelled.current) return;

          const evaluated = evaluateManifest(resolved.manifest, hostProvided);
          if (!evaluated.ok) {
            failure = { reason: evaluated.reason, detail: evaluated.detail };
          } else {
            const intact = await integrity.verify(resolved);
            if (cancelled.current) return;
            if (!intact) {
              failure = { reason: "integrity-failed", detail: "integrity check failed" };
            } else {
              dispatch({ type: "resolved", resolved });
              component = await chunkLoader.load(resolved);
              if (cancelled.current) return;
            }
          }
        } catch (err) {
          const detail = err instanceof Error ? err.message : "unknown error";
          // Surface the failure so miniapp load errors are diagnosable in the field.
          console.warn("[miniapp] load failed:", detail);
          failure = {
            reason: detail.startsWith("resolve failed") ? "resolve-failed" : "download-failed",
            detail,
          };
        }
        if (cancelled.current) return;

        if (failure === null && component !== null) {
          const mounted = component;
          setEntry(() => mounted);
          dispatch({ type: "mounted" });
          setRetrying(false);
          return;
        }

        const f = failure ?? { reason: "download-failed" as FallbackReason, detail: "no component" };
        if (isRetryable(f.reason) && tryNo < maxAuto) {
          await sleep(backoffMs);
          if (cancelled.current) return;
          continue;
        }
        dispatch({ type: "fail", reason: f.reason, detail: f.detail });
        setRetrying(false);
        return;
      }
    })();

    return () => {
      cancelled.current = true;
    };
  }, [id, resolveClient, chunkLoader, hostProvided, integrity, attempt, maxAuto, backoffMs]);

  return { state, Entry, reload, retrying };
}
```

- [ ] **Step 2: Typecheck** — `pnpm --filter @dentvega/host-runtime typecheck` limpio. (La cobertura de comportamiento va en Task 4, vía el component test.)
- [ ] **Step 3: Commit**
```bash
git add packages/host-runtime/src/useMiniapp.ts
git commit  # feat(host-runtime): useMiniapp auto-retries transient failures + exposes reload/retrying  (+ trailer)
```

---

### Task 3: `MiniappHost.tsx` — UI (retry condicional + retrying)

**Files:**
- Modify: `packages/host-runtime/src/MiniappHost.tsx`

**Interfaces:**
- Consumes: `useMiniapp` (`reload`, `retrying`), `isRetryable` de `./loaderState`.
- Produces: `MiniappHostProps.retry?`.

- [ ] **Step 1: Editar `MiniappHost.tsx`.**

Import de `isRetryable` (junto a los tipos de `loaderState`):
```ts
import { isRetryable } from "./loaderState";
import type { FallbackReason } from "./loaderState";
```

`MiniappHostProps` — sumar `retry?`:
```ts
  onRetry?: () => void;
  retry?: { maxAuto?: number; backoffMs?: number };
```

Copy de `skew` — afinar a terminal:
```ts
  skew: "Esta miniapp no es compatible con esta versión de la app. Actualizá la app para usarla.",
```

Llamada a `useMiniapp` — pasar `retry` y tomar `reload`/`retrying`:
```ts
  const { state, Entry, reload, retrying } = useMiniapp({
    id: props.id,
    resolveClient: props.resolveClient,
    chunkLoader: props.chunkLoader,
    hostProvided: props.hostProvided,
    integrity: props.integrity,
    retry: props.retry,
  });
```

Rama `fallback` — botón solo si retryable, `onRetry ?? reload`:
```tsx
  if (state.status === "fallback") {
    const canRetry = isRetryable(state.reason);
    return (
      <Box padding="xl" gap="sm" style={styles.center}>
        <AppText variant="title" color="danger" accessibilityRole="header">
          Miniapp no disponible
        </AppText>
        <AppText variant="body" color="textMuted">
          {FALLBACK_COPY[state.reason]}
        </AppText>
        {canRetry ? (
          <Button label="Reintentar" onPress={props.onRetry ?? reload} />
        ) : null}
      </Box>
    );
  }
```

Rama loading — sumar "Reintentando…" cuando `retrying`:
```tsx
  return (
    <View
      testID="miniapp-loading"
      style={[styles.center, { backgroundColor: theme.colors.background }]}
    >
      <ActivityIndicator color={theme.colors.primary} />
      {retrying ? (
        <AppText variant="body" color="textMuted">
          Reintentando…
        </AppText>
      ) : null}
    </View>
  );
```
> El `import type { FallbackReason }` puede ya no ser necesario si no se usa directamente — dejarlo solo si TS lo pide; si queda sin usar, no agregarlo.

- [ ] **Step 2: Typecheck** — `pnpm --filter @dentvega/host-runtime typecheck` limpio.
- [ ] **Step 3: Commit**
```bash
git add packages/host-runtime/src/MiniappHost.tsx
git commit  # feat(host-runtime): retry button only for retryable fallbacks + built-in reload + retrying UI  (+ trailer)
```

---

### Task 4: Tests de comportamiento (component)

**Files:**
- Modify: `packages/host-runtime/src/__tests__/MiniappHost.test.tsx`

- [ ] **Step 1: Agregar helpers + casos** al final de `MiniappHost.test.tsx` (dentro del describe existente o uno nuevo). Reutiliza `ID`, `hostProvided`, `grant`, `manifest`, `resolvedWith`, `compatibleShared`, `mockResolve` ya definidos arriba en el archivo. Agregar imports que falten: `fireEvent` de `@testing-library/react-native`, `Text` de `react-native` (ya está), y `EntryComponent` (ya importado).

```tsx
// --- helpers para retry ---
const OkEntry: EntryComponent = () => <Text>MINIAPP OK</Text>;
const okLoader: ChunkLoader = { load: async () => OkEntry };

/** Falla las primeras `failures` llamadas a resolve, después devuelve `resp`. */
function flakyResolve(failures: number, resp: ResolveResponse): ResolveClient {
  let n = 0;
  return {
    resolve: async () => {
      if (n++ < failures) throw new Error("resolve failed: transient");
      return resp;
    },
  };
}

function renderHost(overrides: Partial<React.ComponentProps<typeof MiniappHost>>) {
  return render(
    <ThemeProvider>
      <MiniappHost
        id={ID}
        resolveClient={mockResolve(resolvedWith(manifest(compatibleShared)))}
        chunkLoader={okLoader}
        hostProvided={hostProvided}
        capabilities={grant}
        retry={{ backoffMs: 0 }}
        {...overrides}
      />
    </ThemeProvider>,
  );
}

describe("MiniappHost — retry UX", () => {
  it("auto-retry: resuelve tras 1 falla transitoria, sin mostrar fallback", async () => {
    renderHost({ resolveClient: flakyResolve(1, resolvedWith(manifest(compatibleShared))) });
    expect(await screen.findByText("MINIAPP OK")).toBeTruthy();
    expect(screen.queryByText("Miniapp no disponible")).toBeNull();
  });

  it("falla retryable persistente → fallback + botón Reintentar", async () => {
    renderHost({ resolveClient: mockResolve(new Error("resolve failed: down")) });
    expect(await screen.findByText("Miniapp no disponible")).toBeTruthy();
    expect(screen.getByText("Reintentar")).toBeTruthy();
  });

  it("falla permanente (skew) → fallback SIN botón Reintentar", async () => {
    const incompatible = [{ name: "react-native", requiredRange: "^0.99.0", singleton: true }];
    renderHost({ resolveClient: mockResolve(resolvedWith(manifest(incompatible))) });
    expect(await screen.findByText("Miniapp no disponible")).toBeTruthy();
    expect(screen.queryByText("Reintentar")).toBeNull();
  });

  it("Reintentar (manual) re-carga y monta", async () => {
    // 2 fallas (inicial + 1 auto-retry) → fallback; el manual arranca budget fresco y monta.
    renderHost({ resolveClient: flakyResolve(2, resolvedWith(manifest(compatibleShared))) });
    fireEvent.press(await screen.findByText("Reintentar"));
    expect(await screen.findByText("MINIAPP OK")).toBeTruthy();
  });
});
```
> Si `screen.getByText("Reintentar")` no encuentra el label del `Button` de ui-kit (según cómo lo renderice), usar `screen.getByRole("button", { name: /Reintentar/ })` o el `testID` del Button. Ajustar según el primer run.

- [ ] **Step 2: Correr — pasa** (`pnpm --filter @dentvega/host-runtime test MiniappHost`) + suite completa del package + `typecheck`.
- [ ] **Step 3: Commit**
```bash
git add packages/host-runtime/src/__tests__/MiniappHost.test.tsx
git commit  # test(host-runtime): auto-retry + retryable/permanent + manual reload behavior  (+ trailer)
```

---

## Cierre (post-tasks, controller)
1. Review final whole-branch (base = commit previo a Task 1).
2. `pnpm --filter @dentvega/host-runtime typecheck && pnpm --filter @dentvega/host-runtime test` — verde.
3. **Push.**

## Operacional (fuera del plan)
- Sin cambios de env. Es un cambio de comportamiento del loader del host; entra en el próximo
  build del host. Consumidores que ya pasan `onRetry` siguen igual; los que no, ahora tienen
  retry funcional + auto-retry.
- Nota de costos: el auto-retry suma **como mucho +1 resolve + 1 download** por falla
  (`maxAuto=1`). El siguiente paso para bajar operaciones es un **cache host-side** (ver spec §7).
