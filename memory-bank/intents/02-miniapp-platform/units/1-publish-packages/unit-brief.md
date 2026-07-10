# Unit 1 — Publicación de paquetes compartidos

> Intent: 02-miniapp-platform · Estado: Borrador · Fecha: 2026-07-09 · Delta 1

## Propósito
Que `@org/miniapp-contract` y `@org/ui-kit` sean **instalables por versión** desde repos externos (miniapps) vía **GitHub Packages**. Es el prerequisito de todo lo demás.

## Alcance
- **`@org/miniapp-contract`:** ya es publicable (dist + publishConfig). Verificar/afinar el flujo de publicación (versión, `npm pack`, publish a GitHub Packages).
- **`@org/ui-kit`:** hoy `main: src/index.ts` (consumido como fuente). **Compilarlo a `dist`** (tsc/tsup, emitir JS + `.d.ts`), añadir `publishConfig`, `exports`, `files: ["dist"]`. Cuidar que las primitivas RN (peerDeps react/react-native) se resuelvan en el consumidor.
- **Consumo:** documentar `.npmrc` (`@org:registry=...`, token `read:packages`) para repos externos.
- **Versionado:** semver; changelog en cambios de contrato (major si rompe el manifest).

## Clasificación
- Infra compartida (paquetes publicados). Sin nativos. **Bloquea Units 2, 3, 4.**

## Dependencias
- Reutiliza ADR-002 (GitHub Packages). Ninguna unidad previa.

## Stories
- S1.1 — `ui-kit`: build a `dist` (JS + tipos) + publishConfig/exports; el host lo consume igual.
- S1.2 — Verificar publicación de ambos: `npm pack` limpio + (opcional) publish real a GitHub Packages con token.
- S1.3 — Documentar consumo externo (`.npmrc` + token) para repos de miniapps.

## Criterios de aceptación
- `@org/ui-kit` y `@org/miniapp-contract` producen tarballs válidos (`npm pack`) con `dist` + `.d.ts`.
- El host sigue compilando/tests verdes consumiéndolos (fuente o publicado).
- Un `.npmrc` documentado permite a un repo externo instalarlos por versión.
