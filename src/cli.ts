#!/usr/bin/env bun
/**
 * cpe — control your TCL 5G CPE router from the terminal
 *
 *   cpe login                authenticate (password from $CPE_PASSWORD)
 *   cpe status               router + network + signal at a glance
 *   cpe devices              list connected devices
 *   cpe wifi                 wifi settings and connected counts
 *   cpe sms                  list SMS messages
 *   cpe reboot               reboot the router
 *   cpe call <endpoint>      call any of the 327 API endpoints directly
 *   cpe endpoints            list all available API endpoints
 */

import { login, call, type Session } from "./api.ts";
import { saveSession, loadSession, hasSession, SESSION_FILE } from "./session.ts";
import { c, fail, step, ok, box, table } from "./ui.ts";
import { ALL_ENDPOINTS } from "./endpoints.ts";

const VERSION = "1.0.0";
const argv = process.argv.slice(2);
const cmd = argv.find(a => !a.startsWith("-")) ?? "";
const rest = () => argv.filter(a => !a.startsWith("-")).slice(1);

function usage() {
  const lines = [
    "",
    c.bold("cpe") + " " + c.grey("v" + VERSION) + " - control your TCL 5G CPE router from the terminal",
    "",
    c.bold("Setup"),
    "  " + c.cyan("cpe login") + "                        authenticate (reads $CPE_PASSWORD)",
    "",
    c.bold("Read"),
    "  " + c.cyan("cpe status") + "                       router, network, and signal summary",
    "  " + c.cyan("cpe info") + "                          full system info",
    "  " + c.cyan("cpe devices") + "                       list connected devices",
    "  " + c.cyan("cpe wifi") + "                          wifi settings + connected counts",
    "  " + c.cyan("cpe sms") + " [--unread]               list SMS messages",
    "  " + c.cyan("cpe usage") + "                         data usage stats",
    "  " + c.cyan("cpe network") + "                       network registration + signal list",
    "  " + c.cyan("cpe vpn") + "                           VPN settings",
    "  " + c.cyan("cpe firewall") + "                      firewall status + rules",
    "",
    c.bold("Act"),
    "  " + c.cyan("cpe reboot") + "                        reboot the router",
    "  " + c.cyan("cpe reset") + "                        factory reset (dangerous!)",
    "  " + c.cyan("cpe wifi on") + " / off                toggle wifi",
    "  " + c.cyan("cpe sms send") + " <number> <message>  send an SMS",
    "  " + c.cyan("cpe block") + " <mac>                   block a device",
    "  " + c.cyan("cpe unblock") + " <mac>                 unblock a device",
    "",
    c.bold("Raw API"),
    "  " + c.cyan("cpe call") + " <endpoint> [json]        call any of 327 API endpoints",
    "  " + c.cyan("cpe endpoints") + " [--get|--set]       list all available endpoints",
    "",
    c.bold("Flags"),
    "  --json                 output raw JSON instead of pretty-printed",
    "  --get                  with endpoints: show only Get* endpoints",
    "  --set                  with endpoints: show only Set* endpoints",
    "  --unread               with sms: show only unread messages",
    "",
  ];
  console.log(lines.join("\n"));
}

const needSession = (): Session => {
  try { return loadSession(); }
  catch (e) { fail((e as Error).message); process.exit(1); }
};

const pretty = !argv.includes("--json");

const print = (data: unknown) => {
  if (!pretty) { console.log(JSON.stringify(data)); return; }
  console.log(JSON.stringify(data, null, 2));
};

// ── main ──────────────────────────────────────────────────────────────────

