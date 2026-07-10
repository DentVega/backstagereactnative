# Bolt 06-1 — Entrada + flujo de creación en la UI · PLAN (Model/Design/Decisión)

> Intent 06 · Repo `backstage-web` · Web, sin dominio nuevo · Fecha: 2026-07-10

## Model
El scaffolder ya existe; este bolt solo hace **alcanzable y claro** el flujo. Lenguaje:
- **id válido** = cumple el contrato `parseMiniappId` (`^[a-z0-9]+(?:[-_][a-z0-9]+)*$`).
- **Resultado** = repo creado (URL) + entrada en el catálogo (`/miniapp/<id>`).

## Design
- `app/catalog/page.tsx` — botón "＋ Crear miniapp" (link a `/create`) junto al título.
- `app/components/CreateForm.tsx`:
  - Validación en cliente del `id` con `parseMiniappId` → hint de formato + bloquear submit si inválido.
  - Estado `done` guarda el `id` creado → muestra link al repo **y** link al detalle `/miniapp/<id>`.
  - Mantener semántica de tests: botón `/crear miniapp/i`, `role=status` con la repoUrl, `role=alert` con el error.

## Decisión
- **Reusar `parseMiniappId` del contrato** (misma regla que el server) en vez de duplicar regex →
  cliente y servidor validan idéntico. No amerita ADR propio (sin decisión arquitectónica nueva).

## Test (RTL)
- Botón de creación presente en el catálogo.
- CreateForm: id inválido → hint + submit bloqueado (no fetch); id válido → submit;
  done → link repo + link detalle; error → alert. (Se conservan los 2 tests existentes.)
