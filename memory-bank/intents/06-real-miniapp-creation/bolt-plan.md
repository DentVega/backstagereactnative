# Intent 06 — Creación real de miniapps · BOLT PLAN

> Inception · Fecha: 2026-07-10

## Enfoque
El dominio del scaffolder ya existe (Intent 02). Esto es **cablear UI + seguridad +
activación**. 3 bolts: dos de construcción (verificables en local) + uno de operaciones
(requiere tu cuenta/secretos).

## Bolt 06-1 — Entrada + flujo de creación en la UI  *(Construcción)*
- Unit 1. Botón "＋ Crear miniapp" en catálogo + nav; `/create` con validación de id
  (formato del contrato) y estados (loading/done→links/error).
- Verifica: RTL de `CreateForm` (validación + estados) + render del botón. Sin tocar dominio.

## Bolt 06-2 — Guard de autorización  *(Construcción · seguridad)*
- Unit 2. `canScaffold(login, allowlist)` puro + aplicarlo en `POST /api/scaffold`
  (403 antes de crear, leyendo la sesión Auth.js). ADR nuevo (modelo de authz del scaffolder).
- Verifica: tests de `canScaffold` (permitido/denegado/allowlist vacía/case-insensitive) +
  test de ruta (403 sin tocar GitHub/registry; autorizado pasa con provider mock).

## Bolt 06-3 — Persistencia + Activación  *(Operations — requiere tu cuenta)*
- Unit 3. Provisionar Upstash KV → `getStore()` usa KV; migrar seed; setear secrets reales
  (`GITHUB_TOKEN`, `MINIAPP_TEMPLATE_REPO=DentVega/miniapp-template`, `SCAFFOLD_ALLOWED_LOGINS`,
  `PUBLISH_TOKEN`); redeploy; smoke E2E (crear→repo→catálogo→persiste; no-autorizado→403).
- Registrar en `memory-bank/operations/` + `activation-checklist.md`.

## Preguntas RN (respondidas)
- ¿Remote federado? **No.** ¿Parte del host bundle? **No.** ¿Módulos nativos? **No.**
  Todo es Backstage web + Ops.

## Riesgos
- **Abuso en demo pública** → mitigado por el guard (allowlist). Confirmar el modelo antes de 06-2.
- **KV**: sin provisionar, la creación no persiste (hoy jsonStore read-only). Es el corazón de 06-3.
- **Token**: PAT con scope `repo`; crea repos bajo DentVega. Nunca en código/logs.

## Orden sugerido
`/bolt-start 1` → `/bolt-start 2` → luego `/operations` (o `/bolt-start 3`) para la activación.
