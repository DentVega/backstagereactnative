# Bolt Plan — Intent 02 (Plataforma de miniapps)

> Fase: **Inception → Construction** · Estado: **Borrador (esperando validación humana)** · Fecha: 2026-07-09
> Cada bolt se ejecuta con `/bolt-start` (Model → Design → ADR → Implement → Test).

## Secuencia y dependencias
```
Bolt 1 (Publicar paquetes) ──► Bolt 2 (Template) ──┬──► Bolt 3 (Migrar account-dashboard)
                                                    └──► Bolt 4 (Scaffolder Backstage)
```
Bolt 3 y Bolt 4 pueden ir en paralelo tras Bolt 2.

## Bolt 1 — Publicar paquetes compartidos
- **Stories:** S1.1, S1.2, S1.3.
- **Entrega:** `@org/ui-kit` compilado a `dist` + publishable; ambos paquetes verificados (`npm pack`); `.npmrc` de consumo documentado.
- **Done:** tarballs válidos con `dist`+`.d.ts`; host sigue verde; consumo externo documentado.
- **ADR:** publicar ui-kit (build a dist, impacto en el consumo del host).

## Bolt 2 — Template de miniapp (GitHub template repo)
- **Stories:** S2.1, S2.2, S2.3.
- **Entrega:** `miniapp-template` (Re.Pack remote que expone `./Entry`, deps a `@org/*` publicados, manifest, placeholders, README) marcado como template en GitHub.
- **Done:** el template compila un chunk remote standalone; instala los `@org/*`; placeholders + README presentes.
- **Depende de:** Bolt 1. **ADR:** mecanismo de sustitución de placeholders.

## Bolt 3 — Migrar account-dashboard a su repo
- **Stories:** S3.1, S3.2, S3.3.
- **Entrega:** repo `miniapp-account-dashboard` (código migrado, deps publicados, dev server); host sin `miniapps/*`; Backstage apunta a la URL externa.
- **Done:** miniapp compila fuera del monorepo (13 tests verdes); host verde sin `miniapps/*`; resolve coherente.
- **Depende de:** Bolts 1, 2. **ADR:** consumo externo del host en dev (URL del dev server).

## Bolt 4 — Scaffolder en Backstage
- **Stories:** S4.1, S4.2, S4.3.
- **Entrega:** `GitProvider` (interfaz + impl GitHub) + `POST /api/scaffold` + página `/create`; crea repo desde el template + registra.
- **Done:** scaffold crea repo (GitHub API, mock en test + creación real manual) + registra + devuelve repoUrl; errores tipados; token por env.
- **Depende de:** Bolt 2 (+ registry del intent 01). **ADR:** `GitProvider` + auth por token.

## Después del intent (diferido → Intent 03 / Operations)
- **Delta 5 — CI por miniapp:** pipeline que buildea el chunk → CDN → `POST /api/miniapps/:id/publish`.
- **Delta 6 — CDN/almacenamiento** de artefactos (elegir proveedor).
- Sustitución automática de placeholders end-to-end; auth en Backstage; firma/integridad de chunks.

## Checkpoints humanos (obligatorios)
- Tras cada artefacto de Inception (hecho).
- Al inicio de cada bolt (Design/ADR) y antes de cerrar el intent.

## Riesgos
- Org/owner real de GitHub (placeholder hasta tenerlo) — bloquea publish/scaffold reales, no el diseño/tests con mocks.
- Build nativo del host (bloqueo de entorno, intent 01) — independiente; el montaje real en device sigue pendiente de resolver el toolchain.
