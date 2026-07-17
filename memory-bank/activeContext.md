# Active Context

> **Agent note:** This is your short-term memory. Read it at the start of every session and update it immediately after making an important decision, changing focus, or encountering a blocker.

## Current Focus (actualizado 2026-07-17)
- **La plataforma está VIVA en producción y validada end-to-end en dispositivo.** El camino real está probado: el emulador (como un teléfono real, sin `adb reverse`) resuelve desde **Backstage en Vercel** → registry en **Upstash** → **verifica sha256** → baja el chunk de **Vercel Blob CDN** → **monta** la miniapp.
- **Deploy live:** `https://backstage-web-blond.vercel.app` (Next.js 16 en Vercel).
- **Lo logrado en la sesión 2026-07-13 → 07-17** (ver `## Sesión` abajo + `audit.md`): build nativo desbloqueado, primer mount on-device, loader genérico, login GitHub, crear miniapps, publicar versión desde la UI, storage de prod (Upstash + Blob), integridad sha256 real, deploy a Vercel.
- **Único pendiente formal:** publicar el contrato `@org/miniapp-contract` → `@dentvega/miniapp-contract` a GitHub Packages (pausado esperando un PAT con `write:packages`). Follow-ons: Home dinámico del host; `@org/ui-kit` publicado.
- Project goal: migrate an **Android bank app** to **React Native + Re.Pack**, and build a **"Spotify for Backstage" web platform** (Next.js) to create/version/distribute **miniapps** consumed by the mobile host as **federated remotes**.

## Sesión 2026-07-13 → 07-17 — de "compila" a producción
1. **Build nativo desbloqueado** — root cause: JVM **Azul Zulu 17** (no el proyecto); fix: **OpenJDK 17 Homebrew**. `assembleDebug` ✅.
2. **Primer mount on-device** + 3 bugs de runtime reales (solo visibles corriendo, no en tests):
   `URLSearchParams.set` no existe en Hermes (`ResolveClient`) · override MF v2 no llegaba al `ScriptManager` (fix `registerRemotes` sobre la instancia global + routing de sub-chunks por caller + `excludeExtension`) · `@org/ui-kit` no era singleton MF → `useTheme` crasheaba.
3. **Loader genérico** — `<MiniappHost id=… />` monta cualquier miniapp vía `loadRemote`, sin wiring por miniapp. Doc: `docs/mounting-miniapps.md`.
4. **Login GitHub** (Auth.js v5) cableado + verificado (OAuth real).
5. **Crear miniapps** — scaffolder configurado (allowlist + `GITHUB_TOKEN` + template marcado); creó `miniapp-hellow_widget` real + registro.
6. **Publicar versión desde la UI** — form en la página de detalle, auth por sesión, manifest armado en el server. (backstage-web)
7. **Storage de prod** — Upstash Redis (registry) + Vercel Blob (chunks). **Bug real fixed:** `@upstash/redis` auto-deserializaba (`automaticDeserialization:false`).
8. **Integridad real** — sha256 (pura-JS en host, validado vs vectores NIST; node crypto en backstage). Reemplaza el no-op de ADR-008. Probado: chunk manipulado → mount bloqueado.
9. **Deploy a Vercel** — env vars + deploy + smoke test; validación del camino de prod en device.

## Recent Technical Decisions
- Bundler = Re.Pack (Module Federation v2), NOT Metro.
- Estado: **Zustand + React Query** como singletons compartidos.
- Backstage web = **Next.js (App Router)**; hosting de chunks = **dev server local** por ahora (CDN diferido a Operations).
- Miniapp piloto = **Account Dashboard** (solo-JS, **cero módulos nativos** en el slice).
- **DOS repos:** (A) móvil = este repo `backstagereactnative` (pnpm: `apps/host`, `miniapps/account-dashboard`, `packages/{ui-kit,miniapp-contract,host-runtime}`); (B) **Backstage = repo git SEPARADO** `backstage-web` (otro equipo).
- **Contrato = paquete publicado versionado `@org/miniapp-contract`** (fuente en repo móvil, publicado a npm privado; Backstage lo instala por versión). Único acoplamiento cross-repo.

