# ADR-013 — GitProvider (interfaz + impl GitHub) para el scaffolder

> Bolt: 02-4-backstage-scaffolder · Estado: **Aceptada** (checkpoint 2026-07-09)

## Contexto
El scaffolder de Backstage crea un repo git nuevo desde el `miniapp-template`. La creación depende de una API externa (GitHub) con token, pero la **lógica de orquestación** (validar + registrar) debe ser testeable sin red.

## Decisión
- **`GitProvider` (interfaz):** `createFromTemplate({templateRepo,name,owner}) → {repoUrl}`. Aísla la API git.
- **`githubProvider(token)`:** impl con la API REST de GitHub `POST /repos/{tpl_owner}/{tpl}/generate` (`Accept: application/vnd.github+json`, `Authorization: Bearer <token>`); mapea fallos HTTP a `GitProviderError`.
- **`mockProvider`:** para tests (sin red).
- **Dominio `scaffoldMiniapp`** recibe el `GitProvider` **inyectado** → testeable con mock.
- **Auth:** `GITHUB_TOKEN` (scope `repo`) por **env**, nunca en código ni logs. `templateRepo` por env `MINIAPP_TEMPLATE_REPO`.

## Consecuencias
- (+) Orquestación 100% testeable (mock); la impl real queda aislada.
- (+) Cambiar de proveedor (GitLab) = otra impl de la misma interfaz.
- (−) La creación **real** de un repo solo se prueba con org + token reales → documentada, no ejecutada en CI (org placeholder hoy).
- (−) El repo generado se personaliza por su propio workflow (`init-template.yml`, ADR-011); el scaffolder no espera ese resultado (async, fuera del request).
