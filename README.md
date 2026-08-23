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
                        ├──► Get*  (164 read-only endpoints)
                        └──► Set*  (135 write + 28 action endpoints, --confirm required)
```

> **Why the crypto is non-trivial.** The router does not accept a plain
> password. It runs a four-stage handshake: an RSA key exchange to establish
> a session, PBKDF2-SHA512 password hashing against a per-session salt,
> AES-256-CBC encryption of every request body (OpenSSL `Salted__` format),
> and HMAC-SHA256 signing of every payload. `cpe` implements all of it.

## Tested on

| Router | Model | Firmware | Status |
|--------|-------|----------|--------|
| TCL 5G CPE | HH515L (EM variant) | `HH515L_EM_02.01_15` | Tested, working |

The API was extracted from the HH515L web UI bundle (`app.9a52d57c.js`).
Other TCL 5G CPE models sharing the same web UI framework (project `HH515L`,
custom `EM`) likely work but are untested. If your router uses a different
firmware, the endpoint list or auth flow may differ.

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

`login` reads the password from `$CPE_PASSWORD` if set, or prompts
interactively with hidden input. The password is never passed on the command
line (where it would show in `ps`), never logged, and never written to disk.
Only the resulting session token is stored.

## Commands

| Command | What it does |
|---|---|
| `cpe login` | Authenticate (interactive prompt or `$CPE_PASSWORD`). |
| `cpe status` | Router, network, signal, and wifi summary. |
| `cpe info` | Hardware + firmware info. |
| `cpe devices` | List all connected devices. |
| `cpe wifi` | Wifi settings and connected client counts. |
| `cpe wifi on` / `off` | Toggle wifi (requires `--confirm`). |
| `cpe sms` | List SMS messages (`--unread` for unread only). |
| `cpe sms send <number> <message>` | Send an SMS (requires `--confirm`). |
| `cpe usage` | Data usage stats and billing cycle. |
| `cpe network` | Network registration and signal list. |
| `cpe vpn` | VPN settings and connection status. |
| `cpe firewall` | Firewall status, MAC filters, port triggering. |
| `cpe sim` | SIM status and PIN state. |
| `cpe reboot` | Reboot the router (requires `--confirm`). |
| `cpe reset` | Factory reset (requires `--confirm`, dangerous). |
| `cpe block <mac>` / `unblock <mac>` | Block or unblock a device (requires `--confirm`). |
| `cpe connect` / `disconnect` | Data connection on/off (requires `--confirm`). |
| `cpe call <endpoint> [json]` | Call any of the 327 API endpoints directly. |
| `cpe endpoints` | Browse + search the endpoint catalog. |

Useful flags: `--json` (compact JSON for agents), `--confirm` (required for
writes), `--get` / `--set` (filter endpoints), `--search <query>`, `--category <cat>`.

## The raw API

Every endpoint the router exposes is available through `cpe call`:

```bash
cpe call GetWlanSettings
cpe call GetConnectedDeviceList --json
cpe call GetUsageSettings
cpe call GetVpnSettings
```

`cpe endpoints` lists all 327, organized by category with descriptions and
read/write/action badges. `--get` filters to read-only, `--set` to
write/action. `--search` finds endpoints by name or description. The full
catalog with machine-readable metadata is in [src/endpoints.ts](src/endpoints.ts).

All `Set*` and action endpoints require `--confirm` — this guard prevents
accidental configuration changes, whether from a typo or an autonomous agent.

## How authentication works

The TCL HH515L web UI uses `loginAuthType: 7` — a four-stage handshake:

1. **Key exchange.** `GetPubKey` returns the router's 4096-bit RSA public
   key. The client generates two random alphanumeric strings — `TmpKey`
   (128 chars) and `HmacKey` (32 chars) — RSA-encrypts them, and sends them
   via `SetConfidentKey`. The router responds with a `SessionId`.

2. **Parameter encryption.** Every subsequent request has its JSON-RPC
   `params` JSON-stringified, then AES-256-CBC encrypted using a key derived
   from `TmpKey` via PBKDF2-SHA256 (50 iterations, 48-byte output: 32-byte
   key + 16-byte IV), in OpenSSL `Salted__` format. Node's
   `createCipheriv` handles PKCS7 padding automatically.

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
  endpoints.ts       all 327 API endpoints with descriptions and categories
  session.ts         session persistence (~/.cpe/session.json)
  ui.ts             terminal output helpers
```

Session data lives in `~/.cpe/session.json`.

## Disclaimer

**This is an unofficial, community-developed tool.** It is not affiliated
with, endorsed by, or supported by TCL Corporation or any of its
subsidiaries. The author of this tool assumes no liability for any damage,
data loss, or device bricking that may result from its use.

This tool was developed by reverse-engineering the web UI of a router the
developer owns, for personal automation purposes. It communicates only with
the router on your local network using the same API the web UI uses. It does
not bypass authentication, exploit vulnerabilities, or access any service
without proper credentials.

By using this tool, you accept full responsibility for any consequences. If
your router locks you out, resets, or breaks, that is on you. Always have the
router's admin password and a backup of your configuration before using
`cpe reset` or any `Set*` endpoint.

## License

MIT — see [LICENSE](LICENSE).