## Known Issues / Blockers
- ⚠️ `@module-federation/enhanced` fijado a **0.9.0** (no subir a 2.x con Re.Pack 5.2.5). **Sigue vigente.**
- ⚠️ Para el build nativo usar **JAVA_HOME = OpenJDK 17 Homebrew** (NO Zulu). Fijar en `~/.gradle/gradle.properties` para no regresar.
- ⚠️ La miniapp se sirve como **build estático** (`bundle:android` → `build/generated/android`), NO el dev server webpack-start (exige `?platform` y rompe la carga como remote). En prod = artefacto estático en Blob (mismo modelo).
- ⚠️ Contrato aún vía `file:`/vendor (backstage) y `@org` placeholder → publicar a GitHub Packages como `@dentvega/*` (pendiente, esperando PAT `write:packages`).
- ✅ RESUELTOS esta sesión: build nativo (JDK), Layer 2 on-device, integridad de chunk (sha256), registry store (Upstash), CDN de chunks (Blob), deploy (Vercel).
- iOS: `pod install` probablemente desbloqueado (CocoaPods 1.16.2 presente) — no verificado en device iOS todavía.

## Intent 02 (miniapp-platform) — MVP COMPLETO (4/4 bolts) ✅
- B1 Publicar paquetes (ui-kit→dist + publishConfig) ✓ · B2 Template GitHub (miniapp-template, remote compila) ✓ · B3 Migrar account-dashboard a repo propio (monorepo sin miniapps/*) ✓ · B4 Scaffolder Backstage (GitProvider + /api/scaffold + /create, 37 tests) ✓.
- **4 repos separados:** móvil (host), `backstage-web`, `miniapp-template`, `miniapp-account-dashboard`.
- **Pendiente para producción real:** dar el **org de GitHub real** (reemplazar `@org` placeholder) → publicar paquetes + probar scaffold/creación real. Diferido a **Intent 03**: CI por miniapp (delta 5) + CDN de chunks (delta 6).
- **Sigue bloqueado (independiente):** build nativo del host (entorno Android) — impide correr la app en device.

## Aclaración de arquitectura (2026-07-09) — plataforma real de miniapps
El usuario aclaró la visión objetivo (ver `standards/system-architecture.md`, "Three-plane architecture"):
- Las **miniapps NO viven en el monorepo móvil** — cada una es su **propio repo git**, creado por Backstage.
- **Backstage = Scaffolder + Registry + Distribución** (capacidad ① "Create miniapp" → crea repo git nuevo desde template).
- Cada miniapp tiene **su CI** que buildea el chunk → CDN → publica a Backstage; el host resuelve la URL y monta en runtime.
- **Corrección:** `account-dashboard` está hoy DENTRO del monorepo (simplificación del slice) → debe salir a su repo.
- **Roadmap (6 deltas):** (1) publicar contract+ui-kit a GitHub Packages; (2) template de miniapp; (3) sacar account-dashboard a repo propio; (4) scaffolder en Backstage (API git); (5) CI por miniapp; (6) CDN de chunks.
- **Candidato a Intent 02** ("Plataforma de miniapps"): planificar con `/aidlc-inception`.

## Intent 04 (backstage-ui-auth) — COMPLETO (4/4 bolts) ✅
- **Objetivo:** UI de Backstage con más detalle de miniapps (versión, fecha de creación, repo, estado CI) + login GitHub para acceder a las miniapps creadas. Todo en `backstage-web` (cero módulos nativos).
- **B04-1 Auth GitHub (Auth.js v5)** ✓ — NextAuth v5, provider GitHub, middleware gate (307 → /signin), callbacks puros testeados. Token server-side, nunca al browser.
- **B04-2 Registry metadatos (createdAt, repoUrl)** ✓ (2026-07-10) — `MiniappRecord += createdAt?/repoUrl?`, `registerMiniapp(...,now)`, scaffolder setea repoUrl, seed backfillea. ADR-019. **70 tests** Backstage, typecheck + build limpios. Ver `bolts/04-2-registry-metadata/outcome.md`.
- **B04-3 Estado de CI (GitHub Actions)** ✓ (2026-07-10) — `lib/ci/` (`CiStatusProvider`, `githubCiProvider`, `mockCiProvider`, `withCache` 60s, `getCiProvider()`); `unknown` como fallback resiliente; token per-request server-side. ADR-020. **88 tests**. Ver `bolts/04-3-ci-status/outcome.md`.
- **B04-4 UI de detalle + catálogo enriquecido** ✓ (2026-07-10) — ruta `/miniapp/[id]` (server component) + catálogo con badge CI/fecha/link; view-models puros (`getMiniappDetail`, `listCatalog+`); componentes `CiBadge`/`VersionList`/`MiniappHeader` (client, RTL); CI resuelto server-side (token nunca al bundle). ADR-021. **102 tests** (antes 88, +14), typecheck + build limpios. Ver `bolts/04-4-detail-ui/outcome.md`.
- **Activación (no bloquea):** scope OAuth `read:user` → badges CI reales darán `unknown` hasta ampliar a `repo`/`actions:read` en el GitHub OAuth App.

## Intent 06 (creación real de miniapps) — en progreso
- **B06-1 UI de creación** ✓ — botón "＋ Crear miniapp" en catálogo + `/create` con validación de id (`parseMiniappId`) y links de resultado (repo + detalle). 104 tests.
- **B06-2 Guard de autorización** ✓ — `canScaffold(login, allowlist)` fail-closed + `SCAFFOLD_ALLOWED_LOGINS` (CSV); guard en `/api/scaffold` antes de tocar GitHub; login capturado del profile OAuth. ADR-022. **117 tests**.
- **B06-3 Persistencia + Activación (Operations) — PENDIENTE (requiere cuenta del usuario):** provisionar Upstash KV → `getStore()` usa KV; setear secrets en Vercel (`GITHUB_TOKEN` scope repo, `MINIAPP_TEMPLATE_REPO=DentVega/miniapp-template`, `SCAFFOLD_ALLOWED_LOGINS=DentVega`, `PUBLISH_TOKEN`); redeploy; smoke E2E.
- **Nota:** en el deploy actual, sin `SCAFFOLD_ALLOWED_LOGINS`, la creación está fail-closed (403) — seguro hasta activar el 06-3. El dominio del scaffolder ya existía (Intent 02); el template sustituye `__MINIAPP_ID__` (init-template.yml, ADR-011).

## Demo desplegada (2026-07-10)
- **Backstage web EN VIVO:** https://backstage-web-blond.vercel.app (Vercel, import de `DentVega/backstage-web`, auto-redeploy en push a `main`).
- 4 repos públicos en `github.com/DentVega` (backstagereactnative, backstage-web, miniapp-template, miniapp-account-dashboard).
- Deploy: login GitHub OAuth activo, `jsonStore` con `data/registry.json` (2 miniapps seed), `CI_STATUS_ENABLED=false`. Contrato vendorizado + tracing de `data/` (commit `fd3f508`). Smoke-test OK (gate 307, /api/miniapps con datos, upload 401).
- **El proyecto es una DEMO para clientes** → prioridad: pulido visible, READMEs con capturas/diagrama, flujo de demo. Build nativo Android sigue despriorizado.

## Immediate Next Step
- **Intent 04 cerrado + demo en vivo.** Siguiente de mayor retorno para el showcase: READMEs con capturas/GIF + diagrama de arquitectura en los 4 repos; documentar un "demo flow" de 1 min.
- **Intent 04 cerrado.** Opciones: `/reflect` (retrospectiva del intent 04), `/operations` (deploy Backstage a Vercel + activar OAuth/CDN/CI reales), o `/aidlc-inception` (nuevo intent). Sigue pendiente independiente: build nativo del host (entorno Android).
- **Build nativo — en progreso (Operations):** 3 blockers resueltos (gradle-plugin devDeps en host, NDK 26.1 reparado, flash-list/screens pineados; autolinking OK). **Falta 1:** `MissingValueException` en `:app:compileDebugJavaWithJavac` (New Arch RN 0.76, no pnpm) — diagnósticos en `operations/activation-checklist.md` (bisecar módulos nativos / `--debug` / setear `react{reactNativeDir}`). Luego iOS `pod install` + montaje en dispositivo (device Android conectado).
- Alternativas: **`/parity`** (cobertura vs. app Android original), o **`/aidlc-inception`** (siguiente intent: transferencias, etc.).
- Recordatorios: `IntegrityVerifier` no-op (cripto antes de prod); Backstage sin auth/CDN; contrato aún `file:`.
