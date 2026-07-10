# Unit 4 — Scaffolder en Backstage ("Create miniapp")

> Intent: 02-miniapp-platform · Estado: Borrador · Fecha: 2026-07-09 · Delta 4

## Propósito
La capacidad ① de la plataforma: desde Backstage, **crear un repo git nuevo** para una miniapp desde el template (GitHub API) y **registrarla** en el catálogo.

## Alcance
- **`GitProvider` (interfaz)**: `createFromTemplate({ templateRepo, name, owner }): Promise<{ repoUrl }>`. Impl `githubProvider` usando la API REST de GitHub (`POST /repos/{tpl_owner}/{tpl}/generate`), auth por **token en env**. Mock inyectable para tests.
- **Endpoint** `POST /api/scaffold { id, name, owner }` (Route Handler): valida `id` (`parseMiniappId`), no-existe en registry → `GitProvider.createFromTemplate` → `registerMiniapp` → responde `{ repoUrl }`. Mapea errores (409 existe, 400 id inválido, 502 fallo git).
- **Página mínima** `/create`: formulario (id, name, owner) → llama al endpoint → muestra el `repoUrl`.
- (Sustitución de placeholders del template: mecanismo por **ADR/Unit 2**; el scaffolder dispara lo que se decida.)
- Tests: dominio del scaffold (validación + orquestación con `GitProvider` mockeado) + endpoint (201/400/409/502) + componente `/create`.

## Clasificación
- Web (Next.js), repo Backstage. **Depende de Unit 2** (template a clonar) + registry (intent 01).

## Dependencias
- Unit 2 (template repo). Reutiliza `registerMiniapp` del registry (intent 01).

## Stories
- S4.1 — `GitProvider` interfaz + impl GitHub (`generate from template`, token env) + mock.
- S4.2 — `POST /api/scaffold` (validación + orquestación + registro + mapeo de errores).
- S4.3 — Página `/create` (formulario → endpoint → muestra repoUrl); test de componente + API.

## Criterios de aceptación
- `POST /api/scaffold` con id/name/owner válidos → crea repo (GitHub API, verificado con mock en test + una creación real manual) → lo registra → devuelve `repoUrl`.
- Errores tipados: id inválido (400), ya registrado (409), fallo del proveedor git (502).
- `/create` funciona y muestra el repo creado; tests verdes.
- Token de GitHub por env/secret, nunca en código ni logs.
