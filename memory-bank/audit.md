# Audit Trail

> Append-only log maintained by the AI-DLC agents. Records the user's **raw
> requests**, the decisions taken, and anything **skipped or deferred** — so
> "why did we do X?" always has a traceable answer. Never rewrite or delete
> entries; append new ones. Complements (does not replace) `activeContext.md`
> (current focus) and ADRs (architectural rationale).

Entry format:

```
## <date> — <phase/bolt>
- **Raw request:** <the user's input, verbatim or faithfully condensed>
- **Decision:** <what was decided and by whom (user checkpoint vs agent)>
- **Skipped/deferred:** <anything intentionally not done, and why>
```

---

<!-- entries below, newest last -->

## 2026-07-09 — Init (/aidlc-init)
- **Raw request:** "voy a trabajar en una migracion de una app de banco de android a react native con repack pero con el agregado que necesito tener una plataforma tipo 'spotify for backstage' para crear miniapps que se puedan agregar al proyecto de react native o incluso share-packages, este backstage puede ser web"
- **Decision:** Initialized the AI-DLC memory-bank (standards + session-context) in an empty/greenfield repo. Modeled the project as two planes — (A) RN + Re.Pack mobile host migrating the Android bank app, (B) a Backstage-style web catalog/registry that creates, versions, signs, and distributes miniapps consumed as federated remotes OR shared pnpm packages. Filled tech-stack / coding / architecture / testing standards with these project-specific decisions (Re.Pack over Metro, dual-consumable miniapp contract, banking-security rules).
- **Skipped/deferred:** No feature code written (per command scope). Open decisions deferred to Inception: state library, monorepo layout, chunk artifact hosting/CDN, miniapp signing/integrity, banking session/PII constraints. Design-standards and testing-standards Layer-1 copied largely verbatim.

## 2026-07-09 — Inception (intent 01-vertical-slice)
- **Raw request:** "responde en spanish" — ejecutar Inception para la migración bancaria + plataforma Backstage de miniapps.
- **Decision (checkpoints humanos):** (1) sembrar un **slice vertical end-to-end** primero; (2) estado = **Zustand + React Query** (singletons); (3) hosting de chunks = **dev server local** por ahora (CDN diferido); (4) miniapp piloto = **Account Dashboard** (solo-JS); (5) Backstage web = **Next.js App Router**; (6) **cero módulos nativos** en el slice. Aprobados requirements, system-context (topología MF), 4 unit-briefs y descomposición en 4 bolts. Estado library escrita en tech-stack.md.
- **Skipped/deferred:** migración masiva de pantallas, auth real, CDN prod, firma de chunks (solo se diseñará el hook por ADR-001), transferencias. Sin código de feature (Inception es solo planificación).

## 2026-07-09 — Inception refinement (intent 01-vertical-slice, arquitectura Backstage)
- **Raw request:** "quiero agregar que la web backstage debe estar en un repositorio diferente para que otro equipo pueda trabajar en el backstage... ¿debería estar en otra carpeta? ¿qué opinas?"
- **Decision (checkpoints humanos):** Backstage pasa a **repo git SEPARADO** `backstage-web` (no una carpeta del monorepo) para dar CI/CD, versionado y deploy independientes a otro equipo. El único acoplamiento cross-repo es el **contrato**, que se extrae como **paquete publicado versionado `@org/miniapp-contract`** (fuente en el repo móvil, publicado a npm privado / GitHub Packages; Backstage lo instala por versión). Opinión dada: la carpeta no da independencia — el límite de git + CI/CD + ownership sí; y el punto de diseño real es cómo se comparte el contrato para que no derive. **Tratado como refinación del intent 01 (NO nuevo intent):** se evolucionaron requirements, system-context (2 repos + contrato publicado), unit-briefs 1 y 4, stories S1.3/S4.1 y bolt-plan (Bolt 1 publica el contrato; Bolt 2 corre en el repo separado). tech-stack.md actualizado a "dos repos".
- **Skipped/deferred:** crear físicamente el repo `backstage-web` (se hará al llegar al Bolt 2). Elección del registry concreto (npm privado vs. GitHub Packages) diferida al Bolt 1/Design.

## 2026-07-09 — Construction: Bolt 1 Foundations (5 etapas DDD)
- **Raw request:** `/bolt-start 1` — ejecutar el bolt Foundations; método "todo de una, yo ejecuto".
- **Decision (checkpoints):** Model → capabilities semilla (`accounts:read`, `session:whoami`) + `satisfiesShared` en el contrato. Design → StyleSheet+tokens, GitHub Packages, iOS+Android. ADR-001/002/003 aceptados. Implement → scaffold real: monorepo pnpm (catalog), host RN 0.76.6 + Re.Pack 5.2.5 (MF v2), `@org/{miniapp-contract,ui-kit,host-runtime}`. Test → 44 tests verdes, bundles android/ios compilan.
- **Hallazgos clave:** `@module-federation/enhanced` DEBE fijarse a **0.9.0** (2.x rompe con Re.Pack 5.2.5); Jest+pnpm requiere `transformIgnorePatterns` para `.pnpm/`; `@swc/helpers` y `@module-federation/*` hoisteados vía `public-hoist-pattern`.
- **Skipped/deferred:** verificación en dispositivo (Layer 2) — Bolt 1 no tiene flujo de usuario, se hará en Bolt 4; `pod install` iOS + build nativo diferidos; zustand/react-query/navigation aún no en `shared` (Bolt 4); publicación real del contrato a GitHub Packages (paso de CI).

