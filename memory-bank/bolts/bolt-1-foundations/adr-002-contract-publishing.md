# ADR-002 — Publicación del contrato vía GitHub Packages

> Bolt: bolt-1-foundations · Estado: **Aceptada** (checkpoint 2026-07-09)

## Contexto
`@org/miniapp-contract` es el **único acoplamiento** entre el repo móvil (fuente del contrato) y el repo separado de Backstage (consumidor). Debe distribuirse como paquete versionado para que ambos repos fijen una versión y el contrato no derive. Candidatos: **GitHub Packages** o **npm privado dedicado**.

## Decisión
Publicar `@org/miniapp-contract` en **GitHub Packages** (npm registry de GitHub, scope `@org`).
- `publishConfig.registry` → `https://npm.pkg.github.com`.
- Ambos repos autentican con `GITHUB_TOKEN` (`.npmrc` con `@org:registry=...`).
- **Versionado semver:** todo cambio del contrato = **bump** (`major` si rompe el shape del manifest/resolve) + changelog. Publicación desde CI del repo móvil al taggear.

## Alternativas consideradas
- **npm privado dedicado (npm Pro/Verdaccio/otro):** más infra y credenciales que gestionar sin beneficio claro si el código ya vive en GitHub.

## Consecuencias
- (+) Cero infra nueva: el registry vive junto al repo; auth con tokens de GitHub.
- (+) Permisos por org/repo; el equipo de Backstage instala por versión.
- (−) Acopla la distribución a GitHub (aceptable dado el flujo actual).
- **Acción Implement:** `packages/miniapp-contract/package.json` con `name`, `version` inicial `0.1.0`, `exports`, `types`, `publishConfig`; `.npmrc` de ejemplo documentado. (La publicación real puede quedar como paso de CI; en Bolt 1 basta con que sea **publicable** y verificado con `npm pack`.)
