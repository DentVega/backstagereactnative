# Bolt Plan — Intent 01 (Vertical Slice)

> Fase: **Inception → Construction** · Estado: **Borrador (esperando validación humana)** · Fecha: 2026-07-09

Cada bolt se ejecuta con `/bolt-start` a través de las 5 etapas DDD (Model → Design → ADR → Implement → Test).
Un bolt de pantalla no está *done* sin ≥1 test RNTL; los bolts de dominio llevan unit tests.

## Secuencia y dependencias

```
Bolt 1 (Foundations) ──► Bolt 2 (Backstage) ──┐
        │                                       ├──► Bolt 4 (Loader+Integración+Fallback) ──► Ops
        └──► Bolt 3 (Dashboard miniapp) ────────┘
```
Bolt 2 y Bolt 3 pueden ir en paralelo tras Bolt 1. Bolt 4 los integra.

## Bolt 1 — Foundations (+ publicar el contrato)
- **Stories:** S1.1, S1.2, S1.3, S1.4.
- **Entrega:** monorepo pnpm, host RN + Re.Pack (MF v2) que arranca, `miniapp-contract` **publicable como `@org/miniapp-contract`**, `ui-kit` (tokens light/dark).
- **Done:** `pnpm install` + `tsc` verdes; host arranca en emulador (no Metro); packages importables; **contrato publicado (o publicable) a registry privado con semver**; ≥1 test RNTL de primitiva.
- **Apoyo:** `/repack-init` para el scaffold Re.Pack.

## Bolt 2 — Backstage Web (REPO SEPARADO — registry + resolve + catálogo)
- **Stories:** S4.1, S4.2, S4.3.
- **Repo:** se ejecuta en el repo git **separado** `backstage-web`, no en este monorepo.
- **Entrega:** Next.js con register/publish, `GET /api/resolve`, y `/catalog`; instala `@org/miniapp-contract@^x`.
- **Done:** se registra/publica la Dashboard; `resolve` devuelve `{url,version,manifest}` válido; tests API + componente verdes.
- **Depende de:** Bolt 1 (contrato **publicado**). Al ser otro repo, otro equipo puede tomarlo en paralelo una vez publicado el contrato.

## Bolt 3 — Miniapp Account Dashboard (build dual)
- **Stories:** S3.1, S3.2, S3.3.
- **Entrega:** dominio testeado + pantalla FlashList (mock) + build dual (remote y shared package).
- **Done:** construye como remote y como package; ≥1 test RNTL de pantalla + unit tests de dominio; 60 FPS.
- **Depende de:** Bolt 1 (contract, ui-kit).

## Bolt 4 — Host Runtime + Integración end-to-end
- **Stories:** S2.1, S2.2, S2.3.
- **Entrega:** shell auth mock + loader (resolve→descarga→verify→mount) + fallback + **ADR-001** integridad de chunk. Integra Backstage (Bolt 2) montando la Dashboard (Bolt 3) real.
- **Done (= criterios del intent):** host monta la Dashboard como remote federado en emulador (Layer 2); fallback sin crash; resuelve vía Backstage; tests verdes.
- **Depende de:** Bolts 1, 2, 3.

## Después del intent
- `/operations` para servir/hostear chunks (definir CDN) y verificación en dispositivo.
- `/parity` para mapear la cobertura vs. la app Android original antes de migrar más features.
- Nuevos intents: features bancarias reales (transferencias, etc.) como nuevos remotes.

## Checkpoints humanos (obligatorios)
- Tras cada artefacto de Inception (hecho).
- Al inicio de cada bolt (Design/ADR) y antes de marcar el intent como completo.
