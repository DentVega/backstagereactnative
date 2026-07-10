# Bolt 03-2 — Chunk storage + upload · RESULT

> Estado: **COMPLETO** · Fecha: 2026-07-10 · Intent 03 · Stories: S2.1–S2.3
> Código en `backstage-web`.

## Qué se construyó
La **recepción** de la plataforma: un endpoint autenticado que recibe el build de una miniapp (zip), almacena los chunks en **Vercel Blob** y publica la versión con su URL de CDN.

```
lib/storage/{types,blob,mock,index}.ts   ChunkStorage + Vercel Blob + mock + getStorage()
lib/auth.ts                              requirePublishToken + AuthError
app/api/miniapps/[id]/upload/route.ts    POST (multipart → fflate unzip → Blob → publishVersion)
lib/http.ts                              + AuthError→401, StorageError→502
```

## Evidencia (verificado, no afirmado)
- **Tests (Vitest):** **48 passing** (42 previos + 6 nuevos: storage 2 · upload 4).
  - `blobStorage` (`@vercel/blob` mockeado): sube N archivos bajo el prefijo, deriva baseUrl.
  - upload (env node, zip real con fflate): 201 con `url` de CDN + versión publicada · 401 sin/mal token · 400 sin file · 409 versión duplicada.
- **Typecheck** limpio · **Build Next.js** compila (ruta `/api/miniapps/[id]/upload`).
- **Runtime (server real):** upload sin token / token malo → **401**.

## Cobertura de stories
- **S2.1 ChunkStorage** ✓ — interfaz + impl Vercel Blob (`putMany` bajo `<id>/<version>/`, addRandomSuffix:false) + mock + `getStorage()`.
- **S2.2 upload** ✓ — `POST /api/miniapps/:id/upload` multipart → unzip (fflate) → Blob → `publishVersion(url=CDN)`; errores 401/400/404/409/502.
- **S2.3 auth** ✓ — `requirePublishToken` (Bearer vs `PUBLISH_TOKEN`); token nunca en logs.

## ADR
- ADR-015 — ChunkStorage (Vercel Blob) + upload autenticado por token de servicio.

## Hallazgo (Test)
- El roundtrip binario `Blob→multipart→File` se corrompe bajo el entorno **jsdom** de vitest → el test de upload usa `// @vitest-environment node` (undici, binario-seguro). En runtime real (Node) no hay problema.
- `@vercel/blob put` no acepta `Uint8Array` directo → se envuelve en `Buffer.from`.

## NO hecho / diferido (honesto)
- **Blob real no ejercitado:** requiere `BLOB_READ_WRITE_TOKEN` (deploy, Bolt 4) → verificado con mock + zip real.
- Integridad criptográfica del chunk (sha256/firma) diferida (ADR-008/ADR-015).
- `publicPath` del host para chunks servidos desde CDN — ajuste menor en el wiring del host si hace falta (intent 01).

## Siguiente
- **Bolt 03-3** (Miniapp CI) — el emisor: build → zip → `POST /upload`. O **Bolt 03-4** (Deploy Vercel).
