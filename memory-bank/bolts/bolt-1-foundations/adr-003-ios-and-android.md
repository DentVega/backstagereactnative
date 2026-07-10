# ADR-003 — Soporte iOS y Android desde el inicio

> Bolt: bolt-1-foundations · Estado: **Aceptada** (checkpoint 2026-07-09)

## Contexto
El origen es una app bancaria Android, pero el producto RN debe correr en **iOS y Android**. La opción de "Android-first, diferir iOS" se descartó explícitamente por el usuario.

## Decisión
El host RN + Re.Pack soporta **ambas plataformas nativas desde Bolt 1**: se generan y mantienen los proyectos nativos `android/` e `ios/`, y Re.Pack produce bundles/chunks para las dos. Hermes activo en ambas.

## Consecuencias
- (+) Paridad de plataforma desde el arranque; sin deuda de "portar a iOS" luego.
- (−) Implement requiere toolchain de **ambas**: Android SDK/Gradle **y** Xcode + **CocoaPods** (`pod install`) para iOS.
- (−) La verificación de dispositivo (Etapa Test / `agent-device`) debería cubrir un emulador Android **y** un simulador iOS.
- **Riesgo de entorno:** el scaffold nativo de iOS necesita macOS + Xcode + CocoaPods. Si el entorno actual no los tiene disponibles, la parte iOS del Implement puede quedar como scaffold generado pero **no verificado en simulador** hasta tener el toolchain — se registrará como tal en el resultado del bolt, no se declarará "verificado" sin evidencia.
- **Chunks federados:** confirmar que la carga de remotes (Bolt 4) funciona en iOS y Android (ScriptManager de Re.Pack soporta ambas).
