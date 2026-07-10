# Bolt 3 — Account Dashboard · Etapa 1: MODEL

> DDD stage 1/5 · Estado: **Borrador (esperando validación humana)** · Fecha: 2026-07-09
> Stories: S3.1 dominio · S3.2 pantalla · S3.3 build dual · Miniapp = remote federado, **solo-JS**

Primera miniapp con **dominio bancario real**. El dominio es framework-free y testeable (S3.1), separado de la UI (S3.2).

## 1. Lenguaje ubicuo (dominio Dashboard)

| Término | Definición |
|---|---|
| **Account** | Cuenta del cliente: id, alias, tipo, moneda, saldo, número enmascarado. |
| **Transaction** | Movimiento: monto con signo, moneda, descripción, fecha, dirección (débito/crédito), categoría. |
| **Money** | Valor monetario en **unidades menores enteras** (céntimos) + código de moneda ISO-4217. Nunca `float`. |
| **Balance** | Saldo actual de una cuenta (Money). |
| **Statement / feed** | Lista de transacciones ordenada por fecha, agrupada por día. |

## 2. Value objects (framework-free)

```
type CurrencyCode = "EUR" | "USD" | "MXN" | ...   // ISO-4217 (string validado)
type Minor = number                                // enteros; céntimos. Sin decimales flotantes.

interface Money      { amountMinor: Minor; currency: CurrencyCode }   // amount puede ser negativo
type AccountType     = "checking" | "savings" | "credit"
type Direction       = "debit" | "credit"

interface Account {
  id: string
  alias: string
  type: AccountType
  balance: Money
  maskedNumber: string        // p.ej. "•••• 4321"
}

interface Transaction {
  id: string
  accountId: string
  amount: Money               // signo: negativo = débito, positivo = crédito
  description: string
  date: string                // ISO-8601
  direction: Direction
  category?: string
}

interface DayGroup { dateISO: string; items: Transaction[]; net: Money }
```

## 3. Lógica pura del dominio (testeable — S3.1)

Todas puras, sin I/O, en `src/domain/`. Llevan **unit tests** (sin renderer):

- **`formatMoney(money, locale?): string`** — formatea céntimos+moneda a string localizado (Intl.NumberFormat, `minimumFractionDigits` por moneda). Hoist del formatter (regla `js-hoist-intl`).
- **`directionOf(money): Direction`** — deriva débito/crédito del signo (0 → credit por convención).
- **`groupByDay(transactions): DayGroup[]`** — agrupa por día (fecha local), ordena desc, calcula `net` por grupo. Base de las secciones de la lista.
- **`netChange(transactions, currency): Money`** — suma neta (valida moneda homogénea; lanza/return error tipado si mezcla monedas).
- **`maskAccountNumber(full): string`** — deja los últimos 4 dígitos, enmascara el resto (regla de seguridad: no exponer PAN completo).

## 4. Datos mock (fixtures)
- `src/domain/fixtures.ts`: 1–2 `Account` + ~12 `Transaction` de ejemplo, montos en céntimos, mezcla débito/crédito, varias fechas. **Sin PII real**. Sirven a la pantalla (React Query los envuelve como si vinieran del server).

## 5. Reglas de seguridad (banca) aplicadas al dominio
- **Money en enteros** (céntimos) — nunca `float` para dinero.
- **`maskAccountNumber`** obligatorio antes de mostrar cualquier número de cuenta.
- Sin PII/secretos en fixtures, logs ni en el bundle del chunk.
- El dominio NO conoce credenciales; recibe datos ya scoped por el host (capabilities de Bolt 1/4).

## 6. Frontera (qué NO es dominio de este bolt)
- Descarga/montaje del remote, resolve, fallback → **Bolt 4** (host-runtime).
- Registro/publicación en Backstage → **Bolt 2**.
- Render (FlashList, primitivas) → Etapa Design/Implement de este bolt.

## Preguntas para el checkpoint
1. **Monedas semilla:** ¿`EUR`, `USD`, `MXN` como set inicial de `CurrencyCode`, o solo una para el MVP?
2. **`netChange` con monedas mezcladas:** propongo **rechazar** (error tipado) en vez de intentar convertir — sin FX en el MVP. ¿OK?
3. ¿Confirmas **Money en céntimos enteros** (no decimales) como convención del dominio bancario?
