# Bolt 3 — Account Dashboard · RESULT

> Estado: **COMPLETO** · Fecha: 2026-07-09 · Stories: S3.1–S3.3

## Qué se construyó
La primera miniapp con dominio bancario real: `@org/account-dashboard`, un **remote federado solo-JS** (build dual) que muestra saldo + movimientos con FlashList, con **gate de capability** y datos mock vía React Query.

```
miniapps/account-dashboard/
├── src/domain/         money.ts · transactions.ts · fixtures.ts · types.ts  (puro, testeado)
├── src/data/           useAccountData.ts  (React Query, singleton compartido)
├── src/components/     AccountHeader · SectionHeader · TransactionRow  (memoizados)
├── src/Dashboard.tsx   FlashList (array aplanado + getItemType)
├── src/Entry.tsx       expose MF "./Entry" — gate accounts:read
├── src/index.ts        entry build-time (shared package)
└── rspack.config.mjs   ModuleFederationPluginV2 (name: account_dashboard)
```

## Evidencia (verificado, no afirmado)
- **Typecheck:** 5/5 proyectos verdes.
- **Tests:** **13 passing** en la miniapp (10 dominio + 3 Entry) · **57 en el workspace**.
  - Dominio: formatMoney (EUR/USD/MXN), directionOf, addMoney/netChange (rechaza mezcla con `CurrencyMismatchError`), maskAccountNumber, groupByDay/toListItems.
  - Entry (RNTL): gate bloquea sin `accounts:read`, gate bloquea si revocado, y carga saldo (`€4,283.55`) + movimiento (`Café Central`) cuando autorizado.
- **Build remote (Re.Pack):** `account_dashboard.android.bundle` 1.5M — `container entry (expose)` de `./Entry`, `mf-manifest.json` (37KB), y shared (flash-list, react-query, react-native) como **vendor chunks separados** (confirma consumo por share scope, no embebido). Emite `@mf-types` (tipos federados).

## Cobertura de stories
- **S3.1 Dominio** ✓ — Money en céntimos enteros, EUR/USD/MXN, `netChange` rechaza monedas mezcladas, enmascarado de cuenta. 10 unit tests.
- **S3.2 Pantalla + Entry** ✓ — FlashList (getItemType, items memoizados, callbacks estables, sin inline objects), ui-kit, React Query. Gate de capability. ≥1 test RNTL.
- **S3.3 Build dual** ✓ — remote container compila (evidencia arriba); paquete build-time `@org/account-dashboard` con `main`/`types` a `src/index.ts` (typecheck verde, barrel exporta Entry/Dashboard).

## ADRs
- ADR-004 FlashList (nativo en host + JS shared singleton; remote lo consume).
- ADR-005 Build dual (una fuente, expose `./Entry` + `main` de paquete).

## Decisiones/hallazgos (Implement/Test)
- **FlashList mock en tests:** FlashList necesita layout nativo para renderizar su ventana; en el entorno de test se mockea para render síncrono de header+rows (práctica estándar). El comportamiento real en dispositivo se valida en Bolt 4.
- **`forceExit` en jest** de la miniapp: el mock de fetch usa un timer corto; evita un cuelgue si queda pendiente.
- El remote se construyó como paquete standalone con el CLI de RN (sin android/ios propios) — Re.Pack lo soporta.

## NO hecho / diferido (honesto)
- **Verificación en dispositivo (agent-device / Layer 2): NO ejecutada.** La miniapp es un remote; solo tiene sentido verificarla **montada en el host** — eso es **Bolt 4** (montar el remote + probar fallback en emulador/simulador).
- **FlashList nativo en el host:** aún NO instalado en `apps/host` (dep + `pod install` iOS + `@shopify/flash-list` en el `shared` del host). Es **acción de Bolt 4** (ADR-004); sin ello el remote no monta en runtime.
- **Import build-time cross-package:** el paquete es importable (typecheck + barrel válidos); el consumo real desde otro paquete se ejercita en Bolt 4.
- `@tanstack/react-query` / `@shopify/flash-list` aún NO en el `shared` del host (Bolt 4).

## Siguiente
- **Bolt 2** (Backstage, repo separado): registrar/publicar esta miniapp + resolve.
- **Bolt 4** (integración): añadir flash-list + singletons al host, montar `account_dashboard` como remote, fallback, y verificación en dispositivo (Layer 2).
