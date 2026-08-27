import { ed25519 } from "@noble/curves/ed25519.js";
import { signatureVerifier } from "../signature";
import { signatureMessage } from "../signatureMessage";
import type { ResolveResponse } from "@dentvega/miniapp-contract";

const b64url = (b: Uint8Array) => Buffer.from(b).toString("base64url");
const bundleOf = (keys: Record<string, string> | null) => ({ keys: async () => keys });

function resolved(signature?: string, integrity: string | undefined = "sha256-abc"): ResolveResponse {
  return {
    id: "acc" as never,
    version: "1.0.0" as never,
    url: "u",
    manifest: {
      id: "acc" as never,
      version: "1.0.0" as never,
      entry: "./E",
      shared: [],
      capabilities: [],
      integrity,
      signature,
    },
  };
}

describe("signatureVerifier", () => {
  const secret = ed25519.utils.randomSecretKey();
  const pub = b64url(ed25519.getPublicKey(secret));
  const sigFor = (msg: string) => b64url(ed25519.sign(new TextEncoder().encode(msg), secret));

  it("ok cuando la firma verifica contra la pubkey del bundle", async () => {
    const sig = sigFor(signatureMessage("acc", "android", "sha256-abc"));
    const v = signatureVerifier(bundleOf({ acc: pub }));
    expect(await v.verify(resolved(sig), "android")).toBe("ok");
  });
  it("invalid cuando la firma no corresponde", async () => {
    const v = signatureVerifier(bundleOf({ acc: pub }));
    expect(await v.verify(resolved("firma-mala"), "android")).toBe("invalid");
  });
  it("missing cuando no hay signature en el manifest", async () => {
    const v = signatureVerifier(bundleOf({ acc: pub }));
    expect(await v.verify(resolved(undefined), "android")).toBe("missing");
  });
  it("unknown-key cuando la miniapp no está en el bundle", async () => {
    const sig = sigFor(signatureMessage("acc", "android", "sha256-abc"));
    const v = signatureVerifier(bundleOf({ otra: pub }));
    expect(await v.verify(resolved(sig), "android")).toBe("unknown-key");
  });
  it("skip cuando no hay bundle (root key off)", async () => {
    const v = signatureVerifier(bundleOf(null));
    expect(await v.verify(resolved("x"), "android")).toBe("skip");
  });
  it("invalid ante base64url basura (no tira)", async () => {
    const v = signatureVerifier(bundleOf({ acc: pub }));
    expect(await v.verify(resolved("!!!no-b64!!!"), "android")).toBe("invalid");
  });
});
