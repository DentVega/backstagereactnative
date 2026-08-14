/**
 * Pure planning for the dev orchestrator (`pnpm dev`). No I/O — takes the parsed
 * `devMiniapps` config + a `resolvePath` fn and returns the derived env vars, adb
 * ports and process list, plus an mprocs YAML. Kept pure so it's unit-testable
 * (node:test); the side effects (import config, write yaml, spawn mprocs) live in
 * dev.mjs.
 */

/** Dev-mount slots (must match rspack.config.mjs MAX_DEV_MINIAPPS). */
export const MAX_MOUNTS = 6;
/** Backstage control-plane port the host talks to in dev. */
export const BACKSTAGE_PORT = 3999;

/**
 * @param {Array} config  the `devMiniapps` array
 * @param {(p: string) => string} resolvePath  config path → absolute path
 * @param {{backstage?: {cwd: string, port: number, autostart: boolean}}} [opts]
 */
export function buildDevPlan(config, resolvePath, opts = {}) {
  if (!Array.isArray(config)) throw new Error('devMiniapps config must be an array');
  const warnings = [];
  const mounts = [];
  const remotes = [];
  const seenPorts = new Map();
  const seenIds = new Set();

  for (const m of config) {
    if (!m || typeof m.id !== 'string' || !m.id) {
      throw new Error('each miniapp needs a non-empty "id"');
    }
    if (seenIds.has(m.id)) throw new Error(`duplicate id "${m.id}"`);
    seenIds.add(m.id);
    if (typeof m.path !== 'string' || !m.path) {
      throw new Error(`miniapp "${m.id}" needs a "path"`);
    }
    const cwd = resolvePath(m.path);
    const mode = m.mode ?? 'mount';
    const autostart = m.autostart !== false;
    if (mode === 'remote') {
      if (!Number.isInteger(m.port)) {
        throw new Error(`remote "${m.id}" needs an integer "port"`);
      }
      if (seenPorts.has(m.port)) {
        throw new Error(`port ${m.port} is used by both "${seenPorts.get(m.port)}" and "${m.id}"`);
      }
      seenPorts.set(m.port, m.id);
      remotes.push({ id: m.id, port: m.port, cwd, autostart });
    } else if (mode === 'mount') {
      mounts.push({ id: m.id, cwd, autostart });
    } else {
      throw new Error(`miniapp "${m.id}" has invalid mode "${mode}" (use "mount" | "remote")`);
    }
  }

  let mountPaths = mounts.filter((m) => m.autostart).map((m) => m.cwd);
  if (mountPaths.length > MAX_MOUNTS) {
    warnings.push(
      `${mountPaths.length} mount miniapps enabled; capping at ${MAX_MOUNTS} (dev-mount slots).`,
    );
    mountPaths = mountPaths.slice(0, MAX_MOUNTS);
  }

  // net.host = a dónde apunta el device a los dev servers ('localhost' para emu/sim;
  // la IP LAN de la Mac para device físico). net.bindAll → dev servers en 0.0.0.0.
  const net = opts.net ?? {host: 'localhost', bindAll: false};
  const backstagePort = opts.backstage?.port ?? BACKSTAGE_PORT;
  const adbPorts = [...new Set([backstagePort, ...remotes.map((r) => r.port)])];
  return {
    mountPaths,
    remotes,
    backstage: opts.backstage ?? null,
    net,
    rspackPoll: opts.rspackPoll ?? null,
    devMiniappPathsEnv: mountPaths.join(','),
    devRemotesEnv: remotes.map((r) => `${r.id}=http://${net.host}:${r.port}`).join(','),
    adbPorts,
    warnings,
  };
}

/**
 * Preflight: cada repo del dev-loop (miniapps + Backstage) tiene que estar
 * `pnpm install`ado (deps resuelven desde su carpeta). `entries` = [{id, path, cwd,
 * mode}]; `exists(path)` chequea el filesystem. Un mount sin node_modules ROMPE el
 * bundle del host → error; el resto (remote/service) solo falla al prender su proc
 * → warning.
 */
export function checkInstalls(entries, exists) {
  const errors = [];
  const warnings = [];
  for (const e of entries) {
    if (!exists(e.cwd)) {
      errors.push({id: e.id, msg: `path no existe: ${e.cwd}`});
      continue;
    }
    if (!exists(`${e.cwd}/node_modules`)) {
      const item = {id: e.id, msg: `falta node_modules — corré: cd ${e.path} && pnpm install`};
      ((e.mode ?? 'mount') === 'mount' ? errors : warnings).push(item);
    }
  }
  return {errors, warnings};
}

/** Próximo puerto libre desde `start`, evitando los ya usados por remotes. Puro. */
export function nextFreePort(entries, start = 9000) {
  const used = new Set(entries.filter((e) => Number.isInteger(e.port)).map((e) => e.port));
  let p = start;
  while (used.has(p)) p++;
  return p;
}

/**
 * Mergea miniapps detectadas en la config (preserva las existentes; agrega solo las
 * nuevas por id). `detected` = [{id, path}]; `mode` = 'mount'|'remote' para las nuevas
 * (remote → puerto auto). Devuelve {merged, added}. Puro.
 */
