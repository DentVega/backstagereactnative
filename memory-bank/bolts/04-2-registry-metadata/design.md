# Bolt 04-2 — Registry metadatos · Etapa 2: DESIGN

> DDD stage 2/5 · Estado: **Borrador** · Fecha: 2026-07-10 · Repo `backstage-web`

## 1. Cambios
```
lib/registry/types.ts     MiniappRecord += createdAt: string · repoUrl?: string
lib/registry/registry.ts  registerMiniapp(reg, {id,name,owner,repoUrl?}, now) → setea createdAt + repoUrl
lib/scaffold.ts           registerMiniapp(reg, {...,repoUrl}, now) tras createFromTemplate
app/api/miniapps/route.ts registerMiniapp(reg, {...}, new Date().toISOString())
lib/registry/seed.ts      fixture con createdAt; seedRegistry backfillea createdAt si falta
lib/registry/__tests__/registry.test.ts   añadir `now` a las llamadas + asserts
```

## 2. Firma
```ts
registerMiniapp(
  reg: Registry,
  input: { id: string; name: string; owner: string; repoUrl?: string },
  now: string,
): Registry
// record: { id, name, owner, versions: [], createdAt: now, repoUrl? }
```

## 3. Compatibilidad
- `createdAt` requerido en records nuevos; registros viejos sin él → tratado como opcional aguas abajo (UI/listCatalog). `seedRegistry` backfillea `createdAt` a los del seed si falta.
- `repoUrl` opcional siempre.

## 4. Verificación (Vitest)
- `registerMiniapp` con `now` → `createdAt` seteado; con `repoUrl` → guardado.
- `scaffoldMiniapp` → record con `repoUrl`.
- `seedRegistry` → fixture con `createdAt`; record viejo sin createdAt no rompe.
- Suite Backstage verde (tests de registry/scaffold actualizados).

## 5. ADR
- **ADR-019** — Extender `MiniappRecord` (`createdAt`, `repoUrl`) con `now` explícito y compatibilidad hacia atrás.
