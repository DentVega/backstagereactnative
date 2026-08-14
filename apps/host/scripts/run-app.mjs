#!/usr/bin/env node
/**
 * Instala/lanza la app nativa apuntando a UN device — así funciona con varios
 * conectados (evita `react-native run-android: more than one device/emulator`).
 *   Android: usa $ANDROID_SERIAL, o el primer device conectado. Warn si hay varios.
 *   iOS:     usa $IOS_UDID / $IOS_SIMULATOR (nombre) si están; si no, el default de run-ios.
 * Uso: node scripts/run-app.mjs <android|ios> [hostFilter]
 */
import {spawnSync, execFileSync} from 'node:child_process';
import {parseAdbDevices} from './dev-plan.mjs';

const platform = process.argv[2];
const hostFilter = process.argv[3] ?? '@app/host';

function run(args) {
  const r = spawnSync('pnpm', ['--filter', hostFilter, 'exec', 'react-native', ...args], {
    stdio: 'inherit',
  });
  process.exit(r.status ?? 0);
}

if (platform === 'android') {
  let serial = process.env.ANDROID_SERIAL;
  if (!serial) {
    let out = '';
    try {
      out = execFileSync('adb', ['devices'], {encoding: 'utf8'});
    } catch {
      console.error('✗ No pude correr `adb` (¿Android SDK en el PATH?).');
      process.exit(1);
    }
    const devices = parseAdbDevices(out);
    if (devices.length === 0) {
      console.error('✗ No hay device Android conectado — abrí un emulador o conectá uno.');
      process.exit(1);
    }
    serial = devices[0];
    if (devices.length > 1) {
      console.warn(
        `⚠ ${devices.length} devices conectados; uso ${serial}. Para elegir otro: ANDROID_SERIAL=<serial> pnpm dev`,
      );
    }
  }
  console.log(`▶ run-android en ${serial}`);
  run(['run-android', '--deviceId', serial]);
} else if (platform === 'ios') {
  const args = ['run-ios'];
  if (process.env.IOS_UDID) args.push('--udid', process.env.IOS_UDID);
  else if (process.env.IOS_SIMULATOR) args.push('--simulator', process.env.IOS_SIMULATOR);
  run(args);
} else {
  console.error('uso: run-app.mjs <android|ios> [hostFilter]');
  process.exit(1);
}
