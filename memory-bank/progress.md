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

## Deuda técnica — abierta (menor)
- **Deploy — versión estática:** `manifest.json` fija la versión; repetir da "blob already exists". Futuro: auto-bump o `allowOverwrite` en el storage.
- **Secrets por-repo:** cada miniapp necesita `BACKSTAGE_URL` + `PUBLISH_TOKEN` (DentVega = usuario, no org). Automatizar en el scaffolder.
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
