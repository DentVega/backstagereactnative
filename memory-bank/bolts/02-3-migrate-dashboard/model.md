# Bolt 02-3 — Migrar account-dashboard · Etapa 1: MODEL

> DDD stage 1/5 · Estado: **Borrador** · Fecha: 2026-07-09 · Intent 02
> Stories: S3.1 crear repo · S3.2 compila+dev server+tests · S3.3 host consume externo

Bolt de **migración/refactor** (sin nueva lógica). Objetivo: `account-dashboard` deja de vivir en el monorepo móvil y pasa a **su propio repo**, consumiendo los `@org/*` **publicados** (no workspace). Demuestra el desacople real: el host monta una miniapp **externa**.

## 1. Lenguaje ubicuo
| Término | Definición |
|---|---|
| **Miniapp externa** | Miniapp en su propio repo, fuera del monorepo del host; el host la consume por **URL + contrato**. |
| **Migración** | Mover el código tal cual + cambiar el modo de consumo de deps (workspace → publicado). |
| **Desacople verificado** | El monorepo móvil ya **no contiene** `miniapps/*`; el host sigue verde y resuelve la miniapp por Backstage. |

## 2. Qué se mueve (invariante: el código no cambia)
- Todo `miniapps/account-dashboard/src/**` (dominio, componentes, Dashboard, Entry, data, tests) → repo nuevo, **sin cambios de código**.
- Config: `rspack.config.mjs`, `react-native.config.js`, `babel.config.cjs`, `jest.config.cjs`, `tsconfig.json`.
- **13 tests** (10 dominio + 3 Entry) se preservan y deben pasar en el repo nuevo.

## 3. Qué cambia (solo el "cómo se consume")
- `package.json`: `@org/miniapp-contract` + `@org/ui-kit` de **workspace** → **`^0.1.0`** (registry) + `.npmrc`. Standalone (no workspace).
- El container MF sigue siendo **`account_dashboard`** (= id del manifest = remote del host). El repo se llama `miniapp-account-dashboard`.

## 4. Qué pasa en el monorepo móvil
- **Quitar `miniapps/*`** de `pnpm-workspace.yaml` + **borrar** `miniapps/account-dashboard`.
- El host **no cambia de código**: su `rspack.config` ya declara el remote `account_dashboard` (URL default), y el resolver de ScriptManager usa la URL que Backstage resuelve (dev server de la miniapp, `:9000`).
- Backstage: el seed ya apunta a `http://localhost:9000/account_dashboard.container.js.bundle`.
- **Invariante:** host + workspace siguen verdes (tsc + tests) tras la migración.

## 5. Verificación (Test)
- En el repo nuevo: compila el remote (expone `./Entry`) + **13 tests** verdes (instalando `@org/*` por `file:` para verificar, restaurando a `^0.1.0`).
- En el móvil: `miniapps/*` fuera; `pnpm -r typecheck` + tests verdes.
- Coherencia host→resolve→URL externa (montaje real depende del entorno nativo, bloqueado aparte).

## 6. Frontera
- El scaffolder que genera estos repos → Bolt 4. Esta migración es "a mano" (la 1ª miniapp de referencia).

## Preguntas para el checkpoint
1. **Ubicación:** sibling `/Volumes/SSDExterno/prodproyects/miniapp-account-dashboard` + git init. ¿OK?
2. **Borrado en el monorepo:** ¿borro `miniapps/account-dashboard` del móvil tras copiarlo (migración limpia), o lo dejo también en el monorepo por ahora (duplicado temporal)? Propongo **borrarlo** (es el punto del desacople).
