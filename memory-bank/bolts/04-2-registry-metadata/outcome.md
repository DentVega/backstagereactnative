# Bolt 04-2 — Registry metadatos (createdAt, repoUrl) · OUTCOME

> DDD 5/5 completo · Fecha: 2026-07-10 · Repo `backstage-web` · Estado: **Hecho ✅**

## Qué se construyó
`MiniappRecord` gana `createdAt` (ISO, requerido en records nuevos, opcional aguas abajo)
y `repoUrl?` (lo setea el scaffolder). El tiempo se inyecta explícito (`now: string`),
igual patrón que `publishVersion`, para mantener el dominio puro y testeable.

## Cambios
- `lib/registry/types.ts` — `MiniappRecord += createdAt?: string · repoUrl?: string`.
- `lib/registry/registry.ts` — `registerMiniapp(reg, {id,name,owner,repoUrl?}, now)` → setea
  `createdAt: now` y `repoUrl` (omitido si no viene).
- `lib/scaffold.ts` — `scaffoldMiniapp(...)` gana param `now`, pasa `repoUrl` de `createFromTemplate`.
- `app/api/miniapps/route.ts` y `app/api/scaffold/route.ts` — pasan `new Date().toISOString()`.
- `lib/registry/seed.ts` — fixture con `createdAt`; `seedRegistry` backfillea `createdAt`
  desde el seed a records viejos que lo omitan.
- Tests: `registry.test.ts` (+3 asserts createdAt/repoUrl), `scaffold.test.ts` (+1 createdAt/repoUrl).

## Decisión
- **ADR-019** — Extender `MiniappRecord` con `now` explícito + compatibilidad hacia atrás
  (createdAt opcional en el tipo; backfill en seed).

## Verificación
- Vitest: **70 passed** (13 files) — antes 66.
- `tsc --noEmit`: limpio.
- `next build`: OK (10 rutas).

## Seguridad
- Sin secretos en código ni logs; `repoUrl` es dato público del repo.

## Siguiente
- Bolt 04-3 — Estado de CI vía GitHub Actions API (`CiStatusProvider`).
- Bolt 04-4 — UI de detalle: versión, fecha de creación, repo, estado CI (consume esta metadata).
