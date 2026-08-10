# Correr el host — referencia rápida

Los 4 escenarios en comandos. Guía detallada (env vars, troubleshooting, dev-loop
de miniapps): [`README.md`](./README.md).

## Setup — una sola vez (desde la raíz del repo)

```bash
pnpm install
pnpm build:packages
```

## La variable que manda: `BACKSTAGE_URL`

Se **hornea en el bundle en build-time** (no hay `.env`). De ahí salen el catálogo y el
resolve. Prod = `https://backstage-web-blond.vercel.app`; default sin setear =
`http://localhost:3999`. Si la cambiás, **reiniciá el dev server** (dev) o **re-buildeá**
(release) — un reload de JS no alcanza.

---

## 1 · DEV LOCAL — Android

Dos terminales; `BACKSTAGE_URL` va en la del dev server (arma el JS):

```bash
# Terminal A — dev server (Re.Pack)
export BACKSTAGE_URL=https://backstage-web-blond.vercel.app
cd apps/host && pnpm start

# Terminal B — build + install
emulator -avd <tu-avd> &          # o desde Android Studio → Device Manager
cd apps/host && pnpm android
```

- Recargar JS tras cambios: `r` + Enter en la Terminal A (no repitas la Terminal B).
- Si el emulador no conecta al dev server: `adb reverse tcp:8081 tcp:8081`.

## 2 · DEV LOCAL — iOS

```bash
cd apps/host/ios && pod install && cd ..      # solo la 1ª vez

# Terminal A — dev server
export BACKSTAGE_URL=https://backstage-web-blond.vercel.app
cd apps/host && pnpm start

# Terminal B
cd apps/host && pnpm ios                        # Simulador
```

**iPhone real:** abrí `apps/host/ios/host.xcworkspace` en Xcode (no el `.xcodeproj`) →
target **host** → **Signing & Capabilities** → seteá tu **Team** + un **Bundle
Identifier** propio → conectá el iPhone, seleccionalo y **Run** (con la Terminal A del
dev server corriendo). ATS ya está resuelto; no toques `Info.plist`.

---

## 3 · PROD — Android (release, JS dentro del binario)

```bash
export BACKSTAGE_URL=https://backstage-web-blond.vercel.app   # ANTES de buildear

cd apps/host/android
./gradlew assembleRelease      # APK → app/build/outputs/apk/release/
# ./gradlew bundleRelease      # AAB para Play Store
```

Gradle invoca el bundle de Re.Pack y lo mete en el binario. No hay dev server en prod.

## 4 · PROD — iOS (release)

```bash
export BACKSTAGE_URL=https://backstage-web-blond.vercel.app   # ANTES de buildear
cd apps/host && pnpm ios --mode Release
```

O desde Xcode: scheme **Release** → Run/Archive (para device real, con la firma del
punto 2). El bundle iOS lo regenera solo el Build Phase "Bundle React Native code and
images" de Xcode (no hay un `bundle:ios` aparte en el host).

---

## Gotchas

- **Catálogo vacío** → `BACKSTAGE_URL` sin setear (cayó a `localhost`). Confirmala en la
  Terminal A y **reiniciá el dev server**.
- **En release** `BACKSTAGE_URL` queda **fija en el binario** → verificá que apunte a
  prod **antes** de buildear. Un release apuntando a `localhost` no carga el catálogo.
- **Plataforma:** automática (`Platform.OS`) → iOS baja el chunk iOS, Android el android.
  Nada que configurar.
- **¿Backstage 100% local?** en otra terminal `cd backstage-web && pnpm dev` (:3999), usá
  `BACKSTAGE_URL=http://localhost:3999`, y para el emulador Android
  `adb reverse tcp:3999 tcp:3999`.
