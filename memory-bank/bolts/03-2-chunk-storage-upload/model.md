# Bolt 03-2 — Chunk storage + upload · Etapa 1: MODEL

> DDD stage 1/5 · Estado: **Borrador** · Fecha: 2026-07-10 · Intent 03
> Código en `backstage-web` · Tests: Vitest. Stories: S2.1 ChunkStorage · S2.2 upload · S2.3 auth

La **recepción** de la plataforma: recibir el build de una miniapp (autenticado), almacenar sus chunks en **Vercel Blob** (CDN) y registrar la versión con su URL de CDN.

## 1. Lenguaje ubicuo
| Término | Definición |
|---|---|
| **Chunk / build** | Salida de Re.Pack de una miniapp: **varios archivos** (container + vendor/expose chunks) que se referencian entre sí. |
| **ChunkStorage** | Abstracción para subir/servir los archivos del build (impl Vercel Blob). |
| **Prefix versionado** | `<id>/<version>/` — todos los archivos del build bajo el mismo prefijo. |
| **Upload** | Endpoint autenticado que recibe el build (zip) + version + manifest, lo almacena y publica. |
| **PUBLISH_TOKEN** | Token de servicio (env) que la CI presenta para publicar. |

## 2. Modelo
```
interface StorageFile { path: string; data: Uint8Array }
interface ChunkStorage {
  putMany(prefix: string, files: StorageFile[]): Promise<{ baseUrl: string }>
}
```
- **Impl Vercel Blob:** sube cada archivo a `prefix/<path>` con `access:'public'` y **`addRandomSuffix:false`** → rutas deterministas; `baseUrl` = URL base de `prefix/`.
- **container URL** = `${baseUrl}/${id}.container.js.bundle` (convención del rspack.config del template).
- **Relatividad:** los chunks del container se referencian bajo `baseUrl`; el host fija el `publicPath`/base al montar (wiring del host = Bolt 4 del intent 01 ya tiene el resolver; ajuste de publicPath si hace falta).

## 3. Flujo del upload (S2.2)
```
POST /api/miniapps/:id/upload   (auth: Bearer PUBLISH_TOKEN)
  1. requirePublishToken(req)                      // sin/ inválido → 401/403
  2. body: zip(build/) + version + manifest         // desde form-data / headers
  3. files = unzip(zip)                             // fflate
  4. { baseUrl } = ChunkStorage.putMany(`${id}/${version}`, files)
  5. url = `${baseUrl}/${id}.container.js.bundle`
  6. publishVersion(reg, id, { version, url, manifest }) → getStore().save
  7. 201 { id, version, url }
```
- Errores: 401/403 (token), 400 (zip/manifest/version inválidos), 404 (id no registrado), 409 (versión duplicada), 502 (Blob).

## 4. Auth (S2.3)
- `requirePublishToken(req)`: compara `Authorization: Bearer <token>` con `process.env.PUBLISH_TOKEN`. Falla → `AuthError` (401). Token nunca en logs.

## 5. Verificación
- `ChunkStorage` (Blob **mockeado** — `@vercel/blob put` stubbeado) → putMany sube N archivos bajo el prefijo, devuelve baseUrl.
- Endpoint: con token + un **zip real** (creado en test con fflate) + manifest → sube (storage mockeado) + `publishVersion` + 201; sin token → 401; versión duplicada → 409.
- Blob real: no se ejercita sin credenciales (deploy, Bolt 4).

## 6. Frontera
- La CI que construye + sube → Bolt 3. Deploy real (Blob provisionado) → Bolt 4.
- El montaje/publicPath en el host → intent 01 (Bolt 4), ajuste menor si el CDN lo requiere.

## Preguntas para el checkpoint
1. **Formato del body:** propongo **multipart/form-data** (`file`=zip, campos `version`, `manifest`) — estándar para subir binarios. ¿OK, o prefieres zip crudo + headers?
2. **Lib de unzip:** `fflate` (ligero, sin nativos, sirve en serverless). ¿OK?
3. **Blob:** `@vercel/blob` con `addRandomSuffix:false` (rutas deterministas). ¿OK?
