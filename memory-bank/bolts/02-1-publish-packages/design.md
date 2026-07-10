# Bolt 02-1 — Publicar paquetes · Etapa 2: DESIGN

> DDD stage 2/5 · Estado: **Borrador** · Fecha: 2026-07-09

## 1. Cambios en `@org/ui-kit`
```
packages/ui-kit/
├── package.json          + files, build/prepack scripts, publishConfig (override a dist)
├── tsconfig.build.json   (nuevo) emite dist/ (JS + .d.ts), excluye tests
└── src/…                 (sin cambios de código)
```
- `main: src/index.ts` / `types: src/index.ts` → **se mantienen** (consumo dev = fuente).
- **`publishConfig` (pnpm)** sobreescribe al publicar: `registry`, `access`, y `main`/`types`/`exports` → `dist`.
- `scripts`: `build: "tsc -p tsconfig.build.json"`, `prepack: "pnpm build"` (garantiza dist antes de pack/publish).
- `files: ["dist"]`.
- Build con **tsc** (jsx react-jsx, declaration, outDir dist); react/react-native quedan como **peer** (no se emiten dentro).

## 2. `@org/miniapp-contract`
- Ya publicable. Solo **verificar** `npm pack` y alinear `publishConfig` (access/registry) con ui-kit.

## 3. Documentación de consumo (S1.3)
- `packages/PUBLISHING.md`: cómo publicar (`pnpm --filter … publish`), y `.npmrc` para consumidores externos:
  ```
  @org:registry=https://npm.pkg.github.com
  //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}   # read:packages
  ```

## 4. Verificación (Etapa Test)
- `pnpm --filter @org/ui-kit build` → `dist/index.js` + `.d.ts`.
- `npm pack --dry-run` en ambos → tarball con `dist/**` (no `src`).
- Simular el package.json publicado (pnpm aplica publishConfig): confirmar `main`→dist.
- **Host sigue verde:** `tsc` + jest del host y del workspace (consumo por `src` intacto).
- Publicación real: documentada; requiere org + token (placeholder hoy).

## 5. ADR
- **ADR-010** — Doble consumo con `publishConfig` de pnpm (dev=src, publicado=dist); build de ui-kit con tsc.

## Nota
Bolt de tooling: sin cambios de UI ni de runtime. Riesgo bajo; el criterio es "pack válido + host verde".
