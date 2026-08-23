#!/usr/bin/env bun
/**
 * cpe - control your TCL 5G CPE router from the terminal
 *
 * Default output is pretty-printed (human-friendly).
 * With --json, output is compact single-line JSON (agent-friendly).
 * Set* and action endpoints require --confirm to prevent accidental writes.
 */

import { login, call, type Session, type ApiError } from "./api.ts";
import { saveSession, loadSession, clearSession, SESSION_FILE } from "./session.ts";
import { c, fail, step, ok, box, table, formatBytes, PLAN_UNITS } from "./ui.ts";
import { ALL_ENDPOINTS, ENDPOINT_COUNT, getEndpoint, endpointsByCategory, searchEndpoints, type EndpointInfo } from "./endpoints.ts";

const VERSION = "1.2.0";
const argv = process.argv.slice(2);
const cmd = argv.find(a => !a.startsWith("-")) ?? "";
const positional = () => argv.filter(a => !a.startsWith("-")).slice(1);
const has = (...f: string[]) => f.some(x => argv.includes(x));
const val = (flag: string) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : undefined; };

function usage() {
  const L = (s: string) => console.log(s);
  L("");
  L(c.bold("cpe") + " " + c.grey("v" + VERSION) + " - control your TCL 5G CPE router from the terminal");
  L("");
  L(c.bold("Setup"));
  L("  " + c.cyan("cpe login") + "                          authenticate (interactive prompt or $CPE_PASSWORD)");
  L("  " + c.cyan("cpe logout") + "                         end the session and delete the local session file");
  L("");
  L(c.bold("Read (safe, no writes)"));
  L("  " + c.cyan("cpe status") + "                         router, network, signal, wifi summary");
  L("  " + c.cyan("cpe info") + "                            hardware + firmware info");
  L("  " + c.cyan("cpe devices") + "                         list connected devices");
  L("  " + c.cyan("cpe wifi") + "                            wifi settings + connected counts");
  L("  " + c.cyan("cpe sms") + " [--unread]                  list SMS messages");
  L("  " + c.cyan("cpe usage") + "                           data usage + billing cycle");
  L("  " + c.cyan("cpe network") + "                        cellular network + signal");
  L("  " + c.cyan("cpe vpn") + "                             VPN settings + status");
  L("  " + c.cyan("cpe firewall") + "                        firewall + filters + port forwarding");
  L("  " + c.cyan("cpe sim") + "                             SIM status + PIN state");
  L("");
  L(c.bold("Act (requires --confirm)"));
  L("  " + c.cyan("cpe reboot") + "                         reboot the router");
  L("  " + c.cyan("cpe reset") + "                          factory reset (requires --confirm)");
  L("  " + c.cyan("cpe wifi on") + " / " + c.cyan("cpe wifi off") + "            toggle wifi");
  L("  " + c.cyan("cpe sms send") + " <number> <message>    send an SMS");
  L("  " + c.cyan("cpe block") + " <mac>                     block a device");
  L("  " + c.cyan("cpe unblock") + " <mac>                   unblock a device");
  L("  " + c.cyan("cpe connect") + " / " + c.cyan("cpe disconnect") + "           data connection on/off");
  L("");
  L(c.bold("Raw API"));
  L("  " + c.cyan("cpe call") + " <endpoint> [json]         call any of " + ENDPOINT_COUNT + " API endpoints");
  L("  " + c.cyan("cpe endpoints") + "                       browse + search the endpoint catalog");
  L("");
  L(c.bold("Flags"));
  L("  --json                   compact JSON output (for agents); default is pretty-printed");
  L("  --confirm                required for any Set* or action endpoint");
  L("  --get                    with endpoints: show only read-only (Get*) endpoints");
  L("  --set                    with endpoints: show only write/action endpoints");
  L("  --category <cat>         with endpoints: filter by category");
  L("  --search <query>         with endpoints: search by name/description/category");
  L("  --unread                 with sms: only threads with unread messages");
  L("");
  L(c.bold("Environment"));
  L("  CPE_PASSWORD             router password (avoids the interactive prompt)");
  L("  CPE_USER                 login user (default: admin)");
  L("  CPE_BASE                 API base URL (default: http://192.168.1.1/jrd/webapi)");
  L("  CPE_TIMEOUT_MS           per-request timeout in ms (default: 15000)");
  L("  NO_COLOR / FORCE_COLOR   disable / force ANSI colour");
  L("");
}

