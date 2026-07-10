# Bolt 4 — Host Runtime + Integración · Etapa 1: MODEL

> DDD stage 1/5 · Estado: **Borrador (esperando validación humana)** · Fecha: 2026-07-09
> Stories: S2.1 nav + sesión mock · S2.2 loader (resolve→descarga→montaje) · S2.3 verify + fallback + ADR
> **Cierra el slice end-to-end.** Integra host (Bolt 1) + miniapp (Bolt 3) + Backstage (Bolt 2).

El dominio de este bolt es el **runtime de carga de miniapps** en el host: máquina de estados del loader, verificación, y sesión→capabilities.

## 1. Lenguaje ubicuo (ampliado)

| Término | Definición |
|---|---|
| **Loader** | Orquesta resolve → descarga → verify → montaje → fallback de una miniapp. |
| **ResolveClient** | Cliente HTTP que llama a Backstage `GET /api/resolve` → `ResolveResponse`. |
| **ScriptManager** | API de Re.Pack que descarga chunks federados por URL en runtime. |
| **Session** | Estado de sesión (mock) del host; vive solo en el host. |
| **Scoped grant** | Capabilities revocables derivadas de la sesión, entregadas a la miniapp. |
| **Skew** | Incompatibilidad de singletons host↔miniapp (del contrato, `satisfiesShared`). |
| **Fallback** | UI de degradación cuando resolve/descarga/verify/skew fallan — sin crash. |

## 2. Máquina de estados del Loader (dominio puro, testeable)

```
LoaderState =
  | { status: "idle" }
  | { status: "resolving" }
  | { status: "downloading"; resolved: ResolveResponse }
  | { status: "mounted";     resolved: ResolveResponse }
  | { status: "fallback";    reason: FallbackReason; detail?: string }

FallbackReason = "resolve-failed" | "download-failed" | "invalid-manifest" | "skew" | "integrity-failed"
```

Transiciones (función pura `reduce`/servicio): idle→resolving→(download)→mounted, o →fallback en cualquier fallo. **Nunca** lanza al árbol de React (no crash); todo error se mapea a `fallback`.

## 3. Verificación (S2.3) — orden de checks antes de montar
1. **Estructura:** `isManifest(manifest)` (del contrato).
2. **Skew de singletons:** `satisfiesShared(hostProvided, manifest.shared)` — el host expone su tabla de versiones provistas (react, react-native, react-query, flash-list). Si incompatible → `fallback: "skew"`.
3. **Integridad:** `verifyIntegrity(chunkMeta, manifest.integrity)` — **interfaz** definida ahora; impl real (hash/firma) por **ADR** (ver Design). En el MVP: check estructural/placeholder, cripto real diferida a Operations.

## 4. Sesión y capabilities (S2.1)
- `SessionState` (Zustand, mock): `{ userId, isAuthenticated, token? }` — el token NUNCA sale del host.
- `deriveCapabilities(session): Capability[]` — puro: sesión autenticada → `["accounts:read", "session:whoami"]`; no autenticada → `[]`.
- `createScopedGrant(caps)` (ya existe cáscara en host-runtime) → `CapabilityGrant` revocable entregado a `./Entry`.

## 5. Navegación (S2.1)
- native-stack: `Home` → `MiniappScreen(id)`.
- `Home` lista miniapps (hardcoded: account_dashboard) con un botón "Abrir".
- `MiniappScreen` invoca el Loader para `account_dashboard` y renderiza estado (spinner / Entry montado / fallback).

## 6. Lógica pura testeable (resumen)
- `nextLoaderState(current, event)` — transiciones (unit test).
- `deriveCapabilities(session)` — (unit test).
- `evaluateManifest(manifest, hostProvided)` → `{ ok } | { fallback: FallbackReason }` — orquesta isManifest + satisfiesShared (unit test, reutiliza contrato).

## 7. Frontera / integración
- **Descarga real del chunk** = Re.Pack ScriptManager + `import("account_dashboard/Entry")` (no puro; capa RN).
- **URL del chunk** = la que devuelve Backstage `/api/resolve` (Bolt 2), servida por el dev server de la miniapp (Bolt 3) en `:8081`.
- **flash-list + react-query nativos/singletons** deben añadirse al host (ADR-004 de Bolt 3).

## 8. Preguntas para el checkpoint
1. **Integridad (S2.3):** para el MVP propongo verificación **estructural + skew** ahora, y dejar la **cripto real (sha256/firma) como interfaz `IntegrityVerifier` con impl no-op documentada** (diferida a Operations, necesita módulo cripto/infra de firma). ¿OK o quieres un sha256 en JS ya (más lento, sin infra de firma)?
2. **Alcance de sesión:** mock con un toggle "login/logout" en Home para poder demostrar el **gate de capability** (sesión→sin acceso→fallback de permiso). ¿Incluir el toggle?
3. **Layer 2 (dispositivo):** ¿intento el arranque real en emulador Android (build Gradle) para verificar el montaje + fallback, aceptando que puede fallar por el entorno (y lo reporto honestamente), o nos quedamos con verificación por RNTL + builds de bundle y dejamos el device para cuando tengas el emulador listo?
