/**
 * cpe — terminal output helpers
 */

const codes = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  grey: "\x1b[90m",
};

export const c = {
  reset: codes.reset,
  bold: (s: string) => codes.bold + s + codes.reset,
  dim: (s: string) => codes.dim + s + codes.reset,
  red: (s: string) => codes.red + s + codes.reset,
  green: (s: string) => codes.green + s + codes.reset,
  yellow: (s: string) => codes.yellow + s + codes.reset,
  blue: (s: string) => codes.blue + s + codes.reset,
  magenta: (s: string) => codes.magenta + s + codes.reset,
  cyan: (s: string) => codes.cyan + s + codes.reset,
  grey: (s: string) => codes.grey + s + codes.reset,
};

export const fail = (msg: string) => console.error(c.red("x") + " " + msg);
export const step = (msg: string) => console.log(c.cyan(">") + " " + msg);
export const ok = (msg: string) => console.log(c.green("v") + " " + msg);

export function box(title: string, lines: [string, string][]): string {
  const labelWidth = Math.max(...lines.map(([k]) => k.length));
  let out = "\n" + c.bold(title) + "\n";
  for (const [k, v] of lines) {
    out += "  " + c.grey(k.padEnd(labelWidth)) + "  " + v + "\n";
  }
  return out;
}

export function table(rows: string[][], headers?: string[]): string {
  if (headers) rows = [headers, ...rows];
  if (!rows.length) return "";
  const widths = rows[0].map((_, i) => Math.max(...rows.map(r => r[i]?.length ?? 0)));
  let out = "";
  rows.forEach((row, idx) => {
    out += row.map((cell, i) => String(cell).padEnd(widths[i])).join("  ") + "\n";
    if (headers && idx === 0) out += widths.map(w => "-".repeat(w)).join("  ") + "\n";
  });
  return out;
}
