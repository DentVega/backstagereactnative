# Intent 01 — Vertical Slice: Host + Miniapp Federada + Backstage Mínimo

> Fase: **Inception** · Estado: **Borrador (esperando validación humana)** · Fecha: 2026-07-09

## 1. Intención de negocio (raw)
"Migración de una app de banco Android a React Native con Re.Pack, con el agregado de una plataforma tipo 'Spotify for Backstage' para crear miniapps que se puedan agregar al proyecto RN o compartir como share-packages. El Backstage puede ser web."

## 2. Objetivo de este intent (MVP)
Demostrar el **flujo completo end-to-end** de la arquitectura con el mínimo alcance creíble:
un **host RN + Re.Pack** que descarga y monta una **miniapp federada** (Dashboard / resumen de cuentas), publicada y resuelta por un **Backstage web mínimo**.

Este slice valida la arquitectura antes de migrar features bancarias reales en volumen.

## 3. En alcance (in scope)
- **Host móvil (RN + Re.Pack, Module Federation v2):** boot del runtime, navegación nativa base, shell de auth/sesión (mock), y **loader de miniapps** (resuelve URL + manifest, monta el remote, maneja fallback).
- **Miniapp piloto — "Account Dashboard":** remote federado **solo-JS** (sin módulos nativos) que muestra saldo(s) y una lista de movimientos (FlashList) con datos mock.
- **Backstage web mínimo (repo separado):** registrar una miniapp (id, versión, manifest, URL del chunk), listarla en un catálogo, y exponer un endpoint que el host consulta para **resolver** la miniapp a montar. Vive en su propio repo git; depende de `@org/miniapp-contract`.
- **Publicar `@org/miniapp-contract`:** el contrato se publica como paquete versionado para que el repo de Backstage lo consuma sin duplicar tipos.
- **Contrato de miniapp:** entry tipado + lista `shared` declarada (react, react-native, navigation, zustand, @tanstack/react-query como singletons) + manifest (id, version, permisos).
- **Consumo dual (probado al menos en diseño):** la misma miniapp es construible como **remote** (runtime) y como **shared package** de workspace (build-time).

## 4. Fuera de alcance (out of scope — diferido)
- Migración del resto de pantallas del banco Android (se planifica luego con `/parity`).
- Auth/sesión real contra backend del banco (usamos mock; el modelo de sesión real se decide en un intent posterior).
- CDN / almacenamiento de artefactos en producción (dev server local por ahora; se define en Operations).
- Firma/verificación de integridad de chunks en producción (se diseña el hook ahora vía ADR, implementación real diferida).
- Flujos sensibles de movimiento de dinero (transferencias) — intent posterior.

## 5. Actores
- **Usuario del banco** (consume la app móvil).
- **Desarrollador de miniapps** (crea/publica miniapps vía Backstage).
- **Host runtime** (sistema que resuelve y monta remotes).

## 6. User stories (nivel intent — se refinan por unidad)
- **US-1:** Como usuario, al abrir la app veo la navegación base y accedo al Dashboard, que se **carga como miniapp federada** de forma transparente.
- **US-2:** Como usuario, si la miniapp no se puede descargar, veo un **fallback** claro y la app no crashea.
- **US-3:** Como desarrollador, puedo **registrar y publicar** una miniapp en Backstage (id + versión + manifest + URL) y verla en el catálogo.
- **US-4:** Como host, **resuelvo** desde Backstage qué versión/URL de la miniapp montar.
- **US-5:** Como desarrollador, la miniapp Dashboard es **construible como remote y como shared package** desde el mismo código.

## 7. Requisitos no funcionales
- **Performance:** 60 FPS en el Dashboard; lista con FlashList; host bundle lean (features en remotes). TTI del host sin regresión notable (target exacto se fija en Operations).
- **Seguridad (banca):** auth/sesión solo en el host; la miniapp recibe **capabilities scoped**, nunca credenciales crudas. Sin secretos/PII en logs, bundles o artefactos. El host trata manifest/URL como input no confiable (verificación de integridad diseñada por ADR).
- **Resiliencia:** todo remote tiene fallback; skew de versiones de singletons detectado y degradado con gracia.
- **TypeScript strict**, dominio testeable separado de UI.

## 8. Criterios de aceptación del intent
- [ ] El host arranca, navega y **monta la miniapp Dashboard como remote federado** en dispositivo/emulador (Layer 2).
- [ ] El **fallback** se activa y no crashea cuando el chunk es inalcanzable.
- [ ] Backstage web permite **registrar/publicar** la miniapp y el host la **resuelve** por su endpoint.
- [ ] La miniapp Dashboard tiene ≥1 test RNTL de su pantalla principal; el dominio (formato de saldos/movimientos) tiene unit tests.
- [ ] `tsc` verde en host, miniapp y Backstage; bundle de Re.Pack genera host + chunk del remote.

## 9. Decisiones tomadas (checkpoint /aidlc-inception, 2026-07-09)
- Sembrar un **slice vertical end-to-end** primero.
- Estado: **Zustand + React Query** como singletons compartidos.
- Hosting de chunks: **dev server local** por ahora; CDN diferido a Operations.
- Miniapp piloto: **Account Dashboard** (solo-JS, sin nativos).
- **Backstage web = Next.js (App Router)** (checkpoint 2026-07-09).
- **Cero módulos nativos** en este slice (confirmado).
- **Backstage vive en un REPO GIT SEPARADO** (otro equipo, CI/CD y deploy propios) — checkpoint 2026-07-09.
- **Contrato compartido = paquete publicado versionado** `@org/miniapp-contract` (fuente en el repo móvil, publicado a npm privado / GitHub Packages; Backstage lo instala por versión). Único acoplamiento entre repos.

## 10. Preguntas abiertas (a resolver en system-context / ADRs)
- Layout exacto del monorepo pnpm (paths de host, remotes, packages, backstage-web).
- Stack del Backstage web (¿Next.js? — sugerido) y forma del manifest/registry.
- Mecanismo concreto de resolución host→Backstage (endpoint REST + shape del manifest).
- Módulos nativos: ninguno en este slice (confirmado — Dashboard es solo-JS).
