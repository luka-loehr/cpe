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

export interface ApiError extends Error {
  code: string;
  expired: boolean;
  /** Extra fields the router returns alongside `code`/`message`.
   *  For a failed Login (010101) this carries `LoginRemainingTimes`. */
  data: Record<string, unknown>;
}

interface ApiResult {
  result?: unknown;
  error?: { code: string; message: string; [k: string]: unknown };
  jsonrpc: string;
  id: string;
}

const BASE = process.env.CPE_BASE || "http://192.168.1.1/jrd/webapi";

/** Request timeout in ms. The router is on the LAN, so this is generous. */
const TIMEOUT_MS = Number(process.env.CPE_TIMEOUT_MS) || 15000;

let origin: string;
try {
  origin = new URL(BASE).origin;
} catch {
  throw new Error(`CPE_BASE is not a valid URL: ${BASE}`);
}

/**
 * POST a JSON-RPC envelope and parse the response.
 * Turns transport-level failures into readable errors instead of letting a
 * TypeError or a JSON parse error surface.
 */
async function postJson(method: string, headers: Record<string, string>, body: unknown): Promise<ApiResult> {
  let res: Response;
  try {
    res = await fetch(`${BASE}?name=${method}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    const cause = e instanceof Error ? e.message : String(e);
    if (e instanceof Error && e.name === "TimeoutError") {
      throw new Error(`[${method}] router did not respond within ${TIMEOUT_MS}ms (${BASE})`);
    }
    throw new Error(`[${method}] cannot reach router at ${BASE}: ${cause}`);
  }

  const text = await res.text();
  let parsed: ApiResult;
  try {
    parsed = JSON.parse(text) as ApiResult;
  } catch {
    const head = text.slice(0, 120).replace(/\s+/g, " ");
    throw new Error(`[${method}] router returned HTTP ${res.status} with non-JSON body: ${head}`);
  }
  if (!res.ok && !parsed.error) {
    throw new Error(`[${method}] router returned HTTP ${res.status}`);
  }
  return parsed;
}

function jsonrpcId(): string {
  return (100 * Math.random()).toFixed(1).toString();
}

/** Throw a typed ApiError, marking session-expiry codes so callers can re-login. */
function apiError(method: string, err: { code: string; message: string; [k: string]: unknown }): ApiError {
  // The router puts diagnostic fields next to code/message, in plaintext —
  // the web UI reads them as `Object.assign({}, error)` minus those two keys.
  const { code: _c, message: _m, ...data } = err;
  const remaining = data["LoginRemainingTimes"];
  const suffix = remaining !== undefined ? ` (${remaining} attempt(s) left)` : "";
  const e = new Error(`[${method}] ${err.code}: ${err.message}${suffix}`) as ApiError;
  e.data = data;
  e.code = err.code;
  // Auth/session codes. -32699/-32698 come from the router's own errorCode map
  // ({unauthorized:"-32699", needLogin:"-32698"}); -32607/-32608 are session
  // expiry/unestablished; 010002 is an invalid token.
  e.expired = ["-32607", "-32608", "-32699", "-32698", "010002"].includes(err.code);
  return e;
}

/**
 * Perform an encrypted JSON-RPC call.
 * Does NOT mutate the caller's `params` object.
 */
export async function call(
  session: Session,
  method: string,
  params: Record<string, unknown> = {},
): Promise<Record<string, unknown> | null> {
  const ts = Date.now();
  // Copy params so we don't mutate the caller's object
  const fullParams = { ...params, _: ts };
  const paramsStr = JSON.stringify(fullParams);
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
    Origin: origin,
    Referer: origin + "/",
    sessionid: session.sessionId,
  };
  if (session.token) headers["_TclRequestVerificationToken"] = session.token;

  const resp = await postJson(method, headers, body);

  if (resp.error) throw apiError(method, resp.error);

  if (resp.result && typeof resp.result === "string") {
    let decrypted: string;
    try {
      decrypted = decrypt(resp.result, session.tmpKey);
    } catch {
      throw new Error(`[${method}] could not decrypt response - session key mismatch, run "cpe login"`);
    }
    try {
      return JSON.parse(decrypted) as Record<string, unknown>;
    } catch {
      throw new Error(`[${method}] decrypted response was not JSON: ${decrypted.slice(0, 120)}`);
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

  const resp = await postJson(method, headers, body);
  if (resp.error) throw apiError(method, resp.error);
  return resp;
}

/**
 * Full authentication flow:
 *   1. GetPubKey → RSA public key
 *   2. Generate TmpKey + HmacKey
 *   3. SetConfidentKey → SessionId
 *   4. GetDeviceSt → salt
 *   5. Login → token
 */
export async function login(password: string, userName = process.env.CPE_USER || "admin"): Promise<Session> {
  // 1. Key exchange — get the router's RSA public key
  const pubKeyResp = await rawCall("GetPubKey", {});
  const pubKeyRaw = (pubKeyResp.result as { publicKey?: string } | undefined)?.publicKey;
  if (!pubKeyRaw) throw new Error("GetPubKey returned no publicKey - is CPE_BASE pointing at a TCL router?");
  const publicKey = pubKeyRaw.replace(/\\n/g, "\n");

  // 2. Generate session keys
  const tmpKey = randomString(128);
  const hmacKey = randomString(32);

  // 3. RSA encrypt the keys and send to router
  const keyData = JSON.stringify({ TmpKey: tmpKey, HmacKey: hmacKey });
  const encryptedKeys = rsaEncrypt(keyData, publicKey);

  const confidentResp = await rawCall("SetConfidentKey", encryptedKeys, "webui");
  if (typeof confidentResp.result !== "string") {
    throw new Error("SetConfidentKey returned no session payload");
  }
  let sessionId: string;
  try {
    sessionId = JSON.parse(decrypt(confidentResp.result, tmpKey)).SessionId;
  } catch {
    throw new Error("SetConfidentKey response could not be decrypted - key exchange failed");
  }
  if (!sessionId) throw new Error("SetConfidentKey returned no SessionId");

  const session: Session = { sessionId, tmpKey, hmacKey, token: null };

  // 4. Get salt for password hashing
  const st = await call(session, "GetDeviceSt", {});
  const salt = (st as { Salt?: string } | null)?.Salt;
  if (!salt) throw new Error("GetDeviceSt returned no Salt");

  // 5. Login with obfuscated username and hashed password.
  //    Exactly one Login call — a failed attempt counts against the router's
  //    lockout counter, so this must never be retried automatically.
  const loginResult = await call(session, "Login", {
    UserName: obfuscateUsername(userName),
    Password: hashPassword(password, salt),
  });

  const token = (loginResult as { token?: string } | null)?.token;
  if (!token) throw new Error("Login succeeded but returned no token");
  session.token = token;

  return session;
}
