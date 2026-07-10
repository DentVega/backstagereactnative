# ADR-020 — CiStatusProvider: pull con cache, fallback `unknown`, token por llamada

> Bolt 04-3 · Fecha: 2026-07-10 · Repo `backstage-web` · Estado: Aceptado

## Contexto
La UI de Backstage (Bolt 04-4) debe mostrar el estado del último build de CI de cada
miniapp. El estado vive en GitHub Actions. Cada miniapp es su propio repo (arquitectura
de tres planos), buildeado por su CI. Necesitamos leer ese estado sin acoplar la UI a
GitHub y sin caer si GitHub falla o falta el token.

## Decisión
1. **Abstracción inyectable `CiStatusProvider`** (mismo patrón que `GitProvider`, ADR-013):
   `getStatus(repoFullName, token)`. Impl `githubCiProvider` (Actions REST) + `mockCiProvider`.
2. **Pull con cache corta (~60s)** por repo — no webhooks. Simple, sin estado persistente
   ni endpoint de recepción; suficiente para un catálogo que se refresca por navegación.
3. **`unknown` como estado, no excepción.** Todo fallo (HTTP, red, token ausente, repo
   privado sin scope, JSON raro) colapsa a `unknown`. La UI nunca rompe por CI.
4. **Token por llamada**, no capturado en el provider — el token de sesión (Unit 1) es
   per-request; pasarlo por argumento evita cerrar sobre un token de vida larga.
5. **`now` inyectado** en la cache (no `Date.now()` directo) → tests deterministas del TTL.

## Alternativas descartadas
- **Webhooks de GitHub → almacenar estado:** empuja en vez de tirar; requiere endpoint
  público, verificación de firma y storage. Sobredimensionado para este intent → **diferido**.
- **Sin cache (fetch en cada render):** rate-limit de GitHub + latencia por card. No.
- **Lanzar excepción ante fallo:** obligaría try/catch en la UI y rompería el catálogo si
  un repo falla. `unknown` es más resiliente.

## Consecuencias
- (+) UI desacoplada y resiliente; provider testeable sin red; TTL testeable con `now`.
- (+) Reutiliza convención `types/impl/mock` + selector index del repo.
- (−) Estado puede estar hasta ~60s desfasado (aceptable para un badge de catálogo).
- (−) `unknown` agrupa varias causas de fallo (sin diagnóstico fino) — aceptable para UI.

## Seguridad
- Token server-side, nunca al browser/logs/cache. La cache guarda solo `status` público.
