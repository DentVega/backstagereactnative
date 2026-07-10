# Bolt 04-3 — Estado de CI · Etapa 1: MODEL

> DDD 1/5 · Estado: **Borrador** · Fecha: 2026-07-10 · Repo `backstage-web`
> Unit 3 (ci-status) · Stories S3.1–S3.3

## Propósito
Exponer el estado del último build de CI de cada miniapp para que la UI (Bolt 04-4)
lo muestre. Resiliente: nunca rompe la UI aunque GitHub falle o falte el token.

## Lenguaje ubicuo
- **CiStatus** — estado del último workflow run de un repo miniapp. Dominio cerrado:
  - `success` — último run concluyó OK.
  - `failure` — último run concluyó en error (failure/cancelled/timed_out).
  - `in_progress` — hay un run en curso (status `in_progress`/`queued`, sin conclusion).
  - `none` — el repo no tiene runs todavía (recién scaffoldeado).
  - `unknown` — no se pudo determinar (sin token, sin repo, error de red, repo privado sin scope).
- **CiStatusProvider** — abstracción inyectable (mismo patrón que `GitProvider`):
  `getStatus(repoFullName: string, token: string) → Promise<{ status: CiStatus }>`.
- **repoFullName** — `<owner>/<repo>`, derivado de `record.repoUrl` o de `<owner>/miniapp-<id>`.
- **Cache de CI** — memoización corta (~60s TTL) por `repoFullName` para no pegar a
  GitHub en cada render del catálogo.

## Reglas de dominio
1. El estado sale del **último run** (`per_page=1`, orden por defecto = más reciente).
2. `conclusion` manda si existe; si es `null` (run vivo) → `in_progress`.
   Mapeo: `success→success`; `failure|cancelled|timed_out|action_required→failure`;
   `null` con status activo → `in_progress`; lista vacía → `none`.
3. **Cualquier fallo** (HTTP no-OK, red, token ausente, JSON inesperado) → `unknown`.
   Nunca lanza hacia la UI; el error es un estado, no una excepción que propague.
4. El **token es de sesión** (Unit 1), server-side; jamás llega al browser.
5. La cache es **por repo** y **efímera** (TTL); no persiste secretos, solo el `status`.

## No-objetivos (este bolt)
- Renderizar el badge en la UI → Bolt 04-4.
- Historial de runs, logs, disparar/reintentar CI.
- Webhooks push de GitHub (esto es pull con cache; webhooks = idea diferida).
