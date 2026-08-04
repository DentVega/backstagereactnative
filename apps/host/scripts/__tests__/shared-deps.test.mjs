import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SHARED_DEPS, CONTRACT_VERSION, CAPABILITY_SINCE, buildMfShared, BUNDLED_DEPS, reconcileDeps } from "../../shared-deps.mjs";

// pkgVersion falso y determinista para el snapshot.
const fakePkg = (name) => `v(${name})`;

test("buildMfShared reproduce EXACTAMENTE el bloque shared actual", () => {
  const out = buildMfShared(SHARED_DEPS, fakePkg);
  assert.deepEqual(out, {
    react: { singleton: true, eager: true, requiredVersion: "18.3.1" },
    "react-native": { singleton: true, eager: true, requiredVersion: "0.76.6" },
    "@tanstack/react-query": { singleton: true, eager: true, version: "v(@tanstack/react-query)", requiredVersion: "^5.0.0" },
    "@shopify/flash-list": { singleton: true, eager: true, version: "v(@shopify/flash-list)", requiredVersion: "^1.7.0" },
    zustand: { singleton: true, eager: true, version: "v(zustand)", requiredVersion: "^5.0.0" },
    "@react-navigation/native": { singleton: true, eager: true, version: "v(@react-navigation/native)", requiredVersion: "^7.0.0" },
    "@react-navigation/native-stack": { singleton: true, eager: true, version: "v(@react-navigation/native-stack)", requiredVersion: "^7.0.0" },
    "@dentvega/ui-kit": { singleton: true, eager: true, version: "v(@dentvega/ui-kit)", requiredVersion: "^0.1.0" },
  });
});

test("react y react-native NO llevan campo version (solo requiredVersion exacto)", () => {
  const out = buildMfShared(SHARED_DEPS, fakePkg);
  assert.equal("version" in out.react, false);
  assert.equal("version" in out["react-native"], false);
});

test("CONTRACT_VERSION es la fuente única y tiene forma semver", () => {
  assert.equal(typeof CONTRACT_VERSION, "string");
  assert.match(CONTRACT_VERSION, /^\d+\.\d+\.\d+$/);
});

test("CAPABILITY_SINCE cubre toda SHARED_DEP", () => {
  for (const d of SHARED_DEPS) assert.equal(typeof CAPABILITY_SINCE.shared[d.name], "string");
});

test("CAPABILITY_SINCE.native tiene los 4 nativos del host", () => {
  for (const n of [
    "@shopify/flash-list",
    "react-native-safe-area-context",
    "react-native-screens",
    "@callstack/repack",
  ])
    assert.equal(typeof CAPABILITY_SINCE.native[n], "string");
});

// --- reconciliación package.json <-> clasificación de deps ---
const cls = () => ({
  shared: SHARED_DEPS.map((d) => d.name),
  native: Object.keys(CAPABILITY_SINCE.native),
  bundled: BUNDLED_DEPS,
});

test("reconcileDeps: dep sin clasificar → unclassified", () => {
  const r = reconcileDeps(["react", "misteriosa"], { shared: ["react"], native: [], bundled: [] });
  assert.deepEqual(r.unclassified, ["misteriosa"]);
});

test("reconcileDeps: shared que no es dep real → phantomShared", () => {
  const r = reconcileDeps(["react"], { shared: ["react", "fantasma"], native: [], bundled: [] });
  assert.deepEqual(r.phantomShared, ["fantasma"]);
});

test("reconcileDeps: bundled stale + conflicting", () => {
  const r = reconcileDeps(["react"], { shared: ["react"], native: [], bundled: ["react", "vieja"] });
  assert.deepEqual(r.staleBundled, ["vieja"]);
  assert.deepEqual(r.conflicting, ["react"]);
});

test("reconcileDeps: todo clasificado → sin violaciones", () => {
  const r = reconcileDeps(["react", "rn-screens", "@dentvega/host-runtime"], {
    shared: ["react"],
    native: ["rn-screens"],
    bundled: ["@dentvega/host-runtime"],
  });
  assert.deepEqual(r, { unclassified: [], phantomShared: [], staleBundled: [], conflicting: [] });
});

test("EL package.json del host está reconciliado (gate real)", () => {
  const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  const r = reconcileDeps(Object.keys(pkg.dependencies ?? {}), cls());
  assert.deepEqual(r.unclassified, [], `runtime deps sin clasificar → agregalas a SHARED_DEPS / CAPABILITY_SINCE.native / BUNDLED_DEPS: ${r.unclassified.join(", ")}`);
  assert.deepEqual(r.phantomShared, [], `en SHARED_DEPS pero no en package.json: ${r.phantomShared.join(", ")}`);
  assert.deepEqual(r.staleBundled, [], `en BUNDLED_DEPS pero no en package.json: ${r.staleBundled.join(", ")}`);
  assert.deepEqual(r.conflicting, [], `en SHARED_DEPS y BUNDLED_DEPS a la vez: ${r.conflicting.join(", ")}`);
});
