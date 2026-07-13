# ADR-022 — Autorización del scaffolder: allowlist de logins, fail-closed

> Bolt 06-2 · Fecha: 2026-07-10 · Repo `backstage-web` · Estado: Aceptado

## Contexto
La demo es pública tras login GitHub. El scaffolder crea repos usando un `GITHUB_TOKEN`
server-side (PAT de la cuenta del deploy) → **cualquier usuario logueado podría crear repos
en esa cuenta**. Hay que restringir quién puede crear, sin romper el flujo para el dueño.

## Decisión
1. **Allowlist de usernames de GitHub** vía env `SCAFFOLD_ALLOWED_LOGINS` (CSV). El guard
   compara el `login` de la sesión (case-insensitive, trim) con la allowlist.
2. **Fail-closed**: allowlist vacía o login ausente → **denegar a todos**. En un deploy sin
   configurar, nadie puede crear (seguro por defecto). Producción setea p.ej. `DentVega`.
3. **Función pura `canScaffold(login, allowlist)`** — testeable sin red ni sesión.
   Error tipado `ScaffoldForbiddenError` (code `FORBIDDEN`) → **HTTP 403** (`statusForError`).
4. **Guard antes de tocar GitHub/registry** en `POST /api/scaffold` → un no autorizado
   nunca crea repos ni lee/escribe el store.
5. El **login** se captura en el JWT en el primer login (`profile.login`) y se expone en la
   sesión (server-side) — separado del `githubAccessToken`.

## Alternativas descartadas
- **Permitir a cualquier cuenta GitHub válida:** deja la cuenta del deploy abierta a abuso.
- **Crear repos bajo la cuenta de cada usuario:** imposible con un solo PAT; requeriría el
  token OAuth del usuario con scope `repo` (hoy el OAuth es `read:user`). Diferido.
- **Default "solo el dueño" mágico:** el server no conoce el dueño de forma fiable →
  preferimos allowlist explícita por env (fail-closed) sin magia.

## Consecuencias
- (+) Cuenta protegida en la demo; guard puro y testeable; 403 claro.
- (+) Base para el futuro "control de acceso por username" a toda la app (ver DEFERRED).
- (−) El dueño debe setear `SCAFFOLD_ALLOWED_LOGINS` para poder crear (aceptable, explícito).
- (−) Aún un solo owner de repos (el del PAT); multi-usuario real queda diferido.

## Seguridad
- Token y allowlist por env; login server-side; el `githubAccessToken` nunca va al navegador.
