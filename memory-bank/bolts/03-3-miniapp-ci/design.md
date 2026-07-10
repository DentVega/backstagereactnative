# Bolt 03-3 — Miniapp CI · Etapa 2: DESIGN

> DDD stage 2/5 · Estado: **Borrador** · Fecha: 2026-07-10

## 1. Piezas
```
backstage-web/
├── lib/storage/fs.ts     (nuevo) fsStorage — dev: escribe a public/chunks/<prefix>/, URL local
└── lib/storage/index.ts  getStorage(): Blob si BLOB_READ_WRITE_TOKEN; si no, fsStorage (dev)

miniapp-template/ y miniapp-account-dashboard/
├── scripts/publish.mjs   (nuevo) POST del zip a Backstage /upload (reutilizable)
└── .github/workflows/ci.yml   (real) install → webpack-bundle → zip → node scripts/publish.mjs
+ PUBLISHING/secrets doc
```

## 2. `fsStorage` (dev)
- `putMany(prefix, files)`: escribe cada file a `process.cwd()/public/chunks/<prefix>/<path>`; devuelve `baseUrl = ${BACKSTAGE_PUBLIC_URL ?? "http://localhost:3999"}/chunks/<prefix>`.
- Next sirve `public/` en la raíz → el chunk queda accesible en dev. **Solo dev** (serverless no escribe fs → Blob en prod).
- `getStorage()`: `BLOB_READ_WRITE_TOKEN` ? `blobStorage()` : `fsStorage()`.

## 3. `scripts/publish.mjs` (en cada miniapp, Node 20)
```
lee manifest.json (id, …) + package.json (version)
zip = process.argv[2]  (la CI ya generó build.zip con los archivos del build, sin prefijo build/)
FormData: file=Blob(readFileSync(zip)), version, manifest(JSON)
fetch POST `${BACKSTAGE_URL}/api/miniapps/${id}/upload`  Authorization: Bearer ${PUBLISH_TOKEN}
→ status 201 espera { url }; !ok → exit 1
```
- Sin deps nuevas (Node 20: fetch/FormData/Blob/fs). El **zip lo hace el workflow** (`cd build && zip -r ../build.zip .`).

## 4. `ci.yml` (real; reemplaza el stub del template)
```
on: push(main) / tag v*
jobs.publish:
  - checkout, setup-node 20, setup pnpm
  - .npmrc (GitHub Packages) con NODE_AUTH/GITHUB_TOKEN
  - pnpm install
  - pnpm exec react-native webpack-bundle --platform android --entry-file src/Entry.tsx --bundle-output build/<id>.container.js.bundle --dev false
  - cd build && zip -r ../build.zip .
  - node scripts/publish.mjs build.zip
    env: BACKSTAGE_URL, PUBLISH_TOKEN (secrets)
```
- Aplicar al **template** (con placeholders `<id>`=`__MINIAPP_ID__`) y a **miniapp-account-dashboard** (id real).

## 5. Verificación (e2e local, honesta)
- YAML válido (parse con un checker).
- **E2E local:** Backstage local (`PUBLISH_TOKEN=secret`, sin BLOB → fsStorage) → en account-dashboard: `webpack-bundle` → `zip` → `node scripts/publish.mjs` → **201** + `/api/resolve` devuelve la URL local + el chunk se sirve desde `public/chunks/…`.
- Run real en GitHub Actions = requiere org + deploy + secrets (Bolt 4).

## 6. ADR
- **ADR-016** — Publish pipeline (GitHub Actions) con `scripts/publish.mjs` reutilizable + `fsStorage` de dev para e2e local sin Blob.

## Nota
Reutilizo la skill `github-actions` para el YAML. Secrets por repo, nunca en el YAML.
