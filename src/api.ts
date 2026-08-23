/**
 * cpe — API client
 *
 * Handles the full authentication lifecycle and provides a single `call()`
 * function for every JSON-RPC endpoint the router exposes.
 */

import { randomString, obfuscateUsername, hashPassword, encrypt, decrypt, computeHMAC, rsaEncrypt } from "./crypto.ts";

export interface Session {
  sessionId: string;
  tmpKey: string;
  hmacKey: string;
  token: string | null;
}

export interface ApiResult {
  result?: unknown;
  error?: { code: string; message: string; [k: string]: unknown };
  jsonrpc: string;
  id: string;
}

const BASE = process.env.CPE_BASE || "http://192.168.1.1/jrd/webapi";

function jsonrpcId(): string {
  return (100 * Math.random()).toFixed(1).toString();
}

/** Perform a raw JSON-RPC call with full encryption. */
export async function call(session: Session, method: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown> | null> {
  const ts = Date.now();
  params["_"] = ts;
  const paramsStr = JSON.stringify(params);
  const hmac = computeHMAC(paramsStr, session.hmacKey);
  const encrypted = encrypt(paramsStr, session.tmpKey);

  const body = {
    _: ts,
    id: jsonrpcId(),
    jsonrpc: "2.0",
    method,
    params: encrypted,
    hmac,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Origin: new URL(BASE).origin,
    Referer: new URL(BASE).origin + "/",
    sessionid: session.sessionId,
  };
  if (session.token) headers["_TclRequestVerificationToken"] = session.token;

  const res = await fetch(`${BASE}?name=${method}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const resp = (await res.json()) as ApiResult;

  if (resp.error) {
    throw new Error(`[${method}] ${resp.error.code}: ${resp.error.message}`);
  }

  if (resp.result && typeof resp.result === "string") {
    try {
      const decrypted = decrypt(resp.result, session.tmpKey);
      return JSON.parse(decrypted) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  return (resp.result as Record<string, unknown>) ?? null;
}

/** Perform an unencrypted JSON-RPC call (used for GetPubKey and SetConfidentKey). */
async function rawCall(method: string, params: unknown, sessionId = ""): Promise<ApiResult> {
  const ts = Date.now();
  const body = { _: ts, id: jsonrpcId(), jsonrpc: "2.0", method, params };
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (sessionId) headers["sessionid"] = sessionId;

  const res = await fetch(`${BASE}?name=${method}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  return (await res.json()) as ApiResult;
}

/**
 * Full authentication flow:
 *   1. GetPubKey → RSA public key
 *   2. Generate TmpKey + HmacKey
 *   3. SetConfidentKey → SessionId
 *   4. GetDeviceSt → salt
 *   5. Login → token
 */
export async function login(password: string): Promise<Session> {
  // 1. Key exchange — get the router's RSA public key
  const pubKeyResp = await rawCall("GetPubKey", {});
  const publicKey = (pubKeyResp.result as { publicKey: string }).publicKey.replace(/\\n/g, "\n");

  // 2. Generate session keys
  const tmpKey = randomString(128);
  const hmacKey = randomString(32);

  // 3. RSA encrypt the keys and send to router
  const keyData = JSON.stringify({ TmpKey: tmpKey, HmacKey: hmacKey });
  const encryptedKeys = rsaEncrypt(keyData, publicKey);

  const confidentResp = await rawCall("SetConfidentKey", encryptedKeys, "webui");
  const confidentResult = JSON.parse(decrypt(confidentResp.result as string, tmpKey));
  const sessionId = confidentResult.SessionId;

  const session: Session = { sessionId, tmpKey, hmacKey, token: null };

  // 4. Get salt for password hashing
  const st = await call(session, "GetDeviceSt", {});
  const salt = (st as { Salt: string }).Salt;

  // 5. Login with obfuscated username and hashed password
  const obfUser = obfuscateUsername("admin");
  const hashedPw = hashPassword(password, salt);
  const loginResult = await call(session, "Login", { UserName: obfUser, Password: hashedPw });

  session.token = (loginResult as { token: string }).token;

  return session;
}

/** Restore a session from a saved token (no password needed). */
export function restoreSession(sessionId: string, tmpKey: string, hmacKey: string, token: string): Session {
  return { sessionId, tmpKey, hmacKey, token };
}
