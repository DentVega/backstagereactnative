import { test } from "node:test";
import assert from "node:assert/strict";
import { buildHostContract } from "../gen-host-contract.mjs";
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
