import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDevMiniappPaths,
  devMiniappName,
  MAX_DEV_MINIAPPS,
} from '../dev-miniapps.mjs';

test('DEV_MINIAPP_PATHS (CSV) → trimmed list', () => {
  assert.deepEqual(parseDevMiniappPaths(' ../a , ../b ', undefined), ['../a', '../b']);
});

test('falls back to single DEV_MINIAPP_PATH (back-compat)', () => {
  assert.deepEqual(parseDevMiniappPaths('', '../solo'), ['../solo']);
  assert.deepEqual(parseDevMiniappPaths(undefined, '../solo'), ['../solo']);
});

test('CSV takes precedence over the single path', () => {
  assert.deepEqual(parseDevMiniappPaths('../a,../b', '../solo'), ['../a', '../b']);
});

test('empty when nothing set', () => {
  assert.deepEqual(parseDevMiniappPaths(undefined, undefined), []);
  assert.deepEqual(parseDevMiniappPaths('  ', ''), []);
});

test('dedupes and caps at MAX_DEV_MINIAPPS', () => {
  assert.deepEqual(parseDevMiniappPaths('../a,../a,../b', undefined), ['../a', '../b']);
  const many = Array.from({length: 10}, (_, i) => `../m${i}`).join(',');
  assert.equal(parseDevMiniappPaths(many, undefined).length, MAX_DEV_MINIAPPS);
});

test('devMiniappName → basename without the miniapp- prefix', () => {
  assert.equal(devMiniappName('../miniapp-hellow_widget'), 'hellow_widget');
  assert.equal(devMiniappName('/abs/path/miniapp-cards_wallet/'), 'cards_wallet');
  assert.equal(devMiniappName('../plain'), 'plain');
});
