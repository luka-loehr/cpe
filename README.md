![cpe banner](.github/assets/banner.png)

# cpe — your TCL 5G router, from a terminal

[![Bun](https://img.shields.io/badge/Bun-runtime%20%26%20build-FBF0DF?style=flat&logo=bun&logoColor=black)](https://bun.sh)
[![Endpoints](https://img.shields.io/badge/endpoints-327%20mapped-6366f1?style=flat)](src/endpoints.ts)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)

**cpe** reverse-engineers the encrypted JSON-RPC API that the TCL HH515L 5G CPE
web UI talks, and exposes all 327 of its endpoints from a single binary. Set
your router password as an environment variable, log in once, and you can read
every status endpoint, list connected devices, send SMS, toggle wifi, reboot,
or call any raw API method — from your shell or from an agent.

Everything runs locally. There is no server, no cloud, no third party. The
session is stored at `~/.cpe/session.json` with `0600` permissions.

```
$CPE_PASSWORD ──► key exchange (RSA) ──► session ──► token
                        │
                        ├──► Get*  (327 endpoints, read-only)
                        └──► Set*  (actions, explicit only)
```

> **Why the crypto is non-trivial.** The router does not accept a plain
> password. It runs a four-stage handshake: an RSA key exchange to establish
> a session, PBKDF2-SHA512 password hashing against a per-session salt,
> AES-256-CBC encryption of every request body (OpenSSL `Salted__` format),
> and HMAC-SHA256 signing of every payload. `cpe` implements all of it.

## Install

Grab a binary from [Releases](../../releases) — self-contained, nothing else needed:

```bash
chmod +x cpe-darwin-arm64
mv cpe-darwin-arm64 ~/.bun/bin/cpe     # or anywhere on your PATH
```

Or run from source with [Bun](https://bun.sh). There are no dependencies:

```bash
git clone git@github.com:luka-loehr/cpe.git ~/Documents/cpe
ln -sf ~/Documents/cpe/src/cli.ts ~/.bun/bin/cpe
```

## Getting started

```bash
export CPE_PASSWORD='your-router-password'
cpe login      # authenticate, session saved to ~/.cpe/session.json
cpe status     # router, network, signal, wifi at a glance
```

`login` reads the password from `$CPE_PASSWORD` — it is never passed on the
command line (where it would show in `ps`), never logged, and never written
to disk. Only the resulting session token is stored.

## Commands

| Command | What it does |
|---|---|
| `cpe login` | Authenticate (reads `$CPE_PASSWORD`). |
| `cpe status` | Router, network, signal, and wifi summary. |
| `cpe info` | Full system info (firmware, hardware, MAC). |
| `cpe devices` | List all connected devices. |
| `cpe wifi` | Wifi settings and connected client counts. |
| `cpe sms` | List SMS messages. |
| `cpe sms send <number> <message>` | Send an SMS. |
| `cpe usage` | Data usage stats and billing cycle. |
| `cpe network` | Network registration and signal list. |
| `cpe vpn` | VPN settings and connection status. |
| `cpe firewall` | Firewall status, MAC/IP filters, port forwarding. |
| `cpe reboot` | Reboot the router. |
| `cpe reset` | Factory reset (dangerous). |
| `cpe wifi on` / `off` | Toggle wifi. |
| `cpe block <mac>` / `unblock <mac>` | Block or unblock a device. |
| `cpe call <endpoint> [json]` | Call any of the 327 API endpoints directly. |
| `cpe endpoints` [--get\|--set] | List all available API endpoints. |

Useful flags: `--json` (raw JSON output), `--get` / `--set` (filter endpoints).

## The raw API

Every endpoint the router exposes is available through `cpe call`:

```bash
cpe call GetWlanSettings
cpe call GetConnectedDeviceList --json
cpe call GetUsageSettings
cpe call GetVpnSettings
```

`cpe endpoints` lists all 327. `--get` filters to read-only `Get*` endpoints,
`--set` to write `Set*` endpoints. See [src/endpoints.ts](src/endpoints.ts)
for the full list, extracted from the router's own web UI bundle.

## How authentication works

The TCL HH515L web UI uses `loginAuthType: 7` — a four-stage handshake:

1. **Key exchange.** `GetPubKey` returns the router's 4096-bit RSA public
   key. The client generates two random alphanumeric strings — `TmpKey`
   (128 chars) and `HmacKey` (32 chars) — RSA-encrypts them, and sends them
   via `SetConfidentKey`. The router responds with a `SessionId`.

2. **Parameter encryption.** Every subsequent request has its JSON-RPC
   `params` JSON-stringified, then AES-256-CBC encrypted using a key derived
   from `TmpKey` via PBKDF2-SHA256 (50 iterations, 48-byte output: 32-byte
   key + 16-byte IV), in OpenSSL `Salted__` format.

3. **HMAC signing.** The plaintext params JSON is also HMAC-SHA256 signed
   with `HmacKey`, and the digest is sent alongside the encrypted payload.

4. **Login.** `GetDeviceSt` returns a per-session salt. The username is
   obfuscated through a bitwise nibble-shuffle with a static key, and the
   password is PBKDF2-SHA512 hashed (1024 iterations, 64-byte output) against
   that salt. The router responds with a token.

Responses are encrypted the same way and decrypted with `TmpKey`.

## Layout

```
src/
  cli.ts            argument parsing and dispatch
  api.ts            the JSON-RPC client, full auth flow
  crypto.ts         RSA, AES-256-CBC, PBKDF2, HMAC, username obfuscation
  endpoints.ts      all 327 API endpoints extracted from the router
  session.ts        session persistence (~/.cpe/session.json)
  ui.ts             terminal output helpers
```

Session data lives in `~/.cpe/session.json`.

## Scope

This drives your own router, on your own network, from your own machine.
The TCL web UI API is not a documented interface and can change between
firmware versions; when it does, things here will break.

## License

MIT — see [LICENSE](LICENSE).
