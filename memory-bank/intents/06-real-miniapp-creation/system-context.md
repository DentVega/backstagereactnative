# Intent 06 — Creación real de miniapps · SYSTEM CONTEXT

> Inception · Fecha: 2026-07-10

## Naturaleza técnica (preguntas RN estándar)
- **NO es un remote federado.** **NO es parte del bundle del host.** **NO usa módulos nativos.**
- Todo ocurre en **Backstage web** (Next.js) + **Operations** (provisión + secrets + deploy).
- El host móvil no cambia; se beneficia indirectamente (nuevas miniapps resolvibles).

## Topología (Module Federation) — dónde encaja la creación
```
[Usuario autorizado] → Backstage /create
        │  POST /api/scaffold (server, con guard de authz)
        ▼
  githubProvider.createFromTemplate   ──create──►  GitHub: DentVega/miniapp-<id>
        │                                            (init-template.yml sustituye __MINIAPP_ID__)
        ▼
  registerMiniapp → getStore().save()  ──persist──►  Upstash KV (registry)
        │
        ▼
  aparece en /catalog ; su CI (ADR-016) buildea el chunk → CDN → publish → el host lo resuelve
```

## Piezas que se tocan
- **UI**: `app/catalog/page.tsx` (botón), `app/layout.tsx` (nav), `app/create/page.tsx` +
  `CreateForm` (validación/estados). Web, sin nativos.
- **Authz**: nuevo guard server-side en `POST /api/scaffold` (lee la sesión Auth.js →
  compara login con allowlist de env). Puro y testeable.
- **Store**: `getStore()` ya selecciona **KV** si hay `KV_REST_API_URL`+`KV_REST_API_TOKEN`
  (ADR-014). Solo falta provisionar Upstash y migrar el seed a KV.
- **Config/Ops**: `GITHUB_TOKEN`, `MINIAPP_TEMPLATE_REPO=DentVega/miniapp-template`,
  credenciales Upstash — todo por env en Vercel.

## Decisiones de contexto
- **Guard por allowlist de logins** (`SCAFFOLD_ALLOWED_LOGINS`, CSV; por defecto = login del
  dueño del deploy). Con un solo `GITHUB_TOKEN` (PAT de DentVega) los repos se crean bajo
  DentVega igualmente → restringir a la allowlist protege la cuenta en la demo pública.
- **KV como store de prod** (Upstash Redis, ya soportado por `kvStore`/`upstashClient`).
- **Reusar el dominio existente** (`scaffoldMiniapp`, `registerMiniapp`, contrato) — sin reescribir.
- La sesión de Auth.js (Unit 1 del Intent 04) aporta el login para el guard; el token de repo
  es un PAT server-side independiente (no el token OAuth del usuario, que solo tiene `read:user`).
