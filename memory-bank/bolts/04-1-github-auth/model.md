# Bolt 04-1 — Login con GitHub · Etapa 1: MODEL

> DDD stage 1/5 · Estado: **Borrador** · Fecha: 2026-07-10 · Intent 04
> Backstage web (Next.js 16) · Tests: Vitest + RTL. Stories: S1.1 Auth.js · S1.2 middleware · S1.3 header

Auth con **Auth.js v5** (next-auth@5) + GitHub OAuth. El dominio es delgado: sesión + gate + token de GitHub server-side.

## 1. Lenguaje ubicuo
| Término | Definición |
|---|---|
| **Sesión** | Usuario autenticado (login, avatar) + `githubAccessToken` (server-side). |
| **Gate** | Middleware que exige sesión para la UI (no para las API). |
| **Ruta protegida** | UI: `/`, `/catalog`, `/miniapp/*`, `/create`. Excluidas: `/api/resolve`, `/upload`, `/scaffold`, `/seed`, `/signin`, `/api/auth/*`. |

## 2. Modelo
```
auth.ts (NextAuth v5):
  providers: [GitHub({ authorization scope: read:user })]
  pages: { signIn: "/signin" }
  callbacks:
    jwt({token, account})    → guarda account.access_token en el token (primer login)
    session({session, token})→ expone session.githubAccessToken (server-side)
    authorized({auth, request}) → isProtectedPath(path) && !auth ? false(redirect) : true
```
- **`isProtectedPath(pathname)`** = función **pura** (lista de rutas UI protegidas vs. excluidas) → **testeable** sin NextAuth.
- El `access_token` de GitHub se guarda en el JWT/sesión **server-side** (lo usará el estado de CI, Unit 3); **nunca** se manda al cliente.

## 3. Piezas
- `auth.ts` (config) + `app/api/auth/[...nextauth]/route.ts` (handlers).
- `middleware.ts` (`export { auth as middleware }` + matcher).
- `app/signin/page.tsx` (botón → `signIn("github")`).
- `UserMenu` (client, presentacional: avatar/login + sign-out) + wrapper server que obtiene la sesión.

## 4. Verificación (Vitest + RTL)
- `isProtectedPath`: UI protegidas → true; API/signin/auth → false.
- Callbacks `jwt`/`session`: el access_token se propaga; no se filtra al cliente.
- `UserMenu` (RTL): render con usuario (avatar/login) + botón sign-out; sin usuario → botón sign-in.
- **OAuth real** (redirect a GitHub) = requiere GitHub App (client id/secret) → placeholder; se verifica lo mockeable.

## 5. Frontera
- Estado de CI (usa el token) → Bolt 3. Detalle/catálogo (tras el gate) → Bolt 4.

## Preguntas para el checkpoint
1. **Librería:** `next-auth@5` (Auth.js v5, App Router). ¿OK?
2. **Gate vía `authorized` callback + `isProtectedPath` puro** (testeable), en vez de lógica opaca en el middleware. ¿OK?
3. **Env de dev:** para levantar sin GitHub App real, propongo permitir arrancar con `AUTH_SECRET` dummy y el provider GitHub con id/secret placeholder (el login real falla pero la app no crashea; los tests usan sesión mockeada). ¿OK?
