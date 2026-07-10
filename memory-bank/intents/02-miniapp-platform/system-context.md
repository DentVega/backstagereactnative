# System Context — Intent 02 (Plataforma de miniapps)

> Fase: **Inception** · Estado: **Borrador (esperando validación humana)** · Fecha: 2026-07-09
> Realiza la "Three-plane architecture" de `standards/system-architecture.md`.

## 1. Topología de repos (post-Intent 02)

```
                         ┌──────── GitHub Packages (registry npm privado) ────────┐
                         │  @org/miniapp-contract@x.y.z   @org/ui-kit@x.y.z        │
                         └──────┬───────────────────────────────┬─────────────────┘
              publica (CI/tag)  │                               │ instalan por versión
   ┌── Repo HOST (móvil) ───────┴───────┐        ┌──────────────┴───── Repos MINIAPP (1 por miniapp) ──┐
   │ apps/host   (cascarón RN + Re.Pack)│        │  miniapp-account-dashboard/   (repo git)            │
   │ packages/{contract, ui-kit,        │        │  miniapp-<otras>/             (repo git)            │
   │           host-runtime}            │        │   cada uno: Re.Pack remote expone "./Entry"         │
   │ (SIN miniapps dentro)              │        │   deps: @org/miniapp-contract + @org/ui-kit         │
   └──────────────┬─────────────────────┘        │   + manifest.json + dev server (sirve el chunk)     │
                  │ resuelve+monta (runtime)      └───────────────┬──────────────────────────────────────┘
                  ▼                                               │ ③ genera repo (GitHub API)
        ┌──────────────── Repo BACKSTAGE (web, separado) ─────────┴───────┐
        │  ① SCAFFOLDER  POST /api/scaffold {id,name,owner}                 │
        │       → GitHub API: generate repo desde `miniapp-template`        │
        │       → registerMiniapp() en el registry                          │
        │  ② REGISTRY   register / publish / resolve / catalog (intent 01)  │
        │  UI: /catalog + /create (página mínima)                           │
        │  Store: registry.json (MVP)                                       │
        └───────────────────────────────────────────────────────────────────┘
        (CDN de chunks = diferido; dev = dev server de cada miniapp)
```

## 2. El template (`miniapp-template`, GitHub template repo)

```
miniapp-template/                (repo marcado como "template" en GitHub)
├── package.json                 name "@org/miniapp-__MINIAPP_ID__" · deps: @org/miniapp-contract, @org/ui-kit (rango)
├── rspack.config.mjs            ModuleFederationPluginV2 name "__MINIAPP_ID__" · exposes "./Entry"
├── react-native.config.js       comandos Re.Pack
├── manifest.json                { id: __MINIAPP_ID__, version, entry: "./Entry", shared[], capabilities[] }
├── src/
│   ├── Entry.tsx                recibe MiniappEntryProps (gate de capability incluido)
│   └── Screen.tsx               placeholder de pantalla
├── .github/workflows/ci.yml     stub de CI (build; publish real = intent 03)
└── README.md                    runbook de dev (dev server, puertos)
```
- **Placeholders:** `__MINIAPP_ID__`, `__MINIAPP_NAME__`, `__MINIAPP_OWNER__` — sustituidos al scaffoldear (workflow post-generación o script `postinit`; a decidir por ADR).
- El template **compila** como remote Re.Pack de forma standalone (criterio de aceptación).

## 3. Flujo del scaffolder (delta 4)
```
Backstage /create (página) → POST /api/scaffold { id, name, owner }
  1. valida id (parseMiniappId del contrato) + no existe en registry
  2. GitProvider.createFromTemplate(templateRepo, "miniapp-<id>", owner)   // GitHub API generate
  3. (opcional) dispara sustitución de placeholders (workflow)
  4. registerMiniapp(registry, { id, name, owner })   // queda en el catálogo, aún sin versión publicada
  5. responde { repoUrl }
```
- `GitProvider` = **interfaz** (impl `githubProvider` usando la API REST de GitHub con token). Mockeable en tests (ADR).
- Token de GitHub por **env/secret**, nunca en código.

## 4. Cómo el host consume una miniapp EXTERNA
- Sin cambios de arquitectura: el host resuelve `id` → Backstage `/api/resolve` → `{url, manifest}` → ScriptManager descarga el chunk desde esa URL → monta `./Entry`.
- **Cambio real:** la `url` apunta al **dev server del repo de la miniapp** (no a un chunk dentro del monorepo). El host **quita `miniapps/*`** de su workspace (queda vacío tras mover account-dashboard).
- El contrato lo comparten host y miniapp **por versión publicada** (GitHub Packages), no por workspace.

## 5. Placement / boundaries
| Elemento | Ubicación | Nota |
|---|---|---|
| `@org/miniapp-contract`, `@org/ui-kit` | **Publicados** (GitHub Packages) | consumidos por host y miniapps por versión |
| `apps/host`, `packages/*` | Repo móvil | el host ya no contiene miniapps |
| `account-dashboard` | **Repo git propio** (migrado) | 1ª miniapp de referencia |
| `miniapp-template` | **Repo git "template"** | molde del scaffolder |
| Scaffolder (API + `/create`) | Repo Backstage | usa GitProvider (GitHub) |
| CDN de chunks | **Diferido** | interfaz; dev = dev server de cada miniapp |

## 6. Decisiones que van a ADR (Construction)
- **ADR** — Publicación de `ui-kit` (además del contrato) a GitHub Packages: build de `src`→`dist` (hoy `main: src`), impacto en el consumo.
- **ADR** — `GitProvider` interfaz + impl GitHub (`generate from template`), auth por token, mock en tests.
- **ADR** — Mecanismo de sustitución de placeholders del template (workflow post-gen vs script `postinit` vs sin sustitución + README).
- **ADR** — Migración de `account-dashboard`: cómo el host lo consume en dev (URL del dev server) sin la `miniapps/` local.

## 7. Riesgos / preguntas
- Org/owner real de GitHub (placeholder `@org` / `org/miniapp-template`).
- `ui-kit` hoy se consume como fuente (`main: src/index.ts`); publicarlo requiere build a `dist` — coordinar con el host y el template.
- Sin CI real (delta 5), publicar el chunk de account-dashboard en dev es manual (su dev server) — aceptable para el MVP.
