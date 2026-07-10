# ADR-001 — Styling del ui-kit: StyleSheet + tokens

> Bolt: bolt-1-foundations · Estado: **Aceptada** (checkpoint 2026-07-09)

## Contexto
El `ui-kit` debe exponer primitivas themed (AppText, Box, Card, Button) con tokens semánticos y soporte light/dark desde el día 1 (`design-standards.md`). Dos enfoques candidatos: **NativeWind** (clases Tailwind mapeadas a tokens) o **`StyleSheet` + tokens** (objetos de estilo que consumen el theme vía `useTheme()`).

## Decisión
Usar **`StyleSheet` + tokens**. Los componentes leen tokens con `useTheme()` y componen `StyleSheet.create` a partir de valores del theme; **nunca** hex/valores crudos.

## Alternativas consideradas
- **NativeWind:** buena DX con clases, pero añade una capa de transform (Babel/preset + resolución de clases) que suma complejidad de config sobre Rspack/Re.Pack y otro punto de fallo en el pipeline de federación. No aporta valor decisivo para un kit pequeño de primitivas.

## Consecuencias
- (+) Cero capas de transform extra; encaja limpio con Re.Pack/Rspack y con chunks federados.
- (+) Theming es un edit de tokens, no un rewrite por pantalla.
- (−) Menos azúcar sintáctico que clases utilitarias.
- **Reversible:** se puede añadir NativeWind más adelante sin romper las primitivas (siguen consumiendo tokens). Registrar el enfoque elegido en `tech-stack.md`.
