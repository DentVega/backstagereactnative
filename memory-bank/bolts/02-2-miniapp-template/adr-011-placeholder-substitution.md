# ADR-011 — Sustitución de placeholders vía workflow de GitHub Actions (un solo uso)

> Bolt: 02-2-miniapp-template · Estado: **Aceptada** (checkpoint 2026-07-09)

## Contexto
El template tiene placeholders (`__MINIAPP_ID__`, `__MINIAPP_NAME__`, `__MINIAPP_OWNER__`). Cuando el scaffolder (Backstage) crea un repo desde el template vía la API de GitHub ("generate from template"), esos placeholders deben personalizarse **automáticamente**, sin pasos manuales del equipo.

## Decisión
Un **workflow de GitHub Actions de un solo uso** en el template: `.github/workflows/init-template.yml`.
- **Trigger:** `push` (primer push del repo generado).
- **Guard:** se salta si el repo es el template original (`github.event.repository.is_template == true`) → no se auto-modifica.
- **Acción:** deriva `__MINIAPP_ID__` del nombre del repo (`miniapp-<id>` → `<id>`), `__MINIAPP_OWNER__` del owner; reemplaza los marcadores en todos los archivos; commitea; y **elimina el propio workflow** (init de una sola vez).
- Encaja con el flujo del scaffolder (Bolt 4): Backstage genera el repo → el workflow lo inicializa solo.

## Alternativas consideradas
- **Script `init` local** (el equipo lo corre tras clonar): requiere un paso manual, se olvida. Menos alineado con "Backstage crea la miniapp lista".
- **Sustitución en el propio scaffolder** (Backstage edita los archivos vía API tras generar): más llamadas a la API de GitHub y lógica en Backstage; el workflow mantiene la personalización dentro del repo generado.

## Consecuencias
- (+) Personalización automática y autocontenida en el repo generado; el scaffolder solo "genera + registra".
- (+) El template **compila con placeholders** (son strings válidos) → verificable sin ejecutar el workflow.
- (−) El init real **solo se prueba en GitHub** (no localmente); se revisa por lectura y se validará al ejecutar el scaffolder de verdad (Bolt 4 / cuando haya org).
- (−) Depende de permisos del `GITHUB_TOKEN` del workflow para commitear. Documentar.
