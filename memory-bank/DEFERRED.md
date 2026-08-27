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

## Verificación de firma de chunks en el host (2026-08-26)
- **Qué:** que el host **verifique la firma Ed25519** de cada chunk (autenticidad), además del
  hash sha256 (integridad) que ya verifica. Requiere: pinear la pubkey **root** del owner en el
  binario, traer el trust bundle (`GET /api/trust-bundle`) y verificar su firma root, sacar la
  pubkey de la miniapp de ahí, verificar la firma del chunk sobre `id:platform:integrity`, con
  anti-rollback por el `version` monotónico del bundle, y **enforce** (sin firma válida → no
  monta, razón `invalid-signature`/`unknown-key` no-retryable). Dep `@noble/ed25519` (JS puro).
- **Por qué:** el sha256 prueba integridad pero no autenticidad — un atacante que controle a la
  vez el storage y el registry puede meter un chunk malicioso y recalcular su hash. La firma
  cierra eso. Es el ítem #2 del roadmap de la plataforma.
- **Dónde encaja:** `host-runtime` (`useMiniapp`/loader, junto a la verificación de integridad);
  el backend (backstage-web) **ya** acepta/sirve firmas y el trust bundle (PR #1, mergeado
  2026-08-27). Falta también firmar en el CI de cada miniapp (`publish.mjs` + secret
  `MINIAPP_SIGN_KEY`, out-of-band en el template). Spec/plan en `backstage-web`
  `docs/superpowers/{specs,plans}/2026-08-26-chunk-signing*`.
- **Estado:** backend construido y mergeado; host + CI pendientes. Activación = **enforce
  directo** → orden: deploy backend → firmar la flota → republicar firmado → recién ahí el host
  con enforce.
