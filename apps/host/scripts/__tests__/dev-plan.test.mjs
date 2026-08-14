import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildDevPlan, toMprocsYaml, MAX_MOUNTS} from '../dev-plan.mjs';

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
  assert.match(yaml, /adb reverse tcp:3999 tcp:3999 && adb reverse tcp:9000 tcp:9000/);
  assert.match(yaml, /DEV_MINIAPP_PATHS: "\/ABS\/\.\.\/hw"/);
  assert.match(yaml, /DEV_REMOTES: "cw=http:\/\/localhost:9000"/);
  assert.match(yaml, /"cw":/);
  assert.match(yaml, /--port 9000/);
  assert.match(yaml, /"app-android":/);
});
