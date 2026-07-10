# Bolt 02-3 — Migrar account-dashboard · RESULT

> Estado: **COMPLETO** · Fecha: 2026-07-09 · Intent 02 · Stories: S3.1–S3.3
> Repo nuevo: `/Volumes/SSDExterno/prodproyects/miniapp-account-dashboard` (git init).

## Qué se hizo
`account-dashboard` salió del monorepo móvil → **su propio repo**, consumiendo `@org/*` publicados (dist). El monorepo ya **no contiene `miniapps/*`**. El host consume la miniapp como **externa** (URL vía Backstage). Desacople real demostrado.

## Evidencia (verificado, no afirmado)
- **Repo nuevo `miniapp-account-dashboard`:**
  - Código migrado sin cambios (dominio, componentes, Dashboard, Entry, tests).
  - Deps `@org/*` en forma **registry** (`^0.1.0`) + `.npmrc`; deps propias (react-query, flash-list).
  - **13 tests verdes** (10 dominio + 3 Entry) — verificados instalando `@org/*` desde los **tarballs (dist)**, fiel a la forma publicada.
  - **Compila el remote:** `webpack-bundle` → `container entry (expose)` + `__federation_expose_Entry` + `mf-manifest.json` (58KB). Container = `account_dashboard`.
  - `jest.config` ajustado al layout **npm flat** (transformIgnorePatterns) + `@org` en el allowlist (dev consume ui-kit como fuente; registry = dist).
- **Monorepo móvil:**
  - `pnpm-workspace.yaml` sin `miniapps/*`; carpeta `miniapps/` **borrada**.
  - **Verde sin miniapps:** typecheck 4/4 · **61 tests** (contract 38 · ui-kit 5 · host-runtime 14 · host 4).
  - **Host sin cambios de código** (resuelve la URL externa vía Backstage; seed ya apunta a `:9000`).

## Cobertura de stories
- **S3.1 crear repo** ✓ — repo nuevo con el código migrado + deps registry + git init.
- **S3.2 compila + tests** ✓ — remote compila; 13 tests verdes.
- **S3.3 host externo** ✓ — `miniapps/*` fuera del workspace + borrado; host/workspace verdes; Backstage apunta a la URL externa.

## ADR
- ADR-012 — account-dashboard como miniapp externa (deps por registry, host consume por URL, monorepo sin miniapps).

## NO hecho / diferido (honesto)
- Publish real de `@org/*` (org placeholder) — verificado por tarballs; el install por registry corre tras publicar.
- Montaje real del remote en el host = entorno nativo (bloqueado, intent 01).
- Subir el repo a GitHub / CI automática (delta 5).
- `apps/host/@mf-types/account_dashboard/` (tipos federados generados) quedan como artefacto; inocuo.

## Siguiente
- **Bolt 02-4** (Scaffolder en Backstage) — cierra el MVP del Intent 02 (Create miniapp → genera repo desde el template).
