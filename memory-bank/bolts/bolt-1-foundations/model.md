# Bolt 1 — Foundations · Etapa 1: MODEL

> DDD stage 1/5 · Estado: **Borrador (esperando validación humana)** · Fecha: 2026-07-09
> Stories: S1.1 monorepo · S1.2 host Re.Pack · S1.3 miniapp-contract (publicado) · S1.4 ui-kit

Este bolt es infraestructura. El "dominio" no es lógica de negocio bancaria, sino el **lenguaje ubicuo del sistema de federación** (el contrato entre host, miniapps y Backstage) más el **modelo de tokens** del sistema visual. Estos son los dos únicos artefactos con lógica pura testeable en Bolt 1.

## 1. Lenguaje ubicuo (glosario del sistema)

| Término | Definición |
|---|---|
| **Host** | La app RN shell que arranca el runtime, mantiene sesión y **monta** miniapps. |
| **Miniapp** | Unidad de feature autocontenida. Se consume como **remote** (runtime) o **shared package** (build-time). |
| **Remote** | Miniapp entregada como **chunk federado** descargado bajo demanda. |
| **Manifest** | Metadatos de una versión de miniapp: `id`, `version`, `entry`, `shared[]`, `capabilities[]`, `integrity?`. |
| **Capability** | Permiso **scoped y revocable** que el host otorga a una miniapp. **Nunca** una credencial cruda. |
| **Registry** | El almacén de miniapps/versiones que vive en Backstage. |
| **Resolve** | Consulta host→Backstage que devuelve `{ id, version, url, manifest }`. |
| **Shared dep / singleton** | Dependencia compartida con una única instancia entre chunks (react, RN, nav, zustand, react-query). |
| **Version skew** | Incompatibilidad entre la versión de un singleton que provee el host y la que declara una miniapp. |

## 2. Modelo del contrato (`@org/miniapp-contract`) — value objects

Framework-free, sin dependencias de runtime pesadas. Solo tipos + funciones puras.

```
MiniappId        = string con marca (branded), formato kebab/snake, no vacío
SemVer           = string validado "MAJOR.MINOR.PATCH"
SharedDepSpec    = { name: string; requiredRange: string; singleton: boolean }
Capability       = union de permisos scoped (p.ej. "accounts:read", "session:whoami")
Manifest         = {
                     id: MiniappId
                     version: SemVer
                     entry: string            // p.ej. "./Entry"
                     shared: SharedDepSpec[]
                     capabilities: Capability[]
                     integrity?: string       // hash/firma (mecanismo se decide en Bolt 4 ADR)
                   }
ResolveRequest   = { id: MiniappId; hostVersion?: SemVer }
ResolveResponse  = { id: MiniappId; version: SemVer; url: string; manifest: Manifest }
MiniappEntryProps= { capabilities: CapabilityGrant }  // lo que recibe el componente ./Entry
```

## 3. Lógica pura del dominio (testeable en Bolt 1)

Estas funciones viven en `@org/miniapp-contract` (puras, sin I/O) y llevan **unit tests**:

- **`isManifest(x: unknown): x is Manifest`** — type guard / validación estructural.
- **`parseSemVer(s: string): SemVer`** — valida formato; lanza/It returns error tipado si inválido.
- **`satisfiesShared(hostShared, miniappShared): SkewResult`** — dado lo que el host provee y lo que la miniapp pide, decide **compatible / skew** por dep (base de la detección de version-skew del loader en Bolt 4).
  - Regla: cada `SharedDepSpec` de la miniapp debe satisfacerse por un singleton del host cuyo rango sea compatible; si falta o es incompatible → skew.

> Nota: la **verificación de integridad** del chunk (`integrity`) NO se implementa aquí — el mecanismo (hash vs. firma) se decide por **ADR-001 en Bolt 4**. En Bolt 1 el campo existe en el tipo pero es opcional y no se valida su contenido.

## 4. Modelo de tokens (`ui-kit`) — lenguaje del sistema visual

Del `design-standards.md`. Tokens semánticos (nunca hex crudo en componentes):

```
ColorToken   = background | surface | text | textMuted | primary | danger | border
               → cada uno mapeado a un valor light y uno dark
SpacingToken = xs 4 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32
TypeToken    = caption · body · title · heading · display   (size + weight + lineHeight)
RadiusToken  = sm · md · lg   ·   ElevationToken = 0 | 1 | 2
Theme        = { colors: Record<ColorToken,string>, spacing, typography, radii, elevation }
```

Lógica pura testeable: `resolveTheme(scheme: 'light'|'dark'): Theme` (selección determinista de paleta).

## 5. Qué NO es dominio de este bolt (frontera)
- Descarga/montaje de chunks, resolve real, fallback → **Bolt 4** (host-runtime).
- Registry/API de Backstage → **Bolt 2** (repo separado).
- Dominio bancario (cuentas/movimientos) → **Bolt 3** (miniapp Dashboard).

## Preguntas para el checkpoint
1. ¿El set inicial de **Capabilities** (`accounts:read`, `session:whoami`) te sirve como semilla, o prefieres definirlas cuando llegue una miniapp real (Bolt 3)?
2. ¿`satisfiesShared` (detección de skew) la ubicamos en `@org/miniapp-contract` (compartible con Backstage para validar al publicar) o solo en `host-runtime`? Propuesta: en el contrato, para reuso.
