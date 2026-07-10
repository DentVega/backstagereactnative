# Bolt 03-1 — Registry → Vercel KV · Etapa 1: MODEL

> DDD stage 1/5 · Estado: **Borrador** · Fecha: 2026-07-10 · Intent 03
> Código en `backstage-web` (Next.js) · Tests: Vitest. Stories: S1.1 kvStore · S1.2 seed · S1.3 tests

Bolt de infraestructura: el registry debe **persistir en serverless (Vercel)**. El JSON fs no persiste → nueva impl de `RegistryStore` sobre **KV (Upstash Redis)**, misma interfaz.

## 1. Lenguaje ubicuo
| Término | Definición |
|---|---|
| **RegistryStore** | Interfaz existente: `load(): Registry` / `save(reg)`. |
| **KV** | Almacenamiento key-value (Upstash Redis vía Vercel Marketplace). |
| **KvClient** | Abstracción mínima (`get`/`set`) sobre el KV → testeable con impl in-memory. |
| **Seed** | Cargar el catálogo actual (account_dashboard) al KV. |

## 2. Modelo (sin lógica nueva; adaptar persistencia)
```
interface KvClient { get(key): Promise<string|null>; set(key, value): Promise<void> }
kvStore(client: KvClient): RegistryStore
   load()  → JSON.parse(client.get("registry")) ?? {}
   save(r) → client.set("registry", JSON.stringify(r))
```
- **Decisión de modelado:** todo el `Registry` bajo **una clave** (`registry`) — igual granularidad que el JSON fs, cambio mínimo, sin tocar el dominio ni las rutas. (Per-id sería más escalable pero cambia la interfaz; se difiere.)
- **Selección por env:** `getStore()` → KV si hay credenciales KV en env; si no, `jsonStore` (dev). Las rutas usan `getStore()`.
- **Impl real:** `upstashClient()` usa `@upstash/redis` con `KV_REST_API_URL`/`KV_REST_API_TOKEN` (los inyecta la integración de Vercel). Solo se instancia si hay env.

## 3. Seed
- `seedRegistry(store)`: escribe el catálogo actual (account_dashboard, tomado de un fixture = el `registry.json` de hoy) al store. **Idempotente** (sobrescribe/mergea sin duplicar).
- Se ejecuta como script/route dev; en tests, contra el KV in-memory.

## 4. Verificación (no hay lógica de negocio)
- **Estructural/round-trip:** `kvStore(inMemoryKv)` → `save` luego `load` devuelve lo guardado; `load` vacío → `{}`.
- Las rutas existentes (resolve/publish/scaffold/catalog) siguen verdes usando `getStore()` (dev = jsonStore).
- Real KV/Upstash: no se prueba sin credenciales (solo mock); documentado.

## 5. Frontera
- Chunk storage (Blob) + upload → Bolt 2. Deploy a Vercel (provisión KV real) → Bolt 4.

## Preguntas para el checkpoint
1. **Granularidad:** todo el registry bajo **una clave** (mínimo cambio) vs. **una clave por miniapp** (más escalable, cambia la interfaz del store). Propongo **una clave** para el MVP. ¿OK?
2. **Cliente KV:** `@upstash/redis` (el KV actual de Vercel Marketplace) detrás de `KvClient`. ¿OK?
