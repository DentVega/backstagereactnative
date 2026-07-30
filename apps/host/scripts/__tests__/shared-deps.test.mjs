import { test } from "node:test";
import assert from "node:assert/strict";
import { SHARED_DEPS, buildMfShared } from "../../shared-deps.mjs";

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
