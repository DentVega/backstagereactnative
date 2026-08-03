# UX de errores en el host — Diseño

**Fecha:** 2026-08-03
**Estado:** Diseño aprobado — listo para plan de implementación
**Owner:** DentVega
**Repo:** `backstagereactnative` · package `host-runtime`

## 1. Contexto y objetivo

El host monta miniapps con el ciclo **resolve → evaluate → verify → load → mount**
(`useMiniapp` + `MiniappHost`). Hoy ya mapea cada falla a un estado `fallback` con
razones tipadas (`resolve-failed`, `download-failed`, `invalid-manifest`, `skew`,
`integrity-failed`), mensajes por razón y un botón "Reintentar". **Dos gaps:**

1. **El retry no es self-contained:** el botón llama a `props.onRetry`, que el padre
   debe implementar (re-montando). Sin eso, el botón no hace nada.
2. **Muestra "Reintentar" para todas las razones**, incluso `skew` (incompatible con la
   app) e `invalid-manifest` (mal publicada), donde reintentar da el mismo resultado.

Objetivo: retry que funcione solo + distinguir fallas transitorias (retryables) de
permanentes + un auto-retry que suavice redes móviles flaky, sin romper la API actual.

## 2. Decisiones tomadas

1. **Retry self-contained:** `useMiniapp` expone `reload()` (re-corre el pipeline). El
   botón lo usa. `onRetry` queda como override opcional del padre (backward-compatible).
2. **Retryable vs permanente:**
   - **retryable:** `resolve-failed`, `download-failed`, `integrity-failed` (red / CDN /
     descarga parcial — reintentar puede resolver).
   - **permanente:** `skew`, `invalid-manifest` (la miniapp es incompatible o está mal
     publicada — reintentar da lo mismo). Sin botón de retry; mensaje terminal.
3. **1 auto-retry con backoff:** ante una falla **retryable**, reintenta automáticamente
   **1 vez** (configurable) tras **~800ms**, mostrando el loading + "Reintentando…", antes
   de caer al fallback. Las permanentes van directo a fallback (sin auto-retry).

## 3. Componentes

### 3.1 `loaderState.ts` — clasificación
```ts
const RETRYABLE: ReadonlySet<FallbackReason> = new Set([
  "resolve-failed", "download-failed", "integrity-failed",
]);
export function isRetryable(reason: FallbackReason): boolean {
  return RETRYABLE.has(reason);
}
```
(El resto de `loaderState.ts` — estados, reducer — no cambia.)

### 3.2 `useMiniapp.ts` — retry loop + reload + retrying
- Nueva config opcional en `UseMiniappDeps`:
  ```ts
  retry?: { maxAuto?: number; backoffMs?: number };  // defaults: maxAuto=1, backoffMs=800
  ```
- Estado interno: `attempt` (número, `reload()` lo incrementa → re-corre el effect) y
  `retrying` (boolean, true mientras hay un auto-retry en vuelo).
- El `useEffect` (deps: `[id, resolveClient, chunkLoader, hostProvided, integrity, attempt, maxAuto, backoffMs]`)
  corre un **loop de intentos**:
  ```
  for (tryNo = 0; ; tryNo++):
    if tryNo > 0: setRetrying(true)
    dispatch(start)
    <pipeline: resolve → evaluate → (fail permanente?) → verify → dispatch(resolved) → load>
       — cada paso respeta cancelled.current
       — falla del catch: reason = detail.startsWith("resolve failed") ? resolve-failed : download-failed
    if cancelled: return
    if ok: setEntry(component); dispatch(mounted); setRetrying(false); return
    if isRetryable(reason) && tryNo < maxAuto:
       await sleep(backoffMs); if cancelled: return; continue
    dispatch(fail, reason, detail); setRetrying(false); return
  ```
  - Preserva el `console.warn("[miniapp] load failed:", detail)` (diagnosable en campo).
  - `sleep(ms) = new Promise(r => setTimeout(r, ms))`. Cancelable vía el check `cancelled.current`
    después del sleep (si el componente se desmontó/cambió durante el backoff, no reintenta).
  - El budget de auto-retry es **por-carga**: cambia con `reload()` o con cualquier dep
    (id, clients) → un retry manual arranca con `tryNo=0` de nuevo.
