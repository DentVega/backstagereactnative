# Progress

> **Agent note:** This is your long-term progress tracker. Update it whenever you complete a Bolt, close a phase, or reach a major milestone.

## Overall Status
- **Current Phase (2026-07-17): PRODUCCIÓN — plataforma live y validada end-to-end en dispositivo.** Backstage desplegado en Vercel (`backstage-web-blond.vercel.app`); registry en Upstash Redis; chunks en Vercel Blob (CDN); integridad sha256 real; el host resuelve+verifica+monta desde internet sin dependencia local.
- **Bolts Completed:** 01 (4/4) · 02 (4/4) · 03 (4/4) · 04 (parcial + publish-UI hecho fuera de bolt). Además, en modo directo esta sesión se cerró TODA la deuda de Operations (build, storage, CDN, integridad, deploy).
- **Verificado on-device** (emulador saliendo a internet como un teléfono real): resolve→Upstash→verify sha256→Blob CDN→mount. Ver `audit.md` (2026-07-13/17) y `operations/activation-checklist.md`.
- **Roadmap de 5 pendientes: 5/5 HECHOS** (storage, integridad, home dinámico, contrato publicado, deploy). Abierto solo menor: firma de chunk (vs hash), iOS en device.

## Milestones Achieved
- [x] Memory Bank and standards initialized
- [x] First intent captured (`01-vertical-slice`) — requirements, system-context, 4 units, 13 stories, bolt-plan
- [x] Re.Pack + Module Federation scaffolded — host compila android/ios con MF v2 (`mf-manifest.json`)
- [x] Bolt 1 Foundations: monorepo + contract (publicable) + ui-kit + host-runtime shell · 44 tests verdes
- [x] Backstage web registry scaffolded — repo separado, resolve verificado en server real
- [x] Loader host↔Backstage integrado (resolve→verify→mount→fallback) — verificado por tests + builds
- [x] **Montaje del remote en DISPOSITIVO real (Layer 2) — LOGRADO 2026-07-13** en emulador `Pixel_10_Pro_XL`: resolve→download(:9000)→mount→render con datos + FlashList + ui-kit compartido + capabilities post-login. Requirió 2 fixes runtime (URLSearchParams, override MF v2) + compartir `@org/ui-kit` como singleton. Ver `audit.md` y `operations/activation-checklist.md`.
- [ ] Android bank-app parity baseline mapped (`/parity`)

