# ADR-018 — Auth con Auth.js v5 + GitHub; gate testeable; API fuera del gate

> Bolt: 04-1-github-auth · Estado: **Aceptada** (checkpoint 2026-07-10)

## Contexto
Backstage necesita login con GitHub para toda la UI, y el token de GitHub de la sesión para consultar el estado de CI (Bolt 3). Debe ser testeable sin ejecutar el OAuth real (requiere GitHub App).

## Decisión
- **Auth.js v5 (`next-auth@5`)** con provider GitHub (App Router). `pages.signIn = "/signin"`.
- **Gate por el callback `authorized`** que delega en una función **pura `isProtectedPath(pathname)`** → testeable sin NextAuth; el middleware solo corre en rutas UI (matcher excluye `api`, `_next`, `signin`).
- **API fuera del gate de UI:** `/api/resolve` (host), `/api/miniapps/*/upload` (CI), `/api/scaffold`, `/api/seed` mantienen su propio criterio (público / token de servicio).
- **`access_token` de GitHub** guardado en JWT/sesión **server-side** (callbacks `jwt`/`session` puros, en `lib/auth-callbacks.ts`); **nunca** al cliente. Scope inicial `read:user`.
- **Env:** `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` (Auth.js autodetecta). Dev sin GitHub App real → placeholders; los tests usan sesión/OAuth mockeados.

## Consecuencias
- (+) La lógica de gate y de sesión es **pura y testeable** (isProtectedPath + callbacks) sin OAuth real.
- (+) El token queda server-side; el estado de CI (Bolt 3) lo usa sin exponerlo.
- (+) Las API que consumen host/CI no se ven afectadas por el login de UI.
- (−) El **login real** requiere crear una **GitHub OAuth App** (client id/secret) → placeholder; no ejecutable por el agente.
- (−) `next-auth@5` está en beta (aunque estable/usado en producción); anclar versión.
- (−) Scope `read:user` → el estado de CI solo verá repos públicos (scope amplio diferido, intent futuro).
