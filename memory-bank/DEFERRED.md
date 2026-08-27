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

## Verificación de firma de chunks en el host (2026-08-26) — ✅ IMPLEMENTADO, activación pendiente
- **Estado (2026-08-27):** el **código está en las tres capas**. Host: `host-runtime` verifica la
  firma Ed25519 del chunk (`signatureVerifier` + `httpTrustBundleClient` con `@noble/curves`,
  `signatureGate`, wire en `useMiniapp`; razones `invalid-signature`/`unknown-key`). Corre en
  modo **warn** (monta + métrica) y está **off** hasta pinear `ROOT_PUBLIC_KEY`. Backend
  (backstage-web) acepta/sirve firmas + trust bundle. CI (`miniapp-template`) firma con
  `MINIAPP_SIGN_KEY`. Spec/plan en backstage-web `docs/superpowers/{specs,plans}/2026-08-27-chunk-signing-end-to-end*`.
- **Falta (operacional, owner):** publicar contract `@dentvega/miniapp-contract@0.4.0`; keygen root
  → `ROOT_PUBLIC_KEY` en Vercel + pin en el host; keygen por-miniapp → secret `MINIAPP_SIGN_KEY`
  + registrar pubkeys; firmar+publicar el trust bundle; republicar la flota firmada; observar
  `/metrics` en warn; flip `SIGNATURE_MODE=enforce` + release del host.
- **Diferido de verdad (follow-up):** anti-rollback persistente del trust bundle (el host no tiene
  persistencia; hoy verifica la firma root pero no recuerda el `version` más alto entre sesiones).
