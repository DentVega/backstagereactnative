# Bolt 02-1 — Publicar paquetes · RESULT

> Estado: **COMPLETO** · Fecha: 2026-07-09 · Intent 02 · Stories: S1.1–S1.3

## Qué se construyó
`@org/ui-kit` y `@org/miniapp-contract` quedaron **publicables** a GitHub Packages con el patrón de doble consumo (dev=src, publicado=dist), sin cambiar el consumo del host.

## Evidencia (verificado, no afirmado)
- **Build ui-kit:** `pnpm --filter @org/ui-kit build` → `dist/` con JS + `.d.ts` (index + primitives + theme).
- **`pnpm pack` (aplica publishConfig):**
  - `@org/ui-kit`: package.json publicado con `main: ./dist/index.js`, `types: ./dist/index.d.ts`, `exports`→dist; tarball contiene **`package/dist/**` (no `src`)**.
  - `@org/miniapp-contract`: `main: ./dist/index.js`; tarball con `dist`.
- **Host/workspace verdes:** typecheck 5/5 · **74 tests** (consumo de ui-kit por `src` intacto).
- **Doc de consumo:** `packages/PUBLISHING.md` (publicar + `.npmrc` externo + peerDeps + versionado).

## Cobertura de stories
- **S1.1 ui-kit→dist** ✓ — `tsconfig.build.json` (tsc emite dist, excluye tests) + `build`/`prepack` + `files` + `publishConfig` override; react/react-native como peer.
- **S1.2 verificar publish** ✓ — `pnpm pack` de ambos produce tarballs válidos con `dist`+`.d.ts`; publishConfig aplicado.
- **S1.3 docs de consumo** ✓ — `PUBLISHING.md` con `.npmrc`, install por versión, y flujo de publicación.

## ADR
- ADR-010 — Doble consumo con `publishConfig` de pnpm (dev=src, publicado=dist), build con tsc, peer react/RN.

## NO hecho / diferido (honesto)
- **Publicación REAL** a GitHub Packages: requiere **org real de GitHub** (hoy `@org` es placeholder) + token `write:packages`. Verificado con `pnpm pack`; el `publish` real queda documentado en `PUBLISHING.md` para cuando haya org.
- Las skills de test RN (RNTL/agent-device) no aplican (bolt de tooling).

## Siguiente
- **Bolt 02-2** (Template de miniapp) — usa estos paquetes publicados como deps.
