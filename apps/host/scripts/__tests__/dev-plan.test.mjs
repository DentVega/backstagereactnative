import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildDevPlan, toMprocsYaml, checkInstalls, MAX_MOUNTS} from '../dev-plan.mjs';

const abs = (p) => `/ABS/${p}`; // deterministic resolvePath for tests

test('mixed config → env vars + adb ports', () => {
  const plan = buildDevPlan(
    [
      {id: 'hw', path: '../miniapp-hw', mode: 'mount', autostart: true},
      {id: 'cw', path: '../miniapp-cw', mode: 'remote', port: 9000, autostart: true},
      {id: 'ad', path: '../miniapp-ad', mode: 'remote', port: 9001, autostart: false},
    ],
    abs,
  );
  assert.deepEqual(plan.mountPaths, ['/ABS/../miniapp-hw']);
  assert.equal(plan.devMiniappPathsEnv, '/ABS/../miniapp-hw');
  assert.equal(plan.devRemotesEnv, 'cw=http://localhost:9000,ad=http://localhost:9001');
  assert.deepEqual(plan.adbPorts, [3999, 9000, 9001]);
  assert.equal(plan.remotes.length, 2);
  assert.equal(plan.remotes[1].autostart, false);
  assert.deepEqual(plan.warnings, []);
});

test('mode defaults to mount; autostart defaults to true', () => {
  const plan = buildDevPlan([{id: 'x', path: '../x'}], abs);
  assert.deepEqual(plan.mountPaths, ['/ABS/../x']);
});

test('disabled mount is excluded from DEV_MINIAPP_PATHS', () => {
  const plan = buildDevPlan([{id: 'x', path: '../x', mode: 'mount', autostart: false}], abs);
  assert.equal(plan.devMiniappPathsEnv, '');
});

test('remote without a port throws', () => {
  assert.throws(
    () => buildDevPlan([{id: 'x', path: '../x', mode: 'remote'}], abs),
    /needs an integer "port"/,
  );
});

test('duplicate ports throw', () => {
  assert.throws(
    () =>
      buildDevPlan(
        [
          {id: 'a', path: '../a', mode: 'remote', port: 9000},
          {id: 'b', path: '../b', mode: 'remote', port: 9000},
        ],
        abs,
      ),
    /port 9000 is used by both/,
  );
});

test('missing path / bad mode / dup id throw', () => {
  assert.throws(() => buildDevPlan([{id: 'x'}], abs), /needs a "path"/);
  assert.throws(() => buildDevPlan([{id: 'x', path: '../x', mode: 'nope'}], abs), /invalid mode/);
  assert.throws(
    () => buildDevPlan([{id: 'x', path: '../x'}, {id: 'x', path: '../y'}], abs),
    /duplicate id/,
  );
});

test('caps mounts at MAX_MOUNTS with a warning', () => {
  const cfg = Array.from({length: MAX_MOUNTS + 2}, (_, i) => ({
    id: `m${i}`,
    path: `../m${i}`,
    mode: 'mount',
    autostart: true,
  }));
  const plan = buildDevPlan(cfg, abs);
  assert.equal(plan.mountPaths.length, MAX_MOUNTS);
  assert.equal(plan.warnings.length, 1);
  assert.match(plan.warnings[0], /capping at 6/);
});

test('toMprocsYaml wires Host env, adb-reverse and per-remote procs', () => {
  const plan = buildDevPlan(
    [
      {id: 'hw', path: '../hw', mode: 'mount', autostart: true},
      {id: 'cw', path: '../cw', mode: 'remote', port: 9000, autostart: true},
    ],
    abs,
  );
  const yaml = toMprocsYaml(plan);
  assert.match(yaml, /adb-reverse:/);
  assert.match(yaml, /for s in \$\(adb devices/); // loops over every connected device
  assert.match(yaml, /adb -s .* reverse tcp:3999 tcp:3999/);
  assert.match(yaml, /adb -s .* reverse tcp:9000 tcp:9000/);
  assert.match(yaml, /DEV_MINIAPP_PATHS: "\/ABS\/\.\.\/hw"/);
  assert.match(yaml, /DEV_REMOTES: "cw=http:\/\/localhost:9000"/);
  assert.match(yaml, /"cw":/);
  assert.match(yaml, /--port 9000/);
  assert.match(yaml, /"app-android":/);
});

const entry = (id, p, mode) => ({id, path: p, cwd: abs(p), mode});

test('checkInstalls: missing path → error; installed → clean', () => {
  const exists = (x) => x === '/ABS/../hw' || x === '/ABS/../hw/node_modules';
  const {errors, warnings} = checkInstalls(
    [entry('hw', '../hw', 'mount'), entry('ad', '../ad', 'mount')],
    exists,
  );
  assert.equal(warnings.length, 0);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].id, 'ad');
  assert.match(errors[0].msg, /path no existe/);
});

test('checkInstalls: mount w/o node_modules → error; remote/service → warning', () => {
  const exists = (x) => ['/ABS/../m', '/ABS/../r', '/ABS/../bs'].includes(x); // paths exist, no node_modules
  const {errors, warnings} = checkInstalls(
    [entry('m', '../m', 'mount'), entry('r', '../r', 'remote'), entry('Backstage', '../bs', 'service')],
    exists,
  );
  assert.equal(errors.length, 1);
  assert.equal(errors[0].id, 'm');
  assert.match(errors[0].msg, /falta node_modules.*pnpm install/);
  assert.equal(warnings.length, 2); // remote r + service Backstage
});

test('checkInstalls: all installed → nothing', () => {
  const {errors, warnings} = checkInstalls([entry('hw', '../hw', 'mount')], () => true);
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
});

test('buildDevPlan: backstage port drives adb; plan carries backstage', () => {
  const plan = buildDevPlan([{id: 'r', path: '../r', mode: 'remote', port: 9000}], abs, {
    backstage: {cwd: '/ABS/bs', port: 3999, autostart: true},
  });
  assert.deepEqual(plan.adbPorts, [3999, 9000]);
  assert.equal(plan.backstage.port, 3999);
});

test('buildDevPlan: no backstage → null + default adb 3999', () => {
  const plan = buildDevPlan([{id: 'r', path: '../r', mode: 'remote', port: 9000}], abs);
  assert.equal(plan.backstage, null);
  assert.deepEqual(plan.adbPorts, [3999, 9000]);
});

test('toMprocsYaml: emits Backstage proc when configured, omits otherwise', () => {
  const withBs = toMprocsYaml(buildDevPlan([], abs, {backstage: {cwd: '/ABS/bs', port: 3999, autostart: true}}));
  assert.match(withBs, /Backstage:/);
  assert.match(withBs, /next dev -p 3999/);
  assert.doesNotMatch(toMprocsYaml(buildDevPlan([], abs)), /Backstage:/);
});
