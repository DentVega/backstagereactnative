# ADR-021 — UI de detalle: view-model puro + CI resuelto en el server component

> Bolt 04-4 · Fecha: 2026-07-10 · Repo `backstage-web` · Estado: Aceptado

## Contexto
La UI debe mostrar detalle de miniapp (versión, fecha, repo, capabilities, versiones) y
estado de CI en catálogo + detalle. El estado de CI es dinámico (necesita el token de
sesión, red, cache); el resto es proyección del registry. Mezclar ambos en un solo lugar
acopla componentes de presentación a la red y complica los tests.

## Decisión
1. **View-model puro `MiniappDetail` / `CatalogEntry` enriquecido** derivados del record
   con funciones puras (`getMiniappDetail`, `listCatalog`) — testeables sin mocks ni red.
2. **CI status se resuelve SOLO en el server component** (`/catalog`, `/miniapp/[id]`)
   vía `getCiProvider()` + `auth()`, y se pasa como dato (`CiStatus`) a componentes
   presentacionales. Los componentes client no conocen GitHub ni el token.
3. **Componentes presentacionales client + RTL** (`CiBadge`, `VersionList`,
   `MiniappHeader`) — reciben props, sin fetching. Reusa el patrón de `CatalogList`.
4. **`notFound()`** para id inexistente en la ruta de detalle (no excepción cruda).
5. **`Promise.all`** para resolver CI de todas las entries del catálogo; la cache de
   04-3 evita el rate-limit y limita las llamadas reales.

## Alternativas descartadas
- **Fetch de CI dentro de los componentes client:** expondría el token al bundle y ataría
  presentación a red. No.
- **CI como campo del view-model puro:** rompería la pureza (necesita token/red/reloj).
- **Endpoint `/api/ci/[id]` + fetch client:** round-trip extra innecesario; el server
  component ya corre server-side con acceso al token y a la cache.

## Consecuencias
- (+) Presentación desacoplada, testeable con RTL sin mocks de red; dominio puro testeable.
- (+) Token nunca sale del server; a la UI solo llega el `CiStatus`.
- (−) El catálogo espera a `Promise.all` de CI (mitigado por cache ~60s y fallback `unknown`).
- (−) Con scope `read:user` los badges reales serán `unknown` hasta ampliar scope
  (`repo`/`actions:read`) — documentado como activation item, no bloquea la UI.
