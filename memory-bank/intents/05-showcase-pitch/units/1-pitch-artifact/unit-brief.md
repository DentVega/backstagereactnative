# Unit 1 — Pitch Artifact (one-pager)

> Intent: 05-showcase-pitch · Estado: Borrador · Fecha: 2026-07-10

## Propósito
Construir el one-pager navegable de venta como un **único artifact autocontenido**,
bilingüe, responsive y theme-aware.

## Clasificación
- **Web / marketing.** No RN, no remote federado, sin módulos nativos.
- Entrega = Artifact de claude.ai (HTML+CSS+JS inline).

## Alcance (secciones de la página)
1. **Hero** — nombre + tagline + CTA demo + CTA repos + toggle ES/EN.
2. **La idea** — el problema y la solución en 1–2 frases.
3. **Arquitectura de tres planos** — diagrama SVG/HTML inline.
4. **Flujo de resolución** — pasos host → Backstage → mount (diagrama/steps).
5. **Capacidades** — grid de tarjetas (registry, scaffolder, auth, CI, catálogo/detalle).
6. **Stack + rigor** — badges del stack + señales de calidad (102 tests, ADRs, seguridad, AI-DLC).
7. **Footer** — enlaces (demo + 4 repos) + nota "demo/portfolio".

## Dependencias
- Contenido ya existente (READMEs, demo en vivo, repos). Sin dependencias de código.

## Stories
- S1.1 — Estructura + diseño base (hero, layout responsive, light/dark, toggle ES/EN).
- S1.2 — Diagramas inline (tres planos + flujo de resolución) en SVG/HTML.
- S1.3 — Secciones de contenido (idea, capacidades, stack+rigor) + CTAs/enlaces.
- S1.4 — Publicar como Artifact + entregar link; (opcional) exportar `.html`.

## Criterios de aceptación
- Un archivo autocontenido; carga sin red; responsive; light/dark.
- ES/EN con toggle funcional.
- Diagramas legibles sin dependencias externas.
- CTAs a demo + repos correctos.
- Publicado como Artifact con link.
