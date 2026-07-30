import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPutRequest, publishHostContract } from "../publish-host-contract.mjs";

const CONTRACT = { contractVersion: "1.0.0", reactNative: "0.76.6", shared: {}, nativeModules: [] };

test("buildPutRequest arma el PUT con Bearer y JSON", () => {
  const { url, init } = buildPutRequest("https://b.example/", "tok", CONTRACT);
  assert.equal(url, "https://b.example/api/host-contract");
  assert.equal(init.method, "PUT");
  assert.equal(init.headers.authorization, "Bearer tok");
  assert.equal(init.headers["content-type"], "application/json");
  assert.deepEqual(JSON.parse(init.body), CONTRACT);
});

test("publishHostContract lanza si el PUT no es ok", async () => {
  const fakeFetch = async () => ({ ok: false, status: 401, text: async () => "no" });
  await assert.rejects(
    () => publishHostContract("https://b.example", "tok", CONTRACT, fakeFetch),
    /401/,
  );
});

test("publishHostContract resuelve en 200", async () => {
  const fakeFetch = async () => ({ ok: true, status: 200, text: async () => "ok" });
  await assert.doesNotReject(() => publishHostContract("https://b.example", "tok", CONTRACT, fakeFetch));
});
