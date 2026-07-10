# Retrospectiva — Intent 03 (ci-cdn) + arco del ciclo

> Fecha: 2026-07-10 · Análisis (sin cambios de código). Intent activo: `03-ci-cdn`.
> Cubre el Intent 03 en detalle y referencia los Intents 01/02 para la fricción transversal.

## 1. Qué se construyó

### Intent 03 (ci-cdn) — 4 bolts, MVP completo (prep)
| Bolt | Entrega | Tests |
|---|---|---|
| 03-1 Registry→KV | `kvStore` (Upstash) + `getStore()` env-selection + `seedRegistry` | 42 (Backstage) |
| 03-2 Chunk storage + upload | `ChunkStorage` (Vercel Blob) + `POST /upload` autenticado | 48 (+6) |
| 03-3 Miniapp CI | `publish.mjs` reutilizable + `ci.yml` (template + account-dashboard) | e2e local real |
| 03-4 Deploy Vercel (prep) | `/api/seed` + host env-aware (DefinePlugin) + `DEPLOY.md` | 50 (+2) |

**Flujo probado end-to-end en local:** CI (`build→zip→publish.mjs`) → `/upload` (token) → Blob/fs → registry (KV/json) → `/resolve` devuelve la URL.

### Arco completo (3 intents)
- **01-vertical-slice** (4 bolts): monorepo RN + Re.Pack (MF v2), miniapp Dashboard, Backstage registry, loader host↔Backstage. **100 tests**.
- **02-miniapp-platform** (4 bolts): publicar `@org/*`, template de miniapp (GitHub), sacar account-dashboard a repo propio, scaffolder Backstage.
- **03-ci-cdn** (4 bolts): KV, Blob+upload, CI, deploy-prep.
- **Escala:** 4 repos (host móvil, `backstage-web`, `miniapp-template`, `miniapp-account-dashboard`) · **17 ADRs** · **~124 tests verdes** (61 móvil + 50 Backstage + 13 miniapp).

## 2. Decisiones clave (ADRs) y si aguantaron

| ADR | Decisión | ¿Aguantó? |
|---|---|---|
| 002 / 010 | Contrato+ui-kit publicados (GitHub Packages, doble consumo `publishConfig`) | ✅ `pnpm pack` limpio; doble consumo (src dev / dist publicado) funcionó sin tocar el host |
| 004 | FlashList nativo en host + JS shared singleton | ✅ conceptualmente; sin validar en device (build nativo bloqueado) |
| 007 | Testing web (Vitest/RTL) — las skills RN no aplican a Backstage | ✅ clave; evitó forzar RNTL en web |
| 009 | Loader dinámico tras `ChunkLoader` inyectable | ✅ hizo testeable todo el loader sin device |
| 011 | Placeholders del template por workflow GitHub Actions | ⚠️ no ejecutado (sin org); revisado por lectura |
| 012 | account-dashboard como repo externo | ✅ el host lo consume por URL+contrato; monorepo sin `miniapps/*` |
| 013 / 016 | GitProvider + publish.mjs reutilizables (mock/e2e) | ✅ orquestación testeable; e2e local real |
| 014 / 015 | RegistryStore→KV (una clave) + ChunkStorage→Blob + token de servicio | ✅ selección por env; local intacto |
| 008 | Integridad cripto **diferida** (IntegrityVerifier no-op) | ✅ decisión consciente; sigue siendo deuda para prod |
| 017 | Deploy Vercel prep + runbook manual | ✅ prep verificada; deploy real = usuario |

**Patrón que más rindió:** **inyección de dependencias + interfaces** (`ResolveClient`, `ChunkLoader`, `GitProvider`, `ChunkStorage`, `RegistryStore`, `KvClient`). Permitió verificar flujos cloud/nativos **sin la infra real** (mocks, tarballs, `file:`, zip real, KV in-memory, fsStorage). Fue la palanca que mantuvo el avance con `@org`/Vercel/GitHub como placeholders.

## 3. Fricción (datos, no fallos)

