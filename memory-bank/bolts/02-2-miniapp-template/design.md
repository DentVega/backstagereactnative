# Bolt 02-2 — Template de miniapp · Etapa 2: DESIGN

> DDD stage 2/5 · Estado: **Borrador** · Fecha: 2026-07-09

## 1. Repo `miniapp-template` (sibling, git propio, marcado template en GitHub)
```
miniapp-template/
├── package.json            name "@org/miniapp-__MINIAPP_ID__" · deps @org/miniapp-contract + @org/ui-kit (^0.1.0)
│                            + Re.Pack/rspack/@module-federation/enhanced@0.9.0 (devDeps)
├── .npmrc                  @org:registry=https://npm.pkg.github.com (consumo publicado)
├── rspack.config.mjs       ModuleFederationPluginV2({ name:"__MINIAPP_ID__", exposes:{ "./Entry":"./src/Entry.tsx" }, shared:{ react, react-native (+ ui-kit) } })
├── react-native.config.js  comandos Re.Pack
├── babel.config.cjs · tsconfig.json
├── manifest.json           { id:"__MINIAPP_ID__", version:"0.1.0", entry:"./Entry", shared[], capabilities[] }
├── src/
│   ├── Entry.tsx           default export; recibe MiniappEntryProps; gate de capability → Screen
│   └── Screen.tsx          placeholder ("Hola desde __MINIAPP_NAME__", usa ui-kit)
├── .github/workflows/
│   ├── init-template.yml   ⭐ sustituye placeholders al generar el repo, commitea, se auto-elimina
│   └── ci.yml              stub: build del chunk (publish real = Intent 03)
└── README.md               runbook de dev (dev server, puerto, publicar URL a Backstage)
```

## 2. Placeholders y su sustitución (ADR-011)
- Marcadores: `__MINIAPP_ID__`, `__MINIAPP_NAME__`, `__MINIAPP_OWNER__`.
- **`init-template.yml`** (GitHub Actions): dispara en el **primer push** de un repo generado (detecta que NO es el template original), deriva `__MINIAPP_ID__` del nombre del repo (`miniapp-<id>`), reemplaza en todos los archivos, commitea, y **borra el workflow** (init de una sola vez).
- Los placeholders son **strings válidos** → el template **compila tal cual** (sin sustituir); la sustitución solo personaliza nombres.

## 3. Conformidad (reusa contract + ui-kit)
- `Entry.tsx`: `default` que recibe `MiniappEntryProps`; si falta la capability requerida → UI "acceso no autorizado"; si ok → `<Screen/>`.
- `shared` en rspack idéntico patrón que account-dashboard (react, react-native singleton; ui-kit shared).
- `manifest.json` refleja el contrato.

## 4. Verificación (Etapa Test)
- **Instalar** deps: react/react-native/re.pack normales; `@org/*` desde los **tarballs locales** (`npm install <tgz> --no-save`) para no ensuciar el template (que declara la versión de registry).
- **Compilar el remote:** `react-native webpack-bundle --entry-file src/Entry.tsx …` → container que expone `./Entry` (+ `mf-manifest.json`).
- El template queda **limpio** (deps en forma de registry `^0.1.0`).
- El workflow de init **no se testea localmente** (requiere GitHub); se revisa por lectura.

## 5. ADR
- **ADR-011** — Sustitución de placeholders vía **workflow de GitHub Actions de un solo uso** (init-template) al generar el repo.

## Nota
El template no tiene lógica de negocio; el criterio es "compila un remote que expone ./Entry" + "cumple el contrato" + "listo para el scaffolder".
