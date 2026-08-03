# Runtime guard `host-too-old` (minHostContract) — Diseño

**Fecha:** 2026-08-03
**Estado:** Diseño aprobado — listo para plan
**Owner:** DentVega
**Repo:** `backstagereactnative` (contract package + host-runtime + apps/host)

## 1. Contexto y objetivo

Los gates de publish (CI `check-compat`, `/upload` 422, `blast-radius`) comparan la
miniapp contra el contract **actual**. Ninguno cubre el eje del tiempo: un **host binario
viejo** en el teléfono de un usuario que no actualizó la app puede montar una miniapp
publicada contra un host más nuevo → crash. El campo `minHostContract: { reactNative,
contractVersion }` ya existe en el `Manifest` (y se valida su shape) pero **nadie lo
enforcea**. Este guard lo enforcea **en runtime, al montar**.

## 2. Comportamiento

Al montar, si el manifest declara `minHostContract` **y** el host expone su
`contractVersion`, el host compara (semver `>=`):
- host `contractVersion` **≥** `minHostContract.contractVersion`
- host `react-native` (de `hostProvided`) **≥** `minHostContract.reactNative`

Si el host es más viejo en cualquiera → fallback **`host-too-old`** (permanente, sin
retry): *"Actualizá la app para usar esta miniapp."*

**Backward-compatible:** sin `minHostContract` en el manifest **o** sin `hostContractVersion`
en el host → el guard es no-op (comportamiento actual intacto).

## 3. Componentes

### 3.1 Contract package — `gteVersion`
`packages/miniapp-contract/src/shared.ts`: nueva función pura, reusa `parseTriple`:
```ts
export function gteVersion(a: string, b: string): boolean; // a >= b (semver); null-parse → false
```
Exportada desde `index.ts`. (host-runtime la consume vía workspace → sin republish;
backstage-web no la necesita.)

### 3.2 host-runtime — `loaderState.ts`
- `FallbackReason` suma `"host-too-old"`.
- **NO** entra en `RETRYABLE_REASONS` → es permanente (sin botón Reintentar).

### 3.3 host-runtime — `evaluate.ts`
`evaluateManifest(manifest, hostProvided, hostContractVersion?)` (3er param opcional).
Después del skew de shared, y solo si `manifest.minHostContract !== undefined` **y**
`hostContractVersion !== undefined`:
```ts
const min = manifest.minHostContract;
const cvOk = gteVersion(hostContractVersion, min.contractVersion);
const rnOk = gteVersion(hostProvided["react-native"], min.reactNative);
if (!cvOk || !rnOk) return { ok: false, reason: "host-too-old", detail: `<qué falló>` };
```

### 3.4 host-runtime — `useMiniapp.ts` + `MiniappHost.tsx`
- `UseMiniappDeps` suma `hostContractVersion?: string`; se pasa a `evaluateManifest`.
- `MiniappHostProps` suma `hostContractVersion?: string`; se pasa a `useMiniapp`.
- `FALLBACK_COPY` suma `"host-too-old": "Actualizá la app para usar esta miniapp."`.

### 3.5 apps/host — activación
- `apps/host/src/hostProvided.ts`: `export const HOST_CONTRACT_VERSION = "0.1.0";`
  (hand-maintained, en sync con el `version` del host package.json — igual patrón que
  `HOST_PROVIDED`).
- `apps/host/src/screens/MiniappScreen.tsx`: pasar `hostContractVersion={HOST_CONTRACT_VERSION}`
  al `<MiniappHost>` (único mount).

## 4. Manejo de errores / edge
- `hostProvided["react-native"]` siempre presente (singleton del host); si por algún motivo
  falta → `gteVersion(undefined, x)` → false → `host-too-old` (fail-safe conservador).
- Manifest sin `minHostContract` → guard salteado (la mayoría de las miniapps hoy).

## 5. Testing (jest)
- **`gteVersion`** (package): `1.0.0>=1.0.0` true, `1.2.0>=1.1.9` true, `0.1.0>=0.2.0` false,
  parse inválido → false.
- **`evaluateManifest`** (host-runtime, `loader.test.ts` style): host más nuevo/igual → ok;
  host más viejo en contractVersion → `host-too-old`; host más viejo en reactNative →
  `host-too-old`; sin `minHostContract` → ok; con `minHostContract` pero sin
  `hostContractVersion` → ok (no-op).
- **`MiniappHost`** (component): manifest con `minHostContract` que el host no cumple →
  fallback `host-too-old` **sin** botón Reintentar (permanente).

## 6. Fuera de alcance (YAGNI / siguiente)
- **Auto-inyectar `HOST_CONTRACT_VERSION` desde el package.json vía DefinePlugin**
  (`__HOST_CONTRACT_VERSION__`, como `__BACKSTAGE_URL__`) — evita el hand-maintained.
  Refinamiento siguiente.
- **Auto-derivar `minHostContract` en la miniapp** (gen-manifest-shared lo calcula de los
  natives/singletons que usa) — hoy la miniapp lo declara a mano. Otro esfuerzo.
- **Resolución por `hostVersion`** (múltiples versiones del host binario en la flota).
