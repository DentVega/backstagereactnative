# Bolt 02-2 — Template de miniapp · RESULT

> Estado: **COMPLETO** · Fecha: 2026-07-09 · Intent 02 · Stories: S2.1–S2.3
> Código en repo SEPARADO `/Volumes/SSDExterno/prodproyects/miniapp-template` (git init).

## Qué se construyó
El **molde** que el scaffolder clona: un Re.Pack federated remote que expone `./Entry`, consume los `@org/*` publicados, y compila standalone.

```
miniapp-template/            (repo git propio, marcar como "template" en GitHub)
├── package.json             @org/miniapp-__MINIAPP_ID__ · deps @org/miniapp-contract + @org/ui-kit (^0.1.0)
├── .npmrc                   @org:registry (GitHub Packages)
├── rspack.config.mjs        MF v2: name "__MINIAPP_ID__", exposes "./Entry", shared singletons
├── manifest.json            id/version/entry/shared/capabilities (placeholders)
├── src/Entry.tsx            default; MiniappEntryProps + gate de capability → Screen
├── src/Screen.tsx           placeholder (usa @org/ui-kit)
├── .github/workflows/
│   ├── init-template.yml     ⭐ sustituye placeholders al generar + se auto-elimina (ADR-011)
│   └── ci.yml                stub (build; publish real = Intent 03)
└── README.md                runbook de dev
```

## Evidencia (verificado, no afirmado)
- **Compila el remote:** `webpack-bundle` → "compiled successfully"; `container entry (expose)`, `__federation_expose_Entry.chunk.bundle`, `mf-manifest.json` (57KB). Expone `./Entry`.
- **Typecheck limpio** (`tsc --noEmit`).
- Verificación hecha instalando `@org/*` desde los paquetes del monorepo por `file:` (`--legacy-peer-deps`); luego **restaurado a `^0.1.0`** (forma de registry) y quitado el `package-lock.json` → template limpio.

## Cobertura de stories
- **S2.1 boilerplate remote** ✓ — rspack MF expone `./Entry`; `Entry.tsx` (gate de capability) + `Screen.tsx` placeholder; `manifest.json`.
- **S2.2 deps publicados + compila** ✓ — deps `@org/*` (^0.1.0) + `.npmrc`; el template compila un chunk remote.
- **S2.3 placeholders + README + template** ✓ — placeholders `__MINIAPP_ID__/__MINIAPP_NAME__/__MINIAPP_OWNER__`; workflow init; README runbook. (Marcar "template" en GitHub = paso al subir el repo.)

## ADR
- ADR-011 — Sustitución de placeholders vía workflow de GitHub Actions de un solo uso (init-template).

## NO hecho / diferido (honesto)
- **Marcar el repo como "template" en GitHub** + subirlo: requiere el remote GitHub (org placeholder). Local listo.
- **El workflow `init-template.yml` NO se probó** (requiere GitHub); revisado por lectura. Se validará al ejecutar el scaffolder real (Bolt 4 / con org).
- Deps `@org/*` reales por registry: verificado por `file:`; el install real requiere publish (Bolt 02-1) + org/token.
- CI real (build→CDN→publish): stub; delta 5 (Intent 03).

## Siguiente
- **Bolt 02-3** (Migrar account-dashboard a su repo, alineada al template) o **Bolt 02-4** (Scaffolder que genera repos desde este template).
