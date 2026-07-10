# Unit 2 — Template de miniapp (GitHub template repo)

> Intent: 02-miniapp-platform · Estado: Borrador · Fecha: 2026-07-09 · Delta 2

## Propósito
El **molde** que el scaffolder clona: un proyecto Re.Pack federated remote listo para codear, que expone `./Entry`, depende de los `@org/*` publicados, y compila standalone.

## Alcance
- Repo `miniapp-template` marcado como **template** en GitHub.
- `package.json` `@org/miniapp-__MINIAPP_ID__` con deps `@org/miniapp-contract` + `@org/ui-kit` (rango publicado) + Re.Pack/rspack devDeps.
- `rspack.config.mjs` `ModuleFederationPluginV2({ name: "__MINIAPP_ID__", exposes: { "./Entry": "./src/Entry.tsx" }, shared: {…singletons…} })`.
- `react-native.config.js` (comandos Re.Pack), `manifest.json` (id/version/entry/shared/capabilities).
- `src/Entry.tsx` (recibe `MiniappEntryProps` + gate de capability) + `src/Screen.tsx` placeholder.
- `README.md` (runbook de dev: dev server, puerto, cómo publicar la URL a Backstage).
- **Placeholders** `__MINIAPP_ID__` / `__MINIAPP_NAME__` / `__MINIAPP_OWNER__` — mecanismo de sustitución **decidido en Design (ADR)**.
- Stub `.github/workflows/ci.yml` (build; publish real = intent 03).

## Clasificación
- Repo template (fuera del monorepo móvil). Remote Re.Pack solo-JS. **Depende de Unit 1** (paquetes publicados).

## Dependencias
- Unit 1 (contract + ui-kit publicados). Lo usa Unit 3 (account-dashboard) y Unit 4 (scaffolder).

## Stories
- S2.1 — Boilerplate del remote (rspack MF expone `./Entry`, Entry con gate, Screen placeholder, manifest).
- S2.2 — Deps a `@org/*` publicados + `.npmrc` de consumo; el template **compila** como remote standalone.
- S2.3 — Placeholders + README/runbook; marcar el repo como template en GitHub.

## Criterios de aceptación
- El template **compila** un chunk remote Re.Pack (`webpack-bundle`) que expone `./Entry`.
- Instala `@org/miniapp-contract` + `@org/ui-kit` desde GitHub Packages.
- README con el runbook de dev; placeholders presentes y documentados.
