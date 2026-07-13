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
