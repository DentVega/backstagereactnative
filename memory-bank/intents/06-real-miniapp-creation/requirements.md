# Intent 06 — Creación real de miniapps desde Backstage · REQUIREMENTS

> Inception · Fecha: 2026-07-10 · Tipo: **activación** (web Backstage + Ops)
> Alcance elegido por el usuario: **activación real completa**.

## Business intent
Que desde la UI de Backstage se pueda **crear una miniapp de verdad**: un click genera un
**repo git nuevo** (desde el template), lo **registra** en el catálogo, y ese registro
**persiste**. Cierra el bucle "Spotify for Backstage": crear → aparece en el catálogo.

## Estado actual (ya existe — Intent 02, ADR-013/011/016)
- `POST /api/scaffold` → `scaffoldMiniapp` → `githubProvider.createFromTemplate` (GitHub REST
  *generate*) → registra en el registry. Página `/create` + `CreateForm`.
- El template `DentVega/miniapp-template` sustituye `__MINIAPP_ID__` al generar
  (`init-template.yml`, ADR-011) → el repo creado queda usable. Su CI publica el chunk (ADR-016).

## Brechas a cubrir (esto es lo nuevo)
1. **Entrada en la UI** — no hay enlace/botón a `/create` desde header ni catálogo.
2. **Persistencia en el deploy** — `getStore()` cae a `jsonStore` (fs read-only en Vercel) →
   una creación no persiste. Necesita **KV (Upstash Redis)** para que el registro sobreviva.
3. **Config real** — `GITHUB_TOKEN` (scope `repo`) + `MINIAPP_TEMPLATE_REPO=DentVega/miniapp-template`.
4. **Autorización / anti-abuso** — la demo es pública (tras login GitHub): cualquier usuario
   logueado podría crear repos en la cuenta DentVega. Hay que **restringir quién puede crear**.

## Requisitos funcionales
- **RF1** Botón "＋ Crear miniapp" visible en el catálogo (y/o header) → `/create`.
- **RF2** `/create` pulido: validación de `id` (formato del contrato), estados claros
  (enviando / creado con link al repo + link al detalle en el catálogo / error accionable).
- **RF3** La creación **persiste** en el registry del deploy (KV) y aparece en `/catalog`.
- **RF4** La creación genera un **repo real** en GitHub desde el template.
- **RF5** **Guard de autorización**: solo logins permitidos pueden crear (allowlist por env,
  por defecto = dueño del deploy). El resto recibe un 403 claro ("creación restringida en la demo").

## Requisitos no funcionales / seguridad
- `GITHUB_TOKEN`, `PUBLISH_TOKEN`, credenciales KV **solo por env/secret** — nunca en código/logs.
- El token del scaffolder vive server-side; jamás llega al navegador.
- Rate-limit básico o allowlist estricta para proteger la cuenta en la demo pública.
- Idempotencia/errores del dominio ya cubiertos (`MiniappExistsError`, `InvalidManifestError`).

## Fuera de alcance
- Rediseñar el dominio del scaffolder (ya existe y está testeado).
- Borrar/editar miniapps, gestión de versiones desde la UI (futuro).
- Multi-tenant / orgs reales (se difiere; hoy owner = cuenta del deploy).

## Criterios de aceptación
- Un usuario **autorizado** entra a Backstage → "＋ Crear miniapp" → rellena id/name/owner →
  se crea el repo en GitHub, aparece en el catálogo y **persiste** tras recargar.
- Un usuario **no autorizado** recibe un 403 claro, sin crear nada.
- Sin secretos en el repo; tests verdes; smoke E2E en el deploy.
