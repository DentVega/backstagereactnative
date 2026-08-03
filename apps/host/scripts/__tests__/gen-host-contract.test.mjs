import { test } from "node:test";
import assert from "node:assert/strict";
import { buildHostContract, parseAutolinkedNatives, requireNativeModules } from "../gen-host-contract.mjs";
import { SHARED_DEPS } from "../../shared-deps.mjs";
import { isHostContract } from "@dentvega/miniapp-contract";

const fakePkg = (name) => (name === "react-native" ? "0.76.6" : `1.0.0`);

test("buildHostContract emite un HostContract válido con las versiones resueltas", () => {
  const c = buildHostContract(SHARED_DEPS, fakePkg, { contractVersion: "1.2.3" });
  assert.equal(c.contractVersion, "1.2.3");
  assert.equal(c.reactNative, "0.76.6");
  assert.equal(c.shared["react-native"], "0.76.6");
  assert.equal(c.shared["@dentvega/ui-kit"], "1.0.0");
  assert.deepEqual(c.nativeModules, []); // Fase 2 los puebla
  assert.equal(isHostContract(c), true);
});

// Forma real del output de `react-native config`: dependencies[name].platforms.{android,ios}
// es un OBJETO si el dep tiene código nativo en esa plataforma, o null si no.
const RN_CONFIG = {
  dependencies: {
    "@shopify/flash-list": { platforms: { android: { sourceDir: "x" }, ios: {} } },
    "react-native-screens": { platforms: { android: {}, ios: null } },
    "some-pure-js-lib": { platforms: { android: null, ios: null } },
    "@callstack/repack": { platforms: { android: {}, ios: {} } },
  },
};

test("parseAutolinkedNatives: solo los deps con native code (android o ios no-null)", () => {
  const out = parseAutolinkedNatives(RN_CONFIG);
  assert.deepEqual(out.sort(), ["@callstack/repack", "@shopify/flash-list", "react-native-screens"]);
  assert.equal(out.includes("some-pure-js-lib"), false);
});

test("parseAutolinkedNatives: tolera config vacío/sin dependencies", () => {
  assert.deepEqual(parseAutolinkedNatives({}), []);
  assert.deepEqual(parseAutolinkedNatives({ dependencies: {} }), []);
});

test("buildHostContract incluye los nativeModules pasados", () => {
  const fakePkg = (name) => (name === "react-native" ? "0.76.6" : "1.0.0");
  const c = buildHostContract(SHARED_DEPS, fakePkg, { contractVersion: "1.0.0", nativeModules: ["react-native-screens"] });
  assert.deepEqual(c.nativeModules, ["react-native-screens"]);
});

test("requireNativeModules: lista no vacía → passthrough", () => {
  assert.deepEqual(requireNativeModules(["react-native-screens"], false), ["react-native-screens"]);
});

test("requireNativeModules: vacío sin allow → throw (fail-loud)", () => {
  assert.throws(() => requireNativeModules([], false), /no native modules detected/);
});

test("requireNativeModules: vacío con ALLOW_NO_NATIVES → [] permitido", () => {
  assert.deepEqual(requireNativeModules([], true), []);
});
