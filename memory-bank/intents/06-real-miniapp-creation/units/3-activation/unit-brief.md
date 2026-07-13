# Unit 3 — Persistencia + Activación (Operations)

> Intent: 06-real-miniapp-creation · Operations. No RN.

## Propósito
Que la creación funcione y persista de verdad en el deploy.

## Alcance
- **KV**: provisionar Upstash Redis (Vercel Marketplace) → setea KV_REST_API_URL/TOKEN →
  `getStore()` usa `kvStore` (ADR-014). Migrar el seed a KV (`seedRegistry` / `POST /api/seed`).
- **Config**: `GITHUB_TOKEN` (scope repo), `MINIAPP_TEMPLATE_REPO=DentVega/miniapp-template`,
  `SCAFFOLD_ALLOWED_LOGINS`, `PUBLISH_TOKEN` — todo por env/secret en Vercel.
- **Deploy + smoke E2E**: crear una miniapp desde la UI → repo real + aparece en catálogo +
  persiste tras recargar; no autorizado → 403.

## Dependencias
- Units 1 y 2. Cuenta Vercel (deploy vía import ya existente). PAT de GitHub del usuario.

## Stories
- S3.1 — Provisionar KV + migrar seed (persistencia verificada).
- S3.2 — Secrets/env reales (token, template, allowlist) + redeploy.
- S3.3 — Smoke E2E de creación (autorizado crea+persiste; no autorizado 403).

## Aceptación
- Registro persiste en KV; creación real genera repo; guard efectivo; documentado en
  `memory-bank/operations/` + activation-checklist.
