# Bolt 02-4 — Scaffolder · Etapa 2: DESIGN

> DDD stage 2/5 · Estado: **Borrador** · Fecha: 2026-07-09 · Repo `backstage-web`

## 1. Estructura nueva (en backstage-web)
```
lib/git/
├── types.ts             GitProvider (interfaz) + GitProviderError
├── github.ts            githubProvider(token) → POST /repos/{tpl}/generate
└── mock.ts              mockProvider (tests)
lib/scaffold.ts          scaffoldMiniapp(reg, provider, {id,name,owner}) — PURO (orquesta)
lib/config.ts            templateRepo (env MINIAPP_TEMPLATE_REPO) + token (env GITHUB_TOKEN)
app/api/scaffold/route.ts   POST /api/scaffold
app/create/page.tsx      página (server) → <CreateForm/> (client)
app/components/CreateForm.tsx   formulario (client) → POST /api/scaffold → muestra repoUrl
+ tests Vitest de cada capa
```

## 2. GitProvider
```ts
interface GitProvider {
  createFromTemplate(i: { templateRepo: string; name: string; owner: string }): Promise<{ repoUrl: string }>
}
```
- **github.ts:** `fetch("https://api.github.com/repos/${templateRepo}/generate", { method:"POST", headers:{ Authorization:`Bearer ${token}`, Accept:"application/vnd.github+json" }, body: JSON.stringify({ owner, name, private:true }) })` → `html_url`. Errores HTTP → `GitProviderError`.
- **mock.ts:** devuelve `{ repoUrl: `https://github.com/${owner}/${name}` }` sin red.

## 3. Dominio (`scaffold.ts`, puro)
`scaffoldMiniapp(reg, provider, {id,name,owner})`:
1. `parseMiniappId(id)` → inválido → `InvalidManifestError`.
2. `reg[id]` existe → `MiniappExistsError`.
3. `provider.createFromTemplate({ templateRepo, name:"miniapp-"+id, owner })`.
4. `registerMiniapp(reg, {id,name,owner})`.
5. return `{ registry, repoUrl }`.

## 4. Endpoint (`/api/scaffold`)
- Valida body (id/name/owner) → carga store → `scaffoldMiniapp(reg, githubProvider(token), …)` → `jsonStore.save` → `201 { id, repoUrl }`.
- Errores → `statusForError` extendido: `GitProviderError → 502`. (400 id/campos, 409 existe.)

## 5. UI (`/create`)
- `CreateForm` (client): inputs id/name/owner + botón → `fetch("/api/scaffold", POST)` → muestra `repoUrl` (enlace) o el error. Estado de carga.

## 6. Tests (Vitest)
- `scaffold.test.ts`: mockProvider → éxito (crea+registra), id inválido, ya existe, `GitProviderError`.
- `scaffold-route.test.ts`: endpoint 201/400/409/502 (provider + store mockeados).
- `CreateForm.test.tsx`: render, submit (fetch mockeado) → muestra repoUrl; estado de error.

## 7. ADR
- **ADR-013** — `GitProvider` (interfaz + impl GitHub `generate from template`), auth por token env, mock inyectable en dominio/endpoint.

## Nota
Verificación por mocks; la creación **real** de un repo requiere org + token → documentada, no ejecutada (org placeholder).
