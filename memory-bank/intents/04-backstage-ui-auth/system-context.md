# System Context — Intent 04 (Backstage UI + auth)

> Fase: **Inception** · Estado: **Borrador (esperando validación humana)** · Fecha: 2026-07-10
> Todo en el repo `backstage-web` (Next.js). **Module Federation: sin cambios** (ver `standards/system-architecture.md`, "Three-plane architecture"); el host sigue resolviendo por `/api/resolve` (fuera del gate de UI).

## 1. Topología (Backstage web interno)
```
                    ┌──────────────── Navegador (usuario) ─────────────────┐
                    │  /  /catalog  /miniapp/[id]  /create   (requieren     │
                    │  sesión)  ·  /signin                                   │
                    └───────────────┬───────────────────────────────────────┘
        middleware (Auth.js): sin sesión → redirect /signin                  
                                    │
   ┌──────────────── Backstage (Next.js) ─────────────────────────────────────┐
   │  Auth.js v5 (GitHub OAuth)  → sesión { user, githubAccessToken }           │
   │  UI (server components): catálogo + detalle, leen del registry + CI status │
   │  lib/registry (KV/json) + createdAt/repoUrl   ·   lib/ci (GitHub Actions)   │
   │                                                                            │
   │  API sin gate de UI (criterio propio):                                     │
   │   GET /api/resolve   (host, público)  ·  POST /api/miniapps/:id/upload (CI, token) │
   │   POST /api/scaffold  ·  POST /api/seed  (token de servicio)                │
   └───────────────┬────────────────────────────────────────────────────────────┘
                   │ CI status (server-side, token de sesión)
                   ▼
          GitHub API: GET /repos/<owner>/miniapp-<id>/actions/runs
```

## 2. Auth (Auth.js v5 + GitHub)
- `auth.ts`: `NextAuth({ providers: [GitHub], callbacks })`. Callback `jwt`/`session` guarda el **`access_token`** de GitHub (server-side; no se expone al cliente).
- **Middleware** (`middleware.ts`): protege `/`, `/catalog`, `/miniapp/*`, `/create` → sin sesión → redirect a `/signin`. **Excluye** `/api/resolve`, `/api/miniapps/*/upload`, `/api/scaffold`, `/api/seed` (los consumen host/CI, no el navegador).
- `/signin`: botón "Sign in with GitHub". Header con avatar/login + sign-out (client component).
- Env: `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`. Scopes: `read:user` (+ `repo`/`workflow` si se leen runs de repos privados).

## 3. Registry (metadatos)
- `MiniappRecord` (lib/registry/types.ts) gana **`createdAt: string`** y **`repoUrl?: string`**.
- `registerMiniapp` setea `createdAt` (fecha de registro). El scaffolder setea `repoUrl` (del GitProvider).
- `versions[].publishedAt` ya existe (última versión / historial).
- **Compatibilidad:** registros viejos sin `createdAt` → tratar como opcional / backfill en el seed.

## 4. CI status (`lib/ci`)
- `getCiStatus(repoFullName, token) → { status: "success"|"failure"|"in_progress"|"none"|"unknown" }`.
- Impl GitHub: `GET /repos/<owner>/miniapp-<id>/actions/runs?per_page=1` → último run: `conclusion ?? status`. Fallback `unknown` si falla / no hay repo / no token.
- **Interfaz `CiStatusProvider`** (mockeable) + impl GitHub. Server-side (usa el token de sesión). **Cache** corto (~60s) por repo.

## 5. UI
- **`/catalog`** (enriquecido): por miniapp → nombre, id, owner, última versión, fecha, **badge de CI**, link a `/miniapp/[id]`.
- **`/miniapp/[id]`** (nuevo, server component): detalle completo → versión actual, `createdAt`, última publicación, **estado de CI**, **link al repo**, **lista de versiones** (con fecha/URL), owner, **capabilities** (del manifest). Reutiliza `resolveMiniapp`/el record.
- Componentes presentacionales (client) testeables con RTL: `CiBadge`, `VersionList`, `MiniappHeader`.

## 6. Placement / boundaries
| Elemento | Ubicación | Nota |
|---|---|---|
| Auth (Auth.js) + middleware | Backstage | gatea solo la UI |
| Registry + createdAt/repoUrl | Backstage (lib/registry) | KV/json |
| CI status | Backstage (lib/ci) | GitHub API, token de sesión, cache |
| UI catálogo/detalle | Backstage (app/) | server + componentes client |
| `/api/resolve`, `/upload`, `/scaffold`, `/seed` | Backstage API | **fuera** del gate de UI |
| Host RN / Module Federation | sin cambios | resuelve por `/api/resolve` |

## 7. ADRs (Construction)
- **ADR** — Auth con Auth.js v5 + GitHub; middleware que gatea solo la UI; token de sesión server-side.
- **ADR** — `CiStatusProvider` (interfaz + impl GitHub Actions API) + cache + fallback `unknown`.
- **ADR** — Extender `MiniappRecord` (`createdAt`, `repoUrl`) con compatibilidad hacia atrás.

## 8. Riesgos
- Rate limit de la GitHub API para el estado de CI → cache + fallback.
- App OAuth de GitHub (client id/secret) = placeholder; el login real requiere crearla.
- Scope `repo`/`workflow` para repos privados — pedir el mínimo necesario.
