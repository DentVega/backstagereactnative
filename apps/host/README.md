# Backstage Host — cómo correr

El **host móvil** (React Native + Re.Pack / Module Federation) que descarga y monta las
miniapps en runtime. El **catálogo** y los **chunks** vienen de Backstage Web; este binario
no trae las miniapps adentro.

---

## Prerequisitos

- **Node ≥ 20** y **pnpm 10** (via corepack).
- Entorno React Native listo:
  - **Android:** JDK 17 + Android SDK + un emulador (o dispositivo).
  - **iOS** (opcional): Xcode + CocoaPods.
  - Si es la primera vez, seguí el *React Native environment setup*.

## Setup (una vez)

Desde la **raíz del repo**:

```bash
pnpm install
pnpm build:packages    # compila host-runtime, ui-kit, miniapp-contract (dist)
```

---

## Configuración — variables de entorno

Re.Pack **hornea estas vars en el bundle en build-time** (via `DefinePlugin`). **No hay
`.env`** — se setean en el **shell** antes de correr.

| Var | Qué hace | Default |
|---|---|---|
| **`BACKSTAGE_URL`** | **La clave.** URL de Backstage de donde salen el catálogo (`/api/miniapps`) y el resolve. **Sin esto, el catálogo NO carga.** | `http://localhost:3999` |
| `DEV_MINIAPP_PATH` | *(opcional)* path a una miniapp local para el dev-loop (mount local con Fast Refresh). | — |
| `DEV_REMOTES` | *(opcional)* remotes federados para el dev-loop de miniapps. | — |

Backstage de producción:

```bash
export BACKSTAGE_URL=https://backstage-web-blond.vercel.app
```

> **Build-time, no runtime:** si cambiás `BACKSTAGE_URL`, tenés que **reiniciar el dev
> server** (o re-buildear el release) — un reload de JS no alcanza, ya quedó horneada.

---

## Modo DEV

Dos terminales. **La `BACKSTAGE_URL` va en la del dev server** (es la que construye el JS):

```bash
# Terminal A — dev server (Re.Pack, reemplaza a Metro)
export BACKSTAGE_URL=https://backstage-web-blond.vercel.app
cd apps/host && pnpm start

# Terminal B — build + install en el emulador/dispositivo
cd apps/host && pnpm android      # Android
# cd apps/host && pnpm ios        # iOS (corré `pod install` en ios/ la 1ª vez)
```

- **Emulador Android:** `emulator -avd Pixel_10_Pro_XL &` (o desde Android Studio → Device Manager) antes del paso B.
- **Recargar el JS** tras cambios: tecleá `r` + Enter en la **Terminal A** (o `Cmd+M` → *Reload* en el emulador).
- Ya instalada la app, para ver cambios de JS **no hace falta** repetir el paso B: alcanza con recargar.

---

## Modo PROD (release)

El JS se **empaqueta dentro del binario** (no hay dev server en prod). `BACKSTAGE_URL`
también se hornea acá → **setearla antes de buildear**:

```bash
export BACKSTAGE_URL=https://backstage-web-blond.vercel.app

# --- Android ---
# APK release (gradle invoca el bundle de Re.Pack y lo mete en el binario):
cd apps/host/android && ./gradlew assembleRelease
#   → apps/host/android/app/build/outputs/apk/release/
# AAB para Play Store: ./gradlew bundleRelease

# --- iOS ---
# Build Release desde Xcode (scheme Release) o:
cd apps/host && pnpm ios --mode Release
```

> Verificá que `BACKSTAGE_URL` apunte a la Backstage **de prod** ANTES de buildear: queda
> fija en el binario. Un binario release apuntando a `localhost` no carga el catálogo.
>
> *(Si solo querés regenerar el bundle JS de release: `pnpm bundle:android`.)*

---

## Troubleshooting

- **El catálogo no carga / aparece vacío** → casi siempre `BACKSTAGE_URL` sin setear (cayó a
  `localhost:3999`). Confirmá la var en la **Terminal A** y **reiniciá el dev server**.
- **Cambios de JS que no aparecen / bundler raro** → cortá la Terminal A y
  `pnpm start --reset-cache`, después reload.
- **El dev server no conecta con el emulador** → `adb reverse tcp:8081 tcp:8081` (8081 es el
  puerto por defecto del dev server).

---

## Dev-loop de miniapps (opcional)

Para desarrollar una miniapp contra este host **sin publicarla**:

- **Modo 1 — mount local (Fast Refresh):**
  ```bash
  DEV_MINIAPP_PATH=/ruta/a/tu/miniapp BACKSTAGE_URL=… pnpm start
  ```
  Se monta vía el alias `@dev-miniapp` (ver `rspack.config.mjs`).
- **Modo 2 — remotes federados:** `DEV_REMOTES=…` (ver `rspack.config.mjs`).
