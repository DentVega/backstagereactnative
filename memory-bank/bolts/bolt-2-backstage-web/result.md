# Bolt 2 — Backstage Web · RESULT

> Estado: **COMPLETO** · Fecha: 2026-07-09 · Stories: S4.1–S4.3
> ⚠️ Código en **repo SEPARADO** `/Volumes/SSDExterno/prodproyects/backstage-web` (git propio).

## Qué se construyó
El "Spotify for miniapps": Next.js 16 (App Router) con registry (register/publish/resolve) + catálogo, en un **repo git separado**, consumiendo `@org/miniapp-contract` vía `file:` (dev).

```
backstage-web/               (repo separado, Next.js 16 + React 19)
├── lib/registry/            dominio PURO: types · registry · store (JSON fs) · http mapper
├── app/api/
│   ├── miniapps/route.ts               POST register · GET list
│   ├── miniapps/[id]/publish/route.ts  POST publish
│   └── resolve/route.ts                GET resolve
├── app/catalog/page.tsx + components/CatalogList.tsx
└── data/registry.json       sembrado con account_dashboard (Bolt 3)
```

## Evidencia (verificado, no afirmado)
- **Tests (Vitest):** **26 passing** en 3 archivos — dominio registry (register/publish/resolve/selectLatest/listCatalog, con errores tipados), Route Handlers (201/400/404/409), CatalogList (RTL).
- **Typecheck:** `tsc --noEmit` verde.
- **Build Next.js:** "Compiled successfully"; rutas `/`, `/catalog`, `/api/miniapps`, `/api/miniapps/[id]/publish`, `/api/resolve`.
- **Runtime end-to-end (server real, `next start`):**
  - `GET /api/resolve?id=account_dashboard` → **200** con `ResolveResponse` completo (manifest real del Bolt 3).
  - `GET /api/resolve?id=ghost` → **404**; con `range=^0.1.0` → **200**.
  - `POST /api/miniapps` (payments) → **201**; `GET /api/miniapps` lista ambas.
  - `GET /catalog` → **200**.

## Cobertura de stories
- **S4.1 Registry** ✓ — register + publish (valida manifest con `isManifest`, semver, coherencia id/version, duplicados), store JSON. Tests API.
- **S4.2 Resolve** ✓ — `GET /api/resolve` devuelve `ResolveResponse` del contrato; selección última/exacta/por rango; 404/409 tipados. Verificado en server real.
- **S4.3 Catálogo** ✓ — `/catalog` + `CatalogList` (test RTL + estado vacío).

## ADRs
- ADR-006 Stack (Next.js App Router + JSON store + contrato `file:` en dev).
- ADR-007 Testing web (Vitest + RTL) — las skills de test RN no aplican a este repo.

## Decisiones/hallazgos
- **Contrato vía `file:`**: requiere `pnpm --filter @org/miniapp-contract build` antes de `pnpm install` en Backstage (consume `dist`). Documentado en el README del repo.
- **agent-device NO aplica** (web): la verificación "de sistema" fue el server real + curl. La verificación end-to-end host↔Backstage (el host resolviendo de verdad) es de **Bolt 4**.
- El `git init` del repo separado se hizo; **no se creó commit** (no solicitado).

## NO hecho / diferido (honesto)
- **Sin auth** en los endpoints (MVP) — deuda para Operations.
- **JSON fs no concurrente/transaccional** — migrar a DB antes de multiusuario real.
- **Publicación real del contrato** a GitHub Packages (hoy `file:`) — paso de CI.
- **Hosting real de artefactos/CDN** — la `url` del seed apunta a `localhost:8081` (dev server); CDN en Operations.
- **Integración real host↔Backstage** (el host montando el remote resuelto) → **Bolt 4**.

## Siguiente
- **Bolt 4** — integración: host resuelve `account_dashboard` contra este `/api/resolve`, descarga el chunk, verifica, monta con capabilities, fallback, y **verificación en dispositivo (Layer 2)**. Cierra el slice end-to-end.
