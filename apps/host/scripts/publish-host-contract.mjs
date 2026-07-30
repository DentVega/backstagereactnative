/**
 * Sube host-contract.json a Backstage (PUT /api/host-contract) con el
 * HOST_CONTRACT_TOKEN dedicado. Uso (en CI/release del host):
 *   BACKSTAGE_URL=... HOST_CONTRACT_TOKEN=... node scripts/publish-host-contract.mjs
 * Requiere que gen-host-contract.mjs haya corrido antes (host-contract.json).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export function buildPutRequest(baseUrl, token, contract) {
  const url = `${baseUrl.replace(/\/+$/, "")}/api/host-contract`;
  return {
    url,
    init: {
      method: "PUT",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(contract),
    },
  };
}

export async function publishHostContract(baseUrl, token, contract, fetchImpl = fetch) {
  const { url, init } = buildPutRequest(baseUrl, token, contract);
  const res = await fetchImpl(url, init);
  if (!res.ok) {
    throw new Error(`publish host-contract failed: HTTP ${res.status} — ${await res.text()}`);
  }
}

// --- CLI ---
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const baseUrl = process.env.BACKSTAGE_URL;
  const token = process.env.HOST_CONTRACT_TOKEN;
  if (!baseUrl || !token) {
    console.error("BACKSTAGE_URL and HOST_CONTRACT_TOKEN are required");
    process.exit(1);
  }
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const contract = JSON.parse(readFileSync(path.join(__dirname, "..", "host-contract.json"), "utf8"));
  await publishHostContract(baseUrl, token, contract);
  console.log(`published host-contract v${contract.contractVersion} to ${baseUrl}`);
}
