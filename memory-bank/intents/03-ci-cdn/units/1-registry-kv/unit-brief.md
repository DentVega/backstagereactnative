# Unit 1 — Registry store → Vercel KV

> Intent: 03-ci-cdn · Estado: Borrador · Fecha: 2026-07-09

## Propósito
Que el registry de Backstage persista en **serverless (Vercel)**. El JSON fs actual no persiste entre invocaciones → migrar `RegistryStore` a **Vercel KV** (Redis/Upstash), misma interfaz.

## Alcance
- Impl `kvStore` de `RegistryStore` (`load()/save()`, o `get/set` por id) sobre Vercel KV / Upstash Redis.
- **Seed:** migrar el `registry.json` actual (con `account_dashboard`) a KV (script/route de seed idempotente).
- Selección de store por env (dev = JSON fs; prod = KV) detrás de la misma interfaz — sin tocar el dominio del registry ni las rutas.
- Tests con un KV **mockeado/in-memory**.

## Clasificación
- Web (Backstage). **Bloquea** el deploy real (Unit 4) y la recepción de uploads (Unit 2 usa el store).

## Dependencias
- Reusa `RegistryStore` (intent 01). Ninguna unidad previa.

## Stories
- S1.1 — `kvStore` (impl KV de RegistryStore) + selección por env.
- S1.2 — Seed del catálogo actual (account_dashboard) a KV (idempotente).
- S1.3 — Tests con KV in-memory (load/save, round-trip).

## Criterios de aceptación
- `RegistryStore` funciona sobre KV sin cambiar el dominio ni los Route Handlers.
- El seed deja `account_dashboard` en KV; `/api/resolve` y `/catalog` funcionan igual.
- Tests verdes con KV mockeado; dev sigue usando JSON fs.
