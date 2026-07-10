# Unit 1 — Login con GitHub (Auth.js v5)

> Intent: 04-backstage-ui-auth · Estado: Borrador · Fecha: 2026-07-10

## Propósito
Que Backstage exija **login con GitHub** para toda la UI, con sesión y el token de GitHub disponible server-side (para el estado de CI).

## Alcance
- **Auth.js v5** (`auth.ts`): provider GitHub OAuth; callbacks `jwt`/`session` guardan `access_token` (server-side, no al cliente) + perfil (login, avatar).
- **Middleware** (`middleware.ts`): protege `/`, `/catalog`, `/miniapp/*`, `/create` → sin sesión → redirect `/signin`. **Excluye** `/api/resolve`, `/api/miniapps/*/upload`, `/api/scaffold`, `/api/seed`.
- **`/signin`:** botón "Sign in with GitHub".
- **Header:** avatar/login del usuario + **sign-out** (client).
- Env: `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`. Scope inicial: `read:user`.

## Clasificación
- Web (Backstage). **Bloquea** el detalle/CI que usan la sesión. Sin RN/federación.

## Dependencias
- Ninguna previa. Provee la sesión + token a Units 3 y 4.

## Stories
- S1.1 — Auth.js config (provider GitHub, session con access_token) + `/signin`.
- S1.2 — Middleware que gatea la UI (excluye las API) + redirect.
- S1.3 — Header con avatar + sign-out; tests (sesión mockeada, guard).

## Criterios de aceptación
- Sin sesión → UI redirige a `/signin`; con sesión → se ve el usuario + sign-out.
- Las API (resolve/upload/scaffold/seed) **no** quedan gateadas por la UI.
- Tests con sesión mockeada (guard redirige / permite) verdes; token nunca al cliente.
