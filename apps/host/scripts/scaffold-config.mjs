#!/usr/bin/env node
/**
 * `pnpm dev:scan` — detecta las miniapps hermanas (`../miniapp-*` con manifest.json)
 * y las agrega a dev-miniapps.config.mjs (preserva las que ya están + el export
 * `backstage`). Por defecto hace PREVIEW; con `--write` escribe. `--remote` agrega
 * las nuevas como remote con puerto auto (default: mount).
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {mergeMiniapps, serializeConfig} from './dev-plan.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const hostPkg = path.resolve(here, '..'); // apps/host
const hostRoot = path.resolve(here, '..', '..', '..'); // backstagereactnative
const parent = path.resolve(hostRoot, '..'); // donde viven las miniapps hermanas
const configPath = path.join(hostPkg, 'dev-miniapps.config.mjs');

const write = process.argv.includes('--write');
const mode = process.argv.includes('--remote') ? 'remote' : 'mount';

function detect() {
  const out = [];
  for (const name of fs.readdirSync(parent)) {
    if (!name.startsWith('miniapp-')) continue;
    if (name === 'miniapp-template') continue; // el template, no una miniapp real
    const dir = path.join(parent, name);
    const manifestPath = path.join(dir, 'manifest.json');
    if (!fs.statSync(dir).isDirectory() || !fs.existsSync(manifestPath)) continue;
    let id = name.replace(/^miniapp-/, '');
    try {
      const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (typeof m.id === 'string' && m.id) id = m.id;
    } catch {
      /* manifest ilegible → usá el basename */
    }
    if (/^__.*__$/.test(id)) continue; // manifest con id placeholder (template sin bootstrapear)
    out.push({id, path: `../${name}`});
  }
  return out;
}

async function loadCurrent() {
  if (!fs.existsSync(configPath)) return {devMiniapps: [], backstage: undefined};
  const mod = await import(pathToFileURL(configPath).href);
  return {devMiniapps: mod.devMiniapps ?? [], backstage: mod.backstage};
}

const detected = detect();
const {devMiniapps: existing, backstage} = await loadCurrent();
const {merged, added} = mergeMiniapps(existing, detected, {mode});

console.log(
  `Detectadas ${detected.length} miniapps hermanas: ${detected.map((d) => d.id).join(', ') || '(ninguna)'}`,
);
if (added.length === 0) {
  console.log('✓ La config ya las tiene todas — nada que agregar.');
  process.exit(0);
}
console.log(`Nuevas (${mode}): ${added.join(', ')}`);

const serialized = serializeConfig(merged, backstage);
if (write) {
  fs.writeFileSync(configPath, serialized, 'utf8');
  console.log(`✓ Escrito apps/host/dev-miniapps.config.mjs (${merged.length} miniapps).`);
} else {
  console.log('\n--- config resultante (preview — corré con --write para aplicar) ---\n');
  process.stdout.write(serialized);
}
