# System Context — Intent 01 (Vertical Slice)

> Fase: **Inception** · Estado: **Borrador (esperando validación humana)** · Fecha: 2026-07-09
> Refina `memory-bank/standards/system-architecture.md` para el alcance de este intent.

## 1. Dos repositorios (decisión checkpoint 2026-07-09)

Backstage web vive en un **repositorio git separado** (otro equipo, con CI/CD, versionado y deploy independientes). El único acoplamiento entre ambos repos es el **contrato publicado** `@org/miniapp-contract`.

### Repo A — Mobile (este repo, `backstagereactnative/`, pnpm workspace)
```
backstagereactnative/            (root — pnpm workspace) — REPO MÓVIL
├── apps/
│   └── host/                    RN + Re.Pack — app host (bank shell)
├── miniapps/
│   └── account-dashboard/       Miniapp piloto — build dual (remote | shared pkg)
├── packages/
│   ├── ui-kit/                  Primitivas themed compartidas (AppText, Box, Card…)
│   ├── miniapp-contract/        FUENTE del contrato → PUBLICADO como @org/miniapp-contract
│   └── host-runtime/            Loader de miniapps + fallback + verificación de manifest
└── memory-bank/                 AI-DLC (ya existe)
```
`pnpm-workspace.yaml` incluye `apps/*`, `miniapps/*`, `packages/*`.

### Repo B — Backstage web (repo separado, `backstage-web/`, otro equipo)
```
backstage-web/                   Next.js (App Router) — REPO SEPARADO
├── app/                         UI catálogo + Route Handlers (register/publish/resolve)
├── lib/registry/                Store del registry (JSON/SQLite)
└── package.json                 depende de @org/miniapp-contract@^x (versión fijada)
```

### Contrato compartido (`@org/miniapp-contract`)
- **Fuente:** `packages/miniapp-contract` en el repo móvil.
- **Distribución:** publicado a **npm privado / GitHub Packages** con **semver**.
- **Consumo:** el repo móvil lo usa como workspace; el repo Backstage lo **instala por versión**.
- **Regla:** todo cambio del contrato = bump de versión + changelog. Ningún repo edita una copia local divergente.

## 2. Topología Module Federation v2 (Re.Pack)

> Backstage (recuadro superior) es un **repo separado**; se comunica con el host solo por HTTP (`/api/resolve`) y ambos comparten el paquete versionado `@org/miniapp-contract`.

```
                        ┌────────────── Backstage (Next.js) — REPO SEPARADO ─────────────────────────┐
                        │  Route Handlers (API):                                                       │
                        │   POST /api/miniapps            ← registrar miniapp                          │
                        │   POST /api/miniapps/:id/publish ← publicar versión (manifest + chunk URL)   │
                        │   GET  /api/resolve?id=&host=   → { url, version, manifest }  (host resuelve) │
                        │   GET  /catalog                  → UI de catálogo (listar/inspeccionar)       │
                        │  Store: registry (JSON/DB simple). Artefactos: dev server local por ahora.   │
                        └───────────────┬───────────────────────────────────────────┬────────────────┘
                     (1) publish        │                                            │  (2) resolve (GET /api/resolve)
                         manifest+chunk  ▼                                            ▲
   ┌──────────────────────────── HOST (apps/host, RN + Re.Pack) ─────────────────────┴─────────────────┐
   │  MF container: "host"                                                                              │
   │   remotes: { account_dashboard: <URL resuelta en runtime desde Backstage> }                       │
   │   shared (singleton:true, eager en host):                                                         │
   │     react · react-native · @react-navigation/* · zustand · @tanstack/react-query                   │
   │   Owns: boot runtime · navegación nativa · shell auth/sesión (mock) · packages/host-runtime loader │
   │        └─ loader: resolve() → fetch chunk → verificar manifest → mount <Entry/> → fallback on error │
   └───────────────────────────────────────────┬───────────────────────────────────────────────────────┘
                                mount on demand │
   ┌────────────────────────── REMOTE: account_dashboard (miniapps/account-dashboard) ─────────────────┐
   │  MF container: "account_dashboard"                                                                 │
   │   exposes: "./Entry"  → componente tipado (miniapp-contract)                                       │
   │   shared (singleton:true, NO eager): react · react-native · nav · zustand · @tanstack/react-query  │
   │   Solo-JS (sin módulos nativos). UI con FlashList + packages/ui-kit. Datos mock.                   │
   │   Build dual: (a) remote container  |  (b) shared package (@org/account-dashboard) build-time      │
   └───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 3. Contratos (packages/miniapp-contract)

- **Manifest:** `{ id, version, entry: "./Entry", shared: string[], capabilities: string[], integrity?: string }`.
- **Entry:** componente RN tipado que recibe `capabilities` scoped inyectadas por el host (nunca credenciales crudas).
- **Resolve response (Backstage):** `{ id, version, url, manifest }`.
- **Regla de shared:** la lista `shared` del remote debe ser **subconjunto compatible** de la que el host provee como singleton. Skew → el loader degrada con fallback.

## 4. Boundaries host vs. remote (este intent)

| Elemento | Ubicación | Nativo | Motivo |
|---|---|---|---|
| Boot runtime, navegación base | **Host** | no | Núcleo, siempre presente |
| Auth/sesión (mock) | **Host** | no | Seguridad: sesión solo en host |
| Loader / fallback / verificación manifest | **Host** (`packages/host-runtime`) | no | Núcleo de federación |
| UI kit (primitivas themed) | **Shared package** | no | Reutilizado por host y miniapps |
| Miniapp contract (tipos) | **Paquete publicado** `@org/miniapp-contract` (fuente en repo móvil) | no | Único acoplamiento entre los dos repos; versionado semver |
| **Account Dashboard** | **Remote federado** (build dual) | **no** | Feature on-demand; valida el pipeline |
| Backstage catálogo/registry/API | **Repo separado** (Next.js), otro equipo | n/a | Plataforma de distribución; CI/CD y deploy independientes |

## 5. Flujos clave
1. **Publicar:** dev registra la miniapp en Backstage → publica versión (manifest + URL del chunk servido por dev server).
2. **Resolver + montar:** host arranca → pide `GET /api/resolve?id=account_dashboard` → obtiene `{url, version, manifest}` → descarga chunk → verifica manifest → monta `./Entry` con capabilities scoped.
3. **Fallback:** si falla descarga/verificación/skew → UI de fallback, sin crash, log sin PII.

## 6. Riesgos / a decidir por ADR (Construction)
- Mecanismo de verificación de integridad del chunk (hash en manifest vs. firma) — ADR en el bolt del loader.
- Shape final del registry store (JSON en fs vs. DB) — simple para el MVP.
- Estrategia de versionado/compatibilidad de singletons (rango semver por miniapp).
