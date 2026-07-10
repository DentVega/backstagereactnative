# Bolt 06-1 — Entrada + flujo de creación en la UI · OUTCOME

> Intent 06 · Repo `backstage-web` · Fecha: 2026-07-10 · Estado: **Hecho ✅**

## Qué se construyó
Hizo alcanzable y claro el flujo de creación (el scaffolder ya existía):
- **Botón "＋ Crear miniapp"** en el catálogo (`page-head-row` con el título) → `/create`.
- **`CreateForm`** mejorado:
  - Validación en cliente del `id` con `parseMiniappId` del contrato (misma regla que el server):
    `aria-invalid`, hint de formato, y **submit bloqueado** si el id es inválido (no pega al API).
  - Estado `done` guarda el `id` → muestra link al **repo** + link al **detalle** `/miniapp/<id>`.
- `.field-hint` + `.page-head-row` en el design system.

## Decisión
- Reusar `parseMiniappId` (contrato) en cliente → cliente y servidor validan idéntico. Sin ADR nuevo.

## Verificación
- Vitest: **104 passed** (17 files) — antes 102 (+2): id inválido bloquea submit sin llamar al API;
  éxito enlaza a `/miniapp/<id>`. Los 2 tests previos siguen verdes.
- `tsc`: limpio · `next build`: OK.

## Siguiente
- Bolt 06-2 — Guard de autorización (`canScaffold` + 403 en `/api/scaffold`).
