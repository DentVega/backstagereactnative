# Bolt 03-4 — Deploy Backstage a Vercel · Etapa 1: MODEL

> DDD stage 1/5 · Estado: **Borrador** · Fecha: 2026-07-10 · Intent 03 · **Cierra el MVP**
> Infra/Operations. Stories: S4.1 config+provisión · S4.2 env/secrets · S4.3 deploy+smoke

Poner Backstage en **producción (Vercel)** con Blob + KV reales, para que el CDN y la persistencia funcionen fuera de local.

## 1. Lenguaje ubicuo
| Término | Definición |
|---|---|
| **Deploy** | Publicar Backstage (Next.js) en Vercel. |
| **Provisión** | Crear Blob + KV (Upstash) vía el Marketplace de Vercel. |
| **Env/secrets** | `BLOB_READ_WRITE_TOKEN`, `PUBLISH_TOKEN`, `KV_REST_API_URL/TOKEN`, `GITHUB_TOKEN`, `MINIAPP_TEMPLATE_REPO`, `BACKSTAGE_PUBLIC_URL`. |
| **Seed** | Cargar el catálogo (account_dashboard) a KV una vez tras el deploy. |
| **Smoke** | Verificar `/catalog`, `/api/resolve`, `/api/miniapps/:id/upload` (auth) en el deploy. |

## 2. Modelo (qué prepara este bolt)
- **Config de deploy:** Next.js en Vercel (zero-config o `vercel.json` mínimo si hace falta).
- **Entry point de seed:** una ruta/route **admin** (`POST /api/seed`, protegida por `PUBLISH_TOKEN`) que llama `seedRegistry(getStore())` → carga el catálogo a KV una vez.
- **Host env-aware:** `BACKSTAGE_BASE_URL` en `apps/host/src/hostProvided.ts` deja de ser hardcode → lee `process.env`/config por entorno (dev local vs URL de Vercel).
- **Runbook + activation-checklist:** los pasos manuales (login, provisión Blob/KV, `vercel env`, `vercel deploy`, seed, smoke) que **solo el usuario** puede correr con su cuenta.

## 3. Dependencia de usuario (honesto)
El deploy **real** requiere: cuenta Vercel + `vercel login` + Vercel CLI (no instalado) + org de GitHub (placeholder) + provisión Blob/KV. **No ejecutable por el agente**; se prepara + documenta. Análogo al publish real (org) y al build nativo (entorno).

## 4. Verificación
- `pnpm build` de Backstage (prod) verde (ya lo está).
- Config + seed route + host env-aware compilan y no rompen tests.
- Deploy real + smoke = **manual** (activation-checklist), verificado por el usuario con su cuenta.

## 5. Frontera
- El flujo end-to-end (CI → Blob → resolve) ya está probado local (Bolts 1-3); aquí solo se lleva a Vercel.

## Preguntas para el checkpoint
1. **¿Tienes cuenta Vercel + quieres intentar un deploy real ahora?** Si sí: te guío con `vercel login`/CLI (los corres tú). Si no: **preparo todo + documento el runbook** y el deploy queda como paso manual. ¿Cuál?
2. **Seed en prod:** ¿una ruta admin `POST /api/seed` (protegida por token) o un script `vercel`? Propongo la **ruta admin** (fácil de invocar post-deploy). ¿OK?
3. **Host env-aware:** `BACKSTAGE_BASE_URL` por env (`process.env.EXPO_PUBLIC_...`/DefinePlugin de Re.Pack). ¿OK que lo parametrice?
