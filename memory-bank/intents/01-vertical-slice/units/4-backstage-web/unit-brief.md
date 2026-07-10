# Unit 4 — Backstage Web (registry / catálogo / resolve)

> Intent: 01-vertical-slice · Estado: Borrador · Fecha: 2026-07-09

## Propósito
El "Spotify for miniapps" mínimo: registrar, versionar, publicar y **resolver** miniapps para el host, con un catálogo web para inspeccionarlas.

## Repositorio
- **Repo git SEPARADO** `backstage-web` (otro equipo, CI/CD y deploy propios). No es parte del monorepo móvil.
- Depende de **`@org/miniapp-contract`** instalado por versión (publicado por Unit 1). No duplica tipos del contrato.

## Alcance
- Proyecto `backstage-web` en **Next.js (App Router)** en su propio repo.
- Route Handlers (API):
  - `POST /api/miniapps` — registrar miniapp (id, nombre, owner).
  - `POST /api/miniapps/:id/publish` — publicar versión (manifest + URL del chunk).
  - `GET /api/resolve?id=&host=` — devuelve `{ id, version, url, manifest }` al host.
  - `GET /catalog` — UI de catálogo (listar/inspeccionar miniapps y versiones).
- Store del registry simple (JSON en fs o SQLite ligero) — suficiente para el MVP.
- Artefactos de chunk servidos por **dev server local** (CDN diferido a Operations).

## Clasificación
- **Web** (Next.js), **repo separado**. No es RN, no aplica federación MF aquí; es el plano de distribución.
- **Módulos nativos:** n/a.

## Dependencias
- Requiere que **Unit 1** haya **publicado** `@org/miniapp-contract` (para instalarlo). Sirve a **Unit 2** (`/api/resolve`) por HTTP y publica **Unit 3**.
- Al ser repo separado, se puede desarrollar en paralelo una vez el contrato está publicado (o contra una versión pre-release del contrato).

## Stories
- S4.1 — Scaffold Next.js + store del registry + `POST /api/miniapps` y `publish`.
- S4.2 — `GET /api/resolve` (contrato con el host) + validación de manifest.
- S4.3 — UI `/catalog` para listar/inspeccionar miniapps y versiones (test componente + API).

## Criterios de aceptación
- Se puede registrar y publicar la miniapp Dashboard; aparece en `/catalog`.
- `GET /api/resolve?id=account_dashboard` devuelve `{url, version, manifest}` válido.
- `tsc` verde; tests de componente (catálogo) y de API (resolve/publish).
- Sin secretos/PII en respuestas ni logs.
