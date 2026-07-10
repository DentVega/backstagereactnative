# ADR-015 — ChunkStorage (Vercel Blob) + upload autenticado por token de servicio

> Bolt: 03-2-chunk-storage-upload · Estado: **Aceptada** (checkpoint 2026-07-10)

## Contexto
Los chunks de una miniapp (varios archivos) deben almacenarse en un CDN y publicarse a Backstage de forma autenticada, para que el host los descargue por URL. Decidido (intent 03): CDN = Vercel Blob; auth = token de servicio.

## Decisión
- **`ChunkStorage` (interfaz):** `putMany(prefix, files) → { baseUrl }`. Aísla el proveedor.
  - Impl **`blobStorage`** con `@vercel/blob` (`put`, `access:'public'`, **`addRandomSuffix:false`** para rutas deterministas bajo `<id>/<version>/`).
  - `mockStorage` para tests.
- **Endpoint `POST /api/miniapps/:id/upload`:** multipart (`file`=zip del build, `version`, `manifest`) → `fflate` unzip → `putMany` → `publishVersion(url = baseUrl/<id>.container.js.bundle)`.
- **Auth = token de servicio:** `requirePublishToken` compara `Authorization: Bearer` con `process.env.PUBLISH_TOKEN`. Sin token válido → `AuthError` (401). `BLOB_READ_WRITE_TOKEN` y `PUBLISH_TOKEN` por env, nunca en código/logs.

## Consecuencias
- (+) La CI publica con un solo secret; Backstage es el único punto de subida (centralizado).
- (+) Testeable sin Blob real (mock + zip real con fflate).
- (−) `addRandomSuffix:false` → sobrescribe si se re-sube la misma versión; el registry rechaza versión duplicada (409) antes, así que ok. Para re-publicar hay que subir versión.
- (−) Token de servicio (secret compartido) — menos robusto que OIDC (diferido a intent 04); rotación manual.
- (−) Blob real solo se ejercita con credenciales (deploy, Bolt 4).
- **Integridad:** el chunk viaja sin verificación criptográfica (sha256/firma diferida, ADR-008).
