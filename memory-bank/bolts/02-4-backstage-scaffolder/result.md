# Bolt 02-4 — Scaffolder en Backstage · RESULT

> Estado: **COMPLETO** · Fecha: 2026-07-09 · Intent 02 · Stories: S4.1–S4.3
> Código en repo `backstage-web`. **Cierra el MVP del Intent 02.**

## Qué se construyó
La capacidad ① "Create miniapp": desde Backstage, crear un repo git nuevo desde el template (GitHub API) + registrarlo.

```
backstage-web/
├── lib/git/{types,github,mock}.ts   GitProvider (interfaz) + impl GitHub (generate) + mock
├── lib/scaffold.ts                  scaffoldMiniapp (PURO): valida → crea repo → registra
├── lib/config.ts                    TEMPLATE_REPO + GITHUB_TOKEN por env
├── app/api/scaffold/route.ts        POST /api/scaffold
├── app/create/page.tsx + components/CreateForm.tsx   página + formulario (client)
└── lib/http.ts                      + GitProviderError → 502
```

## Evidencia (verificado, no afirmado)
- **Tests (Vitest):** **37 passing** en 6 archivos (26 previos + 11 nuevos: scaffold 4 · route 5 · CreateForm 2).
  - Dominio: crea+registra (mock), id inválido (no toca el provider), duplicado (no crea repo), `GitProviderError` propaga.
  - Endpoint: 201 (fetch mockeado) · 400 campos/id · 409 duplicado · **502** fallo git.
  - CreateForm (RTL): submit → muestra repoUrl; error → alerta.
- **Typecheck:** limpio. **Build Next.js:** compila; rutas `/api/scaffold` + `/create`.
- **Runtime (server real):** `/create`→200 · `POST /api/scaffold` sin campos→400 · `/catalog`→200.

## Cobertura de stories
- **S4.1 GitProvider** ✓ — interfaz + `githubProvider` (`POST /repos/{tpl}/generate`, token env) + `mockProvider`.
- **S4.2 endpoint** ✓ — `POST /api/scaffold` con validación + orquestación + registro + errores tipados (400/409/502).
- **S4.3 página** ✓ — `/create` + `CreateForm` (form → endpoint → repoUrl/error).

## ADR
- ADR-013 — `GitProvider` (interfaz + impl GitHub, auth token env, mock inyectable).

## NO hecho / diferido (honesto)
- **Creación REAL de un repo:** requiere **org + `GITHUB_TOKEN`** reales (org placeholder) → verificado con mocks; una creación real es un paso manual documentado.
- Personalización de placeholders del repo generado = su propio workflow `init-template.yml` (ADR-011), async, fuera del request.
- Sin auth en Backstage (deuda de Operations).

## Cierre del Intent 02
MVP (deltas 1-2-3-4) **completo**: publicar paquetes · template · migrar account-dashboard · scaffolder. Diferido → Intent 03: CI por miniapp (delta 5) + CDN (delta 6).
