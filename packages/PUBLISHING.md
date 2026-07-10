# Publicar y consumir los paquetes `@org/*`

Los paquetes compartidos (`@org/miniapp-contract`, `@org/ui-kit`) se publican a **GitHub Packages**
y se consumen por versión desde repos externos (miniapps). Patrón de **doble consumo** (ADR-010):
en el monorepo se consumen como **fuente** (`main: src`); al publicar, `publishConfig` (pnpm)
sobreescribe a **`dist`**.

## Publicar (desde el repo móvil)
```bash
# 1) build (lo hace prepack, pero se puede correr suelto)
pnpm --filter @org/ui-kit build
pnpm --filter @org/miniapp-contract build

# 2) verificar el tarball (aplica publishConfig → main:dist, contenido dist/)
pnpm --filter @org/ui-kit pack
pnpm --filter @org/miniapp-contract pack

# 3) publicar (requiere org real en el scope @org + token write:packages)
#    GITHUB_TOKEN con write:packages en el entorno
pnpm --filter @org/miniapp-contract publish --no-git-checks
pnpm --filter @org/ui-kit publish --no-git-checks
```
> ⚠️ Reemplaza `@org` por tu **org/usuario real de GitHub** en los `name` de cada paquete
> y en el `.npmrc`. Sin eso, `pack` funciona (verificación) pero `publish` no.

## Consumir desde un repo de miniapp (externo)
`.npmrc` del repo consumidor:
```
@org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}   # token con read:packages
```
`package.json`:
```json
{
  "dependencies": {
    "@org/miniapp-contract": "^0.1.0",
    "@org/ui-kit": "^0.1.0"
  }
}
```
Luego `pnpm install` (o npm). React y React Native son **peerDependencies** de `ui-kit`
— los provee la app consumidora (singletons federados).

## Versionado
- Semver. Un cambio **incompatible** del contrato (shape del manifest / resolve) = **major**
  + changelog; coordinar host y miniapps.
