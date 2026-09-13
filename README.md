![cpe banner](.github/assets/banner.png)

# cpe – your TCL 5G router, from a terminal

[![CI](https://github.com/luka-loehr/cpe/actions/workflows/ci.yml/badge.svg)](https://github.com/luka-loehr/cpe/actions/workflows/ci.yml) [![Bun](https://img.shields.io/badge/Bun-runtime%20%26%20build-FBF0DF?style=flat&logo=bun&logoColor=black)](https://bun.sh) [![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Linux-lightgrey?style=flat)](../../releases) [![Endpoints](https://img.shields.io/badge/endpoints-348%20mapped-6366f1?style=flat)](src/endpoints.ts) [![License](https://img.shields.io/badge/License-MIT-orange?style=flat)](LICENSE)

**cpe** speaks the encrypted JSON-RPC API behind the TCL HH515L 5G CPE web UI and exposes all 348 of its endpoints from a single binary, for your shell or an agent.

---

## Features

- **Full API coverage** all 348 endpoints (174 read, 174 write/action), verified against the firmware's web UI
- **Everyday commands** status, devices, Wi-Fi, SMS, data usage, network, VPN, firewall, SIM
- **Encrypted handshake** RSA key exchange, AES-256-CBC, HMAC-SHA256 and PBKDF2-SHA512 login, tested against router vectors
- **Safe by default** every write or action endpoint requires `--confirm`
- **Agent-friendly** compact `--json` output and `cpe call` for any raw method
- **Local only** no server or cloud; the session lives at `~/.cpe/session.json` (`0600`), the password is never stored
- **Single binary** self-contained builds for macOS and Linux (arm64 / x64)

---

## Install

Download a binary from [Releases](../../releases) (verify with `SHA256SUMS`), or build from source with [Bun](https://bun.sh):

```bash
git clone https://github.com/luka-loehr/cpe.git
cd cpe && bun install
bun run build && ./dist/cpe --help
```

## Usage

```bash
cpe login                  # prompts for the password, or reads $CPE_PASSWORD
cpe status                 # router, network, signal, Wi-Fi, data usage
cpe devices                # connected devices
cpe call GetWlanSettings   # any raw endpoint
cpe reboot --confirm       # writes and actions need --confirm
```

---

## Documentation

- [Usage](docs/USAGE.md) – commands, flags, environment variables, raw API
- [Architecture](docs/ARCHITECTURE.md) – how authentication works, layout, development

---

## Disclaimer

cpe is an independent project and is not affiliated with or endorsed by TCL. All trademarks belong to their respective owners. It is intended for interoperability with your own device: it drives your own router, on your own network, from your own machine. The API is undocumented and may change with firmware updates.

---

## License

MIT License - [View License](LICENSE)

---

## Support

- [Report bugs](https://github.com/luka-loehr/cpe/issues)  
- [luka@lukaloehr.com](mailto:luka@lukaloehr.com)  

---

Developed by [Luka Löhr](https://github.com/luka-loehr)
