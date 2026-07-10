# Activation Checklist

> Mantenido por el agente de **Operations**. Construction produjo **código verificado**;
> esto lista los pasos manuales, específicos de entorno, que solo **tú** puedes ejecutar
> para que la app realmente corra. Marca cada ítem; deja sin marcar (no borres) lo que no
> aplique, con nota.

## Status
- **Code-complete:** 4 / 4 bolts (intent `01-vertical-slice`) · 100 tests verdes
- **Activated:** **partial** — código completo y verificado por tests/builds; **la app aún NO corre en dispositivo** (build nativo bloqueado, ver Native).

## Native (Re.Pack app) — ⚠️ BLOQUEANTE para correr la app · PROGRESO 2026-07-09
Blockers resueltos en Operations (el build avanza mucho más lejos):
- [x] **Resolución `@react-native/gradle-plugin` bajo pnpm** — FIX: añadidos `@react-native/gradle-plugin@0.76.6` y `@react-native/codegen@0.76.6` como devDeps directas de `apps/host` (pnpm los coloca en `apps/host/node_modules`; el `settings.gradle` los resuelve sin editar Gradle).
- [x] **NDK roto reparado** — `ndk/26.1.10909125` estaba mal extraído (nivel extra `android-ndk-r26b/`); aplanado → `source.properties` + `toolchains` en la raíz. (Reparación de tu SDK.)
- [x] **Autolinking funciona** — Gradle configura `react-native-screens`, `react-native-safe-area-context`, `@shopify/flash-list`. `react-native-screens` fijado 4.4.0 / safe-area 4.14.1 / flash-list 1.7.6 (compat RN 0.76).

Más blockers resueltos (investigación Operations 2026-07-09):
- [x] **`react-native-screens` rompía `debugCompileClasspath`** — bisección: screens (4.4.0/4.11.1) declara `implementation 'com.facebook.react:react-native:+'` (coord. legacy + versión dinámica); bajo pnpm el substitution del plugin `com.facebook.react.rootproject` (`react-native`→`react-android`) provee la versión con un provider vacío. FIX: substitution explícita con versión concreta en `apps/host/android/build.gradle` (`allprojects { resolutionStrategy.dependencySubstitution { substitute react-native → react-android:0.76.6, hermes-engine → hermes-android:0.76.6 } }`). Con eso `:app:dependencies --configuration debugCompileClasspath` resuelve ✅. screens fijado 4.11.1 (compat JS codegen RN 0.76; 4.25 daba error "onAppear").

## 🎯 HALLAZGO DECISIVO (2026-07-09) — es el ENTORNO, no el proyecto
Se probó la **Opción A** (sacar el host del workspace pnpm → `node_modules` real con npm, `react-native` como carpeta real). **NO arregló el build** — mismo error. Eso **refuta la teoría del symlink/pnpm**.
Prueba definitiva: se creó un **RN 0.76 vanilla nuevo** (npm puro, sin pnpm/Re.Pack/nada nuestro) → **falla con el MISMO error exacto**, incluso con `newArchEnabled=false` y `gradlew clean`.
**Conclusión: el entorno de build Android de esta máquina no puede compilar NINGUNA app RN 0.76.** No es pnpm, ni Re.Pack, ni las miniapps, ni la Opción A (revertida). Coincide con issues RN #48212 / #43170 / #38056 (fallos de apps vanilla, sin fix universal publicado).
**Entorno:** Gradle 8.10.2 · **único JDK: Zulu 17.0.13** · AGP (default RN 0.76) · build-tools 35 · NDK 26.1(reparado)/27 · CMake 3.22.1 · SDK en disco externo `/Volumes/SSDExterno/SDKAndroid`.
**Fixes de entorno a probar (por probabilidad):**
1. **Cambiar de JDK** — sospechoso #1 de este bug de provider de AGP. Instalar **Temurin 17** o **JDK 21** y apuntar `JAVA_HOME`/`org.gradle.java.home` ahí. Solo hay Zulu 17.0.13; probar otra distro/versión.
2. **SDK en disco externo** — tenía el NDK 26.1 mal extraído (ya reparado); puede haber más componentes incompletos. Reinstalar el SDK en ruta estándar (`~/Library/Android/sdk`) vía Android Studio, o reparar con `sdkmanager`.
3. **Construir vía Android Studio** (gestiona toolchain/JDK embebido) en vez de `./gradlew` por CLI.
4. **Subir de versión RN** (0.77+/0.78) donde este bug puede estar resuelto.
Una vez el entorno compile un RN 0.76 vanilla, **nuestro proyecto compila igual** (los fixes de pnpm ya están: gradle-plugin devDeps, NDK, substitution, screens 4.11.1).

