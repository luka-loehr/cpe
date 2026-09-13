# Architecture

## How authentication works

The router does not accept a plain password. The HH515L web UI uses
`loginAuthType: 7`, a four-stage handshake:

```
password ──► key exchange (RSA) ──► session ──► token
                    │
                    ├──► Get*  (174 endpoints, read-only, no --confirm needed)
                    └──► Set*/actions  (174 endpoints, --confirm required)
```

1. **Key exchange.** `GetPubKey` returns the router's RSA public key. The
   client generates two random alphanumeric strings, `TmpKey` (128 chars) and
   `HmacKey` (32 chars), RSA-encrypts them, and sends them via
   `SetConfidentKey`. The router responds with a `SessionId`.

2. **Parameter encryption.** Every subsequent request has its JSON-RPC
   `params` JSON-stringified, then AES-256-CBC encrypted with a key derived
   from `TmpKey` via PBKDF2-SHA256 (50 iterations, 48-byte output: 32-byte key
   + 16-byte IV), in OpenSSL `Salted__` format. PKCS#7 padding is applied once,
   by the cipher.

3. **HMAC signing.** The plaintext params JSON is also HMAC-SHA256 signed with
   `HmacKey`, and the digest travels alongside the encrypted payload.

4. **Login.** `GetDeviceSt` returns a per-session salt. The password is
   PBKDF2-SHA512 hashed (1024 iterations, 64-byte output) against it. The
   username is obfuscated so that each input character becomes two output
   characters: both carry the key character's high nibble, and their low
   nibbles are the input's low and high nibble XOR'd with the key's low nibble.
   `admin` encodes to `dc13ibej?7`. The router responds with a token.

Responses are encrypted the same way and decrypted with `TmpKey`. The crypto
is covered by tests built from vectors taken from the router's own JavaScript.

## Layout

```
src/
  cli.ts            argument parsing and dispatch
  api.ts            JSON-RPC client, transport, full auth flow
  crypto.ts         RSA, AES-256-CBC, PBKDF2, HMAC, username obfuscation
  endpoints.ts      all 348 API endpoints with category and description
  session.ts        session persistence (~/.cpe/session.json)
  ui.ts             terminal output helpers and formatters
test/               crypto, catalog and formatting tests
```

## Development

```bash
bun install
bun test           # crypto, catalog and formatting tests
bun run typecheck  # tsc --noEmit, strict
bun run build      # compiles dist/cpe
```

## Scope

The TCL web UI API is undocumented and can change between firmware versions;
when it does, things here will break. Developed against `HH515L_EM_02.01_15`.
