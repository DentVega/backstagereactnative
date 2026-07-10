# RUNBOOK — Ejecutar el móvil + Backstage (dev)

> Cómo correr el slice end-to-end: host RN monta la miniapp `account_dashboard`
> resuelta por Backstage. Puertos: **host dev server 8081** · **remote (chunk) 9000** · **Backstage 3999**.

## 0. Prerrequisitos
- Device Android conectado por USB (verifica: `adb devices`) **o** un emulador corriendo.
- ⚠️ **Build nativo:** hoy la CLI (`./gradlew`) falla por un problema del entorno Android de esta máquina (un RN 0.76 vanilla también falla). **Compila/instala la app desde Android Studio** (usa su JDK/toolchain embebido). Ver `activation-checklist.md`.

---

## 1. Backstage (web) — repo separado
```bash
# 1a. (una vez / tras cambiar el contrato) construir el contrato EN EL REPO MÓVIL:
cd /Volumes/SSDExterno/prodproyects/backstagereactnative
pnpm --filter @org/miniapp-contract build

# 1b. instalar y correr Backstage:
cd /Volumes/SSDExterno/prodproyects/backstage-web
pnpm install
PORT=3999 pnpm dev
```
Verifica en el navegador: http://localhost:3999 · http://localhost:3999/catalog
Y el endpoint que usa el host: http://localhost:3999/api/resolve?id=account_dashboard

---

## 2. Servir el chunk de la miniapp (remote) — puerto 9000
La URL del seed apunta a `http://localhost:9000/account_dashboard.container.js.bundle`.
En una terminal aparte, levanta el **dev server de la miniapp** en 9000:
```bash
cd /Volumes/SSDExterno/prodproyects/backstagereactnative/miniapps/account-dashboard
pnpm exec react-native webpack-start --port 9000
```

---

## 3. Host (app móvil)

### 3a. Compilar + instalar (una vez) — Android Studio
1. Abre `apps/host/android` en Android Studio → espera el **Gradle Sync**.
2. Selecciona el módulo **`app`** → **Run ▶** con el device conectado. Esto instala la app.

### 3b. Dev server del host (cada vez) — puerto 8081
En otra terminal:
```bash
cd /Volumes/SSDExterno/prodproyects/backstagereactnative/apps/host
pnpm start          # = react-native webpack-start (Re.Pack) en :8081
```

### 3c. Mapear puertos del device → Mac (device físico)
Para que `localhost` en el teléfono llegue a tu Mac:
```bash
adb reverse tcp:8081 tcp:8081   # host dev server
adb reverse tcp:9000 tcp:9000   # chunk del remote
adb reverse tcp:3999 tcp:3999   # Backstage
```
(Con emulador, `10.0.2.2` mapea al host; igual `adb reverse` funciona.)

---

## 4. Probar el flujo end-to-end
1. Abre la app en el device (o Run desde Android Studio).
2. **Home** → botón **"Iniciar sesión"** (activa la sesión mock → capabilities).
3. Botón **"Abrir miniapp"**.
4. El host: resuelve contra Backstage (`:3999`) → obtiene la URL (`:9000`) → descarga el container → verifica el manifest → **monta el Dashboard** (saldo + movimientos con FlashList).

### Probar el fallback (resiliencia)
- Sin iniciar sesión → "Abrir miniapp" → pantalla **"Acceso no autorizado"** (gate de capability).
- Con Backstage apagado (Ctrl-C en su terminal) → "Abrir miniapp" → **"Miniapp no disponible"** (fallback resolve-failed), sin crash.

---

## Resumen de terminales (4)
| Terminal | Comando | Puerto |
|---|---|---|
| Backstage | `cd backstage-web && PORT=3999 pnpm dev` | 3999 |
| Remote (miniapp) | `cd miniapps/account-dashboard && pnpm exec react-native webpack-start --port 9000` | 9000 |
| Host dev server | `cd apps/host && pnpm start` | 8081 |
| adb reverse + Run | `adb reverse …` + Android Studio Run | — |

## Notas
- **iOS:** falta `pod install` con un ruby que tenga CocoaPods (2.7.6 / 3.3.5); luego Run desde Xcode/Android-Studio-equivalente. Mismo bloqueo de entorno pendiente.
- **Integridad de chunk:** hoy `IntegrityVerifier` es no-op (ADR-008) — no valida hash aún.
- Si Android Studio también falla el build: es el entorno (ver `activation-checklist.md` → probar otro JDK 17 / reinstalar SDK en `~/Library/Android/sdk`).
