# Progress

> **Agent note:** This is your long-term progress tracker. Update it whenever you complete a Bolt, close a phase, or reach a major milestone.

## Overall Status
- **Current Phase:** Intents 01/02/03 con Construction COMPLETA · build nativo del host bloqueado por entorno · deploy Vercel = manual (tu cuenta)
- **Bolts Completed:** 4 / 4 (intent `01-vertical-slice`) · 100 tests verdes (74 móvil + 26 Backstage)
- **Operations:** tamaños dentro de presupuesto (host 2.48MB/3MB, remote ~430KB/600KB); hosting dev local (CDN diferido); ver `operations/activation-checklist.md` (bloqueante: build nativo pnpm) y `operations/operations-runbook.md`.

## Milestones Achieved
- [x] Memory Bank and standards initialized
- [x] First intent captured (`01-vertical-slice`) — requirements, system-context, 4 units, 13 stories, bolt-plan
- [x] Re.Pack + Module Federation scaffolded — host compila android/ios con MF v2 (`mf-manifest.json`)
- [x] Bolt 1 Foundations: monorepo + contract (publicable) + ui-kit + host-runtime shell · 44 tests verdes
- [x] Backstage web registry scaffolded — repo separado, resolve verificado en server real
- [x] Loader host↔Backstage integrado (resolve→verify→mount→fallback) — verificado por tests + builds
- [ ] Montaje del remote en DISPOSITIVO real (Layer 2) — bloqueado por setup build nativo RN+pnpm monorepo
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

## Deuda técnica abierta (para Operations / próximo bolt)
- **Build nativo en monorepo pnpm:** `settings.gradle` de RN no resuelve `@react-native/gradle-plugin` (hoisted). Hoistear RN build tooling + ajustar rutas gradle; iOS `pod install` con ruby que tenga CocoaPods.
- **Integridad de chunk:** `IntegrityVerifier` es no-op (ADR-008) — implementar sha256/firma antes de prod.
- **Backstage:** sin auth, JSON fs no transaccional, contrato vía `file:` (publicar a GitHub Packages), CDN de artefactos.

## Bolts (Execution Units) — intent 01-vertical-slice
- **Bolt 1:** `Completed` ✓ — Foundations. 44 tests verdes; host compila android/ios con Re.Pack+MF v2. Ver `bolts/bolt-1-foundations/result.md`.
- **Bolt 2:** `Completed` ✓ — Backstage Web (repo separado `/Volumes/SSDExterno/prodproyects/backstage-web`). 26 tests; build Next.js ok; resolve verificado en server real. Ver `bolts/bolt-2-backstage-web/result.md`.
- **Bolt 3:** `Completed` ✓ — Miniapp Account Dashboard. 13 tests; container remoto compila con MF v2. Ver `bolts/bolt-3-account-dashboard/result.md`.
- **Bolt 4:** `Completed` ✓ — Host Runtime + integración. Loader (resolve→verify→mount→fallback), sesión+capabilities, nav, remote wired. 18 tests nuevos; bundles android/ios con remote compilan. **Layer 2 en dispositivo DIFERIDO** (build nativo bloqueado por setup RN+pnpm). Ver `bolts/bolt-4-host-integration/result.md`.

## Deferred or Blocked Tasks
- CDN/hosting de chunks en producción → Operations.
- Auth/sesión real contra backend, firma de chunks en prod, transferencias → intents posteriores.
- Parity vs. app Android → `/parity` tras el slice.
