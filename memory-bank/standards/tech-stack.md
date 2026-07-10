# Tech Stack

> Read by every AI-DLC agent before acting. Keep current.

## Core (versiones fijadas en Bolt 1)
- **Framework:** React Native **0.76.6** (New Architecture) · React **18.3.1**.
- **Bundler:** **Re.Pack 5.2.5** (Rspack 1.7.x) — **NOT Metro**. Do not generate Metro-specific config.
- **Module Federation:** `@module-federation/enhanced` **pinned `0.9.0`** (exacto). ⚠️ NO subir a la línea 2.x: no resuelve subpaths con Re.Pack 5.2.5 (`error-codes/browser`, `runtime/helpers`).
- **pnpm quirks:** `public-hoist-pattern[]=@module-federation/*` y `@swc/helpers` en `.npmrc`; Jest usa `transformIgnorePatterns` que contempla el layout `.pnpm/`.
- **Code splitting / microfrontends:** Module Federation v2 — host app + on-demand remote chunks (JS or Hermes bytecode).
- **JS engine:** Hermes (bytecode chunks, tree-shaking enabled).
- **Language:** TypeScript (strict).

## Conventions
- Platforms: **iOS + Android** (ambas desde el inicio — ADR-003). Hermes en las dos.
- Styling: **`StyleSheet` + tokens** (ADR-001) — sin NativeWind; componentes leen tokens vía `useTheme()`, nunca hex crudo.
- Contract publishing: **GitHub Packages** (`@org/miniapp-contract`, ADR-002).
- Lists: **FlashList** (not FlatList) for any scrolling collection.
- Navigation: native-stack / native navigators (not JS-only stacks).
- State: **Zustand** (UI/app state) + **React Query / TanStack Query** (server state & cache). Both are `singleton: true` across host and every remote — a per-remote copy would split cache/state.
- Package manager / monorepo: **pnpm workspaces** (miniapps/remotes live as workspace packages so they can be either federated remotes OR shared packages). <confirm during Inception>

## Two products, TWO repositories
1. **Mobile host (bank app)** — THIS repo (`backstagereactnative`, pnpm workspace). The migrated Android banking app on RN + Re.Pack. Owns core nav, auth, session, and the runtime that mounts miniapps. Also holds the miniapps and shared packages.
2. **Backstage platform ("Spotify for miniapps")** — a **SEPARATE git repo** (`backstage-web`, owned by another team, independent CI/CD + deploy). A **web** app (catalog/registry/publisher) where teams create, register, version, and distribute miniapps. A miniapp can be consumed two ways:
   - **Federated remote** — downloaded on demand into the mobile host at runtime.
   - **Shared package** — published to the workspace/registry and imported at build time.

### Cross-repo contract
- The only coupling between the two repos is **`@org/miniapp-contract`** (manifest + `/api/resolve` shape). Source lives in the mobile repo (`packages/miniapp-contract`), **published** to a private npm registry / GitHub Packages with semver. The Backstage repo installs it by version. Any contract change = version bump + changelog; never a divergent local copy.

## Federation boundaries (fill in per project, refine in system-architecture.md)
- Host bundle contains: core navigation, auth/session, shared UI kit, the miniapp loader/runtime.
- Federated remotes: individual banking features + third-party/team miniapps — downloaded on demand.
- Shared singletons across chunks: react, react-native, navigation, state lib, data-cache client, i18n, session client (pin versions to avoid duplication / split caches).

## Backstage web stack
- Frontend + API: **Next.js (App Router)**. Registry/API via Next Route Handlers. Storage for chunk artifacts/CDN: **dev server local por ahora** (CDN/object storage diferido a Operations).

## Performance budget (baseline medido en Operations, 2026-07-09)
- Target FPS: 60. Time-to-interactive: **≤ 2500 ms** cold start (target; **medir en dispositivo** — Layer 2 pendiente).
- **Host chunk ceiling: ≤ 3 MB** JS pre-Hermes. Actual: **2.48 MB** ✅ (Hermes .hbc reduce ~30-50% en build nativo).
- **Remote incremental ceiling: ≤ 600 KB** (con singletons provistos por el host). Actual `account_dashboard`: container 384 KB + expose 44 KB ≈ **~430 KB** ✅.
- **Regla de no-duplicación:** react/react-native/react-query/flash-list/navigation son `singleton:true` en host y remotes → NO se re-descargan al montar (el build standalone del remote los emite como vendor chunks, pero el host los provee vía share scope).
- Banking-app baseline: cold start y secure-session init no deben regresar vs. la app Android nativa — medir cuando el build nativo esté operativo.
