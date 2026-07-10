# Unit 4 — UI de detalle + catálogo enriquecido

> Intent: 04-backstage-ui-auth · Estado: Borrador · Fecha: 2026-07-10

## Propósito
Mostrar el detalle de cada miniapp y enriquecer el catálogo con los nuevos metadatos.

## Alcance
- **`/miniapp/[id]`** (server component): versión actual, `createdAt`, última publicación, **estado de CI**, **link al repo**, **lista de versiones** (fecha/URL), owner, **capabilities** (del manifest).
- **`/catalog`** enriquecido: por miniapp → última versión + fecha + **badge de CI** + link al detalle.
- Componentes presentacionales (client, RTL): `CiBadge`, `VersionList`, `MiniappHeader`.
- Requiere sesión (Unit 1); consume registry (Unit 2) + CI status (Unit 3).

## Clasificación
- Web (Backstage). **Depende de Units 1, 2, 3.**

## Dependencias
- Unit 1 (auth), Unit 2 (metadatos), Unit 3 (CI status).

## Stories
- S4.1 — Componentes `CiBadge` + `VersionList` + `MiniappHeader` (RTL).
- S4.2 — Página `/miniapp/[id]` (detalle completo) con CI status.
- S4.3 — Catálogo enriquecido (badge + versión + fecha + link).

## Criterios de aceptación
- `/miniapp/[id]` muestra todos los metadatos + estado de CI + versiones + capabilities.
- El catálogo muestra el badge de CI + versión + fecha + link al detalle.
- Tests de componentes (RTL) + del detalle verdes; sin sesión → redirige (Unit 1).
