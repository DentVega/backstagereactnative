# Intent 05 — Showcase / Pitch Artifact · BOLT PLAN

> Inception · Fecha: 2026-07-10

## Enfoque
Entregable único y cohesivo (un archivo). No tiene sentido fragmentarlo en muchos bolts;
**un solo bolt** que produce el artifact completo, con las 4 stories como pasos internos.

## Bolt 05-1 — Pitch one-pager (artifact)
- **Stories:** S1.1 (base/diseño) · S1.2 (diagramas) · S1.3 (contenido/CTAs) · S1.4 (publicar).
- **Naturaleza:** web estática autocontenida; **no RN, no federado, sin nativos**.
- **Etapas DDD adaptadas** (es UI de marketing, no dominio):
  - *Model/Design:* estructura de secciones + sistema visual (tokens, light/dark, i18n toggle).
  - *ADR:* decisiones no triviales (single-file CSP-safe, diagramas SVG inline vs Mermaid, i18n por toggle).
  - *Implement:* escribir el HTML/CSS/JS inline (skill `artifact-design` primero).
  - *Test/Verify:* revisión visual (responsive, light/dark, toggle ES/EN, enlaces), publicar Artifact.
- **Salida:** link del Artifact + registro en `memory-bank/bolts/05-1-pitch-artifact/`.

## Riesgos / notas
- **CSP de Artifacts**: nada externo (fuentes/CDN/fetch). Diagramas y estilos 100% inline.
- Mantener el contenido sincronizado con la realidad (102 tests, URL de la demo, repos).
- Bilingüe: evitar duplicar layout — un solo DOM con textos conmutables por `data-i18n`.

## Siguiente
`/bolt-start 1` (de este intent) → construir y publicar el artifact.
