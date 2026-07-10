# Unit 2 — Chunk storage (Blob) + upload autenticado

> Intent: 03-ci-cdn · Estado: Borrador · Fecha: 2026-07-09

## Propósito
La **recepción** en Backstage: recibir el build de una miniapp (autenticado), almacenar los chunks en **Vercel Blob** (CDN) y registrar la versión con su URL de CDN.

## Alcance
- **`ChunkStorage` (interfaz)** + impl **Vercel Blob**: `putMany(prefix, files) → { baseUrl }` (Blob público); `remove(prefix)` opcional. Aísla el proveedor.
- **`POST /api/miniapps/:id/upload`** (autenticado con `PUBLISH_TOKEN`):
  - Verifica `Authorization: Bearer <PUBLISH_TOKEN>` (env). Sin token → 401/403.
  - Body: **zip** del `build/` + `version` + `manifest`. Descomprime, sube todos los archivos a Blob bajo `<id>/<version>/`.
  - `publishVersion(reg, id, { version, url: <CDN>/<id>/<version>/<container>, manifest })` → guarda en el store.
  - Errores: 401/403 (token), 400 (zip/manifest/version inválidos), 404 (id no registrado), 409 (versión duplicada), 502 (Blob).
- `/api/resolve` devuelve la URL del CDN (Blob).

## Clasificación
- Web (Backstage). **Depende de Unit 1** (store) + registry (intent 01). La usa la CI (Unit 3).

## Dependencias
- Unit 1 (store KV) para persistir; reusa `publishVersion`.

## Stories
- S2.1 — `ChunkStorage` (interfaz) + impl Vercel Blob (`putMany` bajo prefijo) + mock.
- S2.2 — `POST /api/miniapps/:id/upload` autenticado (token) + descompresión zip + Blob + `publishVersion`.
- S2.3 — Auth middleware/util del token de servicio + mapeo de errores (401/403/400/409/502).

## Criterios de aceptación
- Upload con token válido + zip + manifest → chunks en Blob, versión registrada, `resolve` devuelve URL de CDN.
- Sin token / token inválido → 401/403; versión duplicada → 409.
- Tests: `ChunkStorage` (Blob mockeado) + endpoint (200/401/409) con store + Blob mockeados.