export function mergeMiniapps(existing, detected, {mode = 'mount'} = {}) {
  const seen = new Set(existing.map((e) => e.id));
  const merged = [...existing];
  const added = [];
  for (const d of detected) {
    if (seen.has(d.id)) continue;
    const entry = {id: d.id, path: d.path, mode, autostart: true};
    if (mode === 'remote') entry.port = nextFreePort(merged);
    merged.push(entry);
    seen.add(d.id);
    added.push(d.id);
  }
  return {merged, added};
}

/** Serializa la config a un módulo `.mjs` (para `pnpm dev:scan --write`). Puro. */
export function serializeConfig(devMiniapps, backstage) {
  const one = (e) => {
    const parts = [
      `id: ${JSON.stringify(e.id)}`,
      `path: ${JSON.stringify(e.path)}`,
      `mode: ${JSON.stringify(e.mode ?? 'mount')}`,
    ];
    if (Number.isInteger(e.port)) parts.push(`port: ${e.port}`);
    parts.push(`autostart: ${e.autostart !== false}`);
    return `  {${parts.join(', ')}}`;
  };
  let out =
    '// dev-miniapps.config.mjs — generado/actualizado por `pnpm dev:scan`. Editá a mano lo que quieras.\n';
  out += `export const devMiniapps = [\n${devMiniapps.map(one).join(',\n')}${devMiniapps.length ? ',' : ''}\n];\n`;
  if (backstage) {
    const b = [`path: ${JSON.stringify(backstage.path)}`];
    if (Number.isInteger(backstage.port)) b.push(`port: ${backstage.port}`);
    b.push(`autostart: ${backstage.autostart !== false}`);
    out += `\nexport const backstage = {${b.join(', ')}};\n`;
  }
  return out;
}

/** Serials de los devices Android conectados, del output de `adb devices`. Puro. */
export function parseAdbDevices(output) {
  return String(output)
    .split('\n')
    .slice(1) // salta el header "List of devices attached"
    .map((l) => l.trim())
    .filter((l) => /\tdevice$/.test(l)) // solo "device" (no offline/unauthorized)
    .map((l) => l.split('\t')[0]);
}

const yq = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

/** Serialize a plan into an mprocs YAML config. */
export function toMprocsYaml(plan, { hostFilter = '@app/host' } = {}) {
  // Reverse every port on EVERY connected Android device — works with 1 or many
  // (avoids `adb: more than one device/emulator`); a no-op with no android devices.
  const reverses = plan.adbPorts.map((p) => `adb -s "$s" reverse tcp:${p} tcp:${p}`).join('; ');
  const adb = plan.adbPorts.length
    ? `for s in $(adb devices | awk 'NR>1 && $2=="device"{print $1}'); do ${reverses}; done`
    : 'true';
  const net = plan.net ?? {host: 'localhost', bindAll: false};
  const bind = net.bindAll ? ' --host 0.0.0.0' : ''; // dev servers en todas las interfaces (device físico)
  const bsPort = plan.backstage?.port ?? BACKSTAGE_PORT;
  const L = ['procs:'];

  // adb reverse (one-shot): forwards Backstage + every remote port to the device(s).
  L.push('  adb-reverse:', '    autostart: true', `    shell: ${yq(adb)}`);

  // Backstage control-plane (Next.js) on its port, if the config declares it.
  if (plan.backstage) {
    L.push('  Backstage:', `    autostart: ${plan.backstage.autostart}`);
    L.push(`    cwd: ${yq(plan.backstage.cwd)}`);
    L.push(`    shell: ${yq(`pnpm exec next dev -p ${plan.backstage.port}${net.bindAll ? ' -H 0.0.0.0' : ''}`)}`);
  }

  // Host Metro/Re.Pack, with the derived env. En device físico el bundle apunta a la
  // IP LAN de la Mac (BACKSTAGE_URL) y Metro escucha en 0.0.0.0.
  L.push('  Host:', '    autostart: true', '    env:');
  L.push(`      DEV_MINIAPP_PATHS: ${yq(plan.devMiniappPathsEnv)}`);
  L.push(`      DEV_REMOTES: ${yq(plan.devRemotesEnv)}`);
  if (net.host !== 'localhost') {
    L.push(`      BACKSTAGE_URL: ${yq(`http://${net.host}:${bsPort}`)}`);
  }
  if (plan.rspackPoll) {
    L.push(`      RSPACK_POLL: ${yq(String(plan.rspackPoll))}`); // polling en disco externo
  }
  L.push(`    shell: ${yq(`pnpm --filter ${hostFilter} exec react-native start${bind}`)}`);

  // One dev server per remote miniapp.
  for (const r of plan.remotes) {
    L.push(`  ${yq(r.id)}:`);
    L.push(`    autostart: ${r.autostart}`);
    L.push(`    cwd: ${yq(r.cwd)}`);
    L.push(`    shell: ${yq(`pnpm exec react-native webpack-start --port ${r.port}${bind}`)}`);
  }

  // Install/launch the native app on demand (start it from the TUI when needed).
  // run-app.mjs picks a device (ANDROID_SERIAL / first connected) so it works with
  // 2+ devices instead of failing with "more than one device/emulator".
  L.push('  app-android:', '    autostart: false');
  L.push(`    shell: ${yq(`node apps/host/scripts/run-app.mjs android ${hostFilter}`)}`);
  L.push('  app-ios:', '    autostart: false');
  L.push(`    shell: ${yq(`node apps/host/scripts/run-app.mjs ios ${hostFilter}${net.bindAll ? ' --device' : ''}`)}`);

  return L.join('\n') + '\n';
}
