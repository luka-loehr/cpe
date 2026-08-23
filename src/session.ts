/**
 * cpe — session persistence
 *
 * Stores the router session (SessionId, TmpKey, HmacKey, token) in a
 * JSON file at ~/.cpe/session.json with 0600 permissions.
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { Session } from "./api.ts";

export const DIR = join(homedir(), ".cpe");
export const SESSION_FILE = join(DIR, "session.json");

export function saveSession(session: Session): void {
  mkdirSync(DIR, { recursive: true, mode: 0o700 });
  writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2), { mode: 0o600 });
  chmodSync(SESSION_FILE, 0o600);
}

export function loadSession(): Session {
  if (!existsSync(SESSION_FILE)) {
    throw new Error(`no session at ${SESSION_FILE} — run "cpe login"`);
  }
  const s = JSON.parse(readFileSync(SESSION_FILE, "utf8")) as Session;
  if (!s.sessionId || !s.tmpKey || !s.hmacKey) {
    throw new Error(`session is incomplete — run "cpe login"`);
  }
  return s;
}

export function hasSession(): boolean {
  return existsSync(SESSION_FILE);
}
