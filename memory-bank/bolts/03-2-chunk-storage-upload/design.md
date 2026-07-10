# Bolt 03-2 — Chunk storage + upload · Etapa 2: DESIGN

> DDD stage 2/5 · Estado: **Borrador** · Fecha: 2026-07-10 · Repo `backstage-web`

## 1. Estructura nueva
```
lib/storage/
├── types.ts      ChunkStorage + StorageFile + StorageError
├── blob.ts       blobStorage() — @vercel/blob put (public, addRandomSuffix:false)
└── mock.ts       mockStorage() — registra archivos, baseUrl ficticio
lib/auth.ts        requirePublishToken(req) + AuthError
app/api/miniapps/[id]/upload/route.ts   POST (multipart → unzip → Blob → publishVersion)
lib/http.ts        + AuthError→401, StorageError→502
+ tests (Vitest)
```

## 2. ChunkStorage
```ts
interface StorageFile { path: string; data: Uint8Array }
interface ChunkStorage { putMany(prefix: string, files: StorageFile[]): Promise<{ baseUrl: string }> }
```
- **blob.ts:** por cada file → `put(`${prefix}/${file.path}`, file.data, { access:'public', addRandomSuffix:false, token: BLOB_READ_WRITE_TOKEN })`. `baseUrl` = url del put menos `/${file.path}` (deterministas). Fallo → `StorageError`.
- **mock.ts:** guarda `{prefix, files}`; `baseUrl = "https://mock.blob/"+prefix`.

## 3. Endpoint `POST /api/miniapps/:id/upload`
```
1. requirePublishToken(req)                     // 401/403
2. form = await req.formData()
   file = form.get("file")  (zip)               // 400 si falta
   version = form.get("version"); manifest = JSON.parse(form.get("manifest"))
3. files = unzip(new Uint8Array(await file.arrayBuffer()))   // fflate unzipSync → StorageFile[]
4. { baseUrl } = storage.putMany(`${id}/${version}`, files)
5. url = `${baseUrl}/${id}.container.js.bundle`
6. reg = getStore().load(); next = publishVersion(reg, id, {version,url,manifest}); getStore().save(next)
7. 201 { id, version, url }
```
- `statusForError`: AuthError→401 · StorageError→502 · (400/404/409 ya del registry).
- El `ChunkStorage` se elige por env (blob si hay `BLOB_READ_WRITE_TOKEN`; mock/inyectable en test).

## 4. Auth
- `requirePublishToken(req)`: `Authorization: Bearer <t>` vs `process.env.PUBLISH_TOKEN`. Sin/ inválido → `AuthError` (401). Token nunca en logs.

## 5. Tests (Vitest)
- `storage.test.ts`: `blobStorage` con `@vercel/blob` **mockeado** (`vi.mock`) → putMany llama put N veces, baseUrl correcto; `mockStorage` registra.
- `upload-route.test.ts`: token válido + **zip real** (fflate `zipSync`) + manifest → storage mock + store mock → 201 con url; sin token → 401; versión duplicada → 409; zip faltante → 400.

## 6. ADR
- **ADR-015** — `ChunkStorage` (interfaz + Vercel Blob, layout `<id>/<version>/`, addRandomSuffix:false) + auth del upload con **token de servicio** (`PUBLISH_TOKEN`).

## Nota
Blob real requiere credenciales (deploy, Bolt 4); se verifica con mocks + zip real.
