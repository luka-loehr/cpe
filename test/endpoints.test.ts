import { expect, test, describe } from "bun:test";
import { CATALOG, ALL_ENDPOINTS, ENDPOINT_COUNT, getEndpoint, endpointsByCategory, searchEndpoints } from "../src/endpoints.ts";

describe("endpoint catalog", () => {
  test("count is consistent", () => {
    expect(ALL_ENDPOINTS.length).toBe(ENDPOINT_COUNT);
    expect(Object.keys(CATALOG).length).toBe(ENDPOINT_COUNT);
  });

  test("every key matches its name field", () => {
    for (const [k, v] of Object.entries(CATALOG)) expect(v.name).toBe(k);
  });

  test("readonly agrees with type", () => {
    for (const e of Object.values(CATALOG)) expect(e.readonly).toBe(e.type === "get");
  });

  test("no entry is missing a description or category", () => {
    for (const e of Object.values(CATALOG)) {
      expect(e.desc.length).toBeGreaterThan(0);
      expect(e.category.length).toBeGreaterThan(0);
    }
  });

  test("lookup helpers work", () => {
    expect(getEndpoint("GetApSystemInfo")?.readonly).toBe(true);
    expect(getEndpoint("SetDeviceReboot")?.readonly).toBe(false);
    expect(getEndpoint("NoSuchEndpoint")).toBeUndefined();
  });

  test("categories partition the catalog", () => {
    const total = Object.values(endpointsByCategory()).reduce((n, e) => n + e.length, 0);
    expect(total).toBe(ENDPOINT_COUNT);
  });

  test("search matches name, description and category", () => {
    expect(searchEndpoints("reboot").length).toBeGreaterThan(0);
    expect(searchEndpoints("zzzznope")).toHaveLength(0);
  });
});
