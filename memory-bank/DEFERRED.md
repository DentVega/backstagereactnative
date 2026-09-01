# Deferred ideas

> Ideas capturadas para más adelante. No comprometidas a un intent todavía.

## Login controlado por allowlist de cuentas GitHub (2026-07-10)
- **Qué:** restringir el **acceso a Backstage** (no solo la creación) a una allowlist de
  usernames de GitHub — que solo cuentas permitidas puedan loguearse/ver el catálogo.
- **Por qué:** control de acceso más fino que "cualquier cuenta GitHub válida" (hoy) — útil
  para clientes/equipos concretos.
- **Dónde encaja:** ampliar el callback `authorized`/`signIn` de Auth.js (Intent 04) con una
  allowlist (`ALLOWED_LOGINS` env) → denegar login fuera de la lista. Relacionado con el guard
  del scaffolder (Intent 06, Bolt 06-2, `SCAFFOLD_ALLOWED_LOGINS`) pero a nivel de toda la app.
- **Estado:** idea del usuario (2026-07-10). Candidato a un intent futuro de "control de acceso".

## Verificación de firma de chunks en el host (2026-08-26) — ✅ DONE / VALIDADO EN PRODUCCIÓN (2026-09-01)
- **Estado:** firma de chunks **live y validada end-to-end en prod**. Host: `host-runtime` verifica
  la firma Ed25519 del chunk (`signatureVerifier` + `httpTrustBundleClient` con `@noble/curves`,
  `signatureGate`, wire en `useMiniapp`; razones `invalid-signature`/`unknown-key`). Corre en
  modo **warn** por default (monta + métrica); pasa a **enforce** (rechaza) vía el flag build-time
  `SIGNATURE_MODE` (rspack DefinePlugin). La verificación está OFF solo hasta pinear `ROOT_PUBLIC_KEY`
  en el build. Backend acepta/sirve firmas + trust bundle (v1 live); CI (`miniapp-template`) firma
  con `MINIAPP_SIGN_KEY`. Las 3 miniapps sirven versión firmada que verifica contra el bundle; el
  **rechazo se probó end-to-end** (versión sin firma → warn cuenta `invalid-signature` en /metrics,
  enforce muestra la pantalla de firma-fallida). Spec/plan en backstage-web
  `docs/superpowers/{specs,plans}/2026-08-27-chunk-signing-end-to-end*`.
- **Follow-up (todavía diferido):** anti-rollback persistente del trust bundle (el host no tiene
  persistencia; hoy verifica la firma root pero no recuerda el `version` más alto entre sesiones).
