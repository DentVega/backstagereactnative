# Operations Runbook — intent 01-vertical-slice

> Fecha: 2026-07-09 · Fase: Operations. Registra hosting de remotes, checklist de release
> Re.Pack, rollback y monitoreo. Complementa `activation-checklist.md`.

## 1. Build (medido)
- **Host bundle:** 2.48 MB JS (pre-Hermes) — ceiling 3 MB ✅.
- **Remote `account_dashboard` (incremental, singletons provistos por el host):** container 384 KB + expose Entry 44 KB ≈ **~430 KB** — ceiling 600 KB ✅.
- Build standalone del remote emite ~8.8 MB de vendor chunks (react-native, react-query, flash-list, virtualized-lists) que **NO se descargan** al montar en el host (share scope, `singleton:true`).
- Hermes: la conversión a bytecode (.hbc) ocurre en el build nativo (`hermesc`), reduce ~30-50%. Pendiente de medir con el build nativo operativo.
- Comandos: host `pnpm --filter @app/host bundle:android`; remote `react-native webpack-bundle --entry-file src/Entry.tsx …`.

## 2. Serve / host de remotes
- **Resolución (runtime):** el host llama a Backstage `GET /api/resolve?id=account_dashboard` → `{url, version, manifest}`. Un resolver de ScriptManager (Re.Pack) usa esa `url` para descargar el chunk (`apps/host/src/chunkLoader.ts`, ADR-009).
- **Dev (hoy):** `url` = `http://localhost:8081/account_dashboard.container.js.bundle` (seed del registry). Servir con el dev server de la miniapp o un estático. ⚠️ Colisión de puerto con el dev server del host (8081) — separar puertos.
- **Env-aware:** `BACKSTAGE_BASE_URL` en `apps/host/src/hostProvided.ts` (hoy `http://localhost:3999`, hardcode) → parametrizar por entorno (dev/staging/prod) vía DefinePlugin/env.
- **Prod (diferido):** publicar artefactos a **CDN/object storage** (S3/GCS/R2/Vercel Blob); Backstage guarda la URL de CDN en el manifest al publicar. Decisión de proveedor: **pendiente**.

## 3. Re.Pack release checklist
- [x] **Shared-deps compatibles:** `@module-federation/enhanced` **fijado 0.9.0** (2.x rompe con Re.Pack 5.2.5). Host y remote lo comparten.
- [x] **Sin duplicación React/RN entre chunks:** react, react-native, react-query, flash-list, navigation son `singleton:true` en host y remote (misma lista canónica).
- [x] **Versiones de singletons alineadas:** host provee react 18.3.1 / RN 0.76.6 / react-query 5.101.2 / flash-list 1.8.3; el remote declara rangos compatibles (`^`). Skew → fallback.
- [ ] **Source maps + symbolication:** los builds emiten `.bundle.map`; falta subirlos a un servicio de symbolication (Sentry u otro) para stacktraces de prod. **Pendiente**.
- [x] **Fallback ante fallo de red/skew/manifest:** implementado y testeado (MiniappHost, 4 caminos de fallback).
- [ ] **Hermes bytecode** en artefactos de prod — pendiente del build nativo.

## 4. Rollback
- **Miniapp (remote):** el registry versiona cada `PublishedVersion`. Rollback = re-publicar/apuntar `resolve` a la versión anterior (o `GET /api/resolve?version=<prev>`). El host la resuelve en el siguiente arranque/montaje — **sin release de la app nativa**. (Nota: implementar endpoint de "set active version" en Backstage; hoy `resolve` toma la última por semver.)
- **Host (app nativa):** cambios en el host requieren release de tienda / rebuild nativo → rollback = versión anterior del binario. Mantener compatibilidad de singletons hacia atrás.
- **Contrato:** un cambio incompatible de `@org/miniapp-contract` es major + coordinar host y remotes; rollback = pinnear la versión previa del paquete.

## 5. Monitoreo (post-release) — qué observar
- **Fallos de carga de chunk:** tasa de estados `fallback` por razón (`resolve-failed`, `download-failed`, `invalid-manifest`, `skew`, `integrity-failed`). Instrumentar `useMiniapp`/`MiniappHost` con telemetría (hoy no hay).
- **Version skew host↔remote:** contar `skew` — indica que un remote se publicó con rangos incompatibles con hosts en producción.
- **Startup / TTI:** medir cold start y tiempo hasta montar el primer remote (target ≤ 2500 ms).
- **Salud de Backstage `/api/resolve`:** latencia y tasa de 4xx/5xx (el host depende de este endpoint para montar remotes).
- **Tamaño de chunks por versión:** vigilar que no crezcan sobre el ceiling (host 3 MB, remote 600 KB).

## 6. Estado
- Build + tamaños ✅ dentro de presupuesto. Hosting **dev local** (CDN diferido). Verificación de montaje en dispositivo **pendiente** (build nativo bloqueado — ver activation-checklist). Ningún deploy/hosting de prod ejecutado (requiere tu confirmación).
