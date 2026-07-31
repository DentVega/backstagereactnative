import { test } from "node:test";
import assert from "node:assert/strict";
import { findNewlyBroken } from "../check-host-compat.mjs";

const published = { contractVersion: "1.0.0", reactNative: "0.76.6",
  shared: { "react-native": "0.76.6" }, nativeModules: ["react-native-screens"] };

// candidato sube RN a 0.77 → rompe la miniapp que pide ^0.76
const candidate = { ...published, reactNative: "0.77.0", shared: { "react-native": "0.77.0" } };

const manifests = [
  { id: "compat", shared: [{ name: "react-native", requiredRange: "^0.76.0", singleton: true }], nativeModules: [] },
  { id: "any", shared: [{ name: "react-native", requiredRange: "*", singleton: true }], nativeModules: [] },
];

test("findNewlyBroken: lista las miniapps que pasan de compatible → incompatible", () => {
  const broken = findNewlyBroken(published, candidate, manifests);
  assert.deepEqual(broken.map((b) => b.id), ["compat"]); // 'any' (rango *) sigue compatible
});

test("findNewlyBroken: [] si el candidato no rompe a nadie", () => {
  assert.deepEqual(findNewlyBroken(published, published, manifests), []);
});

test("findNewlyBroken: NO marca una miniapp que ya estaba incompatible con el publicado", () => {
  const alreadyBroken = [{ id: "old", shared: [{ name: "react-native", requiredRange: "^0.99.0", singleton: true }], nativeModules: [] }];
  assert.deepEqual(findNewlyBroken(published, candidate, alreadyBroken), []); // era incompat, sigue incompat
});
