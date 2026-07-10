# Unit 2 — Host Runtime (loader de miniapps + shell)

> Intent: 01-vertical-slice · Estado: Borrador · Fecha: 2026-07-09

## Propósito
Convertir el host vacío en un runtime capaz de **resolver, descargar, verificar y montar** una miniapp federada, con navegación base, shell de auth/sesión (mock) y **fallback** robusto.

## Alcance
- `packages/host-runtime`: función `resolve()` (llama a Backstage), descarga del chunk (Re.Pack ScriptManager), **verificación de manifest**, montaje de `./Entry`, inyección de **capabilities scoped**, y **fallback** en error/skew.
- Navegación nativa base (native-stack) en `apps/host`.
- Shell de auth/sesión **mock** (Zustand) — sesión vive solo en host; expone capabilities revocables a la miniapp.
- ADR: mecanismo de verificación de integridad del chunk (hash vs. firma).

## Clasificación
- **Host** (núcleo, siempre presente). **Módulos nativos:** ninguno en este slice.
- Provee singletons `shared` (eager) a los remotes.

## Dependencias
- Requiere **Unit 1** (scaffold host, contract). Consume el endpoint de **Unit 4** (`/api/resolve`) — se puede desarrollar contra un mock del endpoint y luego integrar.

## Stories
- S2.1 — Navegación nativa base + shell de auth/sesión mock (Zustand, capabilities scoped).
- S2.2 — `host-runtime`: resolve + descarga + montaje de un remote vía Re.Pack ScriptManager.
- S2.3 — Verificación de manifest + fallback (chunk inalcanzable / skew de singletons) — con ADR.

## Criterios de aceptación
- El host resuelve una URL (real o mock) y **monta un remote** de prueba.
- Chunk inalcanzable o manifest inválido → **fallback visible, sin crash**, log sin PII.
- La miniapp recibe capabilities scoped, nunca credenciales.
- ≥1 test RNTL del shell/fallback; unit tests de la lógica de resolve/verify.
