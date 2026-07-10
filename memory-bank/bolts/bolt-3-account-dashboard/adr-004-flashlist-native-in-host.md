# ADR-004 — FlashList: módulo nativo en el host, JS compartido; el remote lo consume

> Bolt: bolt-3-account-dashboard · Estado: **Aceptada** (checkpoint 2026-07-09)

## Contexto
El estándar de listas (`coding-standards.md`) exige **FlashList**. Pero `@shopify/flash-list` incluye una **vista nativa** (AutoLayoutView). La regla de `system-architecture.md` dice: *"una feature que requiere módulos nativos no puede ser un remote puro-JS"*. La miniapp Account Dashboard ES un remote federado solo-JS. Conflicto aparente.

## Decisión
Dividir FlashList en sus dos capas:
- **Módulo nativo** (AutoLayoutView) → compilado en el **host** (native deps viven en `apps/host`, regla `monorepo-native-deps-in-app`).
- **JS de `@shopify/flash-list`** → declarado **`shared` `singleton: true`** en el share scope. El host lo provee; el remote lo **consume** por el scope, sin empaquetar una copia.

Así el chunk del remote sigue siendo **JS puro** (no lleva binario nativo), pero usa FlashList real provista por el host.

## Consecuencias
- (+) Cumple el estándar de listas y mantiene el remote como chunk JS.
- (+) **Demuestra el patrón real** que se repetirá: miniapps que necesitan una lib nativa provista por el host vía share scope.
- (−) **Acoplamiento host↔remote:** el host DEBE tener `@shopify/flash-list` instalado (JS+nativo) y en su `shared` para que el remote monte. Si falta → skew → fallback (Bolt 4). Se registrará en el contrato `shared` de la miniapp.
- (−) La versión de FlashList es un **singleton**: host y remote deben ser compatibles (mismo major).
- **Acción Bolt 4:** añadir `@shopify/flash-list` a `apps/host` (dep + `pod install` iOS + rebuild android) y a la lista `shared` del host. En Bolt 3, la miniapp lo declara como `shared singleton` y lo usa como devDep para build/test standalone.
- **Alternativa descartada:** FlatList puro-JS — evitaría el nativo pero viola el estándar de listas y no ejercita el patrón real.
