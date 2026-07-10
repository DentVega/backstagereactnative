# Bolt 3 — Account Dashboard · Etapa 2: DESIGN

> DDD stage 2/5 · Estado: **Borrador (esperando validación humana)** · Fecha: 2026-07-09

## 1. Estructura del paquete (`miniapps/account-dashboard`)

```
miniapps/account-dashboard/
├── package.json              @org/account-dashboard (build dual: remote | shared pkg)
├── rspack.config.mjs         Re.Pack + ModuleFederationPluginV2 (SOLO para build remote)
├── tsconfig.json · jest.config.cjs · babel.config.cjs
├── src/
│   ├── index.ts              entry BUILD-TIME (shared package) → exporta Entry + Dashboard
│   ├── Entry.tsx             entry RUNTIME (MF expose "./Entry") — recibe MiniappEntryProps
│   ├── Dashboard.tsx         pantalla: AccountHeader + FlashList por día
│   ├── components/
│   │   ├── AccountHeader.tsx (saldo total, memo)
│   │   ├── SectionHeader.tsx (día, memo)
│   │   └── TransactionRow.tsx (movimiento, memo)
│   ├── data/useAccountData.ts  React Query hook (mock async)
│   └── domain/               (S3.1) money.ts, transactions.ts, fixtures.ts, index.ts
```

## 2. Placement host vs. remote (Re.Pack)

| Elemento | Ubicación | Nativo | Nota |
|---|---|---|---|
| Dominio + UI + Entry | **Remote federado** `account_dashboard` | no | chunk JS on-demand |
| `@org/ui-kit`, `@org/miniapp-contract` | shared / build-time | no | consumidos por el remote |
| `@tanstack/react-query` | **shared singleton** | no | cache única host↔remote |
| **`@shopify/flash-list`** | **native en el host**, JS **shared singleton** | **sí (nativo)** | ver ADR-004 |

> **Regla clave (system-architecture):** un remote solo-JS no puede *contener* un módulo nativo. FlashList tiene una vista nativa (AutoLayout). Solución: el **host** compila el módulo nativo de FlashList; el remote consume su **JS por el share scope** como singleton. El remote sigue siendo un chunk JS puro. → **ADR-004**.

## 3. Contrato de entrada (Entry)
- `Entry(props: MiniappEntryProps)` — recibe `capabilities: CapabilityGrant`.
- **Gate de capability:** si `!capabilities.granted.includes("accounts:read")` o `capabilities.isRevoked()` → render de **permiso denegado** (no data). Demuestra el modelo scoped de Bolt 1.
- Asume que corre dentro de los providers del host (`ThemeProvider` + `QueryClientProvider`). Para preview standalone/tests hay un wrapper local `renderWithProviders`.

## 4. Estado / datos
- `useAccountData()` = React Query (`useQuery`) que resuelve los **fixtures** tras un `setTimeout` simulado (imita el server). `staleTime` alto (mock).
- React Query **singleton** compartido: la cache es única entre host y remote (evita doble fetch).
- Sin estado global extra en este bolt (Zustand entra con sesión en Bolt 4).

## 5. Lista (reglas de performance de la skill)
- **FlashList** (no FlatList). Datos = array **aplanado heterogéneo**: `{type:"header"|"row", ...}` a partir de `groupByDay`.
- `getItemType` por `type` (**list-performance-item-types**).
- `TransactionRow` y `SectionHeader` **memoizados** (`React.memo`); callbacks estables (**list-performance-callbacks**); sin objetos/estilos inline en el render de items (**list-performance-inline-objects**); `keyExtractor` estable.
- `estimatedItemSize` fijado.

## 6. Build dual (S3.3)
- **Remote (runtime):** `rspack.config.mjs` con `ModuleFederationPluginV2({ name:"account_dashboard", exposes:{ "./Entry":"./src/Entry.tsx" }, shared:{…singletons…} })` → produce `account_dashboard.container.*.bundle`.
- **Shared package (build-time):** `package.json.main = src/index.ts` (exporta `Entry`, `Dashboard`) → cualquier app del monorepo puede `import { Dashboard } from "@org/account-dashboard"`.
- **Una sola fuente, dos entrypoints.** Documentado en el paquete.

## 7. Decisiones que van a ADR (Etapa 3)
- **ADR-004** — FlashList: módulo nativo en el host + JS shared singleton; el remote lo consume (aplicación de la regla "native no puede ser remote puro-JS").
- **ADR-005** — Mecanismo de build dual (single source: expose `./Entry` para remote + `main` para paquete compartido).

## Decisiones abiertas para el checkpoint
1. **FlashList vs FlatList:** propongo **FlashList con nativo en el host** (ADR-004) — cumple el estándar de listas y demuestra el patrón real "miniapp que necesita una lib nativa provista por el host". Alternativa más simple pero fuera de estándar: FlatList (puro-JS) solo para el piloto. ¿Cuál?
2. **Gate de capability** (`accounts:read`) con pantalla de permiso denegado — ¿lo incluyo en este bolt o lo dejo para Bolt 4 con la sesión real? Propongo incluir el gate ahora (barato y valida el contrato).
