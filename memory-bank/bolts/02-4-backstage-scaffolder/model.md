# Bolt 02-4 — Scaffolder en Backstage · Etapa 1: MODEL

> DDD stage 1/5 · Estado: **Borrador** · Fecha: 2026-07-09 · Intent 02
> Código en repo `backstage-web` (Next.js) · Tests: Vitest (ADR-007). Cierra el MVP del Intent 02.
> Stories: S4.1 GitProvider · S4.2 endpoint · S4.3 página `/create`

Capacidad ① de la plataforma: desde Backstage, **crear un repo git nuevo** para una miniapp (desde el template) y **registrarla**.

## 1. Lenguaje ubicuo
| Término | Definición |
|---|---|
| **Scaffold** | Crear un repo nuevo desde el `miniapp-template` + registrarlo en el registry. |
| **GitProvider** | Abstracción de la API git (GitHub) para crear repos desde un template. |
| **Template repo** | `<org>/miniapp-template` (marcado template en GitHub). |
| **Repo generado** | `<owner>/miniapp-<id>` — el init-template.yml lo personaliza (ADR-011). |

## 2. Dominio del scaffold (puro, orquestación)
```
scaffoldMiniapp(reg, gitProvider, { id, name, owner }):
  1. id = parseMiniappId(id)              // contrato; inválido → error tipado
  2. si reg[id] existe → error (ya registrada)
  3. repoUrl = await gitProvider.createFromTemplate({ templateRepo, name: "miniapp-"+id, owner })
  4. reg' = registerMiniapp(reg, { id, name, owner })   // queda en el catálogo (sin versión aún)
  5. return { registry: reg', repoUrl }
```
- Reutiliza `parseMiniappId` (contrato) + `registerMiniapp` (registry, intent 01).
- Errores tipados: `MiniappExistsError` (ya existe), `InvalidManifestError`/id inválido, `GitProviderError` (fallo git).

## 3. GitProvider (interfaz)
```
interface GitProvider {
  createFromTemplate(input: { templateRepo: string; name: string; owner: string }): Promise<{ repoUrl: string }>
}
```
- **`githubProvider`**: API REST de GitHub `POST /repos/{tpl_owner}/{tpl}/generate` (header `Accept: application/vnd.github+json`, token `Bearer`). Devuelve `html_url`.
- **`mockProvider`**: para tests (no llama a la red).
- Token de GitHub por **env** (`GITHUB_TOKEN`), nunca en código/logs.

## 4. Contrato HTTP (S4.2)
- `POST /api/scaffold { id, name, owner }` → `scaffoldMiniapp` → `201 { id, repoUrl }`.
- Errores: `400` id inválido / campos faltantes · `409` ya registrada · `502` fallo del GitProvider.

## 5. UI (S4.3)
- Página `/create`: formulario (id, name, owner) → `POST /api/scaffold` → muestra el `repoUrl` (o el error).

## 6. Config
- `templateRepo` = `<org>/miniapp-template` (placeholder org). `GITHUB_TOKEN` por env.

## 7. Frontera
- El template lo consume/personaliza el workflow del repo generado (ADR-011). El scaffolder solo "genera + registra".
- Publicar la versión/URL de la miniapp (chunk) sigue siendo `POST /api/miniapps/:id/publish` (registry, intent 01) — no es parte del scaffold.

## Preguntas para el checkpoint
1. **Verificación:** propongo tests con `mockProvider` (dominio + endpoint + página) + una creación **real manual** documentada (requiere org + token). ¿OK?
2. **`scaffold` = solo crear+registrar** (la personalización de placeholders la hace el workflow del repo generado). ¿Confirmas ese límite, o quieres que el scaffolder también dispare/espere la personalización?
