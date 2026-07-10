# ADR-019 — Extender MiniappRecord (createdAt, repoUrl)

> Bolt: 04-2-registry-metadata · Estado: **Aceptada** (checkpoint 2026-07-10)

## Contexto
La UI (Bolt 4) debe mostrar la fecha de creación de cada miniapp y un link a su repo. El `MiniappRecord` no los tenía.

## Decisión
- `MiniappRecord` gana **`createdAt: string`** (ISO) y **`repoUrl?: string`**.
- `registerMiniapp` recibe un **`now: string`** explícito (mismo patrón que `publishVersion`) y setea `createdAt`; acepta `repoUrl` opcional en el input.
- El **scaffolder** pasa el `repoUrl` (del `GitProvider`) al registrar.
- **Compatibilidad hacia atrás:** `createdAt` es opcional aguas abajo (UI/listCatalog); `seedRegistry` backfillea `createdAt` a los registros del seed que no lo tengan.

## Consecuencias
- (+) `now` explícito → `registerMiniapp` sigue pura y testeable (sin `Date.now()` dentro).
- (+) Cambio acotado: 2 llamadas (route + scaffold) + tests.
- (−) Firma de `registerMiniapp` cambia (nuevo `now`) → actualizar callers y tests existentes.
- (−) Registros creados antes de este bolt no tienen `createdAt` hasta el backfill del seed / re-registro.
