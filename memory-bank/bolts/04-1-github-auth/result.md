# Bolt 04-1 — Login con GitHub · RESULT

> Estado: **COMPLETO** · Fecha: 2026-07-10 · Intent 04 · Stories: S1.1–S1.3
> Código en `backstage-web`. Bolt web (Vitest+RTL; RNTL/agent-device no aplican).

## Qué se construyó
Login con GitHub (Auth.js v5) que **gatea toda la UI** de Backstage; el token de GitHub queda server-side para el estado de CI (Bolt 3).

```
auth.ts                          NextAuth v5 (GitHub) + trustHost + callbacks
lib/auth-paths.ts                isProtectedPath() — puro, testeable
lib/auth-callbacks.ts            jwtCallback / sessionCallback — puros
middleware.ts                    export { auth as middleware } + matcher (solo UI)
app/api/auth/[...nextauth]/route.ts   handlers → { GET, POST }
app/signin/page.tsx              "Sign in with GitHub" (signIn server action)
app/components/UserMenu.tsx      client: avatar/login + sign-out
app/layout.tsx                   header con <UserMenu user={session?.user}/>
types/next-auth.d.ts             augment Session/JWT con githubAccessToken
```

## Evidencia (verificado, no afirmado)
- **Tests (Vitest+RTL):** **66 passing** (50 previos + 16: `isProtectedPath` 11 · callbacks 3 · `UserMenu` 2).
- **Typecheck** limpio · **Build Next.js** compila (ruta `/signin` + `ƒ Middleware`).
- **Gate verificado en server real:**
  - `/catalog` sin sesión → **307 → /signin?callbackUrl=…** · `/` → 307.
  - `/signin` → 200 (público) · `/api/resolve` → 200 (**fuera del gate**, lo consume el host).

## Cobertura de stories
- **S1.1 Auth.js + /signin** ✓ — NextAuth v5 GitHub (scope read:user), session con `githubAccessToken` (server-side), `/signin`.
- **S1.2 middleware** ✓ — gatea `/`, `/catalog`, `/miniapp/*`, `/create`; excluye api/signin/_next; redirect verificado.
- **S1.3 header** ✓ — `UserMenu` (avatar + sign-out) en el layout; tests RTL.

## ADR
- ADR-018 — Auth.js v5 + GitHub; gate por `authorized`+`isProtectedPath` (testeable); token server-side; API fuera del gate.

## Hallazgos (Implement)
- **Auth.js v5 exporta `handlers`** (no GET/POST directos) → la route hace `export const { GET, POST } = handlers`.
- **`trustHost: true`** es obligatorio para host no-Vercel (localhost) — sin él, `UntrustedHost` rompía el gate (daba 200 en vez de redirect). Vercel lo autodetecta.
- **Next 16 deprecó `middleware`→`proxy`**, pero el rename a `proxy.ts` **rompió el redirect de Auth.js** (diseñado para la convención `middleware`) → se mantiene `middleware.ts` (warning cosmético, funciona).

## NO hecho / diferido (honesto)
- **OAuth real (login con GitHub de verdad):** requiere una **GitHub OAuth App** (client id/secret) + `AUTH_SECRET` real → placeholder; verificado el gate/callbacks/UI con mocks + server con env dummy. El redirect a GitHub real es tu paso.
- Scope amplio `repo`/`workflow` (CI de repos privados) diferido.

## Siguiente
- **Bolt 04-2** (Registry metadatos: createdAt/repoUrl) — independiente. O **04-3** (CI status, usa el token de esta sesión).
