# Bolt 4 — Host Runtime + Integración · Etapa 2: DESIGN

> DDD stage 2/5 · Estado: **Borrador (esperando validación humana)** · Fecha: 2026-07-09

## 1. Cambios en el host (`apps/host`)

**Nuevas deps runtime:** `@tanstack/react-query`, `@shopify/flash-list` (nativo), `zustand`,
`@react-navigation/native`, `@react-navigation/native-stack`, `react-native-screens`,
`react-native-safe-area-context`, `@module-federation/enhanced` (runtime, ya presente).

**rspack.config — `shared` singletons (ampliado):**
```
react, react-native            (ya, eager)
@tanstack/react-query          singleton
@shopify/flash-list            singleton   ← nativo compilado en el host (ADR-004)
zustand                        singleton
@react-navigation/*            singleton
```
**Remote dinámico:** el host NO fija la URL en build. Usa un **resolver de ScriptManager** que
consulta Backstage en runtime (ADR-009). El remote `account_dashboard` se carga con la runtime API.

## 2. Estructura nueva

```
packages/host-runtime/src/
├── loaderState.ts        nextLoaderState (reducer puro) + tipos
├── evaluate.ts           evaluateManifest (isManifest + satisfiesShared) — puro
├── integrity.ts          IntegrityVerifier (interfaz) + noopVerifier (ADR-008)
├── ResolveClient.ts      httpResolveClient(baseUrl) → GET /api/resolve
├── ChunkLoader.ts        interfaz ChunkLoader + repackChunkLoader (adapter Re.Pack/MF)
├── useMiniapp.ts         hook: orquesta resolve→evaluate→load→mount / fallback
└── MiniappHost.tsx       componente: spinner / <Entry/> / <Fallback/>

apps/host/src/
├── session/store.ts      zustand: login()/logout(), deriveCapabilities (S2.1)
├── ScriptManagerSetup.ts resolver de ScriptManager (URL desde Backstage)
├── screens/HomeScreen.tsx      login toggle + abrir miniapp
└── screens/MiniappScreen.tsx   usa MiniappHost(account_dashboard)
apps/host/App.tsx         Providers: QueryClient + Theme + NavigationContainer
```

## 3. Flujo del Loader (S2.2 + S2.3)
```
useMiniapp(id):
  setState(resolving)
  resolved = await resolveClient.resolve({id})        // Backstage /api/resolve
  ev = evaluateManifest(resolved.manifest, hostProvided)   // isManifest + skew
  if (!ev.ok) → fallback(ev.reason)
  if (!integrity.verify(resolved)) → fallback("integrity-failed")
  setState(downloading, resolved)
  Entry = await chunkLoader.load(resolved)             // ScriptManager + loadRemote
  setState(mounted) → render <Entry capabilities={grant} />
  cualquier throw → fallback(reason)                   // NUNCA crashea
```
- `hostProvided` = tabla de versiones que el host declara como singleton (react 18.3.1, react-native 0.76.6, react-query 5.x, flash-list 1.x).
- `grant` = `createScopedGrant(deriveCapabilities(session))`.

## 4. Testabilidad (S2.2/S2.3 con RNTL + unit)
- **Puro (unit):** `nextLoaderState`, `evaluateManifest`, `deriveCapabilities`.
- **Hook/UI (RNTL):** `MiniappHost` con `ResolveClient` y `ChunkLoader` **inyectados (mock)**:
  - happy path → monta `./Entry` (mock devuelve el componente real de la miniapp) → muestra saldo.
  - resolve falla → fallback "resolve-failed".
  - manifest inválido → fallback "invalid-manifest".
  - skew (host provee versión incompatible) → fallback "skew".
- El adapter real `repackChunkLoader` queda aislado; su verificación runtime es Layer 2 (device).

## 5. Placement host vs. remote
| Elemento | Ubicación | Nativo |
|---|---|---|
| Loader, evaluate, session, nav, providers | **Host** | flash-list sí (host lo compila) |
| `account_dashboard` (./Entry) | **Remote federado** (Bolt 3) | no |
| Resolución de URL | runtime (ScriptManager resolver → Backstage) | no |

## 6. Sirviendo el chunk (dev)
- La miniapp (Bolt 3) se sirve con `react-native webpack-start` (dev server) o se copia el bundle a un server estático en `:8081` — la URL del seed de Backstage apunta ahí.
- Documentar el comando de arranque en el result.

## 7. ADRs (Etapa 3)
- **ADR-008** — Verificación de integridad: estructural + skew ahora; `IntegrityVerifier` no-op; cripto (sha256/firma) diferida a Operations.
- **ADR-009** — Carga dinámica de remotes: ScriptManager resolver + runtime `loadRemote`, aislado tras `ChunkLoader` (inyectable/mockeable).

## Nota de método (checkpoint antes de Implement)
Implement instala deps **nativas** (flash-list, screens) → autolinking + rebuild android. Verificación primaria: unit + RNTL + build del host bundle con el remote wired. Layer 2 (emulador) se **intenta** sin bloquear.