## Intent 02 — miniapp-platform (Inception completa, Construction pendiente)
- **Planificado:** requirements, system-context (3 planos), 4 units, 12 stories, bolt-plan. MVP = deltas 1-2-3-4.
- **Bolts 02:** B1 ✓ (publicar paquetes) · B2 `Completed` ✓ (miniapp-template: repo separado, remote compila con MF, expone ./Entry) · B3 `Completed` ✓ (account-dashboard migrada a repo propio; monorepo sin miniapps/*; móvil verde 61 tests) · B4 `Completed` ✓ (scaffolder: GitProvider + /api/scaffold + /create; 37 tests Backstage; runtime verificado). **Intent 02 MVP COMPLETO.** Ver `bolts/02-*`.
- **Diferido → Intent 03/Operations:** CI por miniapp (delta 5) + CDN de chunks (delta 6).

## Intent 03 — ci-cdn (Inception completa, Construction pendiente)
- **Planificado:** requirements, system-context (flujo CI→Backstage→Blob→host), 4 units, 12 stories, bolt-plan. MVP = CI + CDN núcleo + token de servicio.
- **Decisiones:** CDN = Vercel Blob · CI = GitHub Actions · store registry = Vercel KV · upload vía Backstage (zip) · deploy = Vercel · integridad cripto diferida.
- **Bolts 03:** B1 `Completed` ✓ (Registry→KV: kvStore + getStore env-selection + seed; 42 tests Backstage) · B2 `Completed` ✓ (ChunkStorage Blob + upload autenticado; 48 tests; 401 verificado en server real) · B3 `Completed` ✓ (Miniapp CI: publish.mjs + ci.yml en template/account-dashboard; e2e local real build→zip→publish 201→resolve) · B4 `Completed` ✓ (Deploy prep Vercel: /api/seed + host env-aware DefinePlugin + DEPLOY.md; 50 tests; deploy real = manual). **Intent 03 MVP COMPLETO (prep).** Ver `bolts/03-*`.
- **Requiere para el flujo real:** cuenta Vercel + org GitHub reales.

## Intent 04 — backstage-ui-auth (Inception completa, Construction pendiente)
- **Planificado:** requirements, system-context, 4 units, 12 stories, bolt-plan. 100% Backstage web (no toca RN/federación).
- **Objetivo:** login con GitHub (Auth.js v5, toda la UI) + UI de detalle por miniapp (versión, createdAt, estado de CI, link repo, versiones, owner, capabilities).
- **Decisiones:** Auth.js v5 + GitHub · toda la UI tras login (API fuera del gate) · CI status = GitHub Actions API (token de sesión, cache, fallback) · sin ACL por org (MVP) · scope read:user + CI de repos públicos.
- **Bolts 04:** B1 `Completed` ✓ (Login GitHub: Auth.js v5 + middleware gate; 66 tests; redirect 307→/signin verificado en server real) · B2 Registry metadatos · B3 Estado de CI · B4 UI detalle+catálogo. Ver `bolts/04-1-*`.

## Deuda técnica — RESUELTA esta sesión (2026-07-13 → 07-17)
- ✅ **Build nativo:** era la JVM (Zulu 17) → OpenJDK 17 Homebrew. `assembleDebug` ✅, corre en emulador.
- ✅ **Integridad de chunk:** `sha256Verifier` real (pura-JS host + node crypto backstage); no-op de ADR-008 reemplazado; probado (manipulación → bloqueo).
- ✅ **Backstage auth:** login GitHub (Auth.js v5) verificado.
- ✅ **Registry store:** Upstash Redis en prod (bug de auto-deserialización fixed). Ya no es JSON fs.
- ✅ **CDN de chunks:** Vercel Blob (público, URLs deterministas), verificado sirviendo al device.
- ✅ **Deploy:** live en Vercel.

## Deuda técnica — RESUELTA (cont. 2026-07-21)
- ✅ **Contrato publicado:** `@dentvega/miniapp-contract@0.1.0` + `@dentvega/ui-kit@0.1.0` en GitHub Packages. `@org`→`@dentvega` en los 4 repos; backstage-web consume el publicado (sin `vendor/`); Vercel build instala el contrato (token `read:packages`) y redesplegado. Elimina el drift web↔móvil.
- ✅ **Home dinámico:** el host lista el catálogo (`GET /api/miniapps`) — cualquier miniapp registrada aparece sola; card por miniapp, deshabilitada sin versión publicada.

## Extra (2026-07-21) — Botón "Deploy" (1 click → CI)
- ✅ Botón **"Deploy"** en la página de detalle de Backstage → dispara el `ci.yml` (`workflow_dispatch`) de la miniapp → build + publish. `POST /api/miniapps/:id/deploy` (auth sesión) + `GitProvider.dispatchWorkflow`.
- ✅ **Fixes de CI reales:** (1) auth de GitHub Packages — `@dentvega/*` puestos **públicos** + token en `~/.npmrc` (pnpm ignora el `.npmrc` committeado); (2) zip **plano** de `build/generated/android/` (antes anidaba sub-chunks → 404 → no montaba).
- ✅ Probado end-to-end: CI publica 0.7.0 → monta en emulador con datos.

## Template drift + actualización de miniapps (2026-07-21) — Capa 1 + hello_widget live
- **Capa 1 (workflow reutilizable):** el build+publish real vive en `miniapp-template/.github/workflows/publish.yml` (`workflow_call`); cada miniapp usa un `ci.yml` **caller delgado** (`uses: DentVega/miniapp-template/.github/workflows/publish.yml@main` + `secrets: inherit`). Arreglar `publish.yml` arregla **todas** las miniapps a la vez (siguen `@main`) — sin update por-repo. Combate el drift de template.
- **Fix ui-kit singleton en el template:** `@dentvega/ui-kit` estaba `singleton: false` → toda miniapp scaffoldeada habría tenido el bug de `useTheme`. Ahora `singleton: true` (template + hello_widget).
- **hello_widget actualizado y LIVE (0.1.2):** estaba doblemente roto (init-template nunca corrió → placeholders sin sustituir; usaba `@org/*`). Corregido: `id=hellow_widget`, `@org`→`@dentvega`, CI→caller, ui-kit singleton, `pnpm-lock.yaml` añadido (lo exige `cache: pnpm`). Publicado 0.1.2 vía CI; **resolve→CDN→integrity sha256→200** verificado.
- **Gotcha CI:** `ci.yml` dispara con `push` **y** `workflow_dispatch`. El `push` del bump ya publica; un `gh workflow run`/botón Deploy manual sobre la misma versión da **409 VERSION_EXISTS** (redundante, no es fallo real). El run del `push` es el que cuenta.

## Capa 2 — template sync (anti-drift) — DONE 2026-07-21
- **Objetivo:** propagar cambios NO-workflow del template (rspack, deps, tsconfig, scaffolding) a miniapps ya scaffoldeadas **sin pisar su código**. Complementa Capa 1 (workflow CI reutilizable).
- **Construido con subagent-driven development** (spec+plan en `backstage-web/docs/superpowers/{specs,plans}/2026-07-21-template-sync-layer2*`; 6 tasks, review por task + whole-branch review final).
- **Mecanismo:** botón "Actualizar desde template" en Backstage → `workflow_dispatch` de `template-sync.yml` en la miniapp → **merge 3-way real con base explícita** (`git merge-tree --merge-base=$BASE`, base = `baseSha` del marcador `.template-sync`; necesario porque `/generate` rompe la ancestry). Materializa con `git read-tree -u --reset` (respeta borrados). Respeta `.templatesyncignore` (Screen.tsx, manifest.json, README*, .template-sync). Bumpea el marcador y **abre PR** (nunca push directo). Sin secrets nuevos.
- **Backstage:** ruta `POST /api/miniapps/:id/sync-template` + botón, gated por `canScaffold`, comparten helper `dispatchMiniappWorkflow` con el botón Deploy. Live en main (Vercel).
- **Enrolamiento:** scaffolds nuevos se auto-enrolan (`init-template.yml` escribe `.template-sync` con baseSha=HEAD template); hello_widget + cards_wallet backfilled (baseSha=8c0e7da).
- **e2e PROBADO:** cambio smoke en template → dispatch → PR con solo el archivo de infra + bump del marcador (Screen.tsx/manifest intactos) → merged → marcador avanzó.
- **Gotcha (no es secret, es setting del repo):** el `GITHUB_TOKEN` automático no abre PRs sin habilitar "Allow GitHub Actions to create and approve pull requests" (`gh api PUT .../actions/permissions/workflow -F can_approve_pull_request_reviews=true`). Habilitado en cards_wallet + hello_widget. **El scaffolder debería setearlo en repos nuevos** (deuda abierta).
- **cards_wallet real + LIVE (0.1.0) — 2026-07-21:** era solo-seed falso (owner `cards-team`, repo `acme/…`, 0 versiones). Creado headless con `gh repo create --template`: `init-template.yml` **sí corrió** (sustituyó placeholders y se auto-eliminó — funciona en scaffold fresco; el fallo de hello_widget era por ser scaffold viejo). Scaffold correcto **sin fixes manuales** (valida la estrategia anti-drift). Secrets vía `gh secret set`; metadata del registry corregida directo en Upstash (script `@upstash/redis` con `automaticDeserialization:false`, key única `registry`, load→modify owner/repoUrl→save). CI publicó 0.1.0; **montó en emulador**. Repo: `DentVega/miniapp-cards_wallet`.

## Deuda técnica — abierta (menor)
- **Redeploy = bump de versión:** `manifest.json` fija la versión y el registry es **inmutable** (409 en versión repetida, por contrato con tests). ✅ Blob ya idempotente (`allowOverwrite: true`). Para re-publicar hay que bumpear la versión (cada build = versión nueva). Futuro: auto-bump en CI o `allowOverwrite` opt-in en el registry (rompería tests de inmutabilidad → decisión pendiente).
- **Botón Deploy vs versión estática:** el botón dispara `workflow_dispatch` sobre la versión actual → 409 si ya está publicada. Sirve solo tras un bump. Ligar al auto-bump.
- ✅ **Secrets por-repo — AUTOMATIZADO (2026-07-21):** el scaffolder ahora siembra `BACKSTAGE_URL` + `PUBLISH_TOKEN` en cada repo nuevo (`GitProvider.setSecret`, libsodium sealed-box, best-effort). Valores desde el env de Backstage vía `scaffoldSecrets()`. **Requiere setear `BACKSTAGE_URL` en Vercel prod** (= URL de Backstage; `PUBLISH_TOKEN` ya está). Crypto verificado bajo node (201); libsodium no corre bajo vitest → unit tests cubren la orquestación. Pendiente menor: `PUBLISH_TOKEN` de prod sigue siendo débil (`dev-*`) → rotar a token fuerte en Vercel + repos a la vez.
- **Scaffolder auto-setea el permiso de PRs de Actions** (`enableActionsPullRequests`, best-effort) → repos nuevos listos para template-sync sin paso manual. Junto con el auto-seed de secrets, el onboarding de una miniapp nueva es 100% automático.
- **Estado de CI en la UI (badge):** sigue "unknown" — scope OAuth `read:user` no lee Actions. Ampliar scope + `CI_STATUS_ENABLED=true`.
- **Integridad = hash, no firma:** protege integridad, no autenticidad de origen (firma con clave = paso mayor futuro).
- **iOS device:** `pod install` presumiblemente OK (CocoaPods 1.16.2) pero no verificado en iOS real.
- **account-dashboard typecheck:** su `tsconfig.json` referencia un `tsconfig.base.json` del monorepo (ruta rota) — pre-existente; el build (`bundle:android`) funciona.
- `@module-federation/enhanced` fijado a 0.9.0 (no subir con Re.Pack 5.2.5).

## Bolts (Execution Units) — intent 01-vertical-slice
- **Bolt 1:** `Completed` ✓ — Foundations. 44 tests verdes; host compila android/ios con Re.Pack+MF v2. Ver `bolts/bolt-1-foundations/result.md`.
- **Bolt 2:** `Completed` ✓ — Backstage Web (repo separado `/Volumes/SSDExterno/prodproyects/backstage-web`). 26 tests; build Next.js ok; resolve verificado en server real. Ver `bolts/bolt-2-backstage-web/result.md`.
- **Bolt 3:** `Completed` ✓ — Miniapp Account Dashboard. 13 tests; container remoto compila con MF v2. Ver `bolts/bolt-3-account-dashboard/result.md`.
- **Bolt 4:** `Completed` ✓ — Host Runtime + integración. Loader (resolve→verify→mount→fallback), sesión+capabilities, nav, remote wired. 18 tests nuevos; bundles android/ios con remote compilan. **Layer 2 en dispositivo DIFERIDO** (build nativo bloqueado por setup RN+pnpm). Ver `bolts/bolt-4-host-integration/result.md`.

## Deferred or Blocked Tasks
- CDN/hosting de chunks en producción → Operations.
- Auth/sesión real contra backend, firma de chunks en prod, transferencias → intents posteriores.
- Parity vs. app Android → `/parity` tras el slice.
