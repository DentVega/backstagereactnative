# Bolt 03-4 — Deploy Backstage a Vercel · RESULT

> Estado: **COMPLETO (prep + docs; deploy real = manual)** · Fecha: 2026-07-10 · Intent 03
> **Cierra el MVP del Intent 03.** Stories: S4.1–S4.3.

## Qué se construyó
Todo lo necesario para desplegar Backstage en Vercel con Blob + KV reales, más el host env-aware. El `vercel deploy` real es un paso manual (tu cuenta).

```
backstage-web/
├── app/api/seed/route.ts   POST /api/seed (auth PUBLISH_TOKEN) → seedRegistry(getStore())
└── DEPLOY.md               runbook completo del deploy a Vercel
apps/host/
├── rspack.config.mjs        + DefinePlugin: __BACKSTAGE_URL__ desde BACKSTAGE_URL
├── src/globals.d.ts         declare const __BACKSTAGE_URL__
└── src/hostProvided.ts       BACKSTAGE_BASE_URL = __BACKSTAGE_URL__ (fallback localhost)
memory-bank/operations/activation-checklist.md   + pasos del deploy Vercel
```

## Evidencia (verificado, no afirmado)
- **Backstage:** `pnpm build` verde con ruta `/api/seed`; **50 tests** (48 + 2 seed: 200 con token / 401 sin).
- **Host env-aware:** typecheck + 4 tests verdes (fallback en jest); **host bundle compila (2.4M)** con `BACKSTAGE_URL=https://…` → la URL de prod **queda inyectada en el bundle** por el DefinePlugin (verificado con grep).
- **Selección por env:** `getStore()`=KV / `getStorage()`=Blob cuando hay creds; local sigue jsonStore/fsStorage.

## Cobertura de stories
- **S4.1 config + provisión** ✓ — zero-config Next.js; Blob + Upstash/KV por Marketplace (documentado en DEPLOY.md).
- **S4.2 env/secrets** ✓ — lista de envs + `vercel env`; selección automática por env; host env-aware (DefinePlugin).
- **S4.3 deploy + smoke** ✓ (preparado/documentado) — runbook con deploy + seed (`/api/seed`) + smoke; **deploy real = manual** (tu cuenta Vercel).

## ADR
- ADR-017 — Deploy prep a Vercel: zero-config + Blob/KV Marketplace, ruta admin de seed, host env-aware, deploy manual documentado.

## Fix colateral
- **`react-native-screens` re-fijado a 4.11.1 exacto** (safe-area 4.14.1, flash-list 1.7.6): el pin se había despineado a `^4.11.1`→4.25.2 (rompía el bundle por codegen "onAppear") tras el revert de Opción A. Ahora exacto.

## NO hecho / diferido (honesto)
- **Deploy REAL a Vercel:** requiere tu cuenta Vercel + `vercel login` + CLI (no instalado) + provisión Blob/KV + org GitHub → runbook en `backstage-web/DEPLOY.md` + activation-checklist. No ejecutable por el agente.
- Auth de usuarios en Backstage (solo token de servicio) → intent 04.
- Build nativo del host (entorno) — independiente, sigue bloqueado.

## Cierre del Intent 03
MVP (CI + CDN) **preparado y verificado localmente** end-to-end (Bolts 1-3) + listo para Vercel (Bolt 4). El flujo cloud real depende de tu cuenta Vercel + org GitHub.
