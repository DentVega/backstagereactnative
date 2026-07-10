# Bolt 4 — Host Runtime + Integración · RESULT

> Estado: **COMPLETO (con Layer 2 diferido — ver abajo)** · Fecha: 2026-07-09 · Stories: S2.1–S2.3
> Cierra el slice: integra host (B1) + miniapp (B3) + Backstage (B2).

## Qué se construyó
El runtime de carga de miniapps en el host: loader (resolve→verify→mount→fallback), sesión mock + capabilities, navegación, y el wire del remote `account_dashboard`.

```
packages/host-runtime/src/   loaderState · evaluate · integrity · ResolveClient
                             · ChunkLoader (interfaz) · useMiniapp · MiniappHost
apps/host/src/               session/store (zustand) · hostProvided · chunkLoader (adapter Re.Pack)
                             · navigation · screens/{Home,Miniapp}
apps/host/App.tsx            Providers: QueryClient + Theme + NavigationContainer + native-stack
apps/host/rspack.config.mjs  remote account_dashboard + shared singletons ampliados
```

## Evidencia (verificado, no afirmado)
- **Typecheck:** 5/5 proyectos móviles verdes.
- **Tests:** **74 passing** en el móvil (host-runtime **14** nuevos: reducer, evaluate/skew, MiniappHost happy + 4 fallbacks; host **4**: deriveCapabilities, sesión toggle, nav). +26 Backstage = **100 en el proyecto**.
- **Build Re.Pack Android + iOS:** ambos "compiled successfully" con el remote wired; `mf-manifest.json` emitido (incluye el consumo de `account_dashboard`). 3 warnings benignos (`masked-view`, peer opcional).
- **Fallbacks probados (RNTL):** resolve-failed, download-failed, invalid-manifest, skew — todos degradan sin crash.
- **Gate de capability:** sesión no autenticada → `deriveCapabilities` vacío → Entry (Bolt 3) muestra "Acceso no autorizado".

## Cobertura de stories
- **S2.1 Nav + sesión** ✓ — native-stack Home→Miniapp; Zustand con login/logout mock; `deriveCapabilities` (token nunca sale del host). Tests.
- **S2.2 Loader** ✓ — `useMiniapp`: resolve (httpResolveClient→Backstage) → evaluate → integrity → load (ChunkLoader) → mount. Adapter real `repackChunkLoader` (ScriptManager + import del remote, URL dinámica).
- **S2.3 Verify + fallback + ADR** ✓ — `evaluateManifest` (isManifest + satisfiesShared); `IntegrityVerifier` (no-op, ADR-008); fallback exhaustivo. ADR-008 + ADR-009.

## ADRs
- ADR-008 integridad (estructural+skew ahora; cripto diferida).
- ADR-009 carga dinámica de remotes tras `ChunkLoader` (testeable).

## Hallazgos (Implement)
- **`react-native-screens` fijado a 4.4.0** + `safe-area-context` 4.14.1: las versiones nuevas (screens 4.25) usan codegen incompatible con el de RN 0.76.6 ("Unknown prop type"). ⚠️ Pin necesario con RN 0.76.
- host tsconfig: `module: esnext` + `moduleResolution: bundler` para permitir dynamic import (chunkLoader).

## ⚠️ Layer 2 (dispositivo) — DIFERIDO, no ejecutado (honesto)
- **Hay un dispositivo Android físico conectado** (`29171FDH300ESL`) y un AVD.
- **El build nativo Gradle FALLA** en: `Error resolving plugin [id: 'com.facebook.react.settings']`.
- **Causa raíz:** el `settings.gradle` de RN referencia `../node_modules/@react-native/gradle-plugin`, pero con **pnpm (node-linker=hoisted)** ese paquete vive anidado en `node_modules/.pnpm/...` en la RAÍZ del monorepo, no en `apps/host/node_modules`. Es un tema conocido de **build nativo RN en monorepo pnpm**, NO un defecto del código del bolt.
- **Fix pendiente (tarea de setup, propia de un bolt/Operations aparte):**
  1. Hoistear las herramientas de build de RN: `public-hoist-pattern[]=@react-native/gradle-plugin` (y react-native CLI) en `.npmrc`, o instalarlas como dep directa de `apps/host`.
  2. Ajustar `settings.gradle`/`app/build.gradle` para apuntar al `gradle-plugin` y a `react-native` en su ruta real (root node_modules).
  3. iOS: `pod install` con un ruby que tenga CocoaPods (2.7.6/3.3.5), no el activo 3.2.2.
- **Runbook cuando el nativo esté listo (montaje real del remote):**
  1. Backstage: `cd backstage-web && pnpm start` (:3999).
  2. Servir el chunk del remote: build de `account_dashboard` y servirlo en `:8081` (URL del seed).
  3. Host: `cd apps/host && pnpm start` (dev server) + `pnpm android`.
  4. En Home → login → "Abrir miniapp" → el host resuelve contra Backstage, descarga el chunk, verifica, monta el Dashboard; probar fallback apagando Backstage.

## Estado del intent
Slice **funcionalmente completo y verificado por tests + builds + resolve runtime de Backstage**. Falta solo la **prueba de montaje en dispositivo real**, bloqueada por el setup del build nativo en monorepo pnpm (tarea de Operations).
