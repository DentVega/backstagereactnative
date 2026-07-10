# Bolt 04-3 — Estado de CI · Etapa 2: DESIGN

> DDD 2/5 · Estado: **Borrador** · Fecha: 2026-07-10 · Repo `backstage-web`

## 1. Archivos (nuevos salvo indicado)
```
lib/ci/types.ts    CiStatus, CiStatusProvider, CiProviderError, repoFullNameFor()
lib/ci/github.ts   githubCiProvider(fetchImpl?) → GET actions/runs, mapea conclusion→CiStatus
lib/ci/mock.ts     mockCiProvider(map) → estados fijos por repo (tests/dev)
lib/ci/cache.ts    withCache(provider, {ttlMs, now}) → decorator memoizador por repo
lib/ci/index.ts    getCiProvider() → github envuelto en cache (o mock si NO hay token)
lib/ci/__tests__/ci.test.ts   github (success/failure/in_progress/none/unknown) + cache
```
> **Mismo patrón que `lib/git/`** (types/impl/mock) + registry `store.ts` (index selector).

## 2. Contrato
```ts
export type CiStatus = "success" | "failure" | "in_progress" | "none" | "unknown";
export interface CiStatusProvider {
  getStatus(repoFullName: string, token: string): Promise<{ status: CiStatus }>;
}
// helper puro, testeable:
export function repoFullNameFor(input: { owner: string; id: string; repoUrl?: string }): string
//   repoUrl "https://github.com/acme/miniapp-x" → "acme/miniapp-x"; si no → `${owner}/miniapp-${id}`
```

## 3. Impl GitHub
- `GET https://api.github.com/repos/<repoFullName>/actions/runs?per_page=1`
  headers: `Authorization: Bearer <token>`, `Accept: application/vnd.github+json`, api-version.
- `res.ok === false` → `unknown` (NO lanza). Parse `workflow_runs[0]`:
  - ausente → `none`
  - `conclusion === "success"` → `success`
  - `conclusion ∈ {failure,cancelled,timed_out,startup_failure,action_required}` → `failure`
  - `conclusion == null` (run vivo) → `in_progress`
  - cualquier otro / catch → `unknown`
- `fetchImpl` inyectable (default `fetch`) para testear sin red.

## 4. Cache (S3.2)
- `withCache(provider, { ttlMs = 60_000, now })` — `now: () => number` inyectado (test-determinista;
  el dominio no llama `Date.now()` directo).
- Mapa `repoFullName → { status, expiresAt }`. Hit válido → devuelve sin pegar a GitHub.
- Solo cachea el `status` (nunca el token). Miss/expirado → delega y re-cachea.

## 5. Selector (index)
- `getCiProvider()`: si no hay token de sesión disponible → `mockCiProvider` con `unknown`
  (degradación segura). Con token → `githubCiProvider` envuelto en `withCache`.
- El token se pasa **por llamada** (`getStatus(repo, token)`), no se captura en el provider.

## 6. Seguridad
- Token de sesión server-side (Unit 1), nunca al browser ni a logs ni a la cache.
- `repoFullName`/`status` son datos públicos → cacheables sin riesgo.

## 7. Verificación (Vitest)
- github: success / failure / in_progress / none / unknown (HTTP 500, red, token vacío).
- `repoFullNameFor`: desde repoUrl y desde owner/id.
- cache: 2ª llamada dentro de TTL no invoca fetch; tras expirar (avanzar `now`) sí.
- Suite Backstage verde.
