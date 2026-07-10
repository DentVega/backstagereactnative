# Bolt 03-3 — Miniapp CI · Etapa 1: MODEL

> DDD stage 1/5 · Estado: **Borrador** · Fecha: 2026-07-10 · Intent 03
> CI/YAML (skill `github-actions`) · No RNTL/agent-device. Stories: S3.1 build · S3.2 upload · S3.3 aplicar

El **emisor**: cada repo de miniapp buildea su chunk y lo publica a Backstage al hacer push/tag, sin pasos manuales.

## 1. Lenguaje ubicuo
| Término | Definición |
|---|---|
| **Publish pipeline** | Workflow de GitHub Actions: install → build → zip → upload. |
| **Build artifact** | El `build/` de Re.Pack (container + chunks). |
| **Publish script** | Paso reutilizable que zippea `build/` y hace `POST /upload` (para no duplicar lógica en cada YAML). |
| **Secrets** | `PUBLISH_TOKEN`, `BACKSTAGE_URL`, token de GitHub Packages (por repo). |

## 2. Pipeline (dominio del workflow)
```
on: push(main) / tag(v*)
  1. checkout + setup-node(20) + install pnpm
  2. install deps  (.npmrc → GitHub Packages, GITHUB_TOKEN read:packages)
  3. build chunk   (react-native webpack-bundle → build/)
  4. publish       (zip build/ → POST ${BACKSTAGE_URL}/api/miniapps/<id>/upload
                    Authorization: Bearer ${PUBLISH_TOKEN}, form: file, version, manifest)
```
- **id/version:** `id` del `manifest.json`; `version` del `package.json` (o el tag).
- **Reutilizable:** el paso 4 se encapsula en un `scripts/publish.mjs` (Node) que el YAML invoca → misma lógica en template y en cada miniapp.

## 3. Verificación (local, honesta)
- **YAML válido** (parse).
- **E2E local del pipeline** (sin GitHub/cloud): build del chunk de `miniapp-account-dashboard` → `publish.mjs` → Backstage local (con `PUBLISH_TOKEN`) → versión publicada → `/api/resolve` devuelve la URL.
- Para que el upload complete **sin Vercel Blob**, se añade un **`fsStorage` de dev** (getStorage cae a fs si no hay `BLOB_READ_WRITE_TOKEN`): escribe los chunks a `public/chunks/<id>/<version>/` y devuelve una URL local. Es un enabler de dev (Blob real = prod, Bolt 4).

## 4. Frontera
- Deploy real de Backstage a Vercel (Blob real, secrets en prod) → Bolt 4.
- El endpoint `/upload` ya existe (Bolt 2).

## Preguntas para el checkpoint
1. **Lógica del upload:** ¿la encapsulo en un **`scripts/publish.mjs`** reutilizable (recomendado, un solo lugar) o la escribo inline en cada `ci.yml`?
2. **`fsStorage` de dev:** para poder verificar el flujo end-to-end **localmente** sin Vercel Blob, propongo un storage fs de dev (getStorage cae a fs sin token de Blob), sirviendo chunks desde `public/`. ¿OK, o dejamos el upload real solo para el deploy (Bolt 4) y aquí verifico el pipeline de forma estructural?
3. **Gestor en CI:** pnpm (consistente con el repo). ¿OK?
