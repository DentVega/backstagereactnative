# Unit 4 — Deploy de Backstage a Vercel

> Intent: 03-ci-cdn · Estado: Borrador · Fecha: 2026-07-09

## Propósito
Que Backstage corra en **Vercel** con Blob + KV, para que el CDN y la persistencia funcionen en producción (hoy solo corre local).

## Alcance
- Config de deploy (Next.js en Vercel; `vercel.json`/`vercel.ts` si hace falta).
- **Provisión** de Vercel Blob (`BLOB_READ_WRITE_TOKEN`) y KV/Upstash (`KV_*`) vía el Marketplace de Vercel.
- **Env/secrets:** `BLOB_READ_WRITE_TOKEN`, `PUBLISH_TOKEN`, `KV_*` (y `MINIAPP_TEMPLATE_REPO`, `GITHUB_TOKEN` del scaffolder) por `vercel env`.
- Store del registry = **KV** en prod (Unit 1).
- Host: `BACKSTAGE_BASE_URL` env-aware apuntando al deploy de Vercel.
- Smoke post-deploy: `/catalog`, `/api/resolve`, `/api/miniapps/:id/upload` (auth).

## Clasificación
- Operations/infra (Backstage en Vercel). **Depende de Units 1 y 2.**

## Dependencias
- Unit 1 (KV), Unit 2 (Blob + upload). Requiere cuenta/proyecto Vercel + org.

## Stories
- S4.1 — Config de deploy + provisión de Blob + KV (Marketplace).
- S4.2 — Env/secrets vía `vercel env`; store = KV en prod.
- S4.3 — Deploy + smoke (catalog/resolve/upload); host apunta a la URL de Vercel.

## Criterios de aceptación
- Backstage desplegado en Vercel; `/catalog` y `/api/resolve` responden contra KV.
- `/api/miniapps/:id/upload` almacena en Blob y exige el token.
- (Requiere cuenta Vercel + org reales; sin eso, config lista + verificación por `vercel build`/dry-run documentada.)
