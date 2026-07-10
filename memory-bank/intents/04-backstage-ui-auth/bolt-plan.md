# Bolt Plan — Intent 04 (Backstage UI + auth)

> Fase: **Inception → Construction** · Estado: **Borrador (esperando validación humana)** · Fecha: 2026-07-10
> Todo en `backstage-web`. Tests: **Vitest + RTL** (bolt web; RNTL/agent-device no aplican). Cada bolt = 5 etapas DDD.

## Secuencia y dependencias
```
Bolt 1 (Login GitHub) ──┐
Bolt 2 (Metadatos)   ────┼──► Bolt 3 (Estado CI) ──► Bolt 4 (UI detalle + catálogo)
                         │        (usa token U1 + repoUrl U2)
```
Bolt 1 y Bolt 2 son independientes (pueden ir en paralelo). Bolt 3 depende de 1+2. Bolt 4 depende de 1+2+3.

## Bolt 1 — Login con GitHub (Auth.js v5)
- **Stories:** S1.1, S1.2, S1.3.
- **Entrega:** Auth.js (GitHub, session con access_token) + `/signin` + middleware que gatea la UI (excluye API) + header (avatar/sign-out).
- **Done:** sin sesión → redirect a signin; con sesión → usuario visible; API no gateadas; tests con sesión mockeada verdes.
- **ADR:** Auth.js v5 + GitHub; middleware gatea solo UI; token server-side.

## Bolt 2 — Registry: metadatos (createdAt, repoUrl)
- **Stories:** S2.1, S2.2, S2.3.
- **Entrega:** `MiniappRecord` + createdAt/repoUrl; register/scaffold los setean; seed compatible.
- **Done:** nuevos registros con createdAt; scaffoldeados con repoUrl; registros viejos no rompen; tests verdes.
- **Depende de:** — (independiente). **ADR:** extender MiniappRecord con compat hacia atrás.

## Bolt 3 — Estado de CI (GitHub Actions API)
- **Stories:** S3.1, S3.2, S3.3.
- **Entrega:** `CiStatusProvider` (interfaz + impl GitHub + mock) + cache (~60s) + fallback `unknown`.
- **Done:** estado del último run; `unknown` ante fallo; cache; tests con API mockeada.
- **Depende de:** Bolts 1 (token) + 2 (repoUrl). **ADR:** CiStatusProvider + cache + fallback.

## Bolt 4 — UI de detalle + catálogo enriquecido
- **Stories:** S4.1, S4.2, S4.3.
- **Entrega:** `CiBadge`/`VersionList`/`MiniappHeader` + `/miniapp/[id]` + catálogo enriquecido.
- **Done:** detalle con todos los metadatos + CI + versiones + capabilities; catálogo con badge; tests RTL + detalle verdes.
- **Depende de:** Bolts 1, 2, 3.

## Después del intent (diferido → futuro)
- ACL por org/owner (filtrar miniapps por acceso del usuario).
- Scope amplio `repo`/`workflow` para CI de repos privados.
- Webhooks de GitHub (estado de CI en tiempo real), editar/borrar desde la UI, roles/permisos.

## Checkpoints humanos (obligatorios)
- Tras cada artefacto de Inception (hecho).
- Al inicio de cada bolt (Design/ADR) y antes de cerrar el intent.

## Riesgos
- App OAuth de GitHub (client id/secret) real = requerida para el login real; el diseño/tests avanzan con sesión mockeada.
- Rate limit de la GitHub API → cache + fallback.
