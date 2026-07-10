# Bolt 04-4 — UI de detalle + catálogo enriquecido · OUTCOME

> DDD 5/5 completo · Fecha: 2026-07-10 · Repo `backstage-web` · Estado: **Hecho ✅**
> **Cierra el Intent 04 (backstage-ui-auth).**

## Qué se construyó
Página de detalle `/miniapp/[id]` y catálogo enriquecido, consumiendo la metadata (04-2)
y el estado de CI (04-3). El usuario autenticado (04-1) ve versión, fecha de creación,
repo, estado de CI, capabilities y lista de versiones.

## Archivos
- `lib/registry/types.ts` — `CatalogEntry += createdAt?/repoUrl?`; nuevos `VersionView`, `MiniappDetail`.
- `lib/registry/registry.ts` — `listCatalog` enriquecido + `getMiniappDetail(reg, id)` (puro, versiones newest-first, capabilities de la latest).
- `lib/ci/resolve.ts` — `resolveCiStatuses(items, token)` → `id → CiStatus` (server-side, cache, desacoplado de auth).
- `app/components/CiBadge.tsx` — badge presentacional de los 5 `CiStatus` (color + aria-label).
- `app/components/VersionList.tsx` — versiones (fecha, chunk link, capabilities) + empty state.
- `app/components/MiniappHeader.tsx` — name/id/owner/createdAt/repo link/latest.
- `app/components/CatalogList.tsx` — + link a `/miniapp/[id]`, fecha y `CiBadge`.
- `app/catalog/page.tsx` — resuelve CI status vía `auth()` + `resolveCiStatuses`.
- `app/miniapp/[id]/page.tsx` — server component: detalle + CI + capabilities + versiones; `notFound()` si no existe.

## Decisión
- **ADR-021** — View-model puro (`getMiniappDetail`/`listCatalog`) + CI resuelto SOLO en
  el server component (`getCiProvider()` + `auth()`); componentes client presentacionales
  reciben `CiStatus` como prop. El token nunca sale del server ni entra al bundle.

## Verificación
- Vitest: **102 passed** (17 files) — antes 88 (+14): CiBadge (5 estados+aria),
  VersionList (con/sin/capabilities), MiniappHeader (repo/createdAt/sin datos),
  CatalogList (link+fecha+badge+fallback), getMiniappDetail (VM/vacío/notFound),
  listCatalog (createdAt/repoUrl).
- `tsc --noEmit`: limpio · `next build`: OK (nueva ruta `/miniapp/[id]`).
- `/miniapp` ya en `PROTECTED_PREFIXES` (middleware 04-1) → detalle requiere sesión (test cubierto).

## Seguridad
- Token de sesión server-side; a los componentes client solo llega el `CiStatus`.
- `repoUrl`/versiones/capabilities son datos públicos.

## Activación (no bloquea)
- Scope OAuth actual `read:user` → badges de CI reales darán `unknown` (fallback correcto).
  Para badges reales: ampliar scope a `repo`/`actions:read` en el GitHub OAuth App.
