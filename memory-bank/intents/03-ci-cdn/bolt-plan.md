# Bolt Plan — Intent 03 (CI + CDN)

> Fase: **Inception → Construction** · Estado: **Borrador (esperando validación humana)** · Fecha: 2026-07-09
> Cada bolt se ejecuta con `/bolt-start` (Model → Design → ADR → Implement → Test).

## Secuencia y dependencias
```
Bolt 1 (Registry → KV) ──► Bolt 2 (Chunk storage Blob + upload auth) ──┬──► Bolt 3 (Miniapp CI)
                                                                        └──► Bolt 4 (Deploy Vercel)
```
Bolt 3 (CI) y Bolt 4 (deploy) pueden ir en paralelo tras Bolt 2.

## Bolt 1 — Registry → Vercel KV
- **Stories:** S1.1, S1.2, S1.3.
- **Entrega:** `kvStore` (impl KV de RegistryStore) + selección por env + seed del catálogo + tests con KV in-memory.
- **Done:** el registry persiste en KV sin cambiar dominio/rutas; dev sigue con JSON fs; tests verdes.
- **ADR:** RegistryStore sobre Vercel KV (migración, misma interfaz).

## Bolt 2 — Chunk storage (Blob) + upload autenticado
- **Stories:** S2.1, S2.2, S2.3.
- **Entrega:** `ChunkStorage` (interfaz + Vercel Blob) + `POST /api/miniapps/:id/upload` (auth token, zip → Blob → publishVersion) + errores tipados.
- **Done:** upload con token → chunks en Blob, versión registrada, resolve devuelve URL de CDN; sin token → 401/403; tests con Blob+store mockeados.
- **Depende de:** Bolt 1. **ADR:** ChunkStorage/Blob (layout `<id>/<version>/`, zip) + auth por token de servicio.

## Bolt 3 — Miniapp CI (GitHub Actions)
- **Stories:** S3.1, S3.2, S3.3.
- **Entrega:** `ci.yml` real (build → zip → upload autenticado) en el **template** y en `miniapp-account-dashboard`; secrets documentados.
- **Done:** el workflow buildea y sube el chunk (verificado con endpoint mockeado/dry-run; run real requiere org + deploy + secrets).
- **Depende de:** Bolt 2 (endpoint de upload).

## Bolt 4 — Deploy de Backstage a Vercel
- **Stories:** S4.1, S4.2, S4.3.
- **Entrega:** config de deploy + provisión Blob/KV (Marketplace) + env/secrets (`vercel env`) + smoke; host apunta a la URL de Vercel.
- **Done:** Backstage en Vercel con KV+Blob; smoke verde (requiere cuenta Vercel + org reales; sin eso, config lista + `vercel build`/dry-run documentado).
- **Depende de:** Bolts 1, 2.

## Después del intent
- **Intent 04 (futuro):** integridad criptográfica de chunks (sha256/firma, ADR-008), OIDC en vez de token de servicio, canales (canary/stable) y rollback avanzado, auth de usuarios en Backstage.
- Build nativo del host (bloqueo de entorno) — independiente; para correr la app en device.

## Checkpoints humanos (obligatorios)
- Tras cada artefacto de Inception (hecho).
- Al inicio de cada bolt (Design/ADR) y antes de cerrar el intent.

## Riesgos
- Requiere **cuenta Vercel + org de GitHub reales** para el flujo end-to-end real (deploy, Blob, KV, publish); el diseño/tests avanzan con mocks.
- Subida multi-archivo por **zip** (definir formato/tamaño en Design).
