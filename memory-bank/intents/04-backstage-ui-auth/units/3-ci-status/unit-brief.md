# Unit 3 — Estado de CI (GitHub Actions API)

> Intent: 04-backstage-ui-auth · Estado: Borrador · Fecha: 2026-07-10

## Propósito
Obtener el estado del último build de CI de cada miniapp para mostrarlo en la UI.

## Alcance
- **`CiStatusProvider` (interfaz):** `getStatus(repoFullName, token) → { status }` con `status ∈ success|failure|in_progress|none|unknown`.
- Impl **GitHub**: `GET /repos/<owner>/miniapp-<id>/actions/runs?per_page=1` → `conclusion ?? status`. Fallback **`unknown`** si falla / sin repo / sin token / repo privado sin scope.
- Repo derivado: `<owner>/miniapp-<id>` (o `repoUrl` del record).
- **Cache** corto (~60s) por repo para no pegar a GitHub en cada render.
- Usa el **token de sesión** (Unit 1), server-side. Mock inyectable.

## Clasificación
- Web (Backstage). **Depende de Unit 1** (token) + Unit 2 (repoUrl). La usa Unit 4.

## Dependencias
- Unit 1 (sesión/token), Unit 2 (repoUrl/owner).

## Stories
- S3.1 — `CiStatusProvider` (interfaz) + impl GitHub (último run) + mock.
- S3.2 — Cache (~60s) + fallback `unknown` (resiliencia).
- S3.3 — Tests: GitHub API mockeada (success/failure/none/unknown) + cache.

## Criterios de aceptación
- Devuelve el estado del último run; `unknown` ante fallo/sin repo/sin scope (no rompe la UI).
- Cachea por repo; no pega a GitHub en cada render.
- Tests con la API mockeada verdes.
