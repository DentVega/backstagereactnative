# ADR-006 — Stack de Backstage: Next.js App Router + JSON store + contrato file:

> Bolt: bolt-2-backstage-web · Estado: **Aceptada** (checkpoint 2026-07-09)

## Contexto
Backstage (repo separado) necesita: API para registrar/publicar/resolver miniapps, una UI de catálogo, y consumir el contrato compartido. MVP: rápido y sin infra pesada.

## Decisión
- **Next.js (App Router)** con **Route Handlers** para la API (Node runtime por el acceso a fs).
- **Store = JSON en fs** (`data/registry.json`) detrás de una interfaz `RegistryStore` inyectable.
- **Contrato** consumido vía **`file:`** apuntando a `packages/miniapp-contract` del monorepo móvil en **dev**; en **prod** = GitHub Packages (ADR-002). Requiere `pnpm build` del contrato (usa `dist`).

## Consecuencias
- (+) Cero infra de DB; store swappable a SQLite/Postgres después sin tocar el dominio puro.
- (+) La lógica de registry es pura y testeable sin Next ni fs.
- (−) `file:` acopla el dev de Backstage a la ruta local del monorepo; se elimina al publicar el contrato de verdad (CI).
- (−) JSON fs no es concurrente/transaccional — aceptable para MVP; migrar antes de multiusuario real (deuda registrada).
- **Acción:** documentar el paso `build del contrato` antes de `pnpm install` en Backstage.
