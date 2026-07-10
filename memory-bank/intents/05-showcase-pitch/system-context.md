# Intent 05 — Showcase / Pitch Artifact · SYSTEM CONTEXT

> Inception · Fecha: 2026-07-10

## Naturaleza técnica
- **NO es una feature de la app RN.** No es un remote federado, no forma parte del bundle
  del host, **no usa módulos nativos**. Es una **página web estática autocontenida**.
- Se materializa como un **Artifact de claude.ai** (HTML con CSS/JS inline, sujeto al CSP:
  sin fuentes/CDN/fetch externos; assets embebidos). Opcionalmente exportable como `.html`.

## Relación con el resto del sistema (solo como contenido, no como código)
El artifact *describe* la topología del producto, no la implementa:

```
                 ┌─────────────────────────┐
   describe →    │  Pitch one-pager (05)    │   ← este intent
                 └─────────────────────────┘
                        cuenta la historia de:

  [Host RN + Re.Pack] --resolve--> [Backstage Web] --scaffold--> [Repos de miniapp]
         host bundle                registry/scaffolder            1 repo por miniapp
         monta remotes              auth + CI status               CI → CDN → publish
```

## Entradas de contenido (ya existen, se referencian)
- Demo en vivo: `https://backstage-web-blond.vercel.app`
- Repos: `github.com/DentVega/{backstage-web, backstagereactnative, miniapp-template, miniapp-account-dashboard}`
- Diagramas y narrativa: reutilizar los de los READMEs (tres planos + secuencia de resolve).
- Señales de rigor: 102 tests (backstage-web), ADRs (memory-bank), contrato versionado.

## Topología Module Federation (para el diagrama del artifact)
- **Host** (bundle base RN) resuelve por **rango semver** y monta **remotes on-demand**.
- **Remotes** = miniapps (chunks federados) alojados en CDN, publicados vía CI de cada repo.
- **Shared singletons**: react, react-native, @tanstack/react-query, @shopify/flash-list.
- Único acoplamiento cross-repo: `@org/miniapp-contract` (contrato versionado).

## Decisiones de contexto
- **Un solo artifact** (no multipágina) — el objetivo es "de un vistazo".
- **Bilingüe con toggle** ES/EN en la misma página (JS inline mínimo).
- **Diagramas en HTML/CSS/SVG inline** (no Mermaid en runtime — el CSP bloquea el script de
  Mermaid; se dibujan como SVG/HTML estáticos).
- Hosting/entrega = Artifact (link privado que el usuario decide compartir).
