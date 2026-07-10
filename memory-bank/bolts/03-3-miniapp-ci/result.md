# Bolt 03-3 — Miniapp CI · RESULT

> Estado: **COMPLETO** · Fecha: 2026-07-10 · Intent 03 · Stories: S3.1–S3.3
> Código en `miniapp-template`, `miniapp-account-dashboard` y `backstage-web` (fsStorage de dev).

## Qué se construyó
El **emisor** del flujo: cada miniapp buildea su chunk y lo publica a Backstage vía GitHub Actions, con lógica reutilizable.

```
miniapp-template/ y miniapp-account-dashboard/
├── scripts/publish.mjs          zip → POST /api/miniapps/<id>/upload (Bearer PUBLISH_TOKEN). Sin deps nuevas.
└── .github/workflows/ci.yml     install (GitHub Packages) → webpack-bundle → zip → node publish.mjs
miniapp-account-dashboard/manifest.json   (nuevo) id/version/entry/shared/capabilities
backstage-web/lib/storage/fs.ts + index.ts   fsStorage de dev (getStorage cae a fs sin BLOB token)
```

## Evidencia (verificado, no afirmado)
- **E2E LOCAL REAL del pipeline** (sin cloud): con Backstage local (`PUBLISH_TOKEN=secret`, sin BLOB → fsStorage):
  1. `webpack-bundle` de account-dashboard → `build/` (container + chunks).
  2. `zip -r build.zip .`.
  3. `node scripts/publish.mjs build.zip` → **HTTP 201** `published account_dashboard@0.2.0`.
  4. `getStorage()=fsStorage` **escribió el chunk** (1.5M) a `public/chunks/account_dashboard/0.2.0/`.
  5. `GET /api/resolve?id=account_dashboard` → devuelve la **nueva versión 0.2.0** + URL.
- **YAML** de los workflows estructuralmente válido (parse básico).
- **Backstage:** 48 tests siguen verdes; getStorage con fallback fs no rompe nada.

## Cobertura de stories
- **S3.1 build** ✓ — workflow: install + `webpack-bundle` → `build/`.
- **S3.2 upload** ✓ — `zip` + `publish.mjs` (reutilizable) → `POST /upload` autenticado; verificado e2e local.
- **S3.3 aplicar** ✓ — `ci.yml` real + `publish.mjs` en **template** (placeholders) y en **account-dashboard** (id real); secrets documentados en el YAML.

## ADR
- ADR-016 — Publish pipeline (GitHub Actions) + `publish.mjs` reutilizable + `fsStorage` de dev.

## NO hecho / diferido (honesto)
- **Run real en GitHub Actions:** requiere org + Backstage desplegado + secrets → verificado localmente; el run cloud llega con el deploy (Bolt 4).
- **Servir el chunk fs por `next start`:** prod snapshotea `public/` en build → el chunk añadido en runtime da 404 con `next start` (se sirve en `next dev` o, en prod, por Blob/CDN). No afecta el pipeline (build→zip→publish→store→resolve verificado).
- El workflow del template usa placeholders (`__MINIAPP_ID__`) → los personaliza init-template.yml (ADR-011); no ejecutado sin GitHub.

## Siguiente
- **Bolt 03-4** (Deploy Backstage a Vercel) — Blob + KV reales; cierra el MVP del Intent 03.
