# Bolt 04-4 — UI de detalle + catálogo · Etapa 2: DESIGN

> DDD 2/5 · Estado: **Borrador** · Fecha: 2026-07-10 · Repo `backstage-web`

## 1. Archivos
```
lib/registry/types.ts        CatalogEntry += createdAt? · repoUrl?; + MiniappDetail, VersionView
lib/registry/registry.ts     listCatalog enriquecido; + getMiniappDetail(reg, id) (puro)
app/components/CiBadge.tsx           (client) CiStatus → color + label accesible
app/components/VersionList.tsx       (client) lista de versiones (fecha, url, capabilities)
app/components/MiniappHeader.tsx     (client) name/id/owner/createdAt/repoUrl/latest
app/components/CatalogList.tsx       (edit) + fecha, badge CI, link a /miniapp/[id]
app/catalog/page.tsx                 (edit) resuelve CI status por entry + pasa statusMap
app/miniapp/[id]/page.tsx            (nuevo) server component: detalle + CI + versiones
app/components/__tests__/            CiBadge, VersionList, MiniappHeader, CatalogList (RTL)
lib/registry/__tests__/registry.test.ts   + getMiniappDetail + listCatalog enriquecido
```

## 2. View-models (puros)
```ts
export interface VersionView { version: string; url: string; publishedAt: string; capabilities: string[] }
export interface MiniappDetail {
  id: string; name: string; owner: string;
  createdAt?: string; repoUrl?: string;
  latestVersion: string | null; versionCount: number;
  versions: VersionView[];      // orden: más nueva primero
  capabilities: string[];        // capabilities de la latest (o [])
}
getMiniappDetail(reg, rawId): MiniappDetail   // throw MiniappNotFoundError si no existe
```
- `CatalogEntry += createdAt?: string; repoUrl?: string` (poblados en `listCatalog`).

## 3. Componentes (client, presentacionales, RTL)
- **`CiBadge({ status })`** — `success`✅ verde · `failure`❌ rojo · `in_progress`🟡 · `none`⚪ · `unknown`❔ gris.
  `role="status"` + `aria-label="CI: <status>"`. Sin lógica de red.
- **`VersionList({ versions })`** — `<ul aria-label="Versiones">`; por item: `v<version>`,
  fecha (`publishedAt`), link al chunk (`url`), capabilities. Vacío → "sin versiones".
- **`MiniappHeader({ detail })`** — name + `<code>id</code>`, owner, createdAt, link repo
  (`repoUrl`, `rel="noopener noreferrer" target="_blank"`), latest version.

## 4. Server components
- **`/catalog`**: `listCatalog(reg)` → para cada entry `repoFullNameFor` + `getCiProvider().getStatus(repo, token)`
  con `token = (await auth())?.githubAccessToken`. `Promise.all` (la cache dedup/limita). Pasa `entries`
  + `statusById: Record<id, CiStatus>` a `CatalogList`. Cada card linkea a `/miniapp/[id]`.
- **`/miniapp/[id]`**: `getMiniappDetail(reg, id)` (`notFound()` si lanza `MiniappNotFoundError`);
  CI status del repo; render `MiniappHeader` + `CiBadge` + capabilities + `VersionList`.
  `export const dynamic = "force-dynamic"`.

## 5. Seguridad
- Token leído server-side (`auth()`); a los componentes client solo llega el `CiStatus`.
- `repoUrl`/versiones/capabilities son datos públicos.
- Nota activación: scope OAuth actual = `read:user` → Actions de repos privados dará
  `unknown` (fallback correcto). Badges reales requieren scope `repo`/`actions:read` (activation item).

## 6. Verificación
- RTL: `CiBadge` (los 5 estados + aria), `VersionList` (con/sin versiones + capabilities),
  `MiniappHeader` (repoUrl link / sin repoUrl / createdAt), `CatalogList` (badge + fecha + link).
- Unit puro: `getMiniappDetail` (existe → VM completo; capabilities de latest; no existe → throw),
  `listCatalog` enriquecido (createdAt/repoUrl presentes).
- `tsc` + `next build` limpios. Suite Backstage verde.
