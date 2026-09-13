# Usage

## Getting started

```bash
cpe login      # prompts for the password (hidden), or reads $CPE_PASSWORD
cpe status     # router, network, signal, Wi-Fi, data usage at a glance
```

```
Router
  Model     HH515L
  Firmware  HH515L_EM_02.01_15
  Uptime    27h 25m

Network
  Operator  Example Mobile
  Type      5G SA
  Signal    ####. (4/5)
  Down      3.57 MB/s
```

The password is never passed on the command line (where it would show in
`ps`), never logged, and never written to disk. Only the resulting session
token is stored, at `~/.cpe/session.json` with `0600` permissions.

> **Note:** the router locks the account after a few failed logins.
> `cpe login` performs exactly one `Login` call and never retries. If
> credentials are rejected, `cpe` prints the number of remaining attempts
> reported by the router.

## Commands

| Command | What it does |
|---|---|
| `cpe login` | Authenticate (prompt or `$CPE_PASSWORD`). |
| `cpe logout` | End the session and delete the local session file. |
| `cpe status` | Router, network, signal, Wi-Fi and data-usage summary. |
| `cpe info` | Hardware, firmware, IMEI/IMSI details. |
| `cpe devices` | Connected devices with interface and internet access. |
| `cpe wifi` | Wi-Fi settings, state and client counts. |
| `cpe sms` | List SMS threads (`--unread` for unread only). |
| `cpe usage` | Data usage and billing cycle. |
| `cpe network` | Cellular registration, signal list, settings. |
| `cpe vpn` | VPN settings and status. |
| `cpe firewall` | Firewall level, filters, port triggering, UPnP, ALG. |
| `cpe sim` | SIM status and PIN state. |
| `cpe reboot` | Reboot the router. |
| `cpe reset` | Factory reset. |
| `cpe wifi on` / `off` | Toggle Wi-Fi. |
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

## Flags

| Flag | Meaning |
|---|---|
| `--json` | Compact single-line JSON (agent-friendly). Default is pretty-printed. |
| `--confirm` | Required for any write or action endpoint. |
| `--get` / `--set` | With `endpoints`: filter to read-only / write endpoints. |
| `--category <cat>` | With `endpoints`: filter by category. |
| `--search <query>` | With `endpoints`: search name, description and category. |
| `--unread` | With `sms`: only threads with unread messages. |
| `--name <n>` | With `block`/`unblock`: override the resolved device name. |

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `CPE_PASSWORD` | – | Router password, skips the interactive prompt. |
| `CPE_USER` | `admin` | Login user. |
| `CPE_BASE` | `http://192.168.1.1/jrd/webapi` | API base URL. |
| `CPE_TIMEOUT_MS` | `15000` | Per-request timeout. |
| `NO_COLOR` / `FORCE_COLOR` | – | Disable / force ANSI color. Color is off automatically when piping. |

## The raw API

Every endpoint the router exposes is available through `cpe call`:

```bash
cpe call GetWlanSettings
cpe call GetConnectedDeviceList --json | jq '.ConnectedList[].DeviceName'
cpe call GetSMSContactList '{"Page":0}'
cpe call SetWlanState '{"WlanState":1}' --confirm
```

`cpe endpoints` lists all 348 (174 read-only, 174 write/action) with category
and description. The catalog was extracted from the router's own web UI bundle
and is verified against it: every name in
[src/endpoints.ts](../src/endpoints.ts) corresponds to a real `post()` call
site in the firmware's JavaScript, and none are missing.