## 2026-07-09 — Construction: Bolt 3 Account Dashboard (5 etapas DDD)
- **Raw request:** `/bolt-start 3` — miniapp Account Dashboard; método "todo de una".
- **Decision (checkpoints):** Model → Money en céntimos enteros, monedas EUR/USD/MXN, `netChange` rechaza mezcla con `CurrencyMismatchError`. Design → FlashList + gate de capability. ADR-004 (FlashList nativo en host, JS shared singleton) + ADR-005 (build dual, una fuente/dos entrypoints). Implement/Test → `@org/account-dashboard`: dominio (10 tests), Entry+Dashboard (3 RNTL con FlashList mockeado), container remoto compila con MF v2 (`mf-manifest.json`, shared como vendor chunks).
- **Skipped/deferred:** verificación en dispositivo (Layer 2) → Bolt 4 (la miniapp solo se verifica montada en el host); instalar `@shopify/flash-list` nativo + añadir flash-list/react-query al `shared` del host → Bolt 4; import build-time cross-package real → Bolt 4.

## 2026-07-09 — Construction: Bolt 2 Backstage Web (5 etapas DDD)
- **Raw request:** `/bolt-start 2` — Backstage web; método "todo de una".
- **Decision (checkpoints):** Model → dominio registry (register/publish/resolve/listCatalog) reutilizando el contrato; ubicación = repo SEPARADO sibling `/Volumes/SSDExterno/prodproyects/backstage-web` + git init; contrato vía `file:` en dev; store JSON. Design → Next.js App Router + Route Handlers. ADR-006 (stack) + ADR-007 (testing web Vitest/RTL — RN test tools no aplican). Implement/Test → Next.js 16 + React 19; 26 tests Vitest; build ok; **verificación runtime real con `next start` + curl** (resolve 200/404/rango, register 201, catalog 200). Seed con `account_dashboard` (manifest real del Bolt 3).
- **Skipped/deferred:** sin auth (Operations); JSON fs no transaccional (migrar a DB); publicación real del contrato a GitHub Packages (hoy `file:`); hosting real de artefactos/CDN (url del seed = localhost:8081); integración real host↔Backstage → Bolt 4; sin commit git (no solicitado).

## 2026-07-09 — Construction: Bolt 4 Host Runtime + Integración (5 etapas DDD) — CIERRA el intent
- **Raw request:** `/bolt-start 4` — integración final; método "todo de una".
- **Decision (checkpoints):** Model → máquina de estados del loader + orden de verificación (isManifest→skew→integridad) + sesión mock→capabilities. Design → loader portable/testeable en host-runtime, adapters concretos en el host. ADR-008 (integridad estructural+skew ahora, cripto diferida, IntegrityVerifier no-op) + ADR-009 (carga dinámica de remotes tras ChunkLoader inyectable). Implement/Test → loader + evaluate + MiniappHost (host-runtime), sesión zustand + nav + adapter Re.Pack (host); remote `account_dashboard` wired en rspack; 18 tests nuevos (100 total); bundles android/ios compilan con mf-manifest.
- **Hallazgos:** `react-native-screens` fijado a 4.4.0 (+safe-area 4.14.1) por codegen incompatible con RN 0.76; host tsconfig `module:esnext` para dynamic import.
- **Layer 2 (dispositivo) DIFERIDO — no ejecutado:** hay device físico conectado, pero el build nativo Gradle falla en `com.facebook.react.settings` porque el `settings.gradle` de RN no resuelve `@react-native/gradle-plugin` bajo pnpm hoisted (tema de setup monorepo, NO defecto del bolt). Runbook + fix documentados en el result. Deuda para Operations/bolt de setup nativo.

## 2026-07-09 — Operations (intent 01-vertical-slice)
- **Raw request:** `/operations` — build, hosting de remotes, verificación, monitoreo; sin deploy/hosting sin confirmación.
- **Decision:** medí tamaños (host 2.48MB, remote incremental ~430KB) y fijé el presupuesto en tech-stack (host ≤3MB, remote ≤600KB — ambos dentro). Documenté hosting (dev server local, resolución runtime vía Backstage; CDN diferido, proveedor pendiente), checklist de release Re.Pack (shared 0.9.0 ✅, sin duplicación RN ✅, source maps sin symbolication ❌, Hermes pendiente), rollback (por versión en el registry sin release nativo) y monitoreo (tasa de fallback por razón, skew, TTI, salud de /api/resolve). Generé `operations/activation-checklist.md` y `operations/operations-runbook.md`.
- **Skipped/deferred (surfaced, NO ejecutado):** ningún deploy/hosting de prod (requiere confirmación). App **no activada**: bloqueante = build nativo pnpm (gradle-plugin) + iOS pods; servir el chunk :8081 (colisión de puerto con host dev server); publicar contrato a GitHub Packages; CDN de artefactos; symbolication; integridad cripto; auth en Backstage. Verificación de montaje en dispositivo pendiente de esos pasos.

