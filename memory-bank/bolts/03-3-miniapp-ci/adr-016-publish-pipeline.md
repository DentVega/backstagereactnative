# ADR-016 — Publish pipeline (GitHub Actions) + publish.mjs reutilizable + fsStorage de dev

> Bolt: 03-3-miniapp-ci · Estado: **Aceptada** (checkpoint 2026-07-10)

## Contexto
Cada miniapp debe publicar su chunk a Backstage automáticamente en CI, sin duplicar lógica en cada `ci.yml`, y debe poder verificarse localmente sin Vercel Blob.

## Decisión
- **CI = GitHub Actions** (`ci.yml`): install (GitHub Packages) → `webpack-bundle` → `zip` del `build/` (sin prefijo) → `node scripts/publish.mjs`.
- **`scripts/publish.mjs` reutilizable** (en cada miniapp): lee `manifest.json` (id) + `package.json` (version), arma el multipart y hace `POST ${BACKSTAGE_URL}/api/miniapps/<id>/upload` con `Bearer ${PUBLISH_TOKEN}`. Sin deps nuevas (Node 20: fetch/FormData/Blob/fs). El **zip lo hace el workflow** (evita añadir una lib de zip a las miniapps).
- **`fsStorage` de dev en Backstage:** `getStorage()` cae a fs (escribe a `public/chunks/`, URL local) cuando falta `BLOB_READ_WRITE_TOKEN` → permite el **e2e local** del pipeline sin Blob. Blob real = prod (Bolt 4).
- Secrets por repo (`PUBLISH_TOKEN`, `BACKSTAGE_URL`, GitHub Packages), nunca en el YAML.

## Consecuencias
- (+) Un solo lugar para la lógica de upload (`publish.mjs`); el template lo hereda y cada miniapp lo tiene igual.
- (+) Verificación **end-to-end real localmente** (build→zip→upload→resolve) sin cuenta cloud.
- (+) `zip` en el runner (ubuntu lo trae) evita dependencias extra en las miniapps.
- (−) `fsStorage` es **solo dev** (serverless no persiste fs) — no confundir con el storage de prod (Blob).
- (−) El run real en GitHub Actions requiere org + deploy + secrets (Bolt 4); en este bolt se verifica local + YAML válido.
- (−) El workflow del template usa placeholders (`__MINIAPP_ID__`) → se personaliza con el init (ADR-011).
