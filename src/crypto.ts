/**
 * cpe — crypto layer
 *
 * The TCL HH515L web UI uses a multi-stage authentication scheme:
 *
 *  1. Key exchange:  client generates TmpKey (128 random alphanumeric chars)
 *     and HmacKey (32 random alphanumeric chars), RSA-encrypts them with the
 *     router's public key, and sends them via SetConfidentKey.  The router
 *     responds with a SessionId.
 *
 *  2. Parameter encryption:  every JSON-RPC request (except GetPubKey and
 *     SetConfidentKey) has its params JSON-stringified, HMAC-SHA256 signed
 *     with HmacKey, then AES-256-CBC encrypted using a key derived from
 *     TmpKey via PBKDF2-SHA256 (50 iterations, 48-byte output, 32-byte key
 *     + 16-byte IV).  Uses the OpenSSL "Salted__" envelope format.
 *
 *  3. Login:  the username is obfuscated through a custom XOR-bitshuffle
 *     using a static key, and the password is PBKDF2-SHA512 hashed with
 *     a per-session salt from GetDeviceSt.
 *
 *  Responses are encrypted the same way and must be decrypted with TmpKey.
 */

import {
  createHmac,
  pbkdf2Sync,
  randomBytes,
  createCipheriv,
  createDecipheriv,
  publicEncrypt,
  createPublicKey,
} from "node:crypto";

const ENCRYPT_KEY = "e5dl12XYVggihggafXWf0f2YSf2Xngd1";
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** Generate a random alphanumeric string of `len` characters. */
export function randomString(len: number): string {
  const buf = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += CHARS[buf[i] % CHARS.length];
  return out;
}

/**
 * Obfuscate the username, mirroring the router's `G()` helper.
 *
 * Each input character becomes two output characters.  Both carry the key
 * character's HIGH nibble verbatim; their LOW nibble is the input's low
 * (resp. high) nibble XOR'd with the key character's LOW nibble:
 *
 *   out[2a]   = (e & 0xF0) | ((i & 0x0F) ^ (e & 0x0F))
 *   out[2a+1] = (e & 0xF0) | ((i >> 4)  ^ (e & 0x0F))
 *
 * Because ENCRYPT_KEY is ASCII, `e & 0xF0` is 0x30-0x70, so the output is
 * always printable ASCII — "admin" encodes to "dc13ibej?7".  Verified against
 * the router's own inverse function J() for every ASCII input.
 */
export function obfuscateUsername(username: string): string {
  let out = "";
  for (let a = 0; a < username.length; a++) {
    const i = username.charCodeAt(a);
    const e = ENCRYPT_KEY.charCodeAt(a % ENCRYPT_KEY.length);
    out += String.fromCharCode((240 & e) | ((15 & i) ^ (15 & e)));
    out += String.fromCharCode((240 & e) | ((i >> 4) ^ (15 & e)));
  }
  return out;
}

/** PBKDF2-SHA512 password hash used for login. */
export function hashPassword(password: string, salt: string): string {
  return pbkdf2Sync(password, salt, 1024, 64, "sha512").toString("hex");
}

/**
 * AES-256-CBC encrypt using a PBKDF2-SHA256 derived key (OpenSSL "Salted__" format).
 * Node's createCipheriv applies PKCS7 padding automatically — do NOT pre-pad.
 */
export function encrypt(plaintext: string, key: string): string {
  const salt = randomBytes(8);
  const derived = pbkdf2Sync(key, salt, 50, 48, "sha256");
  const aesKey = derived.subarray(0, 32);
  const iv = derived.subarray(32, 48);

  const cipher = createCipheriv("aes-256-cbc", aesKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([Buffer.from("Salted__"), salt, encrypted]).toString("base64");
}

/**
 * AES-256-CBC decrypt using a PBKDF2-SHA256 derived key (OpenSSL "Salted__" format).
 * Node's createDecipheriv strips PKCS7 padding automatically — do NOT post-unpad.
 */
export function decrypt(ciphertextB64: string, key: string): string {
  const raw = Buffer.from(ciphertextB64, "base64");
  const salt = raw.subarray(8, 16);
  const ciphertext = raw.subarray(16);
  const derived = pbkdf2Sync(key, salt, 50, 48, "sha256");
  const aesKey = derived.subarray(0, 32);
  const iv = derived.subarray(32, 48);

  const decipher = createDecipheriv("aes-256-cbc", aesKey, iv);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/** HMAC-SHA256 hex digest of `data` using `hmacKey`. */
export function computeHMAC(data: string, hmacKey: string): string {
  return createHmac("sha256", hmacKey).update(data).digest("hex");
}

/** RSA encrypt `data` with a PEM public key (PKCS#1 v1.5 padding). */
export function rsaEncrypt(data: string, publicKeyPem: string): string {
  const key = createPublicKey(publicKeyPem);
  const encrypted = publicEncrypt(
    { key, padding: 1 /* RSA_PKCS1_PADDING */ },
    Buffer.from(data, "utf8"),
  );
  return encrypted.toString("base64");
}
