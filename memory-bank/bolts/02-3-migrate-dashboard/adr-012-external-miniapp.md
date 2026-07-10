# ADR-012 — account-dashboard como miniapp externa (fuera del monorepo)

> Bolt: 02-3-migrate-dashboard · Estado: **Aceptada** (checkpoint 2026-07-09)

## Contexto
En el intent 01, `account-dashboard` se puso DENTRO del monorepo móvil (`miniapps/account-dashboard`) por simplicidad del slice. La arquitectura real (three-plane, intent 02) exige que las miniapps vivan en **repos propios**, consumidas por el host solo por **URL + contrato**.

## Decisión
Migrar `account-dashboard` a un **repo git propio** (`miniapp-account-dashboard`):
- El **código no cambia**; solo el modo de consumo de deps: `@org/miniapp-contract` + `@org/ui-kit` pasan de **workspace** a **registry** (`^0.1.0`, GitHub Packages) + `.npmrc`.
- El container MF conserva el nombre **`account_dashboard`** (= id del manifest = remote declarado por el host), para no romper la resolución.
- El **monorepo móvil quita `miniapps/*`** de su workspace y borra la carpeta. El **host no cambia de código**: resuelve la URL vía Backstage (dev server de la miniapp) — desacople real.
- **Verificación local sin publish real:** instalar `@org/*` por `file:` a los paquetes del monorepo, correr tests + build, y **restaurar** a `^0.1.0` (forma committed).

## Consecuencias
- (+) Desacople real: el host ya no contiene ninguna miniapp; consume por contrato + URL.
- (+) La miniapp se desarrolla/despliega independiente (equipo dueño).
- (−) Sin publish real de `@org/*` (org placeholder), el install por registry no corre aún; se verifica por `file:`.
- (−) En dev, la miniapp se sirve por su dev server (:9000) y su URL se registra en Backstage a mano (CI automática = delta 5, intent 03).
- **Reversible:** el código es el mismo; volver al monorepo sería re-añadir `miniapps/*` (no se hará).