const needSession = (): Session => {
  try { return loadSession(); }
  catch (e) { fail((e as Error).message); process.exit(1); }
};

const isJson = argv.includes("--json");

/** Print structured data: pretty-printed by default, compact JSON with --json. */
function print(data: unknown) {
  console.log(JSON.stringify(data, null, isJson ? 0 : 2));
}

/** Read password interactively with hidden input, falling back to $CPE_PASSWORD. */
async function readPassword(): Promise<string> {
  const envPw = process.env.CPE_PASSWORD;
  if (envPw) { step("using $CPE_PASSWORD"); return envPw; }
  if (!process.stdin.isTTY) { fail("not a TTY - set $CPE_PASSWORD"); process.exit(1); }
  process.stdout.write(c.cyan("router password: ") + c.dim("(input hidden) "));
  process.stdin.setRawMode(true);
  process.stdin.resume();
  const dec = new TextDecoder();
  let pw = "";
  for await (const chunk of process.stdin) {
    const text = dec.decode(chunk);
    for (const ch of text) {
      const code = ch.charCodeAt(0);
      if (code === 13 || code === 10) { process.stdin.setRawMode(false); process.stdin.pause(); process.stdout.write("\n"); return pw; }
      if (code === 3) { process.stdout.write("\n"); process.exit(1); }
      if (code === 127) { pw = pw.slice(0, -1); continue; }
      if (code >= 32) pw += ch;
    }
  }
  return pw;
}

/** Safety guard: all non-readonly endpoints require --confirm. */
function guardWrite(endpoint: string): boolean {
  const info = getEndpoint(endpoint);
  if (!info) { fail('unknown endpoint "' + endpoint + '"'); return false; }
  if (info.readonly) return true;
  if (!has("--confirm")) {
    fail('"' + endpoint + '" is a write/action endpoint (' + info.desc + ") - add --confirm to proceed");
    step("this guard prevents accidental config changes");
    return false;
  }
  step("confirmed: " + info.desc);
  return true;
}

/** Wrap a call() to handle session expiry with a re-login hint. */
async function safeCall(session: Session, method: string, params?: Record<string, unknown>) {
  try {
    return await call(session, method, params);
  } catch (e) {
    if ((e as ApiError).expired) {
      fail("session expired - run " + c.cyan("cpe login") + " again");
      step("the router auto-logs-out after a few minutes idle; see " + c.cyan("cpe call GetLogoutTimeSettings"));
    }
    throw e;
  }
}

const NET_TYPES: Record<number, string> = {
  2: "GSM", 6: "GPRS", 7: "EDGE", 8: "WCDMA", 11: "HSDPA", 12: "HSUPA",
  13: "HSPA", 14: "HSPA+", 15: "LTE", 16: "5G NSA", 17: "5G SA",
};

/**
 * ConnectType -> interface, transcribed from the router's own icon mapper:
 *   [4,5,6,7]->lan  [8]->usb  [0]->5g_guest  [1]->5g
 *   [2]->2g_guest   [3]->2g   [9]->6g_guest  [10]->6g
 */
const CONNECT_TYPES: Record<number, string> = {
  0: "5G guest", 1: "5G", 2: "2.4G guest", 3: "2.4G",
  4: "LAN", 5: "LAN", 6: "LAN", 7: "LAN",
  8: "USB", 9: "6G guest", 10: "6G",
};

/** Clamp signal to [0,5] so .repeat() never throws RangeError. */
function signalBars(n: number): number { return Math.max(0, Math.min(5, n | 0)); }

// ── main ──────────────────────────────────────────────────────────────────

