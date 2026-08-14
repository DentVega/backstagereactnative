#!/usr/bin/env node
/**
 * `pnpm dev` — orquestador declarativo del dev-loop. Lee dev-miniapps.config.mjs,
 * deriva las env vars (DEV_MINIAPP_PATHS / DEV_REMOTES) + los adb reverse, genera
 * la config de mprocs y la corre. Un comando levanta todo, con autostart/toggle
 * por miniapp. Con DEV_DRY=1 imprime el plan + el YAML y sale (sin arrancar mprocs).
 */
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {buildDevPlan, toMprocsYaml, checkInstalls} from './dev-plan.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)); // apps/host/scripts
const hostPkg = path.resolve(here, '..'); // apps/host
const hostRoot = path.resolve(here, '..', '..', '..'); // backstagereactnative (raíz del repo host)

const configPath = path.join(hostPkg, 'dev-miniapps.config.mjs');
const examplePath = path.join(hostPkg, 'dev-miniapps.config.example.mjs');

async function loadConfig() {
  const useExample = !fs.existsSync(configPath);
  const file = useExample ? examplePath : configPath;
  if (useExample) {
    console.warn('⚠ No hay apps/host/dev-miniapps.config.mjs — usando el ejemplo.');
    console.warn('  Copialo y editá los paths:');
    console.warn('  cp apps/host/dev-miniapps.config.example.mjs apps/host/dev-miniapps.config.mjs');
  }
  const mod = await import(pathToFileURL(file).href);
  return {miniapps: mod.devMiniapps ?? mod.default ?? [], backstage: mod.backstage};
}

const {miniapps: config, backstage: backstageCfg} = await loadConfig();

const resolvePath = (rel) => path.resolve(hostRoot, rel);
const backstage = backstageCfg
  ? {
      cwd: resolvePath(backstageCfg.path),
      port: backstageCfg.port ?? 3999,
      autostart: backstageCfg.autostart !== false,
    }
  : null;

let plan;
try {
  plan = buildDevPlan(config, resolvePath, {backstage});
} catch (e) {
  console.error(`✗ Config inválida: ${e.message}`);
  process.exit(1);
}
for (const w of plan.warnings) console.warn(`⚠ ${w}`);

// Preflight: cada repo (miniapps + Backstage) tiene que estar pnpm install-ado.
const preflightEntries = config.map((m) => ({
  id: m.id,
  path: m.path,
  cwd: resolvePath(m.path),
  mode: m.mode ?? 'mount',
}));
if (backstage) {
  preflightEntries.push({id: 'Backstage', path: backstageCfg.path, cwd: backstage.cwd, mode: 'service'});
}
const {errors, warnings} = checkInstalls(preflightEntries, (p) => fs.existsSync(p));
for (const w of warnings) console.warn(`⚠ ${w.id}: ${w.msg}`);
if (errors.length > 0) {
  console.error('✗ Repos sin instalar (el dev-mount rompería el bundle del host):');
  for (const e of errors) console.error(`  • ${e.id}: ${e.msg}`);
  if (process.env.DEV_DRY !== '1') process.exit(1);
}

const yaml = toMprocsYaml(plan);
const yamlPath = path.join(hostPkg, '.mprocs.generated.yaml');
fs.writeFileSync(yamlPath, yaml, 'utf8');

const summary = `${plan.mountPaths.length} mount, ${plan.remotes.length} remote${plan.backstage ? ` + Backstage :${plan.backstage.port}` : ''} (adb: ${plan.adbPorts.join(', ')})`;

if (process.env.DEV_DRY === '1') {
  console.log(`▶ pnpm dev (dry-run) — ${summary}\n`);
  console.log(yaml);
  process.exit(0);
}

console.log(`▶ pnpm dev — ${summary}`);
// npx fetches mprocs on first use (no hard dependency → no CI install of the binary).
const child = spawn('npx', ['--yes', 'mprocs', '-c', yamlPath], {
  stdio: 'inherit',
  cwd: hostRoot,
});
child.on('error', (e) => {
  console.error(`✗ No pude arrancar mprocs (${e.message}).`);
  console.error('  Asegurate de tener npx (viene con Node), o instalá: pnpm add -D mprocs');
  process.exit(1);
});
child.on('exit', (code) => process.exit(code ?? 0));
