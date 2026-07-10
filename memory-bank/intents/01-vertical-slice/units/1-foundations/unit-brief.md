# Unit 1 — Foundations (monorepo + scaffold + shared packages)

> Intent: 01-vertical-slice · Estado: Borrador · Fecha: 2026-07-09

## Propósito
Sentar la base sobre la que se construyen host, miniapp y Backstage: monorepo pnpm, scaffold Re.Pack del host, y los paquetes compartidos (`ui-kit`, `miniapp-contract`).

## Alcance
- `pnpm-workspace.yaml` con `apps/*`, `miniapps/*`, `packages/*`.
- Scaffold del host RN + **Re.Pack** (Rspack + Module Federation v2) — **sin Metro**.
- `packages/miniapp-contract`: tipos de manifest, entry, capabilities, shared list. **Configurado para publicarse** como `@org/miniapp-contract` (semver, `publishConfig` a registry privado) — lo consumirá el repo separado de Backstage.
- `packages/ui-kit`: primitivas themed base (AppText, Box, Card) + tokens (light/dark) por `design-standards.md`.
- Config TS strict compartida.

## Clasificación
- **Host / Remote / Web:** infraestructura compartida (no es un remote).
- **Módulos nativos:** ninguno.
- **Singletons declarados aquí:** lista canónica `shared` (react, react-native, navigation, zustand, @tanstack/react-query).

## Dependencias
- Ninguna previa. **Bloquea a las unidades 2, 3, 4.**

## Stories
- S1.1 — Monorepo pnpm + workspaces.
- S1.2 — Scaffold host RN + Re.Pack (MF v2) que arranca vacío.
- S1.3 — `packages/miniapp-contract` (tipos del contrato).
- S1.4 — `packages/ui-kit` con tokens + primitivas themed.

## Criterios de aceptación
- `pnpm install` resuelve el workspace; `tsc` verde en todos los paquetes.
- El host arranca en emulador con una pantalla vacía servida por Re.Pack (no Metro).
- `miniapp-contract` y `ui-kit` importables desde otros paquetes.
