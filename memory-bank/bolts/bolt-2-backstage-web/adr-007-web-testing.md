# ADR-007 — Testing de Backstage con Vitest + RTL (las skills de test RN no aplican)

> Bolt: bolt-2-backstage-web · Estado: **Aceptada** (checkpoint 2026-07-09)

## Contexto
El flujo AI-DLC RN prescribe React Native Testing Library (Layer 1) y `agent-device` (Layer 2). Backstage es un repo **web (Next.js)**, no RN: esas herramientas no aplican (no hay dispositivo, ni componentes RN).

## Decisión
Testear Backstage con herramientas web:
- **Vitest** para la lógica de registry (pura) y para los Route Handlers (invocados como funciones con `Request` mockeada).
- **@testing-library/react** para el componente `CatalogList` (presentacional, client).

Sin `agent-device`: la verificación "de sistema" de Backstage es que el host (Bolt 4) **resuelva** una miniapp real contra la API — se hará en Bolt 4.

## Consecuencias
- (+) Testing idiomático para web; rápido en CI.
- (+) `testing-standards.md` (RN) sigue vigente para el móvil; este ADR documenta la excepción para el repo web.
- (−) Dos ecosistemas de test en el proyecto (RN: Jest/RNTL; web: Vitest/RTL) — esperado al tener dos planos.
- **Cierre de S4:** dominio + handlers (Vitest) verdes + `CatalogList` (RTL) verde. La resolución end-to-end host↔Backstage se valida en Bolt 4.
