# Unit 3 — Miniapp "Account Dashboard" (remote federado, build dual)

> Intent: 01-vertical-slice · Estado: Borrador · Fecha: 2026-07-09

## Propósito
Primera miniapp de referencia: pantalla de **resumen de cuentas** (saldos + movimientos) que valida el pipeline de federación y el **consumo dual** (remote y shared package).

## Alcance
- `miniapps/account-dashboard` con `expose: "./Entry"` (contrato de Unit 1).
- UI: header de saldo + lista de movimientos con **FlashList**, usando `ui-kit`. Datos **mock**.
- Dominio: formato de saldos/movimientos (funciones puras, testeable).
- **Build dual:** (a) container remote MF; (b) shared package `@org/account-dashboard` importable en build-time.
- `shared` declarado como singleton (subconjunto compatible del host).

## Clasificación
- **Remote federado**, **solo-JS**, **sin módulos nativos** (confirmado).
- Consumido on-demand por el host (Unit 2) y publicado vía Backstage (Unit 4).

## Dependencias
- Requiere **Unit 1** (contract, ui-kit). Se monta con **Unit 2** (loader). Se publica con **Unit 4**.

## Stories
- S3.1 — Dominio: modelo + formato de cuentas/movimientos (unit tests).
- S3.2 — Pantalla Dashboard (FlashList + ui-kit) con datos mock + entry `./Entry` (test RNTL).
- S3.3 — Build dual: config remote MF **y** empaquetado como shared package.

## Criterios de aceptación
- La miniapp construye como **remote** (chunk cargable) y como **shared package**.
- Dashboard renderiza saldos + movimientos a 60 FPS con FlashList.
- ≥1 test RNTL de la pantalla; unit tests del dominio.
- Sin PII/secretos en el bundle; respeta contrato de capabilities.
