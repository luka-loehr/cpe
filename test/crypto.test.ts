/**
 * Crypto tests.
 *
 * The username obfuscation is checked against vectors produced by the
 * router's own `G()` helper, and against its own inverse `J()`.  Both were
 * lifted verbatim from the HH515L web UI bundle, so these are ground truth,
 * not a restatement of our implementation.
 */
import { expect, test, describe } from "bun:test";
import {
  obfuscateUsername, hashPassword, encrypt, decrypt, computeHMAC, randomString,
} from "../src/crypto.ts";

const ENCRYPT_KEY = "e5dl12XYVggihggafXWf0f2YSf2Xngd1";

/** Verbatim port of the router's inverse function J(). */
function routerDecode(t: string): string {
  const r = ENCRYPT_KEY, n = r.length, a: number[] = [];
  let e: number;
  for (let i = 0; i < t.length; i++) {
    e = i === 0 ? 0 : i / 2;
    a[e] = ((t.charCodeAt(i + 1) ^ r.charCodeAt(e % n)) << 4) | (15 & (t.charCodeAt(i) ^ r.charCodeAt(e % n)));
    i++;
  }
  return a.map(x => String.fromCharCode(x)).join("");
}

describe("obfuscateUsername", () => {
  test("matches the router for the default user", () => {
    expect(obfuscateUsername("admin")).toBe("dc13ibej?7");
  });

  test("output is printable ASCII (no control bytes)", () => {
    for (const u of ["admin", "root", "user", "Administrator"]) {
      for (const ch of obfuscateUsername(u)) {
        expect(ch.charCodeAt(0)).toBeGreaterThanOrEqual(32);
        expect(ch.charCodeAt(0)).toBeLessThan(127);
      }
    }
  });

  test("round-trips through the router's own decoder", () => {
    for (const u of ["admin", "root", "a", "abcdefghijklmnopqrstuvwxyz0123456789ABC"]) {
      expect(routerDecode(obfuscateUsername(u))).toBe(u);
    }
  });

  test("emits two characters per input character", () => {
    expect(obfuscateUsername("abcd")).toHaveLength(8);
    expect(obfuscateUsername("")).toBe("");
  });
});

describe("hashPassword", () => {
  test("PBKDF2-SHA512, 1024 iterations, 64 bytes, hex", () => {
    const h = hashPassword("password", "salt");
    expect(h).toHaveLength(128);
    expect(h).toMatch(/^[0-9a-f]+$/);
  });

  test("is salt-dependent", () => {
    expect(hashPassword("pw", "a")).not.toBe(hashPassword("pw", "b"));
  });
});

describe("encrypt/decrypt", () => {
  test("round-trips", () => {
    const pt = JSON.stringify({ UserName: "dc13ibej?7", _: 1755950000000 });
    expect(decrypt(encrypt(pt, "tmpkey"), "tmpkey")).toBe(pt);
  });

  test("produces OpenSSL Salted__ output", () => {
    const raw = Buffer.from(encrypt("x", "k"), "base64");
    expect(raw.subarray(0, 8).toString()).toBe("Salted__");
  });

  test("uses a random salt per call", () => {
    expect(encrypt("same", "k")).not.toBe(encrypt("same", "k"));
  });

  test("does not double-pad: ciphertext is one block for short input", () => {
    // 7 plaintext bytes -> a single 16-byte AES block, not two.
    const raw = Buffer.from(encrypt('{"a":1}', "k"), "base64");
    expect(raw.length - 16).toBe(16);
  });

  test("round-trips payloads whose last byte would break naive unpadding", () => {
    const pt = '{"SessionId":"abc123","Salt":"deadbeef"}'; // ends in '}' = 125
    expect(decrypt(encrypt(pt, "k"), "k")).toBe(pt);
  });
});

describe("computeHMAC", () => {
  test("SHA-256 hex digest", () => {
    expect(computeHMAC("data", "key")).toHaveLength(64);
    expect(computeHMAC("data", "key")).toMatch(/^[0-9a-f]+$/);
  });
});

describe("randomString", () => {
  test("length and alphabet", () => {
    expect(randomString(128)).toHaveLength(128);
    expect(randomString(32)).toMatch(/^[A-Za-z0-9]+$/);
  });
});
