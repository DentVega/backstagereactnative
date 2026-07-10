# Bolt 02-2 — Template de miniapp · Etapa 1: MODEL

> DDD stage 1/5 · Estado: **Borrador** · Fecha: 2026-07-09 · Intent 02
> Stories: S2.1 boilerplate remote · S2.2 deps publicados + compila · S2.3 placeholders + README

El "dominio" del template es el **contrato de conformidad de una miniapp**: qué debe exponer y cumplir cualquier miniapp para que el host la monte. El template es la **forma mínima** que satisface ese contrato.

## 1. Lenguaje ubicuo
| Término | Definición |
|---|---|
| **Template repo** | Repo GitHub marcado como *template*; el scaffolder genera copias desde él. |
| **Placeholder** | Marcador (`__MINIAPP_ID__`, `__MINIAPP_NAME__`, `__MINIAPP_OWNER__`) sustituido al generar. |
| **Conformidad de miniapp** | Requisitos que el host espera: expone `./Entry` (contrato `MiniappEntryProps`), declara `shared` singletons compatibles, publica un `manifest`. |
| **Init del template** | Paso que sustituye placeholders tras generar el repo (mecanismo → ADR). |

## 2. Contrato que toda miniapp (y el template) debe cumplir
Reutiliza `@org/miniapp-contract`:
- **Expone `./Entry`**: componente `default` que recibe `MiniappEntryProps { capabilities }`.
- **Gate de capability**: si falta el permiso requerido o está revocado → UI de acceso denegado (no data).
- **`manifest`**: `{ id, version, entry: "./Entry", shared[], capabilities[] }`.
- **`shared` singletons**: react, react-native (+ los que use) — subconjunto compatible de lo que el host provee. Skew → el host hace fallback.

## 3. Forma mínima del template
```
Entry.tsx        → gate de capability + render de Screen
Screen.tsx       → placeholder ("Hola desde __MINIAPP_NAME__")
manifest.json    → id/version/entry/shared/capabilities (con placeholders)
rspack.config    → MF v2: name "__MINIAPP_ID__", exposes "./Entry", shared singletons
```
No hay lógica de negocio: el template es estructura + contrato, listo para que el equipo agregue su feature.

## 4. Placeholders (a resolver en ADR)
- `__MINIAPP_ID__` (kebab/snake, valida `parseMiniappId`), `__MINIAPP_NAME__`, `__MINIAPP_OWNER__`.
- Aparecen en: `package.json` (name), `rspack.config` (MF name), `manifest.json`, textos de UI.
- **Mecanismo de sustitución** → decisión en Etapa 3 (ADR): workflow de GitHub Actions al generar, vs. script `init` local.

## 5. Deps (publicadas)
- `@org/miniapp-contract` (requerido: el contrato del Entry).
- `@org/ui-kit` (opcional-recomendado: consistencia visual).
- Consumidas por **versión** desde GitHub Packages (`.npmrc`). Para verificación local sin publish real → tarballs locales (`--no-save`), sin ensuciar el template.

## 6. Frontera
- El scaffolder que genera repos desde el template → Bolt 4.
- La 1ª miniapp real (account-dashboard migrada, alineada al template) → Bolt 3.

## Preguntas para el checkpoint
1. **Ubicación del template repo:** sibling `/Volumes/SSDExterno/prodproyects/miniapp-template` + `git init` (como backstage-web). ¿OK?
2. **¿El template depende de `@org/ui-kit`** (recomendado, consistencia visual) o lo dejamos **solo `@org/miniapp-contract`** (más liviano, el equipo elige su UI)?
3. **Placeholders:** ¿decidimos el mecanismo en el ADR (propongo **workflow de GitHub Actions al generar**), o tienes preferencia?
