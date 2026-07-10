# Bolt 03-1 — Registry → KV · Etapa 2: DESIGN

> DDD stage 2/5 · Estado: **Borrador** · Fecha: 2026-07-10 · Repo `backstage-web`

## 1. Estructura
```
lib/registry/
├── store.ts        + getStore() (selección por env: KV si hay creds, si no jsonStore)
├── kv.ts           (nuevo) KvClient (interfaz) + kvStore(client) + upstashClient()
├── seed.ts         (nuevo) seedRegistry(store) + fixture account_dashboard
└── __tests__/kv.test.ts, seed.test.ts (nuevos)
app/api/**/route.ts  jsonStore → getStore()   (resolve, miniapps, publish, scaffold)
```

## 2. `kv.ts`
```ts
interface KvClient { get(k:string): Promise<string|null>; set(k:string, v:string): Promise<void> }
function kvStore(client: KvClient): RegistryStore {
  load: async () => JSON.parse((await client.get("registry")) ?? "{}")
  save: async (r) => client.set("registry", JSON.stringify(r))
}
function upstashClient(): KvClient  // @upstash/redis desde env KV_REST_API_URL/TOKEN
```

## 3. `store.ts` — selección por env
```ts
function getStore(): RegistryStore {
  return (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
    ? kvStore(upstashClient()) : jsonStore
}
```
- `jsonStore` se mantiene (dev). Las rutas cambian `jsonStore` → `getStore()`.

## 4. `seed.ts`
- `seedRegistry(store)`: escribe el fixture (account_dashboard, el registry.json actual) al store (idempotente: `save` del objeto completo).
- Uso: script dev / route dev-only; en tests contra KV in-memory.

## 5. Impacto en tests existentes
- `app/api/__tests__/routes.test.ts` y `scaffold-route.test.ts` mockean `@/lib/registry/store` con `jsonStore` → cambiar a mockear **`getStore`** (devuelve el store in-memory).

## 6. Verificación (Test)
- `kv.test.ts`: `kvStore(inMemoryKv)` round-trip (save→load), load vacío → {}.
- `seed.test.ts`: `seedRegistry` deja account_dashboard en un store in-memory.
- Suite Backstage completa verde (rutas via getStore=jsonStore en test).
- `@upstash/redis` no se ejercita sin creds (documentado).

## 7. ADR
- **ADR-014** — `RegistryStore` sobre **Upstash Redis (Vercel KV)**: `KvClient` abstracción, todo el registry bajo una clave, selección por env, `jsonStore` en dev.

## Nota
Cambio de infra de bajo riesgo; el dominio del registry y el contrato HTTP no cambian.
