# Bolt 05-1 — Pitch one-pager (artifact) · OUTCOME

> Intent 05 (showcase-pitch) · Fecha: 2026-07-10 · Estado: **Hecho ✅**

## Qué se construyó
One-pager de venta bilingüe (ES/EN) publicado como **Artifact de claude.ai**, para
presentar el proyecto a clientes en <2 min. Entregable de marketing, no feature RN.

**🔗 Artifact:** https://claude.ai/code/artifact/99908d5e-88c1-4eea-b915-7037a892e9a9
Fuente: `scratchpad/pitch.html` (redeploy = republicar mismo path → mantiene la URL).

## Dirección de diseño
- Concepto **"Registry Console"**: ficha técnica premium de un registro de módulos.
- Fondo control-room oscuro + acento **ámbar-señal** (marca lo "vivo/montado"); **monospace
  del sistema** como voz técnica (CSP-safe, sin webfonts). Diagramas 100% HTML/CSS inline.
- Autocontenido (un archivo), responsive, light/dark por tokens (media query + `data-theme`
  override en ambos sentidos), i18n por toggle sobre un mismo DOM (spans `.en`/`.es`).

## Secciones
Hero (thesis "ship features without rebuilding the app" + consola de catálogo en vivo) ·
La idea · Arquitectura de 3 planos · Flujo de resolución (4 pasos, señal animada) ·
Capacidades (6 cards) · Rigor (métricas 102 tests / 21 ADRs / 4 repos / 0 creds + badges de stack) ·
Footer con enlaces a demo + 4 repos.

## Verificación
- Publicado OK. Autocontenido (sin recursos externos → CSP-safe). Reveal on-scroll +
  animación de señal respetan `prefers-reduced-motion`. CTAs a demo + repos correctos.

## Pendiente (opcional)
- Compartir el Artifact (menú Share) para obtener link público.
- Añadir capturas reales de la demo si se quiere reforzar (hoy usa una consola ilustrativa).

## Cierra
Intent 05 completo (1/1 bolt).
