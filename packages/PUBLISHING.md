# Publicar `@dentvega/ui-kit`

`ui-kit` es el único paquete publicado desde este repo. Va a **npm público** (MIT). El resto del
scope vive en [`repack-miniapps`](https://github.com/DentVega/repack-miniapps):
`@dentvega/miniapp-contract`, `@dentvega/miniapp-runtime`, `@dentvega/miniapp-storage`.

**Doble consumo (ADR-010):** en el monorepo el host lo consume como **fuente** (`main: src`); al
publicar, `publishConfig` lo cambia a **`dist`**. Los imports relativos llevan `.js` explícito
(ESM válido); el host los resuelve al `.ts` con `resolve.extensionAlias` (Rspack) y
`moduleNameMapper` (jest).

## Publicar

```bash
pnpm --filter @dentvega/ui-kit build
pnpm --filter @dentvega/ui-kit check:dist      # todo import relativo del dist con .js
pnpm --filter @dentvega/ui-kit pack            # revisar: solo dist/, LICENSE, README
npm whoami                                     # si da 401: npm login
pnpm --filter @dentvega/ui-kit publish --no-git-checks
```

La cuenta tiene 2FA: publica una persona desde su terminal. Si npm deja la versión *staged*,
aprobarla en npmjs.com → paquete → **Staged Packages** → **Approve**.

## Consumir (miniapps)

```json
{ "dependencies": { "@dentvega/miniapp-contract": "^0.4.1", "@dentvega/ui-kit": "^0.1.1" } }
```

Sin `.npmrc` especial. `react` y `react-native` son peers: los provee la app. En runtime la miniapp
usa el `ui-kit` del host (singleton de Module Federation, `requiredVersion: '^0.1.0'`).

## Versionado

Semver. Un cambio incompatible de `ui-kit` es una release del host: el host es quien lo comparte.
