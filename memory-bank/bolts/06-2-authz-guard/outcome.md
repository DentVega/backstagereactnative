# Bolt 06-2 — Guard de autorización del scaffolder · OUTCOME

> Intent 06 · Repo `backstage-web` · Fecha: 2026-07-10 · Estado: **Hecho ✅**

## Qué se construyó
Guard de autorización para proteger la cuenta GitHub en la demo pública: solo usernames
en una allowlist pueden crear miniapps.

## Archivos
- `lib/scaffold-authz.ts` — `canScaffold(login, allowlist)` (puro, fail-closed, case-insensitive,
  trim) + `ScaffoldForbiddenError` (code FORBIDDEN).
- `lib/config.ts` — `scaffoldAllowedLogins()` parsea `SCAFFOLD_ALLOWED_LOGINS` (CSV; vacío → deny).
- `lib/auth-callbacks.ts` — captura `profile.login` en el JWT y lo expone en la sesión (`githubLogin`).
- `types/next-auth.d.ts` — `githubLogin?` en Session y JWT.
- `lib/http.ts` — `ScaffoldForbiddenError` → **403**.
- `app/api/scaffold/route.ts` — guard **antes** de tocar GitHub/registry (lee la sesión).

## Decisión
- **ADR-022** — Allowlist de logins, **fail-closed**, guard puro y testeable, 403 claro,
  login capturado del profile. Base para el futuro control de acceso a toda la app (DEFERRED).

## Verificación
- Vitest: **117 passed** (18 files) — antes 104 (+13): `canScaffold` (allow/deny/empty/case/null),
  parsing de env, mapeo 403, captura de login en callbacks, y **ruta**: login no permitido → 403
  sin llamar a GitHub ni escribir el registry; sin sesión → 403; allowlist vacía → 403; permitido → 201.
- `tsc`: limpio · `next build`: OK.

## Seguridad
- Token y allowlist por env; login server-side; `githubAccessToken` nunca al navegador.

## Siguiente
- Bolt 06-3 (Operations) — provisionar KV + secrets reales (incl. `SCAFFOLD_ALLOWED_LOGINS=DentVega`)
  + redeploy + smoke E2E. Requiere tu cuenta.
