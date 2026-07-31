import { checkNativeModules } from "../compat.js";

describe("checkNativeModules", () => {
  const host = ["react-native-screens", "react-native-safe-area-context"];

  it("compatible cuando todos los natives de la miniapp están en el host", () => {
    const r = checkNativeModules(host, ["react-native-screens"]);
    expect(r.compatible).toBe(true);
    expect(r.missing).toEqual([]);
  });
  it("incompatible listando los que faltan", () => {
    const r = checkNativeModules(host, ["react-native-screens", "react-native-svg", "react-native-mmkv"]);
    expect(r.compatible).toBe(false);
    expect(r.missing).toEqual(["react-native-svg", "react-native-mmkv"]);
  });
  it("miniapp sin natives → compatible", () => {
    expect(checkNativeModules(host, [])).toEqual({ compatible: true, missing: [] });
  });
});