1. **Build nativo del host — bloqueo de entorno (la fricción #1 del ciclo).** Se invirtió muchísimo en Operations del Intent 01. Diagnóstico decisivo: **un RN 0.76 vanilla nuevo también falla** → es el entorno Android de la máquina, no el proyecto (ni pnpm, ni Re.Pack, ni miniapps). Se probó y **revirtió la Opción A** (host fuera del workspace) al confirmar que no era el symlink. Lección: **hacer el test "vanilla nuevo" temprano** ahorra horas de perseguir al proyecto.
2. **`@module-federation/enhanced` debe fijarse a 0.9.0** (2.x rompe con Re.Pack 5.2.5) — gotcha caro, ya en `tech-stack.md`.
3. **Pins de módulos nativos se despinaron** (`react-native-screens` `^4.11.1`→4.25.2 tras el revert de Opción A) → rompió el bundle por codegen. **Reincidente** (pasó 2 veces). Los rangos caret son peligrosos con RN 0.76.
4. **pnpm + herramientas ajenas:** jest `transformIgnorePatterns` para `.pnpm/` (móvil) vs npm flat (repos migrados); `@swc/helpers` y `@module-federation/*` hoisteados; resolución cross-repo de `ui-kit` como fuente (jest seguía el symlink al `.pnpm` del móvil). Cada migración de repo re-tocó la config de jest.
5. **jsdom corrompe multipart binario** en Vitest → el test de `/upload` necesitó `// @vitest-environment node`. No obvio.
6. **`next start` no sirve archivos añadidos a `public/` en runtime** → el chunk de `fsStorage` daba 404 con prod build (sí con `next dev`/Blob). Sorpresa de activación.
7. **Builds stale:** correr el e2e contra `pnpm start` sin rebuild usó código viejo (getStorage). Recordatorio de rebuild tras cambios.
8. **Placeholders `@org` / cuenta Vercel / org GitHub** — presentes todo el ciclo; obligaron a verificar con mocks/tarballs. No frenaron el diseño, pero difieren toda validación cloud/publish real.
9. **Corrección de arquitectura a mitad de camino:** en el slice, la miniapp vivía en el monorepo; el usuario aclaró que debe ser **repo propio creado por Backstage**. Se corrigió en Intent 02 (system-architecture "3 planos"). La federación ya lo soportaba sin cambios — buena señal de la arquitectura.

## 4. Recomendaciones (sugeridas, no aplicadas)

### A. Standards update (`memory-bank/standards/`)
- **A1 — Pinear EXACTO los módulos nativos** (react-native-screens 4.11.1, safe-area 4.14.1, flash-list 1.7.6) en `tech-stack.md`, con nota "no usar caret con RN 0.76" (fricción #3, reincidente).
- **A2 — `testing-standards.md`:** añadir "tests que manejan binario/multipart corren en `// @vitest-environment node`" (fricción #5) y "repos npm-flat usan `transformIgnorePatterns` distinto al `.pnpm/` del monorepo" (fricción #4).
- **A3 — `system-architecture.md`:** ya actualizado a 3 planos; añadir la nota "verificar builds nativos con un **vanilla nuevo** antes de culpar al proyecto" (fricción #1).

### B. Process change
- **B1 — Test "vanilla nuevo" temprano** ante cualquier fallo de build nativo/tooling opaco: crear un proyecto limpio y reproducir antes de perseguir la config del proyecto (habría ahorrado la Opción A completa).
- **B2 — Rebuild antes de e2e** contra `pnpm start`/prod (fricción #7): checklist de "rebuild si tocaste server code".
- **B3 — Marcar los bolts como "RN / web / tooling-CI"** al planificar, para saltar las etapas de test RN (RNTL/agent-device) en los que no aplican (Backstage, CI, packaging) — se hizo ad-hoc vía ADR-007; conviene explícito en el bolt-plan.

### C. Deferred → `DEFERRED.md` (crear)
- Integridad criptográfica de chunks (sha256/firma) — ADR-008.
- Auth de usuarios en Backstage + OIDC (en vez de token de servicio) — intent 04.
- Canales de release (canary/stable) + rollback avanzado.
- KV per-id (en vez de una clave para todo el registry) — ADR-014.
- Servir chunks de dev por una route (`/chunks/[...]`) para que `next start` local sirva fsStorage.
- **Desbloquear el build nativo del host** (otro JDK / reinstalar SDK en ruta estándar / Android Studio) — activation-checklist.

### D. Feedback para el plugin (rn-repack-aidlc)
- **D1 — Etapa Test adaptativa:** el `bolt-start` prescribe "RNTL + agent-device" y "vercel-react-native-skills" en TODOS los bolts, pero muchos son web/CI/tooling puro (Backstage, KV, Blob, publish, deploy). El plugin debería elegir el toolset de test por tipo de bolt (RN vs web vs tooling).
- **D2 — `setup-skills` tenía repos/nombres incorrectos:** `vercel-react-native-skills` está en `vercel-labs/agent-skills` (no `callstackincubator`), y los nombres llevan prefijo `vercel-`. Corregir el comando.
- **D3 — Modelo de miniapps:** el flujo asume miniapps dentro del monorepo; el patrón real "un repo por miniapp creado por Backstage" (que el usuario pidió) merece ser el default en las plantillas/`federation-analyst`.
- **D4 — Soporte pnpm-monorepo + RN nativo:** documentar los gotchas (gradle-plugin devDeps, transformIgnorePatterns, module-federation/enhanced pin) como parte del `repack-init`/standards, ya que son recurrentes.

## 5. Veredicto
Ciclo muy productivo: 3 intents, 12 bolts, ~124 tests, 4 repos, la plataforma "Spotify for miniapps" **diseñada y verificada localmente end-to-end**. La fricción se concentró en **entorno/infra externa** (build nativo Android, cuentas cloud/org) — NO en la lógica ni la arquitectura, que aguantaron y absorbieron una corrección de rumbo importante (miniapps en repos propios) sin refactor. El patrón de **interfaces inyectables** fue lo que permitió avanzar sin la infra real.
