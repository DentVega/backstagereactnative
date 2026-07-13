# Unit 1 — Flujo de creación en la UI

> Intent: 06-real-miniapp-creation · Web (Backstage). No RN, no federado, sin nativos.

## Propósito
Hacer alcanzable y pulido el flujo de crear miniapp desde la UI (el scaffolder ya existe).

## Alcance
- Botón "＋ Crear miniapp" en el catálogo (y enlace en el header).
- `/create` pulido: validación de `id` (formato del contrato), estados claros
  (enviando / creado → link al repo + link al detalle / error accionable).
- Sin tocar el dominio del scaffolder.

## Dependencias
- `POST /api/scaffold` existente; guard de Unit 2 (authz) para el estado 403.

## Stories
- S1.1 — Entrada UI (botón catálogo + nav header) → /create.
- S1.2 — /create con validación de id + estados (loading/done/error) + links de resultado.

## Aceptación
- Se llega a /create desde el catálogo; validación evita ids inválidos antes de enviar;
  éxito muestra link al repo y al detalle; error muestra el mensaje del API. Tests RTL verdes.