## 2026-07-09 — Operations: arreglo del build nativo (a pedido del usuario)
- **Raw request:** "Arreglar el build nativo pnpm".
- **Decision/acciones (3 blockers resueltos):** (1) `@react-native/gradle-plugin@0.76.6` + `@react-native/codegen@0.76.6` añadidos como devDeps directas de `apps/host` → pnpm los coloca en `apps/host/node_modules`, el `settings.gradle` de RN los resuelve (sin editar Gradle). (2) NDK 26.1.10909125 estaba mal extraído (nivel extra `android-ndk-r26b/`) → aplanado, `source.properties`/`toolchains` a la raíz (reparación del SDK del usuario). (3) `@shopify/flash-list` fijado a 1.7.6 (compat RN 0.76). Resultado: el autolinking ahora configura screens/safe-area/flash-list y el build avanza hasta `:app:compileDebugJavaWithJavac`. Sin regresión JS (74 tests verdes).
- **Bloqueante restante (NO específico de pnpm):** `MissingValueException` en resolución de artefactos de `:app` (New Arch RN 0.76). Diagnósticos siguientes documentados en `operations/activation-checklist.md`. iOS pods sigue pendiente (ruby con CocoaPods). Handoff honesto — no se alcanzó el montaje en dispositivo.

## 2026-07-09 — Operations: continuación del blocker nativo (a pedido: "sigue con el blocker")
- **Bisección + fixes:** aislé que `react-native-screens` rompía `debugCompileClasspath` (usa `com.facebook.react:react-native:+`, coord. legacy; el substitution del plugin da provider vacío bajo pnpm). FIX: substitution explícita `react-native→react-android:0.76.6` + `hermes-engine→hermes-android:0.76.6` en `apps/host/android/build.gradle`. Con eso el compile classpath resuelve. screens fijado 4.11.1.
- **Estado:** el build avanza mucho (configura todos los proyectos, resuelve compile classpath), pero `assembleDebug` (grafo completo) aún falla con un **segundo** provider vacío, presente **incluso con screens deshabilitado** → probable codegen New Arch del app. Detalle y próximos pasos en `operations/activation-checklist.md`.
- **Decisión:** parar la depuración nativa (cadena de fricción RN New Arch + pnpm, muchas iteraciones sin final garantizado). Fixes legítimos conservados; JS + 74 tests siguen verdes; sin regresión. Handoff honesto.

