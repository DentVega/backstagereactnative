# Bolt 04-3 — Estado de CI (GitHub Actions) · OUTCOME

> DDD 5/5 completo · Fecha: 2026-07-10 · Repo `backstage-web` · Estado: **Hecho ✅**

## Qué se construyó
`CiStatusProvider` inyectable que lee el estado del último run de CI de cada miniapp
desde la GitHub Actions API, con cache corta y fallback resiliente. No renderiza UI
(eso es Bolt 04-4) — entrega el dominio + provider + cache + tests.

## Archivos (nuevos)
- `lib/ci/types.ts` — `CiStatus` (success|failure|in_progress|none|unknown),
  `CiStatusProvider`, `CiProviderError`, `repoFullNameFor()` (repoUrl → owner/repo,
  o fallback `<owner>/miniapp-<id>`).
- `lib/ci/github.ts` — `githubCiProvider(fetchImpl?)` → `GET actions/runs?per_page=1`,
  mapea `conclusion`→estado; **nunca lanza** (todo fallo → `unknown`).
- `lib/ci/mock.ts` — `mockCiProvider(map, fallback)` para tests/dev.
- `lib/ci/cache.ts` — `withCache(provider, {ttlMs:60_000, now})` memoiza por repo;
  `now` inyectado para TTL determinista; solo cachea `status`, nunca el token.
- `lib/ci/index.ts` — `getCiProvider()` (github+cache, o mock si `CI_STATUS_ENABLED=false`).
- `lib/ci/__tests__/ci.test.ts` — 18 tests.

## Decisión
- **ADR-020** — Pull con cache ~60s (no webhooks, diferido); `unknown` como estado
  no excepción; token por llamada (per-request, server-side); `now` inyectado.

## Verificación
- Vitest: **88 passed** (14 files) — antes 70 (+18).
- `tsc --noEmit`: limpio · `next build`: OK.
- Cubierto: mapping (success/failure/cancelled→failure/in_progress/none), newest-run,
  resiliencia (HTTP 500 / red / body malformado / sin token → unknown), bearer header,
  cache (hit dentro de TTL, re-hit tras expirar, por-repo), mock.

## Seguridad
- Token de sesión server-side, nunca al browser/logs/cache; la cache guarda solo `status` público.

## Siguiente
- Bolt 04-4 — UI de detalle: card/página con versión, fecha de creación, repoUrl y
  badge de estado de CI (consume `getCiProvider()` + metadata de 04-2).
