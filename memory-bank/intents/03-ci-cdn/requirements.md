# Intent 03 — CI por miniapp + CDN de chunks (distribución automática)

> Fase: **Inception** · Estado: **Borrador (esperando validación humana)** · Fecha: 2026-07-09

## 1. Intención de negocio
Completar la plataforma: automatizar la **distribución** de miniapps. Hoy (intent 02) una miniapp se sirve a mano por su dev server y su URL se registra manual. Con esto, la **CI de cada miniapp** buildea el chunk, lo sube a un **CDN (Vercel Blob)** y **publica** `{version, url, manifest}` a Backstage; el host resuelve la URL del CDN y monta.

## 2. Objetivo (MVP = deltas 5-6, núcleo)
- **CI por miniapp (GitHub Actions):** build del chunk (Re.Pack) → subir a CDN → publicar a Backstage.
- **CDN = Vercel Blob:** los chunks viven en Blob (público), servidos por CDN; Backstage guarda/expone esas URLs.
- **Auth del publish = token de servicio:** el endpoint de publish/upload de Backstage exige un token (secret de la CI).
- **Deploy de Backstage a Vercel** para que Blob/CDN funcionen en prod.

## 3. En alcance
- **Backstage — recepción:** interfaz `ChunkStorage` + impl **Vercel Blob**; endpoint **autenticado** (token de servicio) que recibe el chunk + manifest, lo **almacena en Blob**, y **registra** `{version, url(CDN), manifest}` (reusa `publishVersion` del registry, intent 01).
- **Miniapp CI (GitHub Actions):** workflow real en el **template** (y en `miniapp-account-dashboard`): install (con acceso a GitHub Packages) → `webpack-bundle` del container → subir el chunk a Backstage (autenticado) → queda publicado. Reemplaza el `ci.yml` stub del template.
- **Deploy Backstage → Vercel:** config + env (`BLOB_READ_WRITE_TOKEN`, `PUBLISH_TOKEN`); store del registry compatible con Vercel (JSON fs no sirve en serverless → ver ADR).
- **Host:** sin cambios de código; `BACKSTAGE_BASE_URL` env-aware (dev vs prod); resuelve la URL del CDN.

## 4. Fuera de alcance (diferido)
- **Integridad criptográfica** del chunk (sha256/firma, ADR-008) — se decidió NO en este MVP; el hook queda para un intent posterior.
- **Auth completa/OIDC**: se usa token de servicio simple (no OIDC).
- **Multi-entorno/rollback avanzado, versionado de canales** (canary/stable) — futuro.
- Build nativo del host (bloqueo de entorno, independiente).

## 5. Actores
- **Miniapp CI:** buildea y publica automáticamente al hacer push/tag.
- **Backstage:** recibe, almacena (Blob), registra, resuelve.
- **Host runtime:** resuelve la URL del CDN y monta.

## 6. User stories
- **US-1:** Como equipo de miniapp, al hacer push mi **CI buildea el chunk y lo publica** sin pasos manuales.
- **US-2:** Como CI, subo el chunk a **Backstage/CDN** autenticándome con un **token de servicio**.
- **US-3:** Como Backstage, **almaceno el chunk en Vercel Blob** y registro su **URL de CDN** + manifest.
- **US-4:** Como host, resuelvo una miniapp y descargo su chunk desde el **CDN** (no un dev server local).
- **US-5:** Como plataforma, Backstage corre en **Vercel** con Blob configurado.

## 7. Requisitos no funcionales
- **Seguridad:** `BLOB_READ_WRITE_TOKEN` y `PUBLISH_TOKEN` por env/secret, nunca en código/logs. El upload rechaza sin token válido.
- **Idempotencia/versionado:** publicar la misma versión dos veces = error (reusa `VersionExistsError`); una versión nueva = nueva entrada.
- **Store en serverless:** el registry no puede depender de fs efímero en Vercel → almacenamiento persistente (ver ADR).
- **Tamaño:** el upload soporta chunks de varios MB.

## 8. Criterios de aceptación del intent
- [ ] La CI (GitHub Actions) del template/account-dashboard **buildea el chunk y lo publica** a Backstage (verificado con el flujo mockeado en test + un run real cuando haya org/deploy).
- [ ] Backstage **almacena en Vercel Blob** y `/api/resolve` devuelve una **URL de CDN** (Blob) válida.
- [ ] El endpoint de upload/publish **exige el token de servicio** (401/403 sin él).
- [ ] Backstage **desplegado en Vercel** con Blob + el registry persistente.
- [ ] Tests: `ChunkStorage` (Blob mockeado) + endpoint autenticado (200/401/409) + el workflow revisado.

## 9. Decisiones (checkpoint /aidlc-inception, 2026-07-09)
- MVP = **CI + CDN núcleo** + auth de publish con **token de servicio**.
- CDN = **Vercel Blob** (público) · CI = **GitHub Actions** · Backstage deploy = **Vercel**.
- Integridad criptográfica (sha256) = **diferida**.

## 10. Preguntas abiertas (a resolver en system-context / ADRs)
- **Store del registry en Vercel:** JSON fs no persiste en serverless → ¿Vercel KV/Edge Config, Postgres del Marketplace, o Blob como store simple? (ADR).
- **Upload:** ¿la CI sube el chunk **a Backstage** (que lo pone en Blob) o **directo a Blob** (con token) y solo publica la URL? Propuesta: vía Backstage (un solo secret, centralizado).
- Org/proyecto de Vercel + org de GitHub (placeholders hasta tenerlos).
