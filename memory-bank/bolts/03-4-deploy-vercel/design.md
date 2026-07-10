# Bolt 03-4 — Deploy Vercel · Etapa 2: DESIGN

> DDD stage 2/5 · Estado: **Borrador** · Fecha: 2026-07-10

## 1. Piezas
```
backstage-web/
├── app/api/seed/route.ts   (nuevo) POST /api/seed (auth PUBLISH_TOKEN) → seedRegistry(getStore())
└── README/DEPLOY.md         runbook de deploy a Vercel (manual)
apps/host/
├── rspack.config.mjs        + DefinePlugin: __BACKSTAGE_URL__ desde process.env.BACKSTAGE_URL
├── src/globals.d.ts         (nuevo) declare const __BACKSTAGE_URL__
└── src/hostProvided.ts       BACKSTAGE_BASE_URL = __BACKSTAGE_URL__ (fallback localhost)
memory-bank/operations/activation-checklist.md   + pasos del deploy Vercel
```

## 2. Ruta de seed (`POST /api/seed`)
- Autenticada con `requirePublishToken` (reusa Bolt 2). Llama `seedRegistry(getStore())` → carga el catálogo (account_dashboard) a KV una vez tras el deploy.
- 200 `{ seeded: true }` / 401 sin token.

## 3. Host env-aware
- `rspack.config.mjs`: `new rspack.DefinePlugin({ __BACKSTAGE_URL__: JSON.stringify(process.env.BACKSTAGE_URL ?? 'http://localhost:3999') })`.
- `globals.d.ts`: `declare const __BACKSTAGE_URL__: string | undefined;`
- `hostProvided.ts`: `BACKSTAGE_BASE_URL = typeof __BACKSTAGE_URL__ !== 'undefined' ? __BACKSTAGE_URL__ : 'http://localhost:3999'` (seguro en jest).

## 4. Deploy (config)
- Next.js en Vercel = **zero-config** (framework autodetectado). Sin `vercel.json` salvo necesidad.
- **Provisión (Marketplace):** Vercel Blob + Upstash Redis (KV) → inyectan `BLOB_READ_WRITE_TOKEN` y `KV_REST_API_URL/TOKEN`.
- **Env manual (`vercel env`):** `PUBLISH_TOKEN`, `GITHUB_TOKEN`, `MINIAPP_TEMPLATE_REPO`, `BACKSTAGE_PUBLIC_URL` (= la URL del deploy).
- `getStore()` usa KV (hay creds); `getStorage()` usa Blob (hay token) — automático por env.

## 5. Runbook (manual, activation-checklist)
```
1. cd backstage-web && npm i -g vercel && vercel login
2. vercel link  (crear/enlazar proyecto)
3. Marketplace: añadir Blob + Upstash Redis (KV) al proyecto → setea BLOB_/KV_ envs
4. vercel env add PUBLISH_TOKEN / GITHUB_TOKEN / MINIAPP_TEMPLATE_REPO / BACKSTAGE_PUBLIC_URL
5. vercel deploy --prod
6. seed: curl -X POST $URL/api/seed -H "authorization: Bearer $PUBLISH_TOKEN"
7. smoke: GET /catalog, GET /api/resolve?id=account_dashboard, POST /upload (401 sin token)
8. host: build con BACKSTAGE_URL=$URL
```

## 6. Verificación (agente)
- `pnpm build` de Backstage (con la ruta seed) verde; 48 tests + seed route test.
- Host: typecheck + tests verdes con el DefinePlugin/globals.
- Deploy real + smoke = **manual** (documentado); el agente no tiene cuenta Vercel.

## 7. ADR
- **ADR-017** — Deploy prep a Vercel: zero-config + Blob/KV por Marketplace, ruta admin de seed (token), host env-aware por DefinePlugin, deploy manual documentado.

## Nota
El flujo end-to-end ya está probado local (Bolts 1-3); este bolt lo lleva a Vercel + documenta lo manual.