- `reload = useCallback(() => setAttempt(a => a + 1), [])`.
- Retorno: `{ state, Entry, reload, retrying }` (antes `{ state, Entry }`).

### 3.3 `MiniappHost.tsx` — UI
- `MiniappHostProps` suma `retry?: { maxAuto?: number; backoffMs?: number }` (pasa a `useMiniapp`).
- Toma `{ state, Entry, reload, retrying }` de `useMiniapp`.
- **Loading:** el spinner actual; si `retrying`, mostrar además un `AppText` "Reintentando…"
  debajo (para que no parezca colgado).
- **Fallback:**
  - Mensaje por razón (el `FALLBACK_COPY` actual; `skew`/`invalid-manifest` ya leen como
    terminales — mantener, opcionalmente afinar el de `skew` a "Actualizá la app para usar
    esta miniapp.").
  - Botón "Reintentar" **solo si `isRetryable(state.reason)`**. `onPress = props.onRetry ?? reload`
    (si el padre pasa `onRetry`, manda el suyo; si no, el `reload` built-in).
- **mounted:** sin cambios.

## 4. Data flow

```
useMiniapp effect (por id / attempt)
  loop tryNo:
    start → resolve → evaluate → verify → load → mount ✔
    o falla:
      permanente (skew/invalid-manifest) → fail (fallback, sin retry) ✗
      retryable + quedan auto-retries → sleep(backoff) [retrying=true, spinner] → retry
      retryable + sin auto-retries → fail (fallback + botón Reintentar) ✗
Usuario toca Reintentar → onRetry ?? reload → reload bumpea attempt → effect corre de nuevo (budget fresco)
```

## 5. Manejo de errores / edge cases
- **Desmontaje/cambio durante el backoff:** el `cancelled.current` post-sleep evita reintentar
  o dispatchar en un componente muerto.
- **Falla permanente:** nunca auto-retry; fallback inmediato sin botón.
- **`onRetry` provisto:** se respeta (el padre puede re-keyear); el `reload` no se usa en ese caso.
- **`maxAuto=0`:** deshabilita el auto-retry (fallback directo, con botón si es retryable).

## 6. Testing (jest)
- **`isRetryable`** (unit, estilo `loader.test.ts`): true para resolve/download/integrity-failed;
  false para skew/invalid-manifest.
- **`MiniappHost`** (component, `@testing-library/react-native`, mirror `MiniappHost.test.tsx`),
  con `retry={{ backoffMs: 0 }}` para no esperar:
  - resolveClient que **falla una vez y luego resuelve** → monta la Entry, **sin** mostrar
    el fallback (el auto-retry lo salvó).
  - resolveClient que **siempre falla** (retryable) → muestra el fallback + botón "Reintentar"
    (después de 1 auto-retry).
  - falla **permanente** (`skew` vía hostProvided incompatible, o manifest inválido) → fallback
    **sin** botón "Reintentar".
  - **press "Reintentar"** con un client fail-then-succeed en el 2º ciclo → re-carga y monta.
  - **"Reintentando…"** visible durante el auto-retry (o al menos que el spinner siga; test del
    texto si el timing lo permite con `backoffMs` > 0 y fake timers — si es frágil, cubrir solo
    el flag `retrying` vía un test más directo).

## 7. Fuera de alcance (YAGNI)
- Backoff exponencial / N>1 auto-retries más allá del prop configurable.
- Detección de offline / escuchar reconexión de red.
- Cachear la última versión buena para servir mientras reintenta.
- Telemetría / reporte de errores a un backend.
