![cpe banner](.github/assets/banner.png)

# cpe — your TCL 5G router, from a terminal

[![CI](https://github.com/luka-loehr/cpe/actions/workflows/ci.yml/badge.svg)](https://github.com/luka-loehr/cpe/actions/workflows/ci.yml)
[![Bun](https://img.shields.io/badge/Bun-runtime%20%26%20build-FBF0DF?style=flat&logo=bun&logoColor=black)](https://bun.sh)
[![Endpoints](https://img.shields.io/badge/endpoints-348%20mapped-6366f1?style=flat)](src/endpoints.ts)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)

**cpe** speaks the encrypted JSON-RPC API behind the TCL HH515L 5G CPE web UI
and exposes all 348 of its endpoints from a single binary. Log in once, then
read every status endpoint, list connected devices, send SMS, toggle wifi,
reboot, or call any raw API method — from your shell or from an agent.

Everything runs locally. No server, no cloud, no third party. The session
lives at `~/.cpe/session.json` with `0600` permissions.

```
password ──► key exchange (RSA) ──► session ──► token
                    │
                    ├──► Get*  (174 endpoints, read-only, no --confirm needed)
                    └──► Set*/actions  (174 endpoints, --confirm required)
```

> **Why the crypto is non-trivial.** The router does not accept a plain
> password. It runs a four-stage handshake: an RSA key exchange to establish a
> session, PBKDF2-SHA512 password hashing against a per-session salt,
> AES-256-CBC encryption of every request body (OpenSSL `Salted__` format),
> and HMAC-SHA256 signing of every payload. The username is additionally run
> through a nibble-shuffle obfuscation with a static key. `cpe` implements all
> of it, and the crypto is covered by tests built from vectors taken out of the
> router's own JavaScript.

## Install

Grab a binary from [Releases](../../releases) — self-contained, no runtime needed:

```bash
# macOS arm64 / x64, Linux x64 / arm64
chmod +x cpe-darwin-arm64
mv cpe-darwin-arm64 ~/.local/bin/cpe    # or anywhere on your PATH
```

Verify it against the published `SHA256SUMS` if you like:

```bash
sha256sum -c SHA256SUMS --ignore-missing
```

Or run from source with [Bun](https://bun.sh). There are no runtime dependencies:

```bash
git clone https://github.com/luka-loehr/cpe.git
cd cpe && bun install
bun run build && ./dist/cpe --help
```

## Getting started

```bash
cpe login      # prompts for the password (hidden), or reads $CPE_PASSWORD
cpe status     # router, network, signal, wifi, data usage at a glance
```

```
Router
  Model     HH515L
  Firmware  HH515L_EM_02.01_15
  Uptime    27h 25m

Network
  Operator  HT HR
  Type      5G SA
  Signal    ####. (4/5)
  Down      3.57 MB/s
```

The password is never passed on the command line (where it would show in
`ps`), never logged, and never written to disk. Only the resulting session
token is stored.

> **One caveat worth knowing:** the router locks the account after a few
> failed logins. `cpe login` performs exactly one `Login` call and never
> retries. If credentials are rejected, the router reports how many attempts
> remain and `cpe` prints that number rather than swallowing it.

## Commands

| Command | What it does |
|---|---|
| `cpe login` | Authenticate (prompt or `$CPE_PASSWORD`). |
| `cpe logout` | End the session and delete the local session file. |
| `cpe status` | Router, network, signal, wifi and data-usage summary. |
| `cpe info` | Hardware, firmware, IMEI/IMSI details. |
| `cpe devices` | Connected devices with interface and internet access. |
| `cpe wifi` | Wifi settings, state and client counts. |
| `cpe sms` | List SMS threads (`--unread` for unread only). |
| `cpe usage` | Data usage and billing cycle. |
| `cpe network` | Cellular registration, signal list, settings. |
| `cpe vpn` | VPN settings and status. |
| `cpe firewall` | Firewall level, filters, port triggering, UPnP, ALG. |
| `cpe sim` | SIM status and PIN state. |
| `cpe reboot` | Reboot the router. |
| `cpe reset` | Factory reset. |
| `cpe wifi on` / `off` | Toggle wifi. |
| `cpe sms send <number> <message>` | Send an SMS. |
| `cpe block <mac>` / `unblock <mac>` | Block or unblock a device. |
| `cpe connect` / `disconnect` | Bring the data connection up or down. |
| `cpe call <endpoint> [json]` | Call any of the 348 endpoints directly. |
| `cpe endpoints` | Browse and search the endpoint catalog. |

### Safety

Every `Set*` and action endpoint requires `--confirm`, including through
`cpe call`. Read-only endpoints never do. `cpe block`/`unblock` resolve the
device name from the router first, because the API silently no-ops when given
a MAC without its matching `DeviceName`.

```bash
cpe reboot                 # refused: reboot requires --confirm
cpe reboot --confirm       # actually reboots
```

### Flags

| Flag | Meaning |
|---|---|
| `--json` | Compact single-line JSON (agent-friendly). Default is pretty-printed. |
| `--confirm` | Required for any write or action endpoint. |
| `--get` / `--set` | With `endpoints`: filter to read-only / write endpoints. |
| `--category <cat>` | With `endpoints`: filter by category. |
| `--search <query>` | With `endpoints`: search name, description and category. |
| `--unread` | With `sms`: only threads with unread messages. |
| `--name <n>` | With `block`/`unblock`: override the resolved device name. |

### Environment

| Variable | Default | Purpose |
|---|---|---|
| `CPE_PASSWORD` | — | Router password, skips the interactive prompt. |
| `CPE_USER` | `admin` | Login user. |
| `CPE_BASE` | `http://192.168.1.1/jrd/webapi` | API base URL. |
| `CPE_TIMEOUT_MS` | `15000` | Per-request timeout. |
| `NO_COLOR` / `FORCE_COLOR` | — | Disable / force ANSI colour. Colour is off automatically when piping. |

## The raw API

Every endpoint the router exposes is available through `cpe call`:

```bash
cpe call GetWlanSettings
cpe call GetConnectedDeviceList --json | jq '.ConnectedList[].DeviceName'
cpe call GetSMSContactList '{"Page":0}'
cpe call SetWlanState '{"WlanState":1}' --confirm
```

`cpe endpoints` lists all 348 with category and description. The catalog was
extracted from the router's own web UI bundle and is verified against it: every
name in [src/endpoints.ts](src/endpoints.ts) corresponds to a real `post()`
call site in the firmware's JavaScript, and none are missing.

## How authentication works

The HH515L web UI uses `loginAuthType: 7` — a four-stage handshake:

1. **Key exchange.** `GetPubKey` returns the router's RSA public key. The
   client generates two random alphanumeric strings — `TmpKey` (128 chars) and
   `HmacKey` (32 chars) — RSA-encrypts them, and sends them via
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

Responses are encrypted the same way and decrypted with `TmpKey`.

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
bun test           # 26 tests
bun run typecheck  # tsc --noEmit, strict
bun run build      # compiles dist/cpe
```

## Scope

This drives your own router, on your own network, from your own machine. The
TCL web UI API is undocumented and can change between firmware versions; when
it does, things here will break. Developed against `HH515L_EM_02.01_15`.

## License

MIT — see [LICENSE](LICENSE).
