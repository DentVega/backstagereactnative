# ADR-017 — Deploy de Backstage a Vercel (prep + runbook manual)

> Bolt: 03-4-deploy-vercel · Estado: **Aceptada** (checkpoint 2026-07-10)

## Contexto
Backstage debe correr en producción con Blob + KV reales. El deploy requiere cuenta Vercel + CLI + provisión de servicios + org de GitHub — recursos que solo el usuario controla. El agente no puede ejecutar el deploy real.

## Decisión
- **Deploy en Vercel zero-config** (Next.js autodetectado); sin `vercel.json` salvo necesidad.
- **Provisión por Marketplace:** Vercel Blob + Upstash Redis (KV) → inyectan `BLOB_READ_WRITE_TOKEN` / `KV_REST_API_URL` / `KV_REST_API_TOKEN`. `getStore()`/`getStorage()` seleccionan KV/Blob por env automáticamente.
- **Seed vía ruta admin** `POST /api/seed` (protegida por `PUBLISH_TOKEN`) → `seedRegistry(getStore())`; se invoca una vez tras el deploy.
- **Host env-aware:** `BACKSTAGE_BASE_URL` deja de ser hardcode → `DefinePlugin` inyecta `__BACKSTAGE_URL__` desde `process.env.BACKSTAGE_URL` en el build del host; fallback a localhost (seguro en jest).
- **Deploy real = paso manual documentado** (activation-checklist + runbook). El agente prepara todo y verifica el build/tests.

## Consecuencias
- (+) Selección KV/Blob automática por env; local sigue con jsonStore/fsStorage sin cambios.
- (+) Seed reproducible post-deploy con un curl autenticado.
- (+) El host apunta al Backstage correcto por entorno sin recompilar el código, solo el build env.
- (−) El deploy real depende de la cuenta Vercel + org (placeholders) → no ejecutado por el agente; documentado.
- (−) `POST /api/seed` sin auth de usuario (solo token de servicio) — aceptable para el MVP; auth de usuarios diferida (intent 04).
