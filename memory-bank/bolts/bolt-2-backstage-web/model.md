# Bolt 2 — Backstage Web · Etapa 1: MODEL

> DDD stage 1/5 · Estado: **Borrador (esperando validación humana)** · Fecha: 2026-07-09
> Stories: S4.1 registry (register/publish) · S4.2 resolve · S4.3 catálogo
> ⚠️ **Repo SEPARADO** (Next.js). Código fuera del monorepo móvil; artefactos AI-DLC aquí.

El "Spotify for miniapps": un **registro** que crea, versiona, publica y **resuelve** miniapps para el host. El dominio es el **registry** (no RN). Reutiliza `@org/miniapp-contract`.

## 1. Lenguaje ubicuo (dominio registry)

| Término | Definición |
|---|---|
| **MiniappRecord** | Entrada del catálogo: id, nombre, owner, y sus versiones publicadas. |
| **PublishedVersion** | Una versión concreta: `version` (SemVer), `url` del chunk, `manifest`, timestamp. |
| **Registry** | Colección de MiniappRecords (store persistente). |
| **Publish** | Añadir una `PublishedVersion` a un MiniappRecord (valida el manifest). |
| **Resolve** | Dado un `id` (+ opcional versión/host), elegir la versión a servir → `ResolveResponse`. |
| **Catalog** | Vista de solo lectura del Registry (listar/inspeccionar). |

## 2. Modelo (reutiliza `@org/miniapp-contract`)

```
// del contrato: Manifest, SemVer, MiniappId, ResolveResponse, isManifest, parseSemVer

interface PublishedVersion {
  version: SemVer
  url: string                 // URL del chunk federado (dev server por ahora)
  manifest: Manifest
  publishedAt: string         // ISO
}

interface MiniappRecord {
  id: MiniappId
  name: string
  owner: string
  versions: PublishedVersion[]   // orden de publicación
}

type Registry = Record<MiniappId, MiniappRecord>
```

## 3. Lógica pura del dominio (testeable — S4.1/S4.2)

En `lib/registry/` (framework-free, unit-tested; independiente de Next.js/HTTP):

- **`registerMiniapp(reg, { id, name, owner }): Registry`** — crea un MiniappRecord vacío; error si ya existe.
- **`publishVersion(reg, id, { version, url, manifest }): Registry`** — valida `isManifest(manifest)` + `parseSemVer(version)` + coherencia `manifest.id === id` y `manifest.version === version`; rechaza duplicado de versión; añade `publishedAt`.
- **`resolveMiniapp(reg, id, opts?): ResolveResponse`** — selección de versión:
  - Sin `version` pedida → **última publicada** (mayor SemVer).
  - Con rango/host → la mayor **compatible** (reutiliza `satisfiesRange`/semver del contrato).
  - No existe id / sin versiones / incompatible → **error tipado** (`NotFound` / `NoCompatibleVersion`).
- **`listCatalog(reg): CatalogEntry[]`** — proyección de solo lectura (id, name, owner, últimas versiones).
- **`selectLatest(versions): PublishedVersion`** — helper puro de orden SemVer (mayor primero).

## 4. Store (persistencia)
- Interfaz `RegistryStore { load(): Registry; save(reg): void }`.
- Implementación MVP: **JSON en fs** (`data/registry.json`) — simple y suficiente. Swappable por SQLite/DB después.
- La lógica pura (sección 3) NO conoce el store; el store se inyecta en las rutas.

## 5. Contrato HTTP (para el host — S4.2)
- `POST /api/miniapps` → `registerMiniapp`.
- `POST /api/miniapps/:id/publish` → `publishVersion`.
- `GET /api/resolve?id=&version=&hostVersion=` → `resolveMiniapp` → `ResolveResponse` del contrato.
- `GET /catalog` (UI) → `listCatalog`.

## 6. Reglas de seguridad
- Sin secretos/PII en respuestas ni logs; el registry solo maneja metadatos + URLs.
- Validar todo input (manifest) con `isManifest` del contrato antes de persistir (input no confiable).
- (MVP) sin auth en los endpoints; se añade en Operations. Registrar como deuda.

## 7. Frontera
- Descarga/verificación/montaje del chunk → **host** (Bolt 4). Backstage solo publica URL+manifest y resuelve.
- Hosting real de artefactos/CDN → Operations (dev server local por ahora).

## Preguntas para el checkpoint
1. **Ubicación física del repo separado:** propongo **sibling** `/Volumes/SSDExterno/prodproyects/backstage-web` con su propio `git init`. ¿OK o prefieres otra ruta?
2. **Consumo del contrato en dev:** como aún NO se publica a GitHub Packages, propongo dependencia **`file:` (o tarball de `npm pack`)** apuntando al paquete del monorepo para desarrollo local, documentando que prod usa GitHub Packages (ADR-002). ¿OK?
3. **Store MVP = JSON en fs** (vs. SQLite). ¿Confirmas JSON para el slice?
