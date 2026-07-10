# Intent 04 — Backstage: UI de detalle + login con GitHub

> Fase: **Inception** · Estado: **Borrador (esperando validación humana)** · Fecha: 2026-07-10
> ⚠️ **100% Backstage web** (Next.js). NO toca el host RN ni Module Federation (sin remotes ni módulos nativos).

## 1. Intención de negocio
Que Backstage sea usable como plataforma: (a) **login con GitHub** para que el equipo acceda a las miniapps creadas, y (b) una **UI con detalle** por miniapp — versión, fecha de creación, estado de su CI, link al repo, historial de versiones, owner y capabilities.

## 2. Objetivo (MVP)
- **GitHub OAuth (Auth.js / NextAuth v5):** "Sign in with GitHub"; **toda la UI requiere login**; sesión + middleware.
- **Metadatos enriquecidos por miniapp:** última versión + `createdAt` + última publicación · **estado de CI** (último run) + link al repo · **lista de versiones** · owner + capabilities.
- **Estado de CI vía GitHub Actions API** (workflow runs del repo `<owner>/miniapp-<id>`), usando el token de GitHub de la sesión.
- **Página de detalle** `/miniapp/[id]` + catálogo enriquecido.

## 3. En alcance
- **Auth:** Auth.js v5 con provider GitHub. Middleware que protege catálogo, detalle y `/create` → sin sesión → redirect a sign-in. Muestra el usuario (avatar/login) + sign-out. El **access_token** de GitHub de la sesión se usa para la API de CI.
- **Registry (metadatos):** extender `MiniappRecord` con `createdAt` (al registrar/scaffoldear) y `repoUrl` (del scaffold). `versions[].publishedAt` ya existe. Migración/seed compatible.
- **CI status service:** cliente que consulta `GET /repos/{owner}/{repo}/actions/runs` (último run: `status`/`conclusion` → success/failure/in_progress/none) con el token de sesión; cacheo corto. Repo derivado: `<owner>/miniapp-<id>`.
- **UI:** `/miniapp/[id]` (detalle completo) + `/catalog` enriquecido (badge de versión + CI + fecha). Reutiliza `listCatalog`/`resolveMiniapp` del registry.

## 4. Fuera de alcance (diferido → intent futuro)
- **Filtro de acceso por org/owner** (todos los usuarios autenticados ven todas las miniapps en el MVP; no hay ACL por repo).
- Roles/permisos finos, invitaciones, multi-tenant.
- Editar/borrar miniapps desde la UI (solo lectura + Create ya existente).
- OIDC para la CI (sigue con token de servicio, intent 03).
- Webhooks de GitHub para estado de CI en tiempo real (se consulta on-demand).

## 5. Actores
- **Usuario de plataforma (dev/PO):** inicia sesión con GitHub, explora el catálogo y el detalle de cada miniapp.
- **Backstage:** valida la sesión, enriquece metadatos, consulta CI a GitHub.

## 6. User stories
- **US-1:** Como usuario, **inicio sesión con GitHub** y solo entonces accedo a Backstage.
- **US-2:** Como usuario, en el **catálogo** veo por miniapp: última versión, fecha, y un **badge de estado de CI**.
- **US-3:** Como usuario, en el **detalle** de una miniapp veo: versión, `createdAt`, última publicación, **estado de CI**, **link al repo**, **lista de versiones**, owner y **capabilities**.
- **US-4:** Como usuario, veo mi **avatar/login** y puedo **cerrar sesión**.
- **US-5:** Como sistema, el **estado de CI** viene del último workflow run del repo (GitHub Actions API) con el token de la sesión.

## 7. Requisitos no funcionales
- **Seguridad:** `AUTH_SECRET`, `AUTH_GITHUB_ID/SECRET` por env, nunca en código/logs. El token de GitHub de la sesión no se expone al cliente; las llamadas a la API de CI son server-side.
- **Resiliencia:** si la API de CI falla o no hay repo → estado `unknown` (no romper la UI).
- **Rendimiento:** cachear el estado de CI (p.ej. 60s) para no pegar a GitHub en cada render.
- **Compatibilidad:** los endpoints existentes (`/api/resolve`, `/upload`, `/scaffold`) siguen igual; `/api/resolve` puede quedar público (lo consume el host) o protegido por token — decidir en Design.

## 8. Criterios de aceptación del intent
- [ ] Sin sesión, la UI (catálogo/detalle/create) redirige a **sign-in con GitHub**; con sesión, se ve el usuario + sign-out.
- [ ] El catálogo muestra versión + fecha + **badge de CI** por miniapp.
- [ ] `/miniapp/[id]` muestra versión, createdAt, última publicación, estado de CI, link al repo, versiones, owner, capabilities.
- [ ] El estado de CI se obtiene de la GitHub Actions API (o `unknown` con fallback).
- [ ] `MiniappRecord` tiene `createdAt` + `repoUrl`; register/scaffold los setean; seed compatible.
- [ ] Tests: auth (sesión mockeada, guard redirige), CI status (GitHub API mockeada), UI de detalle/catálogo (RTL), registry con createdAt.

## 9. Decisiones (checkpoint /aidlc-inception, 2026-07-10)
- Auth = **Auth.js v5 + GitHub** · **toda la UI tras login** · CI = **GitHub Actions API** (token de sesión) · metadatos = versión+fecha, CI+repo, versiones, owner+capabilities.
- Sin ACL por org (MVP); `/api/resolve` público (lo consume el host) salvo decisión contraria en Design.

## 10. Preguntas abiertas (a resolver en system-context / ADRs)
- Scopes del OAuth de GitHub (¿`read:user` + `repo`/`workflow` para leer runs de repos privados?).
- ¿`/api/resolve` y `/upload` quedan fuera del gate de UI (los consumen host/CI, no navegador)? Propuesta: sí, siguen con su propio criterio (público / token).
- App OAuth de GitHub concreta (client id/secret) = placeholder hasta tenerla.
