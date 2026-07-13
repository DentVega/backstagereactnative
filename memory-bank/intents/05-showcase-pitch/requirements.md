# Intent 05 — Showcase / Pitch Artifact · REQUIREMENTS

> Inception · Fecha: 2026-07-10 · Tipo: **marketing/showcase** (no feature RN)

## Business intent
Tener un **one-pager visual navegable** que presente el proyecto "Spotify for Backstage"
a clientes/prospectos, para que entiendan el **valor** y la **solidez técnica** en **<2 min**
y se pueda **compartir por link** o enseñar en una llamada.

## Por qué (contexto)
El proyecto es una **demo para conseguir clientes** (ver `memory/project-purpose-demo`).
Ya existen: demo web en vivo, 4 repos públicos con READMEs. Falta la **pieza de venta**:
un artefacto que cuente la historia de un vistazo, sin obligar a leer código o READMEs.

## Requisitos funcionales
1. **Hero** — nombre, tagline ("Spotify for Backstage / micro-frontends para React Native"),
   CTA a la **demo en vivo** (backstage-web-blond.vercel.app).
2. **El problema / la idea** — 1–2 frases: super-app bancaria donde cada feature es una
   miniapp independiente cargada en runtime.
3. **Arquitectura de tres planos** — diagrama visual (host RN ↔ Backstage ↔ repos de miniapp).
4. **Flujo de resolución** — cómo el host resuelve y monta una miniapp por Module Federation.
5. **Capacidades** — registry, scaffolder, auth GitHub, estado de CI, catálogo/detalle.
6. **Stack** — RN 0.76 + Re.Pack 5 (MF v2), Next.js 16, TypeScript, Auth.js, Vitest.
7. **Prueba de rigor** — señales de calidad: 102 tests, ADRs, contrato versionado,
   seguridad (capabilities acotadas, token server-side), flujo AI-DLC.
8. **Enlaces** — demo en vivo + los 4 repos públicos.
9. **Bilingüe** — ES/EN (toggle o dos secciones).

## Requisitos no funcionales
- **Autocontenido** — un solo archivo (CSS/JS inline), sin dependencias externas
  (encaja con el CSP de Artifacts de claude.ai).
- **Responsive** + **theme-aware** (light/dark).
- **Compartible** — publicable como Artifact (link) y/o exportable a HTML.
- Carga instantánea, sin build.

## Fuera de alcance
- No es una app; no hay backend ni datos en vivo embebidos (más allá de enlazar la demo).
- No toca los repos de código (es un entregable separado).
- Sin analítica/tracking.

## Criterios de aceptación
- Un prospecto entiende qué es, el valor y el rigor técnico en <2 min sin leer código.
- Diagramas claros de arquitectura + flujo.
- CTAs a demo + repos funcionando.
- ES/EN. Responsive y light/dark. Autocontenido (un archivo).
