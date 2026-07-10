# Bolt 1 — Foundations · RESULT

> Estado: **COMPLETO** · Fecha: 2026-07-09 · Stories: S1.1–S1.4

## Qué se construyó
Monorepo pnpm con el host RN + Re.Pack (Module Federation v2) y tres paquetes, todos verificados con `tsc` + `jest` y builds reales de Re.Pack para Android e iOS.

```
backstagereactnative/
├── apps/host/                 RN 0.76.6 + Re.Pack 5.2.5 (Rspack) · container MF "host"
├── packages/miniapp-contract/ @org/miniapp-contract (publicable, GitHub Packages)
├── packages/ui-kit/           @org/ui-kit (tokens light/dark + primitivas, StyleSheet+tokens)
└── packages/host-runtime/     @org/host-runtime (cáscara; loader real en Bolt 4)
```

## Evidencia (verificado, no afirmado)
- **Typecheck:** 4/4 proyectos verdes (`pnpm -r typecheck`).
- **Tests:** **44 passing** — 38 contract (guards + skew), 5 ui-kit (RNTL: role queries + userEvent + resolveTheme), 1 host (RNTL boot).
- **Build Re.Pack Android:** `index.android.bundle` 2.4M, "compiled successfully".
- **Build Re.Pack iOS:** `index.ios.bundle` 2.4M, "compiled successfully".
- **Module Federation v2 activo:** el build emite `mf-manifest.json` + `mf-stats.json` (container "host", shared react/react-native singleton eager).
- **Sin Metro:** `metro.config.js` eliminado; Re.Pack registra `webpack-bundle`/`webpack-start`.
- **Contrato publicable:** `npm pack` produce `@org/miniapp-contract@0.1.0` con `dist/*.d.ts`.

## Cobertura de stories
- **S1.1 Monorepo** ✓ — pnpm workspaces (apps/miniapps/packages) + catalog (versiones únicas) + tsconfig.base + .npmrc GitHub Packages.
- **S1.2 Host Re.Pack** ✓ — RN 0.76.6 + Re.Pack 5.2.5 + MF v2, compila android/ios, no Metro.
- **S1.3 miniapp-contract** ✓ — tipos + guards + `satisfiesShared` (skew), 38 tests, publicable.
- **S1.4 ui-kit** ✓ — tokens semánticos light/dark, ThemeProvider/useTheme, AppText/Box/Card/Button (44×44, accessibilityRole), StyleSheet+tokens.

## ADRs
- ADR-001 StyleSheet+tokens · ADR-002 GitHub Packages · ADR-003 iOS+Android.

## Decisiones/hallazgos de entorno (Implement)
- **`@module-federation/enhanced` fijado a `0.9.0`** (exacto). El `^2.7.0` (línea nueva) NO resuelve sus subpaths con Re.Pack 5.2.5 (`error-codes/browser`, `runtime/helpers`). **Pin obligatorio** hasta que Re.Pack soporte MF 2.x.
- **Jest + pnpm:** el preset `react-native` necesita `transformIgnorePatterns` que contemple el layout `.pnpm/` (scopes como `@scope+name`). Aplicado en ui-kit y host.
- **`@swc/helpers`** hoisteado a la raíz (`public-hoist-pattern`) para que los paquetes transformados por babel-swc-loader lo resuelvan.
- **`@module-federation/*`** hoisteado (`public-hoist-pattern`) para resolución de subpaths bajo pnpm.

## NO hecho / diferido (honesto)
- **Verificación en dispositivo (agent-device / Layer 2): NO ejecutada.** Bolt 1 no tiene flujo de usuario (solo pantalla de boot); la evidencia es el build de ambos bundles + test RNTL de boot. Layer 2 se hará cuando exista un flujo montable (Bolt 4: montar un remote + fallback).
- iOS: bundle JS compila; **no** se corrió `pod install` ni build nativo en simulador (no requerido para el bundle JS; se hará en Operations/Bolt 4).
- zustand / react-query / navigation: aún NO en `shared` (se añaden como singletons en Bolt 4 con el loader y la navegación).
- Publicación real del contrato a GitHub Packages: es **publicable** (`npm pack` ok); el push real queda como paso de CI.

## Siguiente
Bolt 2 (Backstage, repo separado) o Bolt 3 (miniapp Dashboard). Ambos dependen solo del contrato (ya publicable). Bolt 4 integra el montaje de remotes en el host.
