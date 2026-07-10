# ADR-014 — RegistryStore sobre Upstash Redis (Vercel KV)

> Bolt: 03-1-registry-kv · Estado: **Aceptada** (checkpoint 2026-07-10)

## Contexto
Backstage corre en Vercel (serverless). El `RegistryStore` actual (JSON en fs, ADR-006) **no persiste** entre invocaciones serverless ni entre despliegues. Necesita un almacén persistente. Vercel KV clásico ya no se ofrece; el KV actual del Marketplace es **Upstash Redis**.

## Decisión
- Nueva impl `kvStore(client)` de `RegistryStore` sobre KV, detrás de una abstracción mínima **`KvClient` (`get`/`set`)** → testeable con impl in-memory, cambiable de proveedor.
- Impl real `upstashClient()` con **`@upstash/redis`** (env `KV_REST_API_URL` / `KV_REST_API_TOKEN`, inyectados por la integración de Vercel).
- **Todo el `Registry` bajo una clave** (`registry`) — misma granularidad que el JSON fs; cambio mínimo, sin tocar el dominio ni el contrato HTTP. (Per-id se difiere.)
- **Selección por env** (`getStore()`): KV en prod (si hay creds), `jsonStore` en dev. Las rutas usan `getStore()`.
- **Seed** idempotente del catálogo actual (account_dashboard) al store.

## Consecuencias
- (+) Persistencia en serverless; dev sigue con JSON fs (cero fricción local).
- (+) Dominio del registry y rutas casi sin cambios (solo el accesor del store).
- (−) **Una clave para todo el registry** = read-modify-write del objeto completo → no apto para alta concurrencia de escritura; aceptable para el volumen actual (publish esporádico). Migrar a per-id si crece.
- (−) La verificación real contra Upstash requiere credenciales (deploy, Bolt 4); en tests se usa KV in-memory.
- **Acción:** actualizar los mocks de los tests de rutas (de `jsonStore` a `getStore`).
