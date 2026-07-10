# Unit 3 — Migrar account-dashboard a su propio repo

> Intent: 02-miniapp-platform · Estado: Borrador · Fecha: 2026-07-09 · Delta 3

## Propósito
Sacar `account-dashboard` del monorepo móvil → su **propio repo git** (1ª miniapp real, alineada al template), demostrando que el host consume una miniapp **externa** por URL + contrato.

## Alcance
- Nuevo repo `miniapp-account-dashboard` con el código actual de `miniapps/account-dashboard` (dominio, pantalla, Entry, tests).
- `package.json` consume `@org/miniapp-contract` + `@org/ui-kit` **publicados** (ya no workspace).
- Compila el chunk y lo sirve con su **dev server** (puerto dedicado, p.ej. 9000).
- **Host:** el resolver/serving apunta a la URL externa (dev server de la miniapp); **quitar `miniapps/*`** del `pnpm-workspace.yaml` del móvil (queda vacío).
- Backstage: el seed/registro de `account_dashboard` apunta a la URL del nuevo dev server.
- Preservar los **13 tests** de la miniapp en su nuevo repo.

## Clasificación
- Repo miniapp (externo). Remote Re.Pack. **Depende de Units 1 y 2.**

## Dependencias
- Unit 1 (paquetes publicados), Unit 2 (template como referencia de estructura). El host (intent 01) ya resuelve/monta.

## Stories
- S3.1 — Crear `miniapp-account-dashboard` (mover código; deps a `@org/*` publicados; git init).
- S3.2 — Compila el remote + dev server sirve el chunk; tests (13) verdes en el nuevo repo.
- S3.3 — Host: quitar `miniapps/*` del workspace + apuntar resolve/seed a la URL externa; verificar (build + resolve en dev).

## Criterios de aceptación
- `miniapp-account-dashboard` compila su chunk fuera del monorepo y consume los `@org/*` publicados.
- El monorepo móvil ya **no contiene** `miniapps/*`; el host sigue verde (tsc + tests).
- Backstage resuelve `account_dashboard` a la URL externa; el flujo host→resolve→(chunk) es coherente (montaje real depende del entorno nativo).
- Los 13 tests de la miniapp pasan en su nuevo repo.