## 2026-07-09 — Operations: Opción A probada y REVERTIDA; causa raíz = ENTORNO
- **Raw request:** "probar la app" → "explicar opciones" → "no perder miniapps" → "probar C" → "buscar en docs Re.Pack" → "proceder con Opción A".
- **Acciones:** (1) Levanté Backstage (corre en :3999, verificado). (2) Opción C (shamefully-hoist): no-op, falló. (3) Busqué en docs Re.Pack/RN (issues #38056/#43170/#48212, artículo dev.to). (4) Ejecuté Opción A: saqué apps/host del workspace pnpm, npm install → node_modules real con react-native como carpeta física. **Option A NO arregló el build nativo** (mismo error) → refutó la teoría del symlink. (5) **Prueba decisiva:** RN 0.76 vanilla nuevo (npm puro) falla idéntico → **es el ENTORNO**, no el proyecto. (6) Revertí Opción A (restauré monorepo pnpm limpio, 74 tests verdes).
- **Veredicto:** el entorno Android (Gradle 8.10.2 / único JDK Zulu 17.0.13 / SDK en disco externo) no compila NINGÚN RN 0.76. Fixes de entorno documentados en `operations/activation-checklist.md` (probar otro JDK — Temurin/JDK21; reinstalar SDK en ruta estándar; Android Studio; subir RN). Miniapps/federación/proyecto: 100% verificados e intactos.
- **Skipped/deferred:** correr la app en device (bloqueado por entorno, no por el proyecto).

## 2026-07-09 — Aclaración de arquitectura (plataforma real de miniapps)
- **Raw request:** "el backstage debe crear miniapps en una carpeta/repo diferente y la app host debe poder usar esas miniapps."
- **Decisión (checkpoints):** Backstage = **Scaffolder + Registry + Distribución** (crea un repo git por miniapp desde un template); **un repo git por miniapp**; **CI de cada miniapp** buildea el chunk → CDN → publica a Backstage. Miniapps FUERA del monorepo móvil (el host solo consume por URL+contrato en runtime). Actualizado `standards/system-architecture.md` a "Three-plane architecture" y `activeContext.md` con el roadmap de 6 deltas.
- **Corrección registrada:** `account-dashboard` en `miniapps/` del monorepo fue simplificación del slice; en la arquitectura real sale a su propio repo.
- **Skipped/deferred:** ejecución de los 6 deltas (candidato a Intent 02, planificar con /aidlc-inception). Nada movido/borrado aún.

## 2026-07-09 — Inception (intent 02-miniapp-platform)
- **Raw request:** "planificar el Intent 02 con /aidlc-inception" — plataforma real de miniapps (scaffolder + repos independientes).
- **Decision (checkpoints):** MVP = deltas 1-2-3-4 (publicar contract+ui-kit a GitHub Packages · template GitHub · sacar account-dashboard a repo propio · scaffolder "Create miniapp" vía GitHub API); 5-6 (CI + CDN) diferidos a intent 03/Operations. Proveedor git = GitHub; mecanismo = GitHub template repo; ui-kit se publica (build a dist); placeholders y CDN se deciden en Design; scaffolder = endpoint + página `/create` mínima; org = placeholder. Producidos requirements, system-context (3 planos), 4 unit-briefs, 12 stories, bolt-plan (4 bolts). system-architecture.md ya actualizado a "Three-plane architecture".
- **Skipped/deferred:** CI por miniapp + CDN (deltas 5-6); auth/firma; org real de GitHub (placeholder). Sin código (Inception es planificación).

## 2026-07-09 — Construction: Bolt 02-1 Publicar paquetes (5 etapas DDD)
- **Raw request:** `/bolt-start 1` (intent 02) — publicar contract + ui-kit.
- **Decision (checkpoints):** build ui-kit con tsc; patrón doble consumo con `publishConfig` de pnpm (dev=src, publicado=dist); verificar con `pnpm pack` + org placeholder. ADR-010. Implement/Test → ui-kit `tsconfig.build.json` + `build`/`prepack` + `files` + `publishConfig`; `dist` con JS+`.d.ts`; `pnpm pack` de ambos aplica publishConfig (main→dist, contenido dist); host/workspace verdes (74 tests, typecheck 5/5); `packages/PUBLISHING.md`.
- **Skipped/deferred:** publish REAL a GitHub Packages (requiere org real + token write:packages; hoy `@org` placeholder) — verificado con pnpm pack, documentado en PUBLISHING.md.

## 2026-07-09 — Construction: Bolt 02-2 Template de miniapp (5 etapas DDD)
- **Raw request:** `/bolt-start 2` (intent 02) — crear el template de miniapp.
- **Decision (checkpoints):** ubicación = repo sibling `/Volumes/SSDExterno/prodproyects/miniapp-template` + git init; el template depende de @org/ui-kit (consistencia visual) además de @org/miniapp-contract; placeholders vía workflow de GitHub Actions (ADR-011). Implement/Test → Re.Pack remote que expone ./Entry (Entry con gate + Screen placeholder + manifest + rspack MF), .npmrc, init-template.yml (sustituye placeholders + self-remove), ci.yml stub, README. Verificado: compila el remote (container+expose+mf-manifest) y typecheck limpio, instalando @org/* por file: y restaurando a ^0.1.0.
- **Skipped/deferred:** subir/marcar el repo como "template" en GitHub (org placeholder); el workflow init no se probó (requiere GitHub); install real de @org/* por registry (requiere publish + org/token); CI real (delta 5).

## 2026-07-09 — Construction: Bolt 02-3 Migrar account-dashboard (5 etapas DDD)
- **Raw request:** `/bolt-start 3` (intent 02) — sacar account-dashboard a su repo.
- **Decision (checkpoints):** ubicación = sibling `/Volumes/SSDExterno/prodproyects/miniapp-account-dashboard` + git init; borrar `miniapps/account-dashboard` del monorepo. ADR-012. Implement/Test → código migrado sin cambios; package.json standalone con `@org/*` en forma registry (`^0.1.0`), verificado con tarballs (dist); 13 tests verdes; remote compila (container account_dashboard + expose). jest.config ajustado a npm flat + `@org` en allowlist. Monorepo: `miniapps/*` fuera del workspace + carpeta borrada; móvil verde (typecheck 4/4, 61 tests); host sin cambios (resuelve URL externa vía Backstage).
- **Skipped/deferred:** publish real de @org (org placeholder); montaje en device (entorno nativo); subir repo/CI (delta 5); `@mf-types` generados quedan como artefacto inocuo.

## 2026-07-09 — Construction: Bolt 02-4 Scaffolder (5 etapas DDD) — CIERRA Intent 02 MVP
- **Raw request:** `/bolt-start 4` (intent 02) — scaffolder "Create miniapp".
- **Decision (checkpoints):** verificación por mocks + creación real documentada; scaffold = crear+registrar (personalización = workflow del repo generado). ADR-013 (GitProvider interfaz + impl GitHub generate + mock). Implement/Test → lib/git (types/github/mock) + lib/scaffold (puro) + /api/scaffold + /create (CreateForm) + GitProviderError→502; 37 tests Vitest (11 nuevos); typecheck + build ok; runtime verificado (/create 200, /api/scaffold 400 sin campos, /catalog 200).
- **Skipped/deferred:** creación REAL de repo (requiere org + GITHUB_TOKEN; org placeholder); auth en Backstage; CI por miniapp + CDN (deltas 5-6, Intent 03).

## 2026-07-09 — Inception (intent 03-ci-cdn)
- **Raw request:** "planificar el Intent 03 con /aidlc-inception" — CI por miniapp + CDN de chunks (deltas 5-6).
- **Decision (checkpoints):** MVP = CI + CDN núcleo + auth publish con token de servicio (integridad cripto diferida). CDN = Vercel Blob (público); CI = GitHub Actions; store registry = Vercel KV (JSON fs no persiste en serverless); upload vía Backstage centralizado como zip; seed del catálogo a KV; deploy Backstage = Vercel. Producidos requirements, system-context (flujo end-to-end), 4 unit-briefs, 12 stories, bolt-plan (4 bolts).
- **Skipped/deferred:** integridad cripto (sha256/firma, ADR-008), OIDC, canales/rollback avanzado, auth de usuarios → Intent 04. Org GitHub + cuenta/proyecto Vercel = placeholders (bloquean el flujo real, no el diseño/tests con mocks).

## 2026-07-10 — Construction: Bolt 03-1 Registry → Vercel KV (5 etapas DDD)
- **Raw request:** `/bolt-start 1` (intent 03) — migrar el registry a KV.
- **Decision (checkpoints):** una clave para todo el registry (cambio mínimo) + cliente `@upstash/redis` tras `KvClient`. ADR-014. Implement/Test → kv.ts (KvClient + kvStore + upstashClient), store.ts getStore() (env-selection KV/jsonStore), seed.ts (fixture account_dashboard idempotente); rutas jsonStore→getStore(); mocks de tests migrados; 42 tests Vitest (5 nuevos); typecheck+build ok; runtime dev verde (getStore=jsonStore).
- **Skipped/deferred:** KV real Upstash no ejercitado (requiere creds Vercel; se valida en Bolt 4/deploy); seed real a KV = script del deploy; granularidad per-id diferida.

## 2026-07-10 — Construction: Bolt 03-2 Chunk storage + upload (5 etapas DDD)
- **Raw request:** `/bolt-start 2` (intent 03) — recepción de chunks + upload autenticado.
- **Decision (checkpoints):** multipart/form-data + fflate + @vercel/blob (addRandomSuffix:false, layout <id>/<version>/); auth por token de servicio (PUBLISH_TOKEN). ADR-015. Implement/Test → lib/storage (ChunkStorage/blob/mock/getStorage) + lib/auth (requirePublishToken) + POST /api/miniapps/[id]/upload (unzip→Blob→publishVersion) + http mapper (401/502); 48 tests Vitest (6 nuevos); typecheck+build ok; 401 verificado en server real.
- **Hallazgos:** test de upload en env node (jsdom corrompe multipart binario); @vercel/blob put requiere Buffer.from.
- **Skipped/deferred:** Blob real (requiere BLOB_READ_WRITE_TOKEN; deploy Bolt 4); integridad cripto; publicPath del host.

## 2026-07-10 — Construction: Bolt 03-3 Miniapp CI (5 etapas DDD)
- **Raw request:** `/bolt-start 3` (intent 03) — CI por miniapp (GitHub Actions).
- **Decision (checkpoints):** publish.mjs reutilizable (no inline) + fsStorage de dev (para e2e local sin Blob) + pnpm. ADR-016. Implement/Test → backstage lib/storage/fs.ts + getStorage fallback; scripts/publish.mjs + .github/workflows/ci.yml en miniapp-template (placeholders) y miniapp-account-dashboard (id real, + manifest.json); zip por el runner. **E2E local REAL verificado:** build account-dashboard → zip → publish.mjs → Backstage local (fsStorage+token) → 201, chunk escrito a public/chunks (1.5M), resolve devuelve la nueva versión 0.2.0 + URL. 48 tests Backstage sin regresión. Artefactos e2e limpiados (seed restaurado a 0.1.0).
- **Skipped/deferred:** run real en GitHub Actions (org + deploy + secrets → Bolt 4); servir chunk fs por next start (prod snapshotea public; se sirve por Blob/CDN en prod o next dev); init de placeholders del template no ejecutado (requiere GitHub).

## 2026-07-10 — Construction: Bolt 03-4 Deploy Vercel (5 etapas DDD) — CIERRA Intent 03 MVP
- **Raw request:** `/bolt-start 4` (intent 03) — deploy Backstage a Vercel; método "preparar y documentar sin deploy real".
- **Decision (checkpoints):** preparar+documentar (deploy real = manual, requiere cuenta Vercel); ruta admin POST /api/seed (auth token); host env-aware por DefinePlugin. ADR-017. Implement/Test → app/api/seed/route.ts + test; host rspack.config DefinePlugin(__BACKSTAGE_URL__) + globals.d.ts + hostProvided env-aware; DEPLOY.md runbook; activation-checklist. Backstage 50 tests + build ok; host typecheck+4 tests; host bundle compila con URL de prod inyectada (verificado grep). Fix colateral: screens re-pineado exacto 4.11.1 (se había despineado a 4.25.2 tras revert Opción A).
- **Skipped/deferred:** deploy REAL a Vercel (cuenta Vercel + CLI + Blob/KV + org GitHub → manual, DEPLOY.md); auth de usuarios (intent 04); build nativo host (entorno).

## 2026-07-10 — Inception (intent 04-backstage-ui-auth)
- **Raw request:** "mejorar la interfaz de Backstage para mostrar más detalle de las miniapps (versión, fecha de creación, estado de CI, etc.) + login con GitHub para acceder a las miniapps creadas."
- **Decision (checkpoints):** 100% Backstage web (no toca RN/MF). Auth = Auth.js v5 + GitHub; toda la UI tras login (API resolve/upload/scaffold/seed fuera del gate); estado de CI = GitHub Actions API con token de sesión (cache+fallback unknown); metadatos = versión+createdAt, CI+repoUrl, lista de versiones, owner+capabilities; sin ACL por org (MVP); scope read:user + CI de repos públicos (scope amplio diferido). Producidos requirements, system-context, 4 unit-briefs, 12 stories, bolt-plan (4 bolts). Bolt-plan marca tests Vitest+RTL (aplica feedback del retro: etapa test adaptativa a web).
- **Skipped/deferred:** ACL por org, scope repo/workflow privados, webhooks CI, editar/borrar, roles → futuro. App OAuth de GitHub real = placeholder (login real requiere client id/secret).

## 2026-07-10 — Construction: Bolt 04-1 Login con GitHub (5 etapas DDD)
- **Raw request:** `/bolt-start 1` (intent 04) — login con GitHub.
- **Decision (checkpoints):** next-auth@5; gate por callback authorized + isProtectedPath (puro/testeable); env dev con placeholders. ADR-018. Implement/Test → auth.ts (NextAuth v5 GitHub, trustHost, callbacks) + lib/auth-paths + lib/auth-callbacks + middleware.ts + /signin + UserMenu + layout header + type augmentation; 66 tests Vitest/RTL (16 nuevos); typecheck+build ok; **gate verificado en server real** (/catalog sin sesión → 307 /signin; /api/resolve 200 fuera del gate).
- **Hallazgos:** Auth.js v5 exporta `handlers` (no GET/POST); `trustHost:true` obligatorio en localhost (UntrustedHost rompía el gate); Next 16 `middleware`→`proxy` rename rompe el redirect de Auth.js → se mantiene middleware.ts.
- **Skipped/deferred:** OAuth real (GitHub App client id/secret + AUTH_SECRET real → placeholder); scope amplio repo/workflow.

## 2026-07-13 — Operations: desbloqueo build nativo + primer run on-device (2 bugs runtime reales)
- **Raw request:** "la app ya corre en android y ios, quiero empezar a probar las miniapps." Objetivo elegido: desbloquear el build nativo y montar la miniapp `account_dashboard` en un dispositivo, de punta a punta.
- **Decision / hallazgos:**
  1. **Build nativo DESBLOQUEADO.** El `MissingValueException` de `assembleDebug` era específico de **Azul Zulu 17.0.13** (única JVM). Fix: `brew install openjdk@17` (Homebrew OpenJDK 17.0.19) → `JAVA_HOME` → `BUILD SUCCESSFUL 28s` → `app-debug.apk` (127 MB). Confirma "es el entorno, no el proyecto". Ver `operations/activation-checklist.md`.
  2. **App corre** en emulador `Pixel_10_Pro_XL` (y device físico `29171FDH300ESL` conectado). UI "Backstage Host" con botón "Abrir miniapp".
  3. **BUG RUNTIME #1 (fixed):** `ResolveClient` usaba `URL`+`URLSearchParams.set`, que **Hermes/RN no implementa** (`URLSearchParams.set is not implemented`) → el resolve fallaba SIEMPRE en device. Los tests pasaban porque Node/jsdom sí lo tienen. Fix en `packages/host-runtime/src/ResolveClient.ts`: query string construido a mano.
  4. **BUG RUNTIME #2 (fix parcial, en progreso):** el override de URL por `ScriptManager.addResolver` (ADR-009) **nunca interceptaba** el remote entry: el `RepackCorePlugin` de Re.Pack llama `ScriptManager.loadScript(name, _, ctx, entry)` con `entry` EXPLÍCITO (la URL estática :8081), saltándose los resolvers. Fix aplicado en `apps/host/src/chunkLoader.ts`: override en runtime con `registerRemotes([{name,entry}],{force:true})` sobre la instancia MF global (`globalThis.__FEDERATION__.__INSTANCES__`) — el import `@module-federation/enhanced/runtime` NO resuelve en el bundle RN. **Con esto el entry ya apunta a la URL de Backstage (:9000).**
  5. **Mejora:** `useMiniapp` ahora `console.warn` el detalle del fallo (antes se tragaba silenciosamente → indiagnosticable en campo).
- **PENDIENTE (serving de chunks del remote en dev):**
  - El contenedor NO es autocontenido: expone `./Entry` como `__federation_expose_Entry.chunk.bundle` + ~56 chunks (build estático en `miniapp-account-dashboard/build/generated/android/`).
  - Esos sub-chunks se **misrutean a :8081** (el resolver `else` los manda al dev server del host; no empiezan con `account_dashboard`). Falta rutar los chunks del remote a su base :9000 (usar el `caller` del resolver, o publicPath del contenedor).
  - `registerRemotes` sin `type` explícito hace que MF agregue sufijo `.javascript` a la URL (`?platform=android.javascript` → 404). Con dev server webpack-start el `?platform=android` es obligatorio pero choca; por eso se pasó a **build estático** (URL limpia, igual a prod). Falta el `type` correcto del entry.
- **Cambios temporales dejados:** servidores dev corriendo (backstage :3999, miniapp webpack-start :9000, host Metro :8081 pre-existente); emulador arriba. `data/registry.json` (backstage-web) revertido a URL sin `?platform`.
- **Durabilidad:** fijar `JAVA_HOME`/`org.gradle.java.home` a openjdk@17 para no volver a Zulu.

## 2026-07-13 (cont.) — LOGRADO: miniapp montada on-device end-to-end
- **Resultado:** la miniapp federada `account_dashboard` **monta y renderiza en el emulador** (`Pixel_10_Pro_XL`) con datos reales (saldo €4,283.55 + lista de transacciones en FlashList), tema de `@org/ui-kit` compartido, y capabilities inyectadas tras "Iniciar sesión". Bucle probado: resolve (Backstage :3999) → download chunk+subchunks (:9000) → mount `./Entry` → render. El gating por capability funciona (sin sesión → "Acceso no autorizado"; con sesión → dashboard).
- **Fixes de producto aplicados (revisar/commitear):**
  1. `packages/host-runtime/src/ResolveClient.ts` — query string manual (bug `URLSearchParams.set` no implementado en Hermes). **Bug real.**
  2. `apps/host/src/chunkLoader.ts` — (a) override de URL del remote con `registerRemotes([{name,entry,type:'global'}],{force:true})` sobre `globalThis.__FEDERATION__.__INSTANCES__` (el resolver de ScriptManager NO intercepta el entry de MF v2; el import `@module-federation/enhanced/runtime` no resuelve en RN); (b) resolver rutea los sub-chunks del remote a su base (`caller`) en vez de al dev server del host; (c) `Script.getRemoteURL(url, {excludeExtension:true})` — sin esto Re.Pack agrega `.javascript` a la URL → 404. **Hace que ADR-009 funcione de verdad on-device.**
  3. `apps/host/rspack.config.mjs` + `miniapp-account-dashboard/rspack.config.mjs` — `@org/ui-kit` agregado a `shared` singleton. Sin esto la miniapp usaba su propia copia de ui-kit → `useTheme` fallaba ("must be used within a ThemeProvider"). **Cumple la regla de singletons de los standards** (libs con estado/contexto = singleton).
  4. `packages/host-runtime/src/useMiniapp.ts` — `console.warn` del detalle del fallo (antes se tragaba silenciosamente).
- **Serving de dev (no es fix de código):** la miniapp se sirve como **build estático** (`pnpm bundle:android` → `build/generated/android/`) por un static server en :9000 (URL limpia, igual a prod), en vez del dev server webpack-start (que exige `?platform=android` e incompatibiliza con la carga de remote). En prod el chunk es un artefacto estático en Blob/CDN → mismo modelo.
- **Entorno:** build con `JAVA_HOME=openjdk@17` (Homebrew). Ver activation-checklist.
- **Pendiente menor:** iOS `pod install` (ya hay CocoaPods 1.16.2) + correr en iOS; fijar `org.gradle.java.home`; verificar tsc/tests del host tras estos cambios; commitear.

## 2026-07-14/17 — Operations en modo directo: publish-UI + storage + integridad + deploy
- **Raw request:** el usuario pidió, uno por uno: login → crear miniapps → publicar versión desde la UI → storage de prod → integridad real → deploy a Vercel.
- **Decisiones / entregado:**
  - **Login** (backstage-web): GitHub OAuth (Auth.js v5) cableado; verificado el redirect con client_id + callback correctos.
  - **Crear miniapps:** configurado `SCAFFOLD_ALLOWED_LOGINS=DentVega` + `GITHUB_TOKEN` (repo) + `MINIAPP_TEMPLATE_REPO=DentVega/miniapp-template` (marcado como template). Creó `miniapp-hellow_widget` real desde el template + registro.
  - **Publicar versión desde la UI** (nueva feature, backstage-web): form en `/miniapp/[id]` (auth por sesión, NO PUBLISH_TOKEN); `/upload` acepta sesión-allowlisted O token; manifest armado en server (`lib/manifest.ts`). +2 tests. Verificado e2e (upload→resolve→mount).
  - **Storage de prod:** `KV_REST_API_URL/TOKEN` (Upstash) + `BLOB_READ_WRITE_TOKEN` (Vercel Blob). **BUG REAL fixed:** `@upstash/redis` auto-deserializaba en `get` → `kvStore` re-parseaba → `"[object Object]" is not valid JSON`; fix `automaticDeserialization:false` (`lib/registry/kv.ts`). Solo salía contra Upstash real (tests usan cliente en memoria). Migrado el catálogo a Upstash; chunk 0.x subido y servido desde Blob CDN; mount desde Blob verificado con caché borrada.
  - **Integridad real:** `sha256Verifier` (host, pura-JS SHA-256 validado vs vectores NIST, `packages/host-runtime/src/sha256.ts`) + `sha256Integrity` (backstage, node crypto). El `/upload` calcula el hash de los bytes reales del container → `manifest.integrity=sha256-<hex>`. Reemplaza el no-op de ADR-008. Cableado en `MiniappScreen`. **Probado:** integridad válida → monta; hash manipulado en KV → mount bloqueado ("No pudimos verificar la integridad"), sin ejecutar código.
  - **Deploy Vercel:** `vercel link` (proyecto existente `backstage-web`), 7 env vars a production (storage+scaffolder+publish), `vercel deploy --prod` → live `backstage-web-blond.vercel.app`. Smoke test OK. **Validación de prod en device:** Metro del host buildeado con `BACKSTAGE_URL=prod`, quitado `adb reverse tcp:3999` → el emulador resolvió desde Vercel por internet + chunk de Blob + integridad → montó. Camino de producción completo.
- **Commits/pushes:** todo en `main` de los repos (backstagereactnative, backstage-web, miniapp-account-dashboard). `.env.local` y data de registry no commiteados.
- **Skipped/deferred:** publicar el contrato a GitHub Packages (`@org`→`@dentvega`, pendiente PAT `write:packages`); Home dinámico del host; `@dentvega/ui-kit`; iOS en device; firma (vs hash) del chunk.

## 2026-07-20/21 — Home dinámico (#3) + contrato publicado (#4) → 5/5 pendientes cerrados
- **Raw request:** cerrar los 2 pendientes restantes del roadmap: Home dinámico del host y publicar el contrato.
- **#3 Home dinámico (host):** `CatalogClient` (host-runtime) consume `GET /api/miniapps`; `HomeScreen` reescrito con react-query + FlashList — card por miniapp del catálogo, estados carga/error/vacío + pull-to-refresh, "Abrir" deshabilitado sin versión publicada. Reemplaza la card hardcodeada → cualquier miniapp registrada (ej. `hellow_widget`) aparece sola. host-runtime 25 tests, apps/host 5 (FlashList mockeado en jest). Verificado on-device (lista desde prod). Commit `feat(host): catalog-driven home`.
- **#4 Contrato publicado:** scope `@dentvega` (decisión del usuario). **Publicados** `@dentvega/miniapp-contract@0.1.0` + `@dentvega/ui-kit@0.1.0` a GitHub Packages (PAT con `write:packages`). Rename `@org`→`@dentvega` en los **4 repos** (host, backstage-web, account-dashboard, miniapp-template): imports + package names + workspace deps + `.npmrc` scope. **backstage-web** dejó el `file:`/vendor → consume `@dentvega/miniapp-contract@^0.1.0` del registro (borrado `vendor/`), con `.npmrc` propio. **Vercel:** el build ahora instala el contrato publicado → se actualizó `GITHUB_TOKEN` (el usuario) a un PAT con `read:packages` y se redesplegó; smoke test prod OK. host-runtime 25 + backstage-web 121 tests; account-dashboard `bundle:android` compila; typechecks limpios (excepto typecheck pre-existente roto de account-dashboard por `tsconfig.base.json`).
- **Decisiones:** `host-runtime` también renombrado a `@dentvega/host-runtime` (workspace-only, no publicado) por consistencia de scope. `ui-kit` publicado junto con el contrato (los repos de miniapp lo consumen) — no quedó como follow-on.
- **Skipped/deferred:** firma criptográfica del chunk (hoy = hash); iOS en device; fix del typecheck de account-dashboard (build funciona).
