# ADR-010 — Doble consumo de paquetes con `publishConfig` (dev=src, publicado=dist)

> Bolt: 02-1-publish-packages · Estado: **Aceptada** (checkpoint 2026-07-09)

## Contexto
`@org/ui-kit` (y `@org/miniapp-contract`) deben: (a) consumirse como **fuente** dentro del monorepo (dev, sin build, con HMR), y (b) publicarse como artefacto **compilado** (`dist`) para repos externos de miniapps. Cambiar `main` a `dist` obligaría a buildear antes de correr el host; dejar `main` en `src` no da un tarball publicable.

## Decisión
Usar el patrón de **doble consumo con `publishConfig` de pnpm**:
- `package.json`: `main`/`types` apuntan a **`src`** → consumo dev/workspace usa fuente (sin cambios para el host).
- `publishConfig` (pnpm) sobreescribe **solo al publicar**: `registry` (GitHub Packages), `access`, y `main`/`types`/`exports` → **`dist`**.
- Build con **`tsc`** (`tsconfig.build.json`: emite JS + `.d.ts`, excluye tests). `prepack` corre el build.
- `react`/`react-native` quedan como **peerDependencies** (no se emiten dentro de `dist`; los provee el consumidor como singletons federados).

## Consecuencias
- (+) El host y el monorepo **no cambian** su consumo (siguen usando `src`).
- (+) Los repos externos reciben `dist` compilado por versión.
- (+) Cero infra nueva: `tsc` ya está; `publishConfig` es nativo de pnpm.
- (−) Depende de que se use **pnpm** para publicar (los overrides de `publishConfig` son de pnpm). Documentado.
- (−) Hay que recordar `build`/`prepack` antes de publicar (cubierto por `prepack`).
- **Verificación:** `npm pack` produce tarball con `dist`; el host queda verde. Publish real = org + token (placeholder hoy).
