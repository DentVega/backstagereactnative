# Unit 2 — Guard de autorización del scaffolder

> Intent: 06-real-miniapp-creation · Web (Backstage), seguridad. No RN.

## Propósito
Proteger la cuenta GitHub en la demo pública: solo logins permitidos pueden crear repos.

## Alcance
- Guard server-side en `POST /api/scaffold`: lee la sesión (Auth.js) → login del usuario →
  compara con allowlist `SCAFFOLD_ALLOWED_LOGINS` (CSV env; por defecto = dueño del deploy).
- No autorizado → 403 con cuerpo de error claro (sin crear nada, sin tocar GitHub).
- Función de decisión **pura y testeable** (`canScaffold(login, allowlist)`).

## Dependencias
- Sesión Auth.js (Intent 04, Unit 1). Env `SCAFFOLD_ALLOWED_LOGINS`.

## Stories
- S2.1 — `canScaffold` (pura) + tests (permitido/denegado/allowlist vacía/case-insensitive).
- S2.2 — Aplicar el guard en `/api/scaffold` (403 antes de crear) + test de ruta.

## Aceptación
- Login no permitido → 403, cero llamadas a GitHub/registry. Login permitido → pasa.
- Rate-limit básico opcional. Tests verdes.
