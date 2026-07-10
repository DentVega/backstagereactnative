# Unit 3 — Miniapp CI (GitHub Actions)

> Intent: 03-ci-cdn · Estado: Borrador · Fecha: 2026-07-09

## Propósito
La **emisión** automática: cada repo de miniapp buildea su chunk y lo publica a Backstage al hacer push/tag — sin pasos manuales.

## Alcance
- Workflow real `ci.yml` (reemplaza el stub del template) + añadido a `miniapp-account-dashboard`:
  1. checkout + setup-node + install (`.npmrc` → GitHub Packages, `GITHUB_TOKEN` read:packages).
  2. `react-native webpack-bundle` → `build/` (container + chunks).
  3. **zip** de `build/` → `POST ${BACKSTAGE_URL}/api/miniapps/<id>/upload` con `Authorization: Bearer ${PUBLISH_TOKEN}`, `version` (del package.json/tag) y `manifest.json`.
- Secrets del repo: `PUBLISH_TOKEN`, `BACKSTAGE_URL` (+ token de GitHub Packages).
- Dispara en push a `main` / tag `v*`.

## Clasificación
- CI (GitHub Actions), en cada repo de miniapp. **Depende de Unit 2** (endpoint de upload).

## Dependencias
- Unit 2 (upload autenticado en Backstage). El template (intent 02) ya tiene el stub a reemplazar.

## Stories
- S3.1 — Workflow `ci.yml`: build del chunk (install + webpack-bundle).
- S3.2 — Empaquetar (zip) + subir a `/upload` autenticado (version + manifest).
- S3.3 — Documentar secrets + aplicar el workflow al template y a account-dashboard.

## Criterios de aceptación
- El workflow, en un push, buildea el chunk y lo sube a Backstage (verificado con un endpoint mockeado en test/dry-run; run real requiere org + deploy + secrets).
- Secrets por repo, nunca en el YAML.
- Template y account-dashboard traen el workflow real.
