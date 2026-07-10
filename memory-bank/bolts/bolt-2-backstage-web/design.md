# Bolt 2 — Backstage Web · Etapa 2: DESIGN

> DDD stage 2/5 · Estado: **Borrador (esperando validación humana)** · Fecha: 2026-07-09

## 1. Repo y estructura (repo SEPARADO)

Ubicación: `/Volumes/SSDExterno/prodproyects/backstage-web` (git propio).

```
backstage-web/
├── package.json                depende de @org/miniapp-contract vía file: (dev)
├── next.config.mjs · tsconfig.json · vitest.config.ts
├── data/registry.json          store JSON (MVP, gitignored salvo seed)
├── lib/registry/
│   ├── types.ts                MiniappRecord, PublishedVersion, Registry, errores
│   ├── registry.ts             register/publish/resolve/listCatalog/selectLatest (PURO)
│   ├── store.ts                RegistryStore (JSON fs) — load/save
│   └── __tests__/registry.test.ts
├── app/
│   ├── api/
│   │   ├── miniapps/route.ts               POST register
│   │   ├── miniapps/[id]/publish/route.ts  POST publish
│   │   └── resolve/route.ts                GET resolve
│   ├── catalog/page.tsx        server component: lee store → CatalogList
│   ├── components/CatalogList.tsx  client, presentacional (testeable RTL)
│   └── page.tsx                landing → link a /catalog
└── app/api/__tests__/routes.test.ts
```

## 2. Stack
- **Next.js (App Router)** + Route Handlers para la API. Node runtime (acceso a fs para el store).
- **TypeScript strict** (reusa el espíritu de `tsconfig.base` del móvil).
- **Store:** JSON en fs (`data/registry.json`), detrás de `RegistryStore`. Swappable.
- **Contrato:** `@org/miniapp-contract` vía `file:../backstagereactnative/packages/miniapp-contract` en dev (prod = GitHub Packages, ADR-002). Requiere `pnpm build` del contrato (consume `dist`).
- **Tests:** **Vitest** (dominio + handlers) + **@testing-library/react** (CatalogList). ⚠️ RNTL/agent-device NO aplican (web).

## 3. Placement (no hay federación aquí)
| Elemento | Ubicación | Nota |
|---|---|---|
| Dominio registry | `lib/registry/` (puro) | Sin Next, sin fs — testeable directo |
| Store JSON | `lib/registry/store.ts` | Único punto con fs |
| API | Route Handlers | Inyectan el store en el dominio |
| Catálogo UI | Server component + `CatalogList` client | Solo lectura |

> Backstage NO es RN y NO participa en Module Federation. Es el plano de distribución: publica URL+manifest y resuelve. El montaje del chunk es del host (Bolt 4).

## 4. Flujos
1. **Register:** `POST /api/miniapps { id, name, owner }` → `registerMiniapp` → 201 / 409 si existe.
2. **Publish:** `POST /api/miniapps/:id/publish { version, url, manifest }` → valida con `isManifest` + `parseSemVer` + coherencia → 201 / 400 / 404.
3. **Resolve:** `GET /api/resolve?id=&version=` → `resolveMiniapp` → `ResolveResponse` (contrato) / 404 / 409 incompatible.
4. **Catalog:** `/catalog` renderiza la lista desde el store.

## 5. Seed
- `data/registry.json` sembrado con la miniapp **account_dashboard** (del Bolt 3): un `MiniappRecord` + una `PublishedVersion` cuyo `manifest` refleja el contrato real (`shared`: react, react-native, react-query, flash-list; `capabilities`: accounts:read; `url` al dev server local). Así el host de Bolt 4 puede resolverla de inmediato.

## 6. Decisiones a ADR
- **ADR-006** — Stack Backstage: Next.js App Router + Route Handlers + JSON fs store + contrato vía `file:` en dev.
- **ADR-007** — Testing web con Vitest + RTL (las skills de test RN no aplican a este repo web).

## Nota de método (checkpoint antes de Implement)
Implement hará `create-next-app` (scaffold grande) en el repo sibling + `git init`. Requiere el contrato **compilado** (`dist`) para el `file:` dep. ¿Procedo todo de una?
