# ADR-009 — Carga dinámica de remotes tras una interfaz ChunkLoader

> Bolt: bolt-4-host-integration · Estado: **Aceptada** (checkpoint 2026-07-09)

## Contexto
La URL del chunk de una miniapp NO se conoce en build: la resuelve Backstage en runtime (`/api/resolve`). Re.Pack (MF v2) descarga chunks vía **ScriptManager**; Module Federation v2 expone una **runtime API** (`registerRemotes`/`loadRemote`). Además, el loader debe ser **testeable sin dispositivo**.

## Decisión
- La resolución de URL en runtime se hace con un **resolver de `ScriptManager`** (Re.Pack) que, dado el id del container, devuelve la `url` obtenida de Backstage.
- La carga del módulo expuesto (`account_dashboard/./Entry`) se hace con la **runtime API de MF** (`registerRemotes` + `loadRemote`), NO con un `import()` estático (evita fijar la URL en build).
- Todo esto se **aísla tras la interfaz `ChunkLoader`** (`load(resolved): Promise<EntryComponent>`), con:
  - `repackChunkLoader` — impl real (ScriptManager + loadRemote).
  - mock inyectable — para unit/RNTL (devuelve el componente de la miniapp directamente).

## Consecuencias
- (+) El **loader es testeable** (ResolveClient y ChunkLoader inyectados); la lógica de estados/fallback se verifica sin device.
- (+) La URL es 100% dinámica (Backstage manda), alineado con el registry.
- (−) El adapter real depende de detalles de versión de Re.Pack/MF; su **verificación de montaje real es Layer 2** (emulador/simulador) — se intenta en este bolt, se marca honestamente si el entorno no lo permite.
- (−) Requiere que el host declare los `shared` singletons compatibles (react-query, flash-list, etc.) o el `loadRemote` fallará por skew → fallback.
- **Cierre:** happy-path + 3 caminos de fallback verificados por RNTL con mocks; montaje real del chunk = Layer 2.
