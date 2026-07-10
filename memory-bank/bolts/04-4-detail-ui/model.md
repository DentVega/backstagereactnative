# Bolt 04-4 — UI de detalle + catálogo enriquecido · Etapa 1: MODEL

> DDD 1/5 · Estado: **Borrador** · Fecha: 2026-07-10 · Repo `backstage-web`
> Unit 4 (detail-ui) · Stories S4.1–S4.3 · Cierra Intent 04

## Propósito
Mostrar el detalle completo de cada miniapp y enriquecer el catálogo con los metadatos
(04-2) y el estado de CI (04-3). Cierra el intent: el usuario autenticado (04-1) ve
versión, fecha de creación, repo, estado de CI, versiones y capabilities.

## Lenguaje ubicuo
- **MiniappDetail** — view-model puro derivado del `MiniappRecord`:
  `{ id, name, owner, createdAt?, repoUrl?, latestVersion, versionCount,
     versions: VersionView[], capabilities: string[] }`.
- **VersionView** — fila de versión para la UI: `{ version, url, publishedAt, capabilities }`.
- **capabilities** — del `manifest` de la versión (latest para la cabecera; por versión en la lista).
- **CiBadge** — representación visual de `CiStatus` (04-3): color + etiqueta accesible.
- **CatalogEntry enriquecido** — gana `createdAt?` y `repoUrl?` (para fecha + link en la card).

## Reglas de dominio
1. El **detalle** es una proyección pura del record (sin red) → testeable sin mocks.
2. El **estado de CI** NO es parte del view-model puro (es dinámico, necesita token) →
   se resuelve en el server component vía `getCiProvider()` y se pasa a los componentes.
3. **Sin sesión → redirige** (ya lo garantiza el middleware de 04-1; `/catalog` y
   `/miniapp/[id]` son rutas protegidas).
4. El **token de sesión** se lee server-side con `auth()`; nunca se pasa al cliente —
   solo el `CiStatus` resultante llega a los componentes.
5. Miniapp inexistente en `/miniapp/[id]` → 404 (Next `notFound()`), no crash.

## No-objetivos
- Disparar/reintentar CI, logs de runs, historial más allá de las versiones publicadas.
- Paginación del catálogo, búsqueda/filtros (idea diferida).
