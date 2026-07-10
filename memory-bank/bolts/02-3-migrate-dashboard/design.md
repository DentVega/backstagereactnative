# Bolt 02-3 — Migrar account-dashboard · Etapa 2: DESIGN

> DDD stage 2/5 · Estado: **Borrador** · Fecha: 2026-07-09

## 1. Repo nuevo `miniapp-account-dashboard` (sibling, git propio)
```
miniapp-account-dashboard/       (copia de miniapps/account-dashboard, standalone)
├── package.json                 name @org/account-dashboard · deps @org/miniapp-contract + @org/ui-kit (^0.1.0)
│                                + @tanstack/react-query, @shopify/flash-list (deps propias) + Re.Pack devDeps
├── .npmrc                       @org:registry (GitHub Packages)
├── rspack.config.mjs            MF v2 name "account_dashboard" · exposes "./Entry"  (sin cambios)
├── react-native.config.js · babel.config.cjs · jest.config.cjs · tsconfig.json
└── src/**                       dominio + componentes + Dashboard + Entry + 13 tests (SIN cambios de código)
```
- Container MF = **`account_dashboard`** (= id del manifest = remote del host). Nombre del repo = `miniapp-account-dashboard`.
- Deps `@org/*` en forma de **registry** (`^0.1.0`); verificación local por `file:` (restaurada).

## 2. Cambios en el monorepo móvil
- `pnpm-workspace.yaml`: quitar `- miniapps/*` (quedan `apps/*` + `packages/*`).
- **Borrar** `miniapps/account-dashboard/` (y el dir `miniapps/` si queda vacío).
- `pnpm install` para reconciliar el workspace.
- **Host: sin cambios de código.** `apps/host/rspack.config` mantiene el remote `account_dashboard` (URL default); el resolver usa la URL de Backstage (dev server de la miniapp `:9000`). Backstage seed ya apunta ahí.

## 3. Verificación (Test)
- **Móvil:** `pnpm -r typecheck` + `pnpm -r test` verdes **sin** `miniapps/*` (contract, ui-kit, host-runtime, host).
- **Repo nuevo:** instalar (@org por `file:` para verificar) → `jest` (13 tests) + compilar el remote (`webpack-bundle` → expone `./Entry`). Restaurar `@org` a `^0.1.0`; quitar lockfile de verificación.
- Coherencia host→resolve→URL externa (montaje real = entorno nativo, bloqueado aparte).

## 4. ADR
- **ADR-012** — Migración de account-dashboard a repo externo: consumo de `@org/*` por registry (verif. por `file:`), monorepo móvil sin `miniapps/*`, host consume por URL de Backstage.

## Nota
Refactor de bajo riesgo: el código no cambia; el criterio es "repo nuevo compila + 13 tests" y "móvil verde sin miniapps".
