# Bolt 04-1 — Login GitHub · Etapa 2: DESIGN

> DDD stage 2/5 · Estado: **Borrador** · Fecha: 2026-07-10 · Repo `backstage-web`

## 1. Estructura
```
auth.ts                          NextAuth v5 (GitHub) + callbacks (jwt/session/authorized)
lib/auth-paths.ts                isProtectedPath(pathname) — PURO, testeable
lib/auth-callbacks.ts            jwtCallback / sessionCallback (puros, exportados para test)
middleware.ts                    export { auth as middleware } + matcher (solo UI)
app/api/auth/[...nextauth]/route.ts   export { GET, POST } = handlers
app/signin/page.tsx              botón "Sign in with GitHub" (signIn server action)
app/components/UserMenu.tsx      client: avatar/login + sign-out (next-auth/react)
app/layout.tsx                   header con <UserMenu user={session?.user}/>
types/next-auth.d.ts             augment Session/JWT con githubAccessToken
+ tests Vitest/RTL
```

## 2. auth.ts / callbacks
```ts
providers: [GitHub({ authorization: { params: { scope: "read:user" } } })]
pages: { signIn: "/signin" }
callbacks:
  jwt: jwtCallback           // account.access_token → token.githubAccessToken
  session: sessionCallback   // token.githubAccessToken → session (server-side)
  authorized({auth,request}) // isProtectedPath(path) ? !!auth : true
```
- `jwtCallback`/`sessionCallback` en `lib/auth-callbacks.ts` (puros) → testeables sin NextAuth.
- Env (Auth.js autodetecta): `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`.

## 3. `isProtectedPath`
- Protegidas: `/`, `/catalog`, `/miniapp/…`, `/create`.
- Excluidas (public/API): `/signin`, `/api/…` (auth, resolve, upload, scaffold, seed), `/_next/…`, assets.

## 4. Middleware
- `export { auth as middleware } from "@/auth"`; `config.matcher` excluye `api`, `_next/*`, `favicon`, `signin` (corre solo en UI). `authorized` decide (redirect a `/signin` si falta sesión).

## 5. UI
- `/signin`: `<form action={async () => { "use server"; await signIn("github", { redirectTo: "/catalog" }) }}>`.
- `UserMenu` (client): props `{ user? }`; con user → avatar+login+**sign-out** (`signOut()` de next-auth/react); sin user → nada (el header solo aparece autenticado).
- `layout.tsx`: `const session = await auth()` → header con UserMenu.

## 6. Verificación (Vitest + RTL)
- `auth-paths.test.ts`: rutas UI → protegidas; api/signin/_next → no.
- `auth-callbacks.test.ts`: jwt guarda access_token; session lo expone; no filtra al cliente.
- `UserMenu.test.tsx` (RTL, `signOut` mockeado): con user → avatar+sign-out; sin user → sin menú.
- OAuth real (redirect GitHub) = **manual** (requiere GitHub App).

## 7. ADR
- **ADR-018** — Auth con Auth.js v5 + GitHub; gate por `authorized`+`isProtectedPath` (puro, testeable); access_token server-side; API fuera del gate.

## Nota
Bolt web; sin RN/federación. Tests con sesión/OAuth mockeados; el login real requiere GitHub App (placeholder).
