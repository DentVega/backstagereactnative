# ADR-008 — Verificación de integridad: estructural + skew ahora, cripto diferida

> Bolt: bolt-4-host-integration · Estado: **Aceptada** (checkpoint 2026-07-09)

## Contexto
El host trata el manifest/chunk resuelto desde Backstage como **input no confiable** y debe verificarlo antes de montar (regla de seguridad, `coding-standards.md`). El campo `manifest.integrity` existe en el contrato (Bolt 1) pero su mecanismo estaba por decidir.

## Decisión
Verificación en dos capas para el MVP:
1. **Estructural:** `isManifest(manifest)` (contrato) — forma válida.
2. **Skew de singletons:** `satisfiesShared(hostProvided, manifest.shared)` — compatibilidad de versiones host↔miniapp; incompatible → fallback.
3. **Integridad criptográfica:** definir la **interfaz `IntegrityVerifier`** con una impl **`noopVerifier`** (siempre pasa, documentada) ahora; la impl real (**sha256 del chunk o firma**) se **difiere a Operations** (necesita módulo cripto/infra de firma + publicación real de artefactos con hash).

## Consecuencias
- (+) El host degrada con gracia ante manifests malformados o skew — sin montar código incompatible.
- (+) El punto de extensión cripto está aislado (`IntegrityVerifier`); activarlo luego es cambiar la impl, no la arquitectura.
- (−) **En el MVP NO hay garantía criptográfica** de que el chunk no fue manipulado. Riesgo aceptado para el slice (dev server local); **bloqueante para producción** — registrado como deuda de Operations.
- **Acción Operations:** publicar chunks con hash en el manifest + `sha256Verifier` que recomputa el hash del chunk descargado; evaluar firma si hay infra.
