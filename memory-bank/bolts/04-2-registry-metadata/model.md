# Bolt 04-2 — Registry metadatos · Etapa 1: MODEL

> DDD stage 1/5 · Estado: **Borrador** · Fecha: 2026-07-10 · Intent 04
> Backstage web · Tests: Vitest. Stories: S2.1 createdAt · S2.2 repoUrl+seed · S2.3 tests

Enriquecer el `MiniappRecord` para que la UI (Bolt 4) muestre **fecha de creación** y **link al repo**. Cambio de dominio pequeño, sin lógica nueva.

## 1. Lenguaje ubicuo
| Término | Definición |
|---|---|
| **createdAt** | Fecha (ISO) en que se registró la miniapp en el catálogo. |
| **repoUrl** | URL del repo git de la miniapp (lo devuelve el scaffolder). |
| **Compatibilidad** | Registros/seed viejos sin `createdAt` no deben romper (opcional / backfill). |

## 2. Modelo
```
MiniappRecord += {
  createdAt: string        // ISO; lo setea registerMiniapp
  repoUrl?: string         // opcional; lo setea el scaffolder
}
```
- `versions[].publishedAt` ya existe (última publicación / historial).
- `registerMiniapp(reg, {id,name,owner}, now)` → ahora recibe `now` (ISO) y setea `createdAt` (igual patrón que `publishVersion`, que ya recibe `now`).
- `scaffoldMiniapp` pasa el `repoUrl` (del GitProvider) al registrar.
- **Seed:** el fixture (account_dashboard) recibe un `createdAt`; `seedRegistry` backfillea `createdAt` si falta.

## 3. Impacto (acotado)
- Firma `registerMiniapp` gana `now: string` → actualizar 2 llamadas (route `/api/miniapps`, `scaffold.ts`) + los tests de `registry.test.ts`.
- `MiniappRecord` opcional-compatible: la UI/`listCatalog` tratan `createdAt`/`repoUrl` como posiblemente ausentes.

## 4. Verificación (Vitest)
- `registerMiniapp` setea `createdAt`; con `repoUrl` lo guarda.
- `scaffoldMiniapp` deja `repoUrl` en el record.
- `seedRegistry` deja `createdAt` en el fixture; un registro viejo sin `createdAt` no rompe.

## 5. Frontera
- Estado de CI (usa `repoUrl`/owner) → Bolt 3. UI que muestra los metadatos → Bolt 4.

## Preguntas para el checkpoint
1. **Firma de `registerMiniapp`:** añadir `now: string` (patrón de `publishVersion`, explícito/puro) vs. `createdAt` en el input. Propongo **`now`**. ¿OK?
2. **`repoUrl` en `registerMiniapp`** (opcional en el input) o solo lo setea `scaffoldMiniapp` tras crear el repo. Propongo **opcional en registerMiniapp** (así register directo también puede llevarlo). ¿OK?
