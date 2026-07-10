# Intent 02 — Plataforma de miniapps (scaffolder + repos independientes)

> Fase: **Inception** · Estado: **Borrador (esperando validación humana)** · Fecha: 2026-07-09

## 1. Intención de negocio
Convertir la prueba de concepto (intent 01) en la **plataforma real "Spotify for miniapps"**: cada miniapp vive en **su propio repo git**, se **crea desde Backstage** (scaffolder) a partir de un **template**, y el **host la consume en runtime** vía Module Federation — sin tener su código. (Ver `standards/system-architecture.md`, "Three-plane architecture".)

## 2. Objetivo de este intent (MVP = deltas 1-2-3-4)
1. **Publicar** `@org/miniapp-contract` + `@org/ui-kit` a **GitHub Packages** (para que repos de miniapps separados los instalen).
2. **Template de miniapp**: un **GitHub template repo** con el boilerplate Re.Pack (expone `./Entry`, depende de los `@org/*` publicados, manifest, README).
3. **Sacar `account-dashboard`** del monorepo móvil → su **propio repo** (1ª miniapp de referencia, alineada al template); el host la resuelve/monta como remote externo.
4. **Scaffolder en Backstage**: "Create miniapp" (`id`, `name`, `owner`) → usa la **API de GitHub ("generate from template")** para crear un repo nuevo + lo **registra** en el registry.

## 3. En alcance
- **Publicación de paquetes:** `contract` y `ui-kit` con `publishConfig` a GitHub Packages; versionado semver; el **host los consume por versión** (ya no `file:`/workspace para el contrato en el flujo cross-repo).
- **`miniapp-template` (GitHub template repo):** proyecto Re.Pack MF que expone `./Entry`; `package.json` depende de `@org/miniapp-contract` + `@org/ui-kit` (rango); `manifest.json` (id/version/entry/shared/capabilities); README con el runbook de dev; placeholders sustituibles (`__MINIAPP_ID__`, `__MINIAPP_NAME__`).
- **`account-dashboard` migrada** a su repo propio, generada desde/consistente con el template; su dev server sirve el chunk; Backstage la resuelve por su URL.
- **Backstage scaffolder:** endpoint + UI mínima "Create miniapp" → GitHub API `POST /repos/{template_owner}/{template_repo}/generate` → crea repo `miniapp-<id>` → sustituye placeholders (o deja README con instrucciones) → `registerMiniapp` en el registry.
- **Host:** ajusta el resolver/serving para consumir la miniapp externa (URL de su dev server); quita `miniapps/*` del workspace (queda vacío).

## 4. Fuera de alcance (diferido → intent 03 / Operations)
- **CI por miniapp** (build chunk → subir a CDN → `publish` a Backstage) — delta 5.
- **CDN/almacenamiento de artefactos** en prod — delta 6 (se diseña detrás de una interfaz; dev usa server local).
- Auth en Backstage, firma/integridad criptográfica de chunks (siguen diferidos de intent 01).
- Migración de más features bancarias.

## 5. Actores
- **Platform dev / admin:** crea miniapps desde Backstage (scaffolder).
- **Miniapp dev (equipo dueño):** codea en el repo generado, corre su dev server.
- **Host runtime:** resuelve y monta miniapps externas.

## 6. User stories
- **US-1:** Como plataforma, publico `@org/miniapp-contract` y `@org/ui-kit` a GitHub Packages para que cualquier repo de miniapp los instale por versión.
- **US-2:** Como miniapp dev, tengo un **template** que clono/genero y me da un remote Re.Pack listo (expone `./Entry`, contrato, ui-kit).
- **US-3:** Como equipo, `account-dashboard` vive en **su propio repo** y el host la monta igual que antes (resuelta por Backstage).
- **US-4:** Como platform dev, desde Backstage hago **"Create miniapp"** y se **crea un repo git nuevo** desde el template + queda **registrado**.
- **US-5:** Como host, resuelvo y monto una miniapp **que no está en mi repo** (solo su URL + contrato).

## 7. Requisitos no funcionales
- **Desacople:** el host NO conoce el código de las miniapps; solo contrato + URL. Las miniapps NO se conocen entre sí.
- **Versionado:** contract/ui-kit semver; un cambio incompatible del contrato = major + coordinar.
- **Seguridad:** tokens de GitHub para publicar/crear repos NUNCA en el código (env/CI secrets). Sin PII/secretos en templates ni manifests.
- **DX:** crear una miniapp nueva debe ser un paso ("Create miniapp") + clonar + codear + correr dev server.

## 8. Criterios de aceptación del intent
- [ ] `@org/miniapp-contract` y `@org/ui-kit` **publicados** a GitHub Packages e instalables por versión desde un repo externo.
- [ ] Existe el **`miniapp-template`** (GitHub template repo) que compila un remote Re.Pack que expone `./Entry`.
- [ ] `account-dashboard` está en **su propio repo**, y el host la **resuelve + monta** vía Backstage (con el device/entorno operativo, o verificado por build + resolve en dev).
- [ ] Backstage **"Create miniapp"** crea un repo nuevo desde el template (GitHub API) + lo registra; verificado (o mockeado el API en test + una creación real manual).
- [ ] Tests: dominio del scaffolder (validación de id/owner, llamada al GitProvider mockeado) verde; el template compila; el contrato/ui-kit publican (`npm pack`/dry-run).

## 9. Decisiones (checkpoint /aidlc-inception, 2026-07-09)
- MVP = deltas **1-2-3-4** (5-6 diferidos).
- Proveedor git = **GitHub**; mecanismo = **GitHub template repo** (`generate from template`).
- CDN/hosting de chunks = **decidir en Design/Operations** (interfaz; dev local por ahora).
- Registry de paquetes = **GitHub Packages** (ya ADR-002).

## 10. Preguntas abiertas (a resolver en system-context / ADRs)
- Org/owner de GitHub concreto para el scope `@org` y el template repo (placeholder hasta tener el dato).
- ¿El scaffolder sustituye placeholders vía un workflow post-generación, o el template usa un script `postinit`?
- ¿La UI de "Create miniapp" es una página en Backstage o solo el endpoint API para el MVP?
