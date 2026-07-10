# Bolt 1 — Foundations · Etapa 2: DESIGN

> DDD stage 2/5 · Estado: **Borrador (esperando validación humana)** · Fecha: 2026-07-09

## 1. Layout del monorepo (Repo A — móvil)

```
backstagereactnative/
├── package.json                 workspace root (scripts, devDeps compartidas)
├── pnpm-workspace.yaml          apps/* · miniapps/* · packages/*
├── tsconfig.base.json           TS strict compartido (extends por cada paquete)
├── jest.config.base.js          preset RN + RNTL compartido
├── apps/
│   └── host/                    RN + Re.Pack (container MF "host")
│       ├── rspack.config.mjs     Re.Pack + ModuleFederationPlugin
│       ├── index.js · App.tsx    boot mínimo (pantalla vacía en Bolt 1)
│       └── package.json
├── miniapps/                    (vacío en Bolt 1 — la Dashboard llega en Bolt 3)
└── packages/
    ├── miniapp-contract/        @org/miniapp-contract (PUBLICABLE)
    │   ├── src/{types.ts, guards.ts, shared.ts, index.ts}
    │   ├── package.json (name @org/…, version, publishConfig, exports, types)
    │   └── tsup/tsc build → dist/ + .d.ts
    ├── ui-kit/                  @org/ui-kit (workspace)
    │   ├── src/theme/{tokens.ts, light.ts, dark.ts, ThemeProvider.tsx, useTheme.ts}
    │   └── src/primitives/{AppText.tsx, Box.tsx, Card.tsx, Button.tsx}
    └── host-runtime/            @org/host-runtime (workspace, CÁSCARA en Bolt 1)
        └── src/index.ts          placeholder; el loader real se implementa en Bolt 4
```

## 2. Elecciones técnicas concretas (a fijar en Implement)

| Área | Elección | Nota |
|---|---|---|
| Package manager | **pnpm** workspaces | remotes/packages como workspaces |
| Node | LTS activo (≥20) | — |
| React Native | **última estable con New Arch** (0.76+) | pin exacto en Implement |
| Bundler | **Re.Pack 5** (Rspack + **Module Federation v2**) | NO Metro |
| JS engine | Hermes | bytecode/tree-shaking |
| Lenguaje | TypeScript **strict** | `tsconfig.base.json` |
| Estado | Zustand + @tanstack/react-query | singletons (declarados en `shared`) |
| Tests | Jest + React Native Testing Library | preset compartido |
| Build del contrato | tsc/tsup → `dist` + `.d.ts` | para publicar `@org/miniapp-contract` |
| **Plataforma foco** | **Android primero** (migración desde Android) | iOS diferido a un intent posterior |

## 3. Shared singletons (Module Federation) — lista canónica

Declarada idéntica en host y (futuros) remotes. En el host es `eager`.

```
react                 · singleton, eager (host)
react-native          · singleton, eager (host)
@react-navigation/*   · singleton
zustand               · singleton   (estado compartido; copia por-remote = estado partido)
@tanstack/react-query · singleton   (cache compartida; copia por-remote = cache partida)
@org/ui-kit           · shared, NO singleton (stateless UI; se comparte para evitar duplicación)
```
`@org/miniapp-contract` **no** va en `shared` de MF: es solo tipos (build-time), no runtime.

## 4. Placement host vs. remote (entregables de Bolt 1)

| Paquete | Ubicación runtime | ¿Nativo? | Rol |
|---|---|---|---|
| `apps/host` | **Host bundle** (container MF) | sí (es la app RN) | Boot + shell; monta remotes (Bolt 4) |
| `@org/miniapp-contract` | **Ninguna** (build-time, publicado) | no | Contrato cross-repo |
| `@org/ui-kit` | **Shared** (host + miniapps) | no | Sistema visual |
| `@org/host-runtime` | **Host bundle** | no | Loader (cáscara ahora, lógica en Bolt 4) |

## 5. Diseño del `ui-kit`
- `ThemeProvider` (Context) expone `Theme`; `useTheme()` lo lee. Respeta `useColorScheme()` del OS + override in-app.
- Primitivas: `AppText` (variant=TypeToken), `Box` (padding/margin por SpacingToken), `Card` (surface+radius+elevation), `Button` (44×44 mínimo, accessibilityRole).
- **Styling:** `StyleSheet` + tokens (ver decisión abierta abajo). Sin hex/valores crudos en componentes.

## 6. Diseño del contrato (`@org/miniapp-contract`)
- `types.ts`: los value objects del Model. `guards.ts`: `isManifest`, `parseSemVer`. `shared.ts`: `satisfiesShared` (+ `SkewResult`).
- `package.json`: `"name": "@org/miniapp-contract"`, `version` semver, `exports` (ESM+types), `publishConfig` a registry privado.
- Sin deps de runtime (solo devDeps de build/test).

## 7. Decisiones que van a ADR (Etapa 3)
- **ADR-001** — Styling del ui-kit: `StyleSheet + tokens` **vs** NativeWind.
- **ADR-002** — Publicación del contrato: **npm privado vs. GitHub Packages** + política de versionado.
- **ADR-003** — Android-first (diferir iOS) para el slice de migración.

## Decisiones cerradas (checkpoint 2026-07-09)
1. **Styling del ui-kit:** `StyleSheet + tokens` → ADR-001.
2. **Registry del contrato:** GitHub Packages → ADR-002.
3. **Plataformas:** iOS **y** Android desde el inicio (no Android-first) → ADR-003.