const main = async () => {
  if (has("-v", "--version")) return console.log(VERSION);
  if (!cmd || has("-h", "--help")) return usage();

  switch (cmd) {
    // ── Setup ──────────────────────────────────────────────────────────────
    case "login": {
      const password = await readPassword();
      step("authenticating with router...");
      try {
        const session = await login(password);
        saveSession(session);
        ok("session saved to " + SESSION_FILE);
        if (isJson) print({ success: true, session_file: SESSION_FILE });
      } catch (e) {
        fail("login failed: " + (e as Error).message);
        if (isJson) print({ success: false, error: (e as Error).message });
        process.exit(1);
      }
      return;
    }

    case "logout": {
      // Best-effort server-side logout, then always drop the local file.
      try {
        const s = loadSession();
        await call(s, "Logout", {}).catch(() => null);
      } catch { /* no usable session — just clear the file */ }
      const removed = clearSession();
      ok(removed ? "session cleared" : "no session to clear");
      if (isJson) print({ action: "logout", cleared: removed });
      return;
    }

    // ── Read ──────────────────────────────────────────────────────────────
    case "status": {
      const s = needSession();
      const [sys, modem, sim, ap, conn, usage] = await Promise.all([
        safeCall(s, "GetApSystemInfo").catch(() => null),
        safeCall(s, "GetModemStatus").catch(() => null),
        safeCall(s, "GetSimStatus").catch(() => null),
        safeCall(s, "GetApStatus").catch(() => null),
        safeCall(s, "GetConnectionState").catch(() => null),
        safeCall(s, "GetUsageSettings").catch(() => null),
      ]);
      const signal = signalBars((modem as any)?.SignalStrength ?? 0);
      const uptime = (ap as any)?.DeviceUptime ?? 0;
      const summary = {
        router: {
          model: (sys as any)?.ModelName ?? null,
          firmware: (sys as any)?.SwVersion ?? null,
          hardware: (sys as any)?.HwVersion ?? null,
          mac: (sys as any)?.MacAddress ?? null,
          uptime_seconds: uptime,
          uptime_human: Math.floor(uptime / 3600) + "h " + Math.floor((uptime % 3600) / 60) + "m",
        },
        network: {
          operator: (modem as any)?.NetworkName ?? null,
          type: NET_TYPES[(modem as any)?.NetworkType] ?? "unknown",
          type_code: (modem as any)?.NetworkType ?? null,
          signal_bars: signal,
          signal_visual: "#".repeat(signal) + ".".repeat(5 - signal),
          connected: (modem as any)?.ConnectionStatus === 2,
          roaming: !!(modem as any)?.Roaming,
          download_speed: (conn as any)?.Speed_Dl ?? null,
          upload_speed: (conn as any)?.Speed_Ul ?? null,
        },
        sim: {
          state: (sim as any)?.SIMState === 7 ? "ready" : "not_ready",
          pin_remaining: (sim as any)?.PinRemainingTimes ?? null,
          puk_remaining: (sim as any)?.PukRemainingTimes ?? null,
        },
        wifi: {
          ssid_2g: (ap as any)?.Ssid_2g ?? null,
          ssid_5g: (ap as any)?.Ssid_5g ?? null,
          clients_2g: (ap as any)?.curr_num_2g ?? 0,
          clients_5g: (ap as any)?.curr_num_5g ?? 0,
          clients_lan: (ap as any)?.curr_num_lan ?? 0,
          clients_total: ((ap as any)?.curr_num_2g ?? 0) + ((ap as any)?.curr_num_5g ?? 0) + ((ap as any)?.curr_num_lan ?? 0),
        },
        data_usage: {
          billing_day: (usage as any)?.BillingDay ?? null,
          monthly_plan: (usage as any)?.MonthlyPlan ?? null,
          monthly_plan_unit: PLAN_UNITS[(usage as any)?.Unit] ?? null,
          used_bytes: (usage as any)?.UsedData ?? null,
          used_human: typeof (usage as any)?.UsedData === "number" ? formatBytes((usage as any).UsedData) : null,
        },
      };
      if (isJson) { print(summary); return; }
      console.log(box("Router", [
        ["Model", summary.router.model ?? "?"], ["Firmware", summary.router.firmware ?? "?"],
        ["Uptime", summary.router.uptime_human], ["MAC", summary.router.mac ?? "?"],
      ]));
      console.log(box("Network", [
        ["Operator", summary.network.operator ?? "?"], ["Type", summary.network.type],
        ["Signal", summary.network.signal_visual + " (" + signal + "/5)"],
        ["Status", summary.network.connected ? "connected" : "disconnected"],
        ["Roaming", summary.network.roaming ? "yes" : "no"],
        ["Down", typeof summary.network.download_speed === "number" ? formatBytes(summary.network.download_speed) + "/s" : "?"],
        ["Up", typeof summary.network.upload_speed === "number" ? formatBytes(summary.network.upload_speed) + "/s" : "?"],
      ]));
      console.log(box("SIM", [
        ["State", summary.sim.state], ["PIN left", String(summary.sim.pin_remaining ?? "?")],
      ]));
      console.log(box("WiFi", [
        ["2.4G SSID", summary.wifi.ssid_2g ?? "?"], ["5G SSID", summary.wifi.ssid_5g ?? "?"],
        ["2.4G clients", String(summary.wifi.clients_2g)], ["5G clients", String(summary.wifi.clients_5g)],
        ["LAN clients", String(summary.wifi.clients_lan)], ["Total", String(summary.wifi.clients_total)],
      ]));
      console.log(box("Data", [
        ["Billing day", String(summary.data_usage.billing_day ?? "?")],
        ["Monthly plan", summary.data_usage.monthly_plan
          ? summary.data_usage.monthly_plan + " " + (summary.data_usage.monthly_plan_unit ?? "")
          : "unlimited"],
        ["Used", summary.data_usage.used_human ?? "?"],
      ]));
      return;
    }

    case "info": {
      const s = needSession();
      const [sys, modem] = await Promise.all([
        safeCall(s, "GetApSystemInfo").catch(() => null),
        safeCall(s, "GetModemSystemInfo").catch(() => null),
      ]);
      print({ system: sys, modem: modem });
      return;
    }

    case "devices": {
      const s = needSession();
      const [connected, blocked] = await Promise.all([
        safeCall(s, "GetConnectedDeviceList").catch(() => null),
        safeCall(s, "GetBlockDeviceList").catch(() => null),
      ]);
      if (isJson) { print({ connected, blocked }); return; }
      const list = (connected as any)?.ConnectedList ?? [];
      if (!list.length) { console.log("no devices connected"); return; }
      const rows = list.map((d: any) => [
        d.MacAddress ?? "?",
        d.IPAddress ?? "?",
        d.DeviceName ?? "?",
        CONNECT_TYPES[d.ConnectType] ?? String(d.ConnectType ?? "?"),
        d.InternetRight === 0 ? "blocked" : "allowed",
      ]);
      console.log(table(rows, ["MAC", "IP", "Name", "Link", "Internet"]));
      if ((blocked as any)?.BlockList?.length) console.log("\nBlocked: " + ((blocked as any).BlockList.length) + " devices");
      return;
    }

    // Handles both the read (`cpe wifi`) and the toggle (`cpe wifi on|off`).
    // These MUST live in one case: a second `case "wifi"` later in the same
    // switch would be unreachable, since the first match wins.
    case "wifi": {
      const sub = positional()[0];
      if (sub === "on" || sub === "off") {
        if (!has("--confirm")) { fail("toggling wifi requires --confirm"); process.exit(1); }
        const s = needSession();
        const result = await safeCall(s, "SetWlanState", { WlanState: sub === "on" ? 1 : 0 });
        ok("wifi " + sub);
        if (isJson) print({ action: "wifi", state: sub, result });
        return;
      }
      if (sub) { fail('unknown wifi subcommand "' + sub + '" - use "on" or "off"'); process.exit(1); }
      const s = needSession();
      const [status, settings, state] = await Promise.all([
        safeCall(s, "GetApStatus").catch(() => null),
        safeCall(s, "GetWlanSettings").catch(() => null),
        safeCall(s, "GetWlanState").catch(() => null),
      ]);
      print({ status, settings, state });
      return;
    }

    case "sms": {
      const s = needSession();
      if (positional()[0] === "send") {
        const [number, ...msgParts] = positional().slice(1);
        if (!number || !msgParts.length) { fail("usage: cpe sms send <number> <message>"); process.exit(1); }
        if (!has("--confirm")) { fail("sending SMS requires --confirm"); process.exit(1); }
        const result = await safeCall(s, "SendSMS", { Number: number, Content: msgParts.join(" ") });
        print(result);
        return;
      }
      // GetSMSContactList requires a Page param — without it the router
      // answers 060201. The web UI calls it as {Page: 0}.
      const [contacts, storage] = await Promise.all([
        safeCall(s, "GetSMSContactList", { Page: 0 }).catch(() => null),
        safeCall(s, "GetSMSStorageState").catch(() => null),
      ]);
      let messages: any[] = (contacts as any)?.SMSContactList ?? [];
      // Unread is tracked per contact thread as UnreadCount, not a boolean.
      if (has("--unread")) messages = messages.filter((m: any) => (m.UnreadCount ?? 0) > 0);
      if (isJson) { print({ messages, storage }); return; }
      if (!messages.length) { console.log(has("--unread") ? "no unread messages" : "no messages"); return; }
      const smsRows = messages.map((m: any) => [
        String(m.ContactId ?? "?"),
        // PhoneNumber is an array; alphanumeric sender IDs contain control bytes.
        String((m.PhoneNumber?.[0] ?? "?")).replace(/[\x00-\x1f]/g, " "),
        String(m.UnreadCount ?? 0) + "/" + String(m.TSMSCount ?? 0),
        String(m.SMSTime ?? "?"),
        String(m.SMSContent ?? "").replace(/\s+/g, " ").slice(0, 48),
      ]);
      console.log(table(smsRows, ["ID", "From", "Unread/Total", "Last", "Preview"]));
      return;
    }

    case "usage": {
      const s = needSession();
      const [active, record, settings] = await Promise.all([
        safeCall(s, "GetActiveData").catch(() => null),
        safeCall(s, "GetUsageRecord").catch(() => null),
        safeCall(s, "GetUsageSettings").catch(() => null),
      ]);
      print({ active, record, settings });
      return;
    }

    case "network": {
      const s = needSession();
      const [info, signal, regState, settings, connState] = await Promise.all([
        safeCall(s, "GetNetworkInfo").catch(() => null),
        safeCall(s, "GetSignalList").catch(() => null),
        safeCall(s, "GetNetworkRegisterState").catch(() => null),
        safeCall(s, "GetNetworkSettings").catch(() => null),
        safeCall(s, "GetConnectionState").catch(() => null),
      ]);
      print({ info, signal, registration: regState, settings, connection: connState });
      return;
    }

    case "vpn": {
      const s = needSession();
      const [info, settings, passthrough] = await Promise.all([
        safeCall(s, "GetVpnInfo").catch(() => null),
        safeCall(s, "GetVpnSettings").catch(() => null),
        safeCall(s, "GetVPNPassthrough").catch(() => null),
      ]);
      print({ info, settings, passthrough });
      return;
    }

    case "firewall": {
      const s = needSession();
      const [level, status, macFilter, portTrig, upnp, alg, dos] = await Promise.all([
        safeCall(s, "GetfirewallLevel").catch(() => null),
        safeCall(s, "GetFirewallStatusOfEx").catch(() => null),
        safeCall(s, "GetMacFilterSettings").catch(() => null),
        safeCall(s, "GetPortTriggering").catch(() => null),
        safeCall(s, "GetUpnpSettings").catch(() => null),
        safeCall(s, "GetALGSettings").catch(() => null),
        safeCall(s, "GetAntiDoSattack").catch(() => null),
      ]);
      print({ level, status, mac_filter: macFilter, port_triggering: portTrig, upnp, alg, anti_dos: dos });
      return;
    }

    case "sim": {
      const s = needSession();
      const [status, pinState] = await Promise.all([
        safeCall(s, "GetSimStatus").catch(() => null),
        safeCall(s, "GetAutoValidatePinState").catch(() => null),
      ]);
      print({ sim: status, auto_pin: pinState });
      return;
    }

    // ── Act ─────────────────────────────────────────────────────────────────
    case "reboot": {
      if (!has("--confirm")) { fail("reboot requires --confirm"); process.exit(1); }
      const s = needSession();
      step("rebooting router...");
      const result = await safeCall(s, "SetDeviceReboot", {});
      ok("reboot command sent");
      if (isJson) print({ action: "reboot", result });
      return;
    }

    case "reset": {
      if (!has("--confirm")) { fail("factory reset requires --confirm (this erases ALL config!)"); process.exit(1); }
      const s = needSession();
      const result = await safeCall(s, "SetDeviceReset", {});
      ok("factory reset command sent");
      if (isJson) print({ action: "reset", result });
      return;
    }

    case "block":
    case "unblock": {
      const blocking = cmd === "block";
      if (!has("--confirm")) { fail(cmd + "ing a device requires --confirm"); process.exit(1); }
      const mac = positional()[0];
      if (!mac) { fail("usage: cpe " + cmd + " <mac> [--name <device-name>]"); process.exit(1); }
      const s = needSession();

      // SetConnectedDeviceBlock/SetDeviceUnblock both take {DeviceName, MacAddress};
      // sending only the MAC silently no-ops. Resolve the name from the router.
      let name = val("--name");
      if (!name) {
        const src = blocking
          ? await safeCall(s, "GetConnectedDeviceList").catch(() => null)
          : await safeCall(s, "GetBlockDeviceList").catch(() => null);
        const list: any[] = (src as any)?.[blocking ? "ConnectedList" : "BlockList"] ?? [];
        const hit = list.find((d: any) => String(d.MacAddress ?? "").toLowerCase() === mac.toLowerCase());
        if (!hit) {
          fail(mac + " is not in the " + (blocking ? "connected" : "blocked") + " device list");
          step("pass --name <device-name> to act on it anyway");
          process.exit(1);
        }
        name = hit.DeviceName;
      }

      const result = await safeCall(s, blocking ? "SetConnectedDeviceBlock" : "SetDeviceUnblock",
        { DeviceName: name, MacAddress: mac });
      ok((blocking ? "blocked " : "unblocked ") + mac + " (" + name + ")");
      if (isJson) print({ action: cmd, mac, name, result });
      return;
    }

    case "connect": {
      if (!has("--confirm")) { fail("connecting requires --confirm"); process.exit(1); }
      const s = needSession();
      const result = await safeCall(s, "Connect", {});
      ok("data connection requested");
      if (isJson) print({ action: "connect", result });
      return;
    }

    case "disconnect": {
      if (!has("--confirm")) { fail("disconnecting requires --confirm"); process.exit(1); }
      const s = needSession();
      const result = await safeCall(s, "DisConnect", {});
      ok("data disconnect requested");
      if (isJson) print({ action: "disconnect", result });
      return;
    }

    // ── Raw API ─────────────────────────────────────────────────────────────
    case "call": {
      const s = needSession();
      const [endpoint, ...jsonArgs] = positional();
      if (!endpoint) { fail("usage: cpe call <endpoint> [json params]"); process.exit(1); }
      if (!ALL_ENDPOINTS.includes(endpoint as any)) {
        fail('unknown endpoint "' + endpoint + '" - run "cpe endpoints" to see all');
        process.exit(1);
      }
      let params: Record<string, unknown> = {};
      if (jsonArgs.length) {
        try { params = JSON.parse(jsonArgs.join(" ")); }
        catch { fail("invalid JSON params"); process.exit(1); }
      }
      if (!guardWrite(endpoint)) process.exit(1);
      const result = await safeCall(s, endpoint, params);
      print(result);
      return;
    }

    case "endpoints": {
      const search = val("--search");
      const category = val("--category");

      const matchesType = (e: EndpointInfo, t: string | null) =>
        !t || (t === "get" ? e.type === "get" : e.type !== "get");
      const matchesCat = (name: string) =>
        !category || name.toLowerCase() === category.toLowerCase();

      let filterType: string | null = null;
      if (has("--get")) filterType = "get";
      if (has("--set")) filterType = "set";

      if (search) {
        const results = searchEndpoints(search).filter(e => matchesType(e, filterType));
        if (isJson) { print(results); return; }
        if (!results.length) { console.log('no endpoint matches "' + search + '"'); return; }
        for (const ep of results) {
          const badge = ep.readonly ? c.green("GET ") : (ep.type === "set" ? c.yellow("SET ") : c.red("ACT "));
          console.log("  " + badge + ep.name.padEnd(34) + " " + c.grey(ep.category + " - " + ep.desc));
        }
        console.log("\n" + c.grey(results.length + " match" + (results.length === 1 ? "" : "es")));
        return;
      }

      const cats = endpointsByCategory();

      if (isJson) {
        const out: Record<string, EndpointInfo[]> = {};
        for (const [name, eps] of Object.entries(cats)) {
          if (!matchesCat(name)) continue;
          const filtered = eps.filter(e => matchesType(e, filterType));
          if (filtered.length) out[name] = filtered;
        }
        print(out);
        return;
      }

      let shown = 0;
      for (const [catName, eps] of Object.entries(cats)) {
        if (!matchesCat(catName)) continue;
        const filtered = eps.filter(e => matchesType(e, filterType));
        if (!filtered.length) continue;
        shown += filtered.length;
        console.log("\n" + c.bold(catName));
        for (const ep of filtered) {
          const badge = ep.readonly ? c.green("GET ") : (ep.type === "set" ? c.yellow("SET ") : c.red("ACT "));
          console.log("  " + badge + ep.name.padEnd(34) + " " + c.grey(ep.desc));
        }
      }
      if (!shown) { fail('no endpoints match those filters'); process.exit(1); }
      console.log("\n" + c.grey(shown + " of " + ENDPOINT_COUNT + " endpoints | read=green write=yellow action=red"));
      return;
    }

    default:
      fail('unknown command "' + cmd + '"');
      step("run " + c.cyan("cpe --help"));
      process.exit(1);
  }
};

main().catch(e => { console.error("\n" + c.red("x") + " " + e.message + "\n"); process.exit(1); });
