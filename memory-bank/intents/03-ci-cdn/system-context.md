# System Context — Intent 03 (CI + CDN)

> Fase: **Inception** · Estado: **Borrador (esperando validación humana)** · Fecha: 2026-07-09

## 1. Flujo end-to-end (distribución automática)
```
  Repo MINIAPP (GitHub Actions CI)                Backstage (Vercel)                 Host (RN)
  ─────────────────────────────────              ──────────────────                 ─────────
  push/tag →                                                                          
   1. pnpm install (GitHub Packages)                                                  
   2. webpack-bundle → build/ (container + chunks)                                    
   3. POST /api/miniapps/:id/upload  ───────────►  auth: Bearer PUBLISH_TOKEN         
       (chunks + version + manifest)               4. ChunkStorage.put → Vercel Blob  
                                                    5. publishVersion(reg,{version,    
                                                       url=CDN, manifest}) → KV        
                                                                                       
                                                   GET /api/resolve?id  ◄──────────── resolve
                                                    → { url: CDN/<id>/<ver>/container }
                                                                        ─────────────► descarga
                                                                          desde el CDN (Blob)
                                                                        monta ./Entry
```

## 2. Backstage (Vercel) — piezas nuevas
- **`RegistryStore` → Vercel KV** (Redis/Upstash): reemplaza el JSON fs (no persiste en serverless). Misma interfaz `load()/save()` (o `get/set` por id).
- **`ChunkStorage` (interfaz) + impl Vercel Blob:** `put(path, data) → { url }` (Blob público); `remove` opcional. Aísla el proveedor.
- **`POST /api/miniapps/:id/upload`** (autenticado, `PUBLISH_TOKEN`): recibe los **archivos del build** (container + chunks) + `version` + `manifest` → `ChunkStorage.put` bajo `<id>/<version>/` → `publishVersion(reg, id, { version, url: <CDN>/<id>/<version>/<container>, manifest })`.
  - Un remote federado son **varios archivos** (container + vendor/expose chunks) que se referencian entre sí por URL relativa → se suben **todos** bajo el mismo prefijo versionado; la `url` publicada apunta al **container**.
- **`/api/resolve`** ya existe: ahora devuelve la **URL del CDN** (Blob) en vez de un dev server local.

## 3. Auth (token de servicio)
- `POST /api/miniapps/:id/upload` (y `/publish`) exigen `Authorization: Bearer ${PUBLISH_TOKEN}`; sin él → 401/403.
- `PUBLISH_TOKEN` = secret compartido entre Backstage (env) y la CI (secret del repo). `BLOB_READ_WRITE_TOKEN` solo en Backstage.

## 4. Miniapp CI (GitHub Actions)
- Workflow real (reemplaza el stub del template + en `miniapp-account-dashboard`):
  1. checkout + node + pnpm/npm install (`.npmrc` → GitHub Packages, token `read:packages`).
  2. `react-native webpack-bundle` → `build/`.
  3. subir `build/` a `POST /api/miniapps/:id/upload` (con `PUBLISH_TOKEN`, `version` del `package.json`/tag, `manifest.json`).
- Dispara en push a `main` / tag.

## 5. Deploy de Backstage a Vercel
- Proyecto Vercel; env: `BLOB_READ_WRITE_TOKEN`, `PUBLISH_TOKEN`, `KV_*` (Upstash). Store del registry en KV.
- Host: `BACKSTAGE_BASE_URL` env-aware (dev local vs URL de Vercel).

## 6. Placement / boundaries
| Elemento | Ubicación | Nota |
|---|---|---|
| CI (build+upload) | Repo de cada miniapp (GitHub Actions) | envía chunks a Backstage |
| Recepción + Blob + KV | Backstage (Vercel) | único punto; auth por token |
| Chunks (artefactos) | **Vercel Blob** (CDN, público) | `<id>/<version>/…` |
| Registry (metadatos) | **Vercel KV** | reemplaza JSON fs |
| Resolución + descarga | Host | URL de CDN |

## 7. Decisiones que van a ADR (Construction)
- **ADR** — `RegistryStore` sobre **Vercel KV** (migración desde JSON fs; misma interfaz).
- **ADR** — `ChunkStorage` (interfaz + impl **Vercel Blob**); layout `<id>/<version>/` y subida multi-archivo.
- **ADR** — Auth del upload/publish con **token de servicio** (`PUBLISH_TOKEN`).
- **ADR** — Deploy a Vercel (config, env, provisión de KV+Blob).

## 8. Riesgos / preguntas
- Subida multi-archivo (todo el `build/`) — tamaño y formato (zip vs múltiples requests). A definir en Design.
- Org de GitHub + proyecto Vercel (placeholders).
- Integridad de chunk (sha256) **diferida** — el chunk viaja sin verificación cripto (aceptado para el MVP).
