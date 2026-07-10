# Bolt 03-1 — Registry → Vercel KV · RESULT

> Estado: **COMPLETO** · Fecha: 2026-07-10 · Intent 03 · Stories: S1.1–S1.3
> Código en `backstage-web`.

## Qué se construyó
El registry de Backstage puede persistir en **serverless** vía KV (Upstash Redis), manteniendo el JSON fs en dev. Prepara el deploy a Vercel (Bolt 4).

```
lib/registry/
├── kv.ts        KvClient (interfaz) + kvStore(client) + upstashClient() (@upstash/redis)
├── store.ts     + getStore() (env: KV si hay creds, si no jsonStore)
├── seed.ts      seedRegistry(store) + fixture account_dashboard (idempotente)
└── __tests__/kv.test.ts
app/api/**/route.ts + catalog  →  jsonStore reemplazado por getStore()
```

## Evidencia (verificado, no afirmado)
- **Tests (Vitest):** **42 passing** (37 previos + 5 nuevos: kvStore round-trip 3 · seed 2).
  - `kvStore(inMemoryKv)`: load vacío → {}, save→load round-trip, persistencia entre instancias.
  - `seedRegistry`: siembra account_dashboard; no clobbea una miniapp ya registrada.
- **Typecheck** limpio · **Build Next.js** compila.
- **Runtime (dev):** `/catalog`→200 · `/api/resolve?id=account_dashboard`→URL (getStore()=jsonStore en dev, lee registry.json).
- Mocks de los tests de rutas migrados de `jsonStore` → `getStore`.

## Cobertura de stories
- **S1.1 kvStore** ✓ — `kvStore(client)` sobre `KvClient`; `getStore()` env-selection; impl `upstashClient()`.
- **S1.2 seed** ✓ — `seedRegistry` idempotente con el fixture account_dashboard.
- **S1.3 tests** ✓ — KV in-memory: round-trip + seed.

## ADR
- ADR-014 — RegistryStore sobre Upstash Redis (KV), una clave, env-selection, jsonStore en dev.

## NO hecho / diferido (honesto)
- **KV real (Upstash) no ejercitado:** requiere credenciales (`KV_REST_API_URL/TOKEN`) que inyecta Vercel → se prueba con KV in-memory; el KV real se valida al desplegar (Bolt 4).
- Seed real a KV = script/route en el deploy (Bolt 4).
- Granularidad "una clave para todo el registry" (read-modify-write) — aceptable al volumen actual; migrar a per-id si crece (ADR-014).

## Siguiente
- **Bolt 03-2** (Chunk storage Blob + upload autenticado) — la recepción de chunks; usa este store.
