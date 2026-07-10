# Bolt 02-1 — Publicar paquetes · Etapa 1: MODEL

> DDD stage 1/5 · Estado: **Borrador (esperando validación humana)** · Fecha: 2026-07-09
> Intent 02 · Stories: S1.1 ui-kit→dist · S1.2 verificar publish · S1.3 docs de consumo

Bolt de **tooling/packaging** (no RN device). El "dominio" es el **modelo de publicación**: cómo un paquete del monorepo se vuelve un artefacto instalable por versión desde un repo externo.

## 1. Lenguaje ubicuo (publicación)
| Término | Definición |
|---|---|
| **Paquete publicable** | `@org/*` con `dist` (JS+`.d.ts`), `files`, `exports`, `publishConfig`. |
| **`dist`** | Salida compilada que se publica (no `src`). |
| **`publishConfig` (pnpm)** | Overrides aplicados **solo al publicar** (registry + `main`/`types`/`exports`→dist). Permite que el workspace consuma `src` y el tarball use `dist`. |
| **Consumidor externo** | Un repo de miniapp que instala `@org/*` por versión desde GitHub Packages (con `.npmrc` + token `read:packages`). |
| **Semver** | Versión del paquete; cambio incompatible del contrato = **major**. |

## 2. Estado actual (dato)
- **`@org/miniapp-contract`** — ya publicable: `main: dist`, `files: [dist]`, `publishConfig`. Solo verificar.
- **`@org/ui-kit`** — `main: src/index.ts`, **sin build ni publishConfig**. Es el trabajo real.

## 3. Modelo del artefacto ui-kit publicable
```
@org/ui-kit (publicado)
├── dist/index.js          JS transpilado (tsc, jsx:react-jsx)
├── dist/**/*.d.ts         tipos
├── package.json           main/types/exports → dist (vía publishConfig al publicar)
└── peerDeps: react, react-native   (NO se empaquetan; los provee el consumidor)
```
- **Regla clave:** las primitivas RN importan `react`/`react-native` como **peer** — se resuelven en el consumidor (host o miniapp), donde son singletons federados. Nunca se bundlean en `dist`.

## 4. Patrón de doble consumo (dev vs publicado)
- **Workspace/dev:** `main: src/index.ts` → el host y el monorepo consumen **fuente** (sin build, HMR).
- **Publicado:** `publishConfig` (pnpm) sobreescribe `main`/`types`/`exports` → **`dist`** en el tarball.
- Así **no cambia** el consumo del host, y los repos externos reciben `dist`.

## 5. Lógica / verificación (no hay lógica de negocio)
- El "test" del bolt es **estructural**: `npm pack --dry-run` produce tarballs con `dist` + `.d.ts`; el host sigue verde (tsc + jest); un `.npmrc` documentado permite el consumo externo.
- Publicación **real** a GitHub Packages requiere **org real + token** (hoy `@org` es placeholder) → se deja como paso final documentado, verificado con `pack` en su ausencia.

## 6. Frontera
- Consumo del contrato/ui-kit por el **template** y las **miniapps** → Bolts 2 y 3.
- Registry/scaffolder → Bolt 4.

## Preguntas para el checkpoint
1. **Build de ui-kit:** propongo **`tsc`** (ya lo usamos para el contrato; emite JS + `.d.ts`, cero deps nuevas). Alternativa `tsup` (bundla, más rápido pero otra dep). ¿tsc?
2. **Doble consumo con `publishConfig` (pnpm)** — mantener `main: src` para dev y overridear a `dist` al publicar. ¿OK, o prefieres cambiar `main` a `dist` directo (el host consumiría dist, requiere build antes de correr)?
3. **Publicación real:** ¿tienes ya el **org de GitHub** para publicar de verdad en este bolt, o lo dejo verificado con `npm pack` y el publish real queda documentado para cuando me des el org?
