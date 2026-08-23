import { expect, test, describe } from "bun:test";
import { formatBytes, table, box, PLAN_UNITS } from "../src/ui.ts";

describe("formatBytes", () => {
  test("matches the router's usageVal/usagekmgb thresholds", () => {
    expect(formatBytes(83028963141)).toBe("77.33 GB");
    expect(formatBytes(1073741824)).toBe("1.00 GB");
    expect(formatBytes(1048576)).toBe("1.00 MB");
    expect(formatBytes(1024)).toBe("1.00 KB");
    expect(formatBytes(0)).toBe("0.00 KB");
  });
  test("handles non-numbers", () => expect(formatBytes(NaN)).toBe("?"));
});

describe("table", () => {
  test("renders ragged rows without dropping columns", () => {
    const out = table([["a", "b", "c"], ["x"]], ["1", "2", "3"]);
    expect(out).toContain("a  b  c");
    expect(out.split("\n")[0]).toContain("3");
  });
  test("empty input yields empty output", () => expect(table([])).toBe(""));
});

describe("box", () => {
  test("survives an empty line list", () => expect(box("T", [])).toContain("T"));
});

test("plan units match the router enum {MB:0, GB:1, KB:2}", () => {
  expect(PLAN_UNITS[0]).toBe("MB");
  expect(PLAN_UNITS[1]).toBe("GB");
  expect(PLAN_UNITS[2]).toBe("KB");
});