Bloqueante restante (NO específico de pnpm; layer New Arch codegen de RN 0.76):
- [ ] **Segundo `MissingValueException` en `:app:assembleDebug`** (`compileDebugJavaWithJavac`) — distinto al de screens: **persiste incluso con screens deshabilitado**, así que NO es un módulo nativo concreto sino un file-collection provider vacío en el grafo completo de `assembleDebug` (probable: salida del **codegen New Arch del app** `generateCodegenArtifactsFromSchema`, o classpath de anotaciones/sources generados, sin valor bajo pnpm). `:app:dependencies` (config única) pasa, pero `assembleDebug` (grafo completo) falla. Diagnósticos siguientes: (a) `--debug` filtrando la creación del provider; (b) probar `newArchEnabled=false` temporalmente para confirmar que es el codegen New Arch; (c) revisar la tarea de codegen del app y su `reactNativeDir`/schema output bajo pnpm; (d) considerar `pnpm` con `node-linker=hoisted` + `shamefully-hoist` o `@rnx-kit` para el toolchain nativo.
- **Diagnóstico final (2026-07-09):** descartado codegen New Arch (falla igual con `newArchEnabled=false`). **Cada tarea/config individual PASA** — `generateAutolinkingPackageList`, `generateAutolinkingNewArchitectureFiles`, `generateCodegenSchemaFromJavaScript`, `generateCodegenArtifactsFromSchema`, y las resoluciones `debugCompileClasspath`/`debugRuntimeClasspath`/`debugAndroidTestRuntimeClasspath` — pero **el grafo completo de `assembleDebug` falla** al determinar deps de `compileDebugJavaWithJavac`. Esto indica un **artefacto de subproyecto nativo con output provider-backed vacío** que solo se materializa en el build agregado, no un módulo/config aislado. Requiere depuración Gradle de especialista (traza del provider en `--debug`) o un cambio estructural.
- **Opciones estructurales para desbloquear (recomendadas):** (a) sacar `apps/host` del workspace pnpm para el build nativo (node_modules propio, no symlinked) — la vía más fiable; (b) `@rnx-kit`/`react-native-monorepo-tools` para el toolchain nativo; (c) `.npmrc` `shamefully-hoist=true` + reinstall (probar); (d) construir con un RN CLI que aísle el proyecto nativo.
- **Progreso neto:** de fallar en 256ms (plugin) a configurar TODOS los proyectos, resolver classpaths y pasar todas las tareas de generación. **Fixes legítimos conservados** (devDeps gradle-plugin/codegen, NDK reparado, screens 4.11.1/safe-area 4.14.1/flash-list 1.7.6, substitution react-android/hermes-android). Bundles JS + 74 tests verdes, sin regresión.
- [ ] **iOS `pod install`** con un ruby que tenga CocoaPods (2.7.6 o 3.3.5; el activo 3.2.2 no lo tiene) — `cd apps/host/ios && pod install`.
- [ ] **Correr en dispositivo/emulador** — `cd apps/host && pnpm start` + `pnpm android`. Hay un device Android conectado (`29171FDH300ESL`).
- [x] **Re.Pack: host bundle compila; remote chunks se generan** — ✅ verificado (android+ios, mf-manifest emitido).

