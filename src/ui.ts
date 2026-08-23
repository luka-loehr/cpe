/**
 * cpe — terminal output helpers
 *
 * Colour is emitted only when stdout is a TTY and NO_COLOR is unset, so
 * piping (`cpe status | grep`) yields clean text.  Set FORCE_COLOR=1 to
 * override.
 */

const useColor =
  process.env.FORCE_COLOR === "1" ||
  (!process.env.NO_COLOR && process.stdout.isTTY === true);

const wrap = (code: string) => (s: string) => (useColor ? code + s + "\x1b[0m" : s);

export const c = {
  reset: useColor ? "\x1b[0m" : "",
  bold: wrap("\x1b[1m"),
  dim: wrap("\x1b[2m"),
  red: wrap("\x1b[31m"),
  green: wrap("\x1b[32m"),
  yellow: wrap("\x1b[33m"),
  blue: wrap("\x1b[34m"),
  magenta: wrap("\x1b[35m"),
  cyan: wrap("\x1b[36m"),
  grey: wrap("\x1b[90m"),
};

export const fail = (msg: string) => console.error(c.red("x") + " " + msg);
export const step = (msg: string) => console.log(c.cyan(">") + " " + msg);
export const ok = (msg: string) => console.log(c.green("v") + " " + msg);

/** Render a titled label/value block. Safe on an empty line list. */
export function box(title: string, lines: [string, string][]): string {
  let out = "\n" + c.bold(title) + "\n";
  if (!lines.length) return out;
  const labelWidth = Math.max(...lines.map(([k]) => k.length));
  for (const [k, v] of lines) {
    out += "  " + c.grey(k.padEnd(labelWidth)) + "  " + v + "\n";
  }
  return out;
}

/**
 * Render a column-aligned table. Column count is the widest row, so ragged
 * rows render instead of being silently truncated.
 */
export function table(rows: string[][], headers?: string[]): string {
  const all = headers ? [headers, ...rows] : rows;
  if (!all.length) return "";
  const cols = Math.max(...all.map(r => r.length));
  const widths: number[] = [];
  for (let i = 0; i < cols; i++) {
    widths[i] = Math.max(...all.map(r => String(r[i] ?? "").length));
  }
  let out = "";
  all.forEach((row, idx) => {
    const cells: string[] = [];
    for (let i = 0; i < cols; i++) cells.push(String(row[i] ?? "").padEnd(widths[i]));
    out += cells.join("  ").trimEnd() + "\n";
    if (headers && idx === 0) out += widths.map(w => "-".repeat(w)).join("  ") + "\n";
  });
  return out;
}

/**
 * Format a byte count the way the router's own web UI does
 * (`usageVal`/`usagekmgb`): binary units, two decimals, KB floor.
 */
export function formatBytes(n: number): string {
  if (!Number.isFinite(n)) return "?";
  if (n >= 1073741824) return (n / 1073741824).toFixed(2) + " GB";
  if (n >= 1048576) return (n / 1048576).toFixed(2) + " MB";
  return (n / 1024).toFixed(2) + " KB";
}

/** The router encodes plan units as {MB:0, GB:1, KB:2}. */
export const PLAN_UNITS: Record<number, string> = { 0: "MB", 1: "GB", 2: "KB" };
