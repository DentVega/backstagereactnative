# ADR-005 — Build dual de la miniapp (una fuente, dos entrypoints)

> Bolt: bolt-3-account-dashboard · Estado: **Aceptada** (checkpoint 2026-07-09)

## Contexto
Una miniapp debe consumirse de dos formas (requirement US-5): como **remote federado** (runtime, on-demand) y como **shared package** (build-time, importado). Sin drift entre ambas: una sola base de código.

## Decisión
Un único módulo fuente con **dos entrypoints declarados**:
- **Runtime (remote):** `rspack.config.mjs` con `ModuleFederationPluginV2({ name:"account_dashboard", exposes:{ "./Entry": "./src/Entry.tsx" } })`. Produce el container/chunk que el host descarga.
- **Build-time (paquete):** `package.json` `main`/`types` → `src/index.ts`, que reexporta `Entry` y `Dashboard`. Cualquier app del monorepo hace `import { Dashboard } from "@org/account-dashboard"`.

`src/Entry.tsx` es la **única** definición del componente de entrada; ambos modos apuntan a él (directa o reexportado). No se duplica lógica.

## Consecuencias
- (+) Sin drift: remote y paquete comparten el mismo `Entry`/`Dashboard`.
- (+) El paquete build-time permite preview/test standalone y consumo directo cuando federar es innecesario.
- (−) Dos configs de build que mantener alineadas (la lista `shared`/deps debe ser coherente con lo que el host provee).
- **Verificación (Test):** construir el **container remoto** (Re.Pack) y **resolver el import build-time** (`tsc`/jest desde otro paquete) — ambos deben pasar para cerrar S3.3.
