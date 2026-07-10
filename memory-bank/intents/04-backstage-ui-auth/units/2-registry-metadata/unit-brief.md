# Unit 2 — Registry: metadatos (createdAt, repoUrl)

> Intent: 04-backstage-ui-auth · Estado: Borrador · Fecha: 2026-07-10

## Propósito
Enriquecer el registry para que la UI muestre fecha de creación y link al repo.

## Alcance
- `MiniappRecord` (lib/registry/types.ts) + **`createdAt: string`** + **`repoUrl?: string`**.
- `registerMiniapp(reg, {...}, now)` setea `createdAt`; el scaffolder setea `repoUrl` (del GitProvider).
- **Compatibilidad hacia atrás:** registros sin `createdAt` → opcional; backfill en el seed.
- `versions[].publishedAt` ya existe (historial / última publicación).

## Clasificación
- Web (Backstage). Independiente; la usa Unit 4 (UI) y Unit 3 (repoUrl para CI).

## Dependencias
- Reusa el registry (intent 01) + scaffolder (intent 02).

## Stories
- S2.1 — `MiniappRecord` + createdAt/repoUrl; registerMiniapp setea createdAt.
- S2.2 — Scaffolder setea repoUrl; seed compatible (backfill createdAt).
- S2.3 — Tests: register con createdAt, scaffold con repoUrl, compat de registros viejos.

## Criterios de aceptación
- Nuevos registros tienen `createdAt`; los scaffoldeados tienen `repoUrl`.
- Registros/seed viejos no rompen (createdAt opcional/backfill).
- Tests del registry + scaffold verdes.