## Serve / host remotes
- [ ] **Servir el chunk de `account_dashboard`** en `http://localhost:8081/account_dashboard.container.js.bundle` (URL del seed de Backstage). Dev: `webpack-start` de la miniapp o servir el bundle estático. ⚠️ El dev server del host usa 8081 por defecto → usar otro puerto para el remote o mover el host.
- [ ] **Backstage corriendo** en `:3999` — `cd ../backstage-web && pnpm start` (antes: `pnpm --filter @org/miniapp-contract build` en el móvil, luego `pnpm install` en backstage-web).
- [ ] **Prod:** definir CDN/almacenamiento de artefactos (hoy dev server local) — ver `operations/hosting.md`.

## Dashboard / Infra
- [ ] **Publicar `@org/miniapp-contract`** a GitHub Packages (hoy `file:` en Backstage) — token + `npm publish` (CI).
- [x] Env build-time del host: `BACKSTAGE_BASE_URL` env-aware vía `DefinePlugin` (`__BACKSTAGE_URL__` desde `BACKSTAGE_URL`; dev cae a localhost) — hecho en Bolt 03-4.

## Seed / data
- [x] **Registry sembrado** con `account_dashboard@0.1.0` — `backstage-web/data/registry.json` ✅.

## Verify (¿está realmente viva?)
- [ ] App bootea contra Backstage **real** (no placeholders) — pendiente del build nativo.
- [ ] Flujo end-to-end: Home → login → "Abrir miniapp" → el host resuelve, descarga, verifica y **monta** el Dashboard.
- [ ] **Fallback**: apagar Backstage → el host muestra "Miniapp no disponible" sin crashear.
- [ ] (opcional) `agent-device` E2E sobre el flujo — cuando el nativo esté operativo.

## Seguridad (antes de prod)
- [ ] **Integridad de chunk**: `IntegrityVerifier` es no-op (ADR-008) → implementar sha256/firma.
- [ ] Backstage: añadir **auth** a los endpoints; migrar store JSON→DB.

## Notes
- **Orden:** (1) arreglar gradle/pods → (2) levantar Backstage + servir chunk → (3) `pnpm start` host + `pnpm android` → (4) verificar flujo + fallback.
- El código de federación (loader, fallback, resolve, gate de capability) está verificado por **100 tests** + builds de ambas plataformas; lo único no probado es el **montaje real del chunk en dispositivo**, que depende de este checklist.

## Deploy Backstage a Vercel (Intent 03 — runbook completo en `backstage-web/DEPLOY.md`)
- [ ] `npm i -g vercel && vercel login` (requiere tu cuenta Vercel).
- [ ] `vercel link` (crear/enlazar el proyecto desde `backstage-web/`).
- [ ] Marketplace: añadir **Vercel Blob** (→ `BLOB_READ_WRITE_TOKEN`) + **Upstash Redis/KV** (→ `KV_REST_API_URL`/`KV_REST_API_TOKEN`).
- [ ] `vercel env add` : `PUBLISH_TOKEN`, `GITHUB_TOKEN`, `MINIAPP_TEMPLATE_REPO`, `BACKSTAGE_PUBLIC_URL`.
- [ ] `vercel deploy --prod`.
- [ ] Seed: `curl -X POST $URL/api/seed -H "authorization: Bearer $PUBLISH_TOKEN"`.
- [ ] Smoke: `/catalog`, `/api/resolve?id=account_dashboard`, `/api/miniapps/x/upload` (401 sin token).
- [ ] CI de cada miniapp: secrets `BACKSTAGE_URL` (= deploy) + `PUBLISH_TOKEN`.
- [ ] Host: buildear con `BACKSTAGE_URL=$deployUrl` (el DefinePlugin lo inyecta; dev cae a localhost:3999).
- [x] **Prep hecha por el agente:** ruta `POST /api/seed` (auth), host env-aware (DefinePlugin), selección KV/Blob por env, runbook `DEPLOY.md`, build + 50 tests verdes. El deploy real = pasos de arriba (tu cuenta).