const main = async () => {
  if (argv.includes("-v") || argv.includes("--version")) return console.log(VERSION);
  if (!cmd || argv.includes("-h") || argv.includes("--help")) return usage();

  switch (cmd) {
    case "login": {
      const password = process.env.CPE_PASSWORD;
      if (!password) { fail("set $CPE_PASSWORD first"); process.exit(1); }
      step("authenticating with router…");
      try {
        const session = await login(password);
        saveSession(session);
        ok(`session saved to ${SESSION_FILE}`);
      } catch (e) {
        fail(`login failed: ${(e as Error).message}`);
        process.exit(1);
      }
      return;
    }

    case "status": {
      const s = needSession();
      const [sys, modem, sim, ap, wan] = await Promise.all([
        call(s, "GetApSystemInfo").catch(() => null),
        call(s, "GetModemStatus").catch(() => null),
        call(s, "GetSimStatus").catch(() => null),
        call(s, "GetApStatus").catch(() => null),
        call(s, "GetWanInfo").catch(() => null),
      ]);

      const netTypes: Record<number, string> = {
        17: "5G SA", 16: "5G NSA", 15: "LTE", 14: "HSPA+", 13: "HSPA",
        12: "HSUPA", 11: "HSDPA", 8: "WCDMA", 7: "EDGE", 6: "GPRS", 2: "GSM",
      };

      console.log(box("Router", [
        ["Model", (sys as any)?.ModelName ?? "?"],
        ["Firmware", (sys as any)?.SwVersion ?? "?"],
        ["MAC", (sys as any)?.MacAddress ?? "?"],
        ["Uptime", `${Math.floor(((ap as any)?.DeviceUptime ?? 0) / 3600)}h ${Math.floor(((ap as any)?.DeviceUptime ?? 0) % 3600 / 60)}m`],
      ]));

      console.log(box("Network", [
        ["Operator", (modem as any)?.NetworkName ?? "?"],
        ["Type", netTypes[(modem as any)?.NetworkType] ?? "?"],
        ["Signal", `${"▮".repeat((modem as any)?.SignalStrength ?? 0)}${"▯".repeat(5 - ((modem as any)?.SignalStrength ?? 0))}`],
        ["Connection", (modem as any)?.ConnectionStatus === 2 ? "connected" : "disconnected"],
        ["Roaming", (modem as any)?.Roaming ? "yes" : "no"],
      ]));

      console.log(box("SIM", [
        ["State", (sim as any)?.SIMState === 7 ? "ready" : "not ready"],
        ["PIN remaining", String((sim as any)?.PinRemainingTimes ?? "?")],
      ]));

      console.log(box("WiFi", [
        ["2.4 GHz SSID", (ap as any)?.Ssid_2g ?? "?"],
        ["5 GHz SSID", (ap as any)?.Ssid_5g ?? "?"],
        ["2.4 GHz clients", String((ap as any)?.curr_num_2g ?? 0)],
        ["5 GHz clients", String((ap as any)?.curr_num_5g ?? 0)],
        ["LAN clients", String((ap as any)?.curr_num_lan ?? 0)],
      ]));

      if (wan) console.log(box("WAN", [
        ["IP", (wan as any)?.WanIPAddress ?? (wan as any)?.WanIP ?? "?"],
        ["Gateway", (wan as any)?.WanGateway ?? "?"],
      ]));
      return;
    }

    case "info": {
      const s = needSession();
      const info = await call(s, "GetSystemInfo").catch(() => null);
      print(info);
      return;
    }

    case "devices": {
      const s = needSession();
      const devices = await call(s, "GetConnectedDeviceList").catch(() => null);
      if (pretty && Array.isArray((devices as any)?.DeviceList)) {
        const rows = (devices as any).DeviceList.map((d: any) => [
          d.MacAddress ?? d.MACAddress ?? "?",
          d.IPAddress ?? d.IP ?? "?",
          d.HostName ?? d.Hostname ?? d.Name ?? "?",
          d.ConnectionType ?? d.Connection ?? "?",
        ]);
        console.log(table(rows, ["MAC", "IP", "Hostname", "Type"]));
      } else print(devices);
      return;
    }

    case "wifi": {
      const s = needSession();
      const [status, settings] = await Promise.all([
        call(s, "GetApStatus").catch(() => null),
        call(s, "GetWlanSettings").catch(() => null),
      ]);
      print({ status, settings });
      return;
    }

    case "sms": {
      const s = needSession();
      if (rest()[0] === "send") {
        const [number, ...msgParts] = rest().slice(1);
        if (!number || !msgParts.length) { fail("usage: cpe sms send <number> <message>"); process.exit(1); }
        const result = await call(s, "SendSMS", { Number: number, Content: msgParts.join(" ") });
        print(result);
        return;
      }
      const list = await call(s, "GetSMSContactList").catch(() => null);
      print(list);
      return;
    }

    case "usage": {
      const s = needSession();
      const [active, record, settings] = await Promise.all([
        call(s, "GetActiveData").catch(() => null),
        call(s, "GetUsageRecord").catch(() => null),
        call(s, "GetUsageSettings").catch(() => null),
      ]);
      print({ active, record, settings });
      return;
    }

    case "network": {
      const s = needSession();
      const [info, signal, regState] = await Promise.all([
        call(s, "GetNetworkInfo").catch(() => null),
        call(s, "GetSignalList").catch(() => null),
        call(s, "GetNetworkRegisterState").catch(() => null),
      ]);
      print({ info, signal, regState });
      return;
    }

    case "vpn": {
      const s = needSession();
      const [info, settings, passthrough] = await Promise.all([
        call(s, "GetVpnInfo").catch(() => null),
        call(s, "GetVpnSettings").catch(() => null),
        call(s, "GetVPNPassthrough").catch(() => null),
      ]);
      print({ info, settings, passthrough });
      return;
    }

    case "firewall": {
      const s = needSession();
      const [level, status, macFilter, ipFilter, portFwd] = await Promise.all([
        call(s, "GetfirewallLevel").catch(() => null),
        call(s, "GetFirewallStatusOfEx").catch(() => null),
        call(s, "GetMacFilterSettings").catch(() => null),
        call(s, "GetIpFilter").catch(() => null),
        call(s, "GetPortFwding").catch(() => null),
      ]);
      print({ level, status, macFilter, ipFilter, portFwd });
      return;
    }

    case "reboot": {
      const s = needSession();
      step("rebooting router…");
      await call(s, "SetDeviceReboot", {});
      ok("reboot command sent");
      return;
    }

    case "reset": {
      const s = needSession();
      step("factory reset…");
      await call(s, "SetDeviceReset", {});
      ok("factory reset command sent");
      return;
    }

    case "block": {
      const s = needSession();
      const mac = rest()[0];
      if (!mac) { fail("usage: cpe block <mac>"); process.exit(1); }
      await call(s, "SetConnectedDeviceBlock", { MacAddress: mac });
      ok(`blocked ${mac}`);
      return;
    }

    case "unblock": {
      const s = needSession();
      const mac = rest()[0];
      if (!mac) { fail("usage: cpe unblock <mac>"); process.exit(1); }
      await call(s, "SetDeviceUnblock", { MacAddress: mac });
      ok(`unblocked ${mac}`);
      return;
    }

    case "wifi-on":
    case "wifi-off": {
      const s = needSession();
      await call(s, "SetWlanState", { WlanState: cmd === "wifi-on" ? 1 : 0 });
      ok(`wifi ${cmd === "wifi-on" ? "on" : "off"}`);
      return;
    }

    case "call": {
      const s = needSession();
      const [endpoint, ...jsonArgs] = rest();
      if (!endpoint) { fail("usage: cpe call <endpoint> [json params]"); process.exit(1); }
      if (!ALL_ENDPOINTS.includes(endpoint as any)) {
        fail(`unknown endpoint "${endpoint}" — run "cpe endpoints" to see all`);
        process.exit(1);
      }
      let params = {};
      if (jsonArgs.length) {
        try { params = JSON.parse(jsonArgs.join(" ")); }
        catch { fail("invalid JSON params"); process.exit(1); }
      }
      const result = await call(s, endpoint, params);
      print(result);
      return;
    }

    case "endpoints": {
      const filter = argv.includes("--get") ? "get" : argv.includes("--set") ? "set" : "all";
      const list = filter === "get"
        ? ALL_ENDPOINTS.filter(e => e.startsWith("Get"))
        : filter === "set"
        ? ALL_ENDPOINTS.filter(e => e.startsWith("Set"))
        : ALL_ENDPOINTS;
      for (const ep of list) console.log(ep);
      return;
    }

    default:
      fail('unknown command "' + cmd + '"');
      step("run " + c.cyan("cpe --help"));
      process.exit(1);
  }
};

main().catch(e => { console.error("\n" + c.red("x") + " " + e.message + "\n"); process.exit(1); });
