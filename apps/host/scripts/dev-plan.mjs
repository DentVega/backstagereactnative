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

  const backstagePort = opts.backstage?.port ?? BACKSTAGE_PORT;
  const adbPorts = [...new Set([backstagePort, ...remotes.map((r) => r.port)])];
  return {
    mountPaths,
    remotes,
    backstage: opts.backstage ?? null,
    devMiniappPathsEnv: mountPaths.join(','),
    devRemotesEnv: remotes.map((r) => `${r.id}=http://localhost:${r.port}`).join(','),
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

const yq = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

/** Serialize a plan into an mprocs YAML config. */
export function toMprocsYaml(plan, { hostFilter = '@app/host' } = {}) {
  // Reverse every port on EVERY connected Android device — works with 1 or many
  // (avoids `adb: more than one device/emulator`); a no-op with no android devices.
  const reverses = plan.adbPorts.map((p) => `adb -s "$s" reverse tcp:${p} tcp:${p}`).join('; ');
  const adb = plan.adbPorts.length
    ? `for s in $(adb devices | awk 'NR>1 && $2=="device"{print $1}'); do ${reverses}; done`
    : 'true';
  const L = ['procs:'];

  // adb reverse (one-shot): forwards Backstage + every remote port to the device(s).
  L.push('  adb-reverse:', '    autostart: true', `    shell: ${yq(adb)}`);

  // Backstage control-plane (Next.js) on its port, if the config declares it.
  if (plan.backstage) {
    L.push('  Backstage:', `    autostart: ${plan.backstage.autostart}`);
    L.push(`    cwd: ${yq(plan.backstage.cwd)}`);
    L.push(`    shell: ${yq(`pnpm exec next dev -p ${plan.backstage.port}`)}`);
  }

  // Host Metro/Re.Pack, with the derived env.
  L.push('  Host:', '    autostart: true', '    env:');
  L.push(`      DEV_MINIAPP_PATHS: ${yq(plan.devMiniappPathsEnv)}`);
  L.push(`      DEV_REMOTES: ${yq(plan.devRemotesEnv)}`);
  L.push(`    shell: ${yq(`pnpm --filter ${hostFilter} start`)}`);

  // One dev server per remote miniapp.
  for (const r of plan.remotes) {
    L.push(`  ${yq(r.id)}:`);
    L.push(`    autostart: ${r.autostart}`);
    L.push(`    cwd: ${yq(r.cwd)}`);
    L.push(`    shell: ${yq(`pnpm exec react-native webpack-start --port ${r.port}`)}`);
  }

  // Install/launch the native app on demand (start it from the TUI when needed).
  for (const plat of ['android', 'ios']) {
    L.push(`  ${yq(`app-${plat}`)}:`, '    autostart: false');
    L.push(`    shell: ${yq(`pnpm --filter ${hostFilter} ${plat}`)}`);
  }

  return L.join('\n') + '\n';
}
