# System Architecture

> Set during Inception (system-context) and refined during Construction (Design + ADRs).

## Three-plane architecture (aclarado 2026-07-09)

**Plane A — Mobile host (bank app, RN + Re.Pack):** runtime que arranca, autentica y **monta** miniapps. **NO contiene miniapps**; solo el cascarón + `packages/*` (contract, ui-kit, host-runtime). Publica `@org/miniapp-contract` y `@org/ui-kit` a un registry (GitHub Packages).
**Plane B — Backstage platform (web, repo separado):** el "Spotify for miniapps" con 3 capacidades: **① Scaffolder** ("Create miniapp" → crea un **repo git nuevo** desde un template), **② Registry** (register/version/resolve/catalog), **③ Distribución** (apunta al CDN donde la CI sube los chunks).
**Plane C — Miniapps (un repo git por miniapp, creados por Backstage):** cada miniapp es un proyecto **independiente**, un Re.Pack federated remote que expone `./Entry`, depende de `@org/miniapp-contract` (+ `@org/ui-kit`) instalados desde el registry, y tiene su **propia CI** que buildea el chunk → lo sube al CDN → hace `POST /api/miniapps/:id/publish` a Backstage.

> ⚠️ **Corrección del slice inicial:** en el slice, `account-dashboard` se puso DENTRO del monorepo móvil (`miniapps/account-dashboard`) por simplicidad. En la arquitectura real, las miniapps **salen del monorepo** a repos git propios, creados y distribuidos por Backstage. La federación ya soporta esto sin cambios: el host consume por **URL + contrato**, no por ubicación en disco.

### Acoplamiento entre planos
- Host ↔ Miniapps: **solo** el contrato `@org/miniapp-contract` (publicado) + el protocolo de montaje MF. El host resuelve la URL en runtime vía Backstage.
- Miniapps ↔ Backstage: la CI de cada miniapp publica `{version, url, manifest}`; Backstage lo sirve por `/api/resolve`.
- Ninguna miniapp conoce a otra ni al código del host — solo el contrato.

```
                 ┌─────────────────────────── Backstage (web) ───────────────────────────┐
                 │  Catalog · Registry · Versioning · Signing · Manifests · Artifact CDN   │
                 └───────────────┬───────────────────────────────┬───────────────────────┘
              publishes remote   │                               │  publishes shared pkg
              chunk + manifest    ▼                               ▼  (build-time import)
   ┌──────────────────── Mobile Host (RN + Re.Pack) ────────────────────┐   pnpm workspace
   │  Boot runtime · Core nav · Auth/Session · Shared UI · Miniapp loader │  (@org/miniapp-*)
   │     └── mounts on demand ──► [ remote: payments ] [ remote: cards ]  │
   └─────────────────────────────────────────────────────────────────────┘
```

## Module Federation topology (Re.Pack)
- **Host app:** boots the runtime, owns core navigation + auth/session, resolves and mounts remotes.
- **Remotes (miniapps):** independently buildable/deployable feature chunks, downloaded on demand from Backstage-published URLs.
- Diagram the host → remote relationships here as the project grows.

## Rules
- A feature that requires **native modules** cannot be a pure-JS remote — keep it in the host or a native-aware container. Record the decision as an ADR.
- Remote chunk URLs are environment-aware (dev server vs. Backstage prod CDN).
- Always design a **graceful fallback** when a remote fails to download or fails signature verification.
- Version skew: host and remotes must share compatible singleton versions; document the contract. Backstage enforces/records the compatible range per miniapp.
- **Shared-library rule:** shared deps flow through a global share scope, so mini-apps reuse each other's copies. Framework libs (react, RN, navigation) AND **stateful libs** (data-cache client, stores, i18n, session client) are `singleton: true` in every container — a per-remote copy of a stateful lib means split caches/sessions. Keep one identical `shared` list across host and all remotes.

## Banking-migration rules
- Map each Android screen/feature to a target: host-core vs. federated miniapp vs. shared package. Track coverage (see `/parity`) so no native feature is dropped.
- Sensitive flows (login, transfers, PII) default to **host-core** unless an ADR justifies isolating them into a signed remote.

## DDD layering (Construction)
- **Domain** (entities, value objects, ubiquitous language) — framework-free, testable.
- **Application** (use cases) — orchestrates domain.
- **UI / RN** — components, navigation, native bindings.

## ADRs
Each non-trivial architectural decision → `memory-bank/bolts/{bolt-id}/adr-NNN.md` (context / decision / consequences).
