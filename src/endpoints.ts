/**
 * cpe — full endpoint catalog with descriptions and categories.
 * 327 endpoints extracted from the TCL HH515L web UI, organized by function.
 */

export type EndpointType = "get" | "set" | "action";

export interface EndpointInfo {
  name: string;
  category: string;
  type: EndpointType;
  desc: string;
  readonly: boolean;
}

export const CATALOG: Record<string, EndpointInfo> = {
  // System
  "GetApSystemInfo": { name: "GetApSystemInfo", category: "System", type: "get", desc: "Hardware/software version, MAC addresses, model name", readonly: true },
  "GetModemSystemInfo": { name: "GetModemSystemInfo", category: "System", type: "get", desc: "Modem firmware, IMSI, ICCID, MSISDN", readonly: true },
  "GetSystemConfig": { name: "GetSystemConfig", category: "System", type: "get", desc: "Theme, usage display settings", readonly: true },
  "GetSystemSettings": { name: "GetSystemSettings", category: "System", type: "get", desc: "NTP server settings", readonly: true },
  "SetSystemSettings": { name: "SetSystemSettings", category: "System", type: "set", desc: "Configure NTP servers", readonly: false },
  "GetSystemLogs": { name: "GetSystemLogs", category: "System", type: "get", desc: "System log entries", readonly: true },
  "SetSystemLogs": { name: "SetSystemLogs", category: "System", type: "set", desc: "Configure system log settings", readonly: false },
  "DownloadSystemLogs": { name: "DownloadSystemLogs", category: "System", type: "action", desc: "Download system logs", readonly: false },
  "GetCurrentTime": { name: "GetCurrentTime", category: "System", type: "get", desc: "Current time, timezone, DST state", readonly: true },
  "SetCurrentTime": { name: "SetCurrentTime", category: "System", type: "set", desc: "Set current time and timezone", readonly: false },
  "GetCurrentLanguage": { name: "GetCurrentLanguage", category: "System", type: "get", desc: "Web UI language", readonly: true },
  "SetLanguage": { name: "SetLanguage", category: "System", type: "set", desc: "Change web UI language", readonly: false },
  "GetSNcode": { name: "GetSNcode", category: "System", type: "get", desc: "Device serial number", readonly: true },
  "SetSNcode": { name: "SetSNcode", category: "System", type: "set", desc: "Set device serial number", readonly: false },
  "GetLogoutTimeSettings": { name: "GetLogoutTimeSettings", category: "System", type: "get", desc: "Auto-logout timeout", readonly: true },
  "SetLogoutTimeSettings": { name: "SetLogoutTimeSettings", category: "System", type: "set", desc: "Configure auto-logout timeout", readonly: false },
  "GetwebManagement": { name: "GetwebManagement", category: "System", type: "get", desc: "Web management switch state", readonly: true },
  "SetwebManagement": { name: "SetwebManagement", category: "System", type: "set", desc: "Toggle web management", readonly: false },
  "GetDeviceDefaultRight": { name: "GetDeviceDefaultRight", category: "System", type: "get", desc: "Default device access rights", readonly: true },
  "SetDeviceDefaultRight": { name: "SetDeviceDefaultRight", category: "System", type: "set", desc: "Set default device access rights", readonly: false },
  "GetPasswordChangeFlag": { name: "GetPasswordChangeFlag", category: "System", type: "get", desc: "Whether password change is forced", readonly: true },
  "SetPasswordChangeFlag": { name: "SetPasswordChangeFlag", category: "System", type: "set", desc: "Set password change flag", readonly: false },

  // Auth
  "Login": { name: "Login", category: "Auth", type: "action", desc: "Authenticate with username/password", readonly: false },
  "Logout": { name: "Logout", category: "Auth", type: "action", desc: "End current session", readonly: false },
  "CheckLoginPasswd": { name: "CheckLoginPasswd", category: "Auth", type: "action", desc: "Verify password without full login", readonly: false },
  "ChangePassword": { name: "ChangePassword", category: "Auth", type: "set", desc: "Change router admin password", readonly: false },
  "GetSaveLoginInfo": { name: "GetSaveLoginInfo", category: "Auth", type: "get", desc: "Saved login info state", readonly: true },
  "SetSaveLoginInfo": { name: "SetSaveLoginInfo", category: "Auth", type: "set", desc: "Configure saved login info", readonly: false },
  "GetPubKey": { name: "GetPubKey", category: "Auth", type: "action", desc: "Get RSA public key for key exchange", readonly: false },
  "SetConfidentKey": { name: "SetConfidentKey", category: "Auth", type: "action", desc: "Send encrypted session keys", readonly: false },
  "HeartBeat": { name: "HeartBeat", category: "Auth", type: "action", desc: "Keep session alive", readonly: false },
  "GetDeviceSt": { name: "GetDeviceSt", category: "Auth", type: "get", desc: "Get salt for password hashing", readonly: true },

  // Network/Cellular
  "GetSimStatus": { name: "GetSimStatus", category: "Network/Cellular", type: "get", desc: "SIM state, PIN/PUK remaining attempts", readonly: true },
  "GetModemStatus": { name: "GetModemStatus", category: "Network/Cellular", type: "get", desc: "Network type, operator, signal, connection", readonly: true },
  "GetNetworkInfo": { name: "GetNetworkInfo", category: "Network/Cellular", type: "get", desc: "PLMN, network type, LAC", readonly: true },
  "GetNetworkSettings": { name: "GetNetworkSettings", category: "Network/Cellular", type: "get", desc: "Network mode, band selection, roaming", readonly: true },
  "SetNetworkSettings": { name: "SetNetworkSettings", category: "Network/Cellular", type: "set", desc: "Configure network mode and bands", readonly: false },
  "GetNetworkRegisterState": { name: "GetNetworkRegisterState", category: "Network/Cellular", type: "get", desc: "Network registration state", readonly: true },
  "RegisterNetwork": { name: "RegisterNetwork", category: "Network/Cellular", type: "action", desc: "Register on network", readonly: false },
  "SearchNetwork": { name: "SearchNetwork", category: "Network/Cellular", type: "action", desc: "Search for available networks", readonly: false },
  "SearchNetworkResult": { name: "SearchNetworkResult", category: "Network/Cellular", type: "get", desc: "Get network search results", readonly: true },
  "GetSignalList": { name: "GetSignalList", category: "Network/Cellular", type: "get", desc: "Signal strength list", readonly: true },
  "GetSpeedConnection": { name: "GetSpeedConnection", category: "Network/Cellular", type: "get", desc: "Connection speed info", readonly: true },
  "GetConnectionState": { name: "GetConnectionState", category: "Network/Cellular", type: "get", desc: "Connection status, speed, error codes", readonly: true },
  "GetConnectionSettings": { name: "GetConnectionSettings", category: "Network/Cellular", type: "get", desc: "PDP type, connect mode, mobile data", readonly: true },
  "SetConnectionSettings": { name: "SetConnectionSettings", category: "Network/Cellular", type: "set", desc: "Configure connection and mobile data", readonly: false },
  "Connect": { name: "Connect", category: "Network/Cellular", type: "action", desc: "Establish data connection", readonly: false },
  "DisConnect": { name: "DisConnect", category: "Network/Cellular", type: "action", desc: "Disconnect data", readonly: false },
  "MultiDisConnect": { name: "MultiDisConnect", category: "Network/Cellular", type: "action", desc: "Disconnect multiple PDN", readonly: false },
  "MultiPdnGetState": { name: "MultiPdnGetState", category: "Network/Cellular", type: "get", desc: "Multiple PDN connection state", readonly: true },
  "GetBandSelection": { name: "GetBandSelection", category: "Network/Cellular", type: "get", desc: "Current band selection", readonly: true },
  "SetBandSelection": { name: "SetBandSelection", category: "Network/Cellular", type: "set", desc: "Configure band selection", readonly: false },
  "GetAntennaSettings": { name: "GetAntennaSettings", category: "Network/Cellular", type: "get", desc: "Antenna configuration", readonly: true },
  "SetAntennaSettings": { name: "SetAntennaSettings", category: "Network/Cellular", type: "set", desc: "Configure antenna settings", readonly: false },
  "GetExternalAntennaStatus": { name: "GetExternalAntennaStatus", category: "Network/Cellular", type: "get", desc: "External antenna status", readonly: true },
  "GetNATType": { name: "GetNATType", category: "Network/Cellular", type: "get", desc: "Current NAT type", readonly: true },
  "SetNATType": { name: "SetNATType", category: "Network/Cellular", type: "set", desc: "Configure NAT type", readonly: false },
  "SetModemMtu": { name: "SetModemMtu", category: "Network/Cellular", type: "set", desc: "Set modem MTU", readonly: false },
  "GetDualWanSettings": { name: "GetDualWanSettings", category: "Network/Cellular", type: "get", desc: "Dual WAN status and priority", readonly: true },
  "SetDualWanSettings": { name: "SetDualWanSettings", category: "Network/Cellular", type: "set", desc: "Configure dual WAN", readonly: false },
  "GetWanSettings": { name: "GetWanSettings", category: "Network/Cellular", type: "get", desc: "WAN IP, subnet, gateway, MTU", readonly: true },
  "SetWanSettings": { name: "SetWanSettings", category: "Network/Cellular", type: "set", desc: "Configure WAN settings", readonly: false },
  "GetWanCurrentMacAddr": { name: "GetWanCurrentMacAddr", category: "Network/Cellular", type: "get", desc: "WAN MAC address", readonly: true },
  "SetWanCurrentMacAddr": { name: "SetWanCurrentMacAddr", category: "Network/Cellular", type: "set", desc: "Set WAN MAC address", readonly: false },
  "GetWanAccess": { name: "GetWanAccess", category: "Network/Cellular", type: "get", desc: "WAN access setting", readonly: true },
  "SetWanAccess": { name: "SetWanAccess", category: "Network/Cellular", type: "set", desc: "Configure WAN access", readonly: false },
  "GetWanIsConnInter": { name: "GetWanIsConnInter", category: "Network/Cellular", type: "get", desc: "WAN internet connection status", readonly: true },
  "GetIpPassthroughSettings": { name: "GetIpPassthroughSettings", category: "Network/Cellular", type: "get", desc: "IP passthrough switch", readonly: true },
  "SetIpPassthroughSettings": { name: "SetIpPassthroughSettings", category: "Network/Cellular", type: "set", desc: "Configure IP passthrough", readonly: false },
  "GetDnsStatus": { name: "GetDnsStatus", category: "Network/Cellular", type: "get", desc: "DNS status", readonly: true },
  "GetManualDNS": { name: "GetManualDNS", category: "Network/Cellular", type: "get", desc: "Manual DNS servers", readonly: true },
  "SetManualDNS": { name: "SetManualDNS", category: "Network/Cellular", type: "set", desc: "Configure manual DNS", readonly: false },
  "GetAtPort": { name: "GetAtPort", category: "Network/Cellular", type: "get", desc: "AT port status", readonly: true },
  "SetAtPort": { name: "SetAtPort", category: "Network/Cellular", type: "set", desc: "Configure AT port", readonly: false },
  "GetApnVlanMapping": { name: "GetApnVlanMapping", category: "Network/Cellular", type: "get", desc: "APN to VLAN mapping", readonly: true },
  "SetApnVlanMapping": { name: "SetApnVlanMapping", category: "Network/Cellular", type: "set", desc: "Configure APN VLAN mapping", readonly: false },

  // WiFi
  "GetWlanSettings": { name: "GetWlanSettings", category: "WiFi", type: "get", desc: "WiFi settings (SSID, security, channel, power)", readonly: true },
  "SetWlanSettings": { name: "SetWlanSettings", category: "WiFi", type: "set", desc: "Configure WiFi settings", readonly: false },
  "GetWlanState": { name: "GetWlanState", category: "WiFi", type: "get", desc: "2.4G and 5G WiFi on/off state", readonly: true },
  "SetWlanState": { name: "SetWlanState", category: "WiFi", type: "set", desc: "Toggle WiFi on/off", readonly: false },
  "SetWlanOn": { name: "SetWlanOn", category: "WiFi", type: "set", desc: "Turn WiFi on", readonly: false },
  "GetWlanStatistics": { name: "GetWlanStatistics", category: "WiFi", type: "get", desc: "WiFi statistics per client", readonly: true },
  "GetWlanSupportMode": { name: "GetWlanSupportMode", category: "WiFi", type: "get", desc: "Supported WiFi modes", readonly: true },
  "GetApStatus": { name: "GetApStatus", category: "WiFi", type: "get", desc: "Connected client counts, SSIDs, uptime", readonly: true },
  "GetWifiSchedulerSetting": { name: "GetWifiSchedulerSetting", category: "WiFi", type: "get", desc: "WiFi scheduler state and time range", readonly: true },
  "SetWifiSchedulerSetting": { name: "SetWifiSchedulerSetting", category: "WiFi", type: "set", desc: "Configure WiFi scheduler", readonly: false },
  "GetWmmSwitch": { name: "GetWmmSwitch", category: "WiFi", type: "get", desc: "WMM (QoS) switch state", readonly: true },
  "SetWmmSwitch": { name: "SetWmmSwitch", category: "WiFi", type: "set", desc: "Toggle WMM", readonly: false },
  "GetWPSswitch": { name: "GetWPSswitch", category: "WiFi", type: "get", desc: "WPS switch state", readonly: true },
  "SetWPSswitch": { name: "SetWPSswitch", category: "WiFi", type: "set", desc: "Toggle WPS", readonly: false },
  "GetWPSSettings": { name: "GetWPSSettings", category: "WiFi", type: "get", desc: "WPS settings", readonly: true },
  "SetWPSSettings": { name: "SetWPSSettings", category: "WiFi", type: "set", desc: "Configure WPS", readonly: false },
  "GetWPSConnectionState": { name: "GetWPSConnectionState", category: "WiFi", type: "get", desc: "WPS connection state and timer", readonly: true },
  "SetWPSConnectionStop": { name: "SetWPSConnectionStop", category: "WiFi", type: "set", desc: "Stop WPS connection", readonly: false },
  "SetWPSPbc": { name: "SetWPSPbc", category: "WiFi", type: "set", desc: "Trigger WPS push button", readonly: false },
  "SetWPSPin": { name: "SetWPSPin", category: "WiFi", type: "set", desc: "Trigger WPS with PIN", readonly: false },
  "GetEcoEthWifiModeSetting": { name: "GetEcoEthWifiModeSetting", category: "WiFi", type: "get", desc: "Eco ethernet/wifi mode settings", readonly: true },
  "SetEcoEthWifiModeSetting": { name: "SetEcoEthWifiModeSetting", category: "WiFi", type: "set", desc: "Configure eco ethernet/wifi mode", readonly: false },

  // LAN
  "GetLanSettings": { name: "GetLanSettings", category: "LAN", type: "get", desc: "LAN IP, subnet, DNS", readonly: true },
  "SetLanSettings": { name: "SetLanSettings", category: "LAN", type: "set", desc: "Configure LAN settings", readonly: false },
  "GetLanPortInfo": { name: "GetLanPortInfo", category: "LAN", type: "get", desc: "LAN port status", readonly: true },
  "GetLanStatistics": { name: "GetLanStatistics", category: "LAN", type: "get", desc: "LAN traffic statistics", readonly: true },
  "GetDHCPReserSettings": { name: "GetDHCPReserSettings", category: "LAN", type: "get", desc: "DHCP reservation list", readonly: true },
  "SetDHCPReserSettings": { name: "SetDHCPReserSettings", category: "LAN", type: "set", desc: "Configure DHCP reservations", readonly: false },

  // Devices
  "GetConnectedDeviceList": { name: "GetConnectedDeviceList", category: "Devices", type: "get", desc: "All connected devices with MAC, IP, hostname", readonly: true },
  "GetBlockDeviceList": { name: "GetBlockDeviceList", category: "Devices", type: "get", desc: "Blocked device list", readonly: true },
  "SetConnectedDeviceBlock": { name: "SetConnectedDeviceBlock", category: "Devices", type: "set", desc: "Block a device by MAC", readonly: false },
  "SetConnectedDeviceRight": { name: "SetConnectedDeviceRight", category: "Devices", type: "set", desc: "Set device access rights", readonly: false },
  "SetDeviceUnblock": { name: "SetDeviceUnblock", category: "Devices", type: "set", desc: "Unblock a device by MAC", readonly: false },
  "GetDeviceFlowInfo": { name: "GetDeviceFlowInfo", category: "Devices", type: "get", desc: "Per-device traffic flow info", readonly: true },
  "SetDeviceName": { name: "SetDeviceName", category: "Devices", type: "set", desc: "Rename a device", readonly: false },
  "GetMacAccessInfo": { name: "GetMacAccessInfo", category: "Devices", type: "get", desc: "MAC access control info", readonly: true },
  "SetMacAccessInfo": { name: "SetMacAccessInfo", category: "Devices", type: "set", desc: "Configure MAC access control", readonly: false },
  "SetDevicePowerOff": { name: "SetDevicePowerOff", category: "Devices", type: "set", desc: "Power off device", readonly: false },

  // Firewall/Security
  "GetFirewallStatusOfEx": { name: "GetFirewallStatusOfEx", category: "Firewall/Security", type: "get", desc: "Firewall status, ping, mode, level, SPI", readonly: true },
  "SetFirewallStatusOfEx": { name: "SetFirewallStatusOfEx", category: "Firewall/Security", type: "set", desc: "Configure firewall status", readonly: false },
  "GetfirewallLevel": { name: "GetfirewallLevel", category: "Firewall/Security", type: "get", desc: "Firewall level setting", readonly: true },
  "SetfirewallLevel": { name: "SetfirewallLevel", category: "Firewall/Security", type: "set", desc: "Set firewall level", readonly: false },
  "GetMacFilterSettings": { name: "GetMacFilterSettings", category: "Firewall/Security", type: "get", desc: "MAC filter policy and lists", readonly: true },
  "SetMacFilterSettings": { name: "SetMacFilterSettings", category: "Firewall/Security", type: "set", desc: "Configure MAC filtering", readonly: false },
  "SetIPFilter": { name: "SetIPFilter", category: "Firewall/Security", type: "set", desc: "Configure IP filtering", readonly: false },
  "SetUrlFilterSettings": { name: "SetUrlFilterSettings", category: "Firewall/Security", type: "set", desc: "Configure URL filtering", readonly: false },
  "GetAntiDoSattack": { name: "GetAntiDoSattack", category: "Firewall/Security", type: "get", desc: "Anti-DoS attack settings", readonly: true },
  "SetAntiDoSattack": { name: "SetAntiDoSattack", category: "Firewall/Security", type: "set", desc: "Configure anti-DoS protection", readonly: false },
  "GetALGSettings": { name: "GetALGSettings", category: "Firewall/Security", type: "get", desc: "ALG (FTP, H323, SIP) settings", readonly: true },
  "SetALGSettings": { name: "SetALGSettings", category: "Firewall/Security", type: "set", desc: "Configure ALG settings", readonly: false },
  "GetStealthModeSetting": { name: "GetStealthModeSetting", category: "Firewall/Security", type: "get", desc: "Stealth mode setting", readonly: true },
  "SetStealthModeSetting": { name: "SetStealthModeSetting", category: "Firewall/Security", type: "set", desc: "Configure stealth mode", readonly: false },
  "GetAttackAccessTrend": { name: "GetAttackAccessTrend", category: "Firewall/Security", type: "get", desc: "Attack access trend data", readonly: true },
  "GetAttackServiceDistributionData": { name: "GetAttackServiceDistributionData", category: "Firewall/Security", type: "get", desc: "Attack distribution by service", readonly: true },
  "GetAttackSourceSettings": { name: "GetAttackSourceSettings", category: "Firewall/Security", type: "get", desc: "Attack source settings", readonly: true },
  "SetAttackSourceSettings": { name: "SetAttackSourceSettings", category: "Firewall/Security", type: "set", desc: "Configure attack source settings", readonly: false },
  "GetAccessInterceptInfo": { name: "GetAccessInterceptInfo", category: "Firewall/Security", type: "get", desc: "Access intercept info", readonly: true },
  "GetProtectedAreaSettings": { name: "GetProtectedAreaSettings", category: "Firewall/Security", type: "get", desc: "Protected area settings", readonly: true },
  "SetProtectedAreaSettings": { name: "SetProtectedAreaSettings", category: "Firewall/Security", type: "set", desc: "Configure protected area", readonly: false },
  "GetUnderageProtection": { name: "GetUnderageProtection", category: "Firewall/Security", type: "get", desc: "Underage protection settings", readonly: true },
  "SetUnderageProtection": { name: "SetUnderageProtection", category: "Firewall/Security", type: "set", desc: "Configure underage protection", readonly: false },
  "GetRemoteAccess": { name: "GetRemoteAccess", category: "Firewall/Security", type: "get", desc: "Remote access settings", readonly: true },
  "SetRemoteAccess": { name: "SetRemoteAccess", category: "Firewall/Security", type: "set", desc: "Configure remote access", readonly: false },
  "GetIPV6InternetSetting": { name: "GetIPV6InternetSetting", category: "Firewall/Security", type: "get", desc: "IPv6 internet settings", readonly: true },
  "SetIPV6InternetSetting": { name: "SetIPV6InternetSetting", category: "Firewall/Security", type: "set", desc: "Configure IPv6 internet", readonly: false },
  "GetIpv6FirewallSettings": { name: "GetIpv6FirewallSettings", category: "Firewall/Security", type: "get", desc: "IPv6 firewall settings", readonly: true },
  "SetIpv6FirewallSettings": { name: "SetIpv6FirewallSettings", category: "Firewall/Security", type: "set", desc: "Configure IPv6 firewall", readonly: false },

  // PortForwarding
  "GetPortTriggering": { name: "GetPortTriggering", category: "PortForwarding", type: "get", desc: "Port triggering rules", readonly: true },
  "SetPortTriggering": { name: "SetPortTriggering", category: "PortForwarding", type: "set", desc: "Configure port triggering", readonly: false },
  "SetPortFwding": { name: "SetPortFwding", category: "PortForwarding", type: "set", desc: "Configure port forwarding rules", readonly: false },

  // VPN
  "GetVpnInfo": { name: "GetVpnInfo", category: "VPN", type: "get", desc: "VPN connection status, IPs", readonly: true },
  "GetVpnSettings": { name: "GetVpnSettings", category: "VPN", type: "get", desc: "VPN settings (protocol, server, credentials)", readonly: true },
  "SetVpnSettings": { name: "SetVpnSettings", category: "VPN", type: "set", desc: "Configure VPN", readonly: false },
  "GetVPNPassthrough": { name: "GetVPNPassthrough", category: "VPN", type: "get", desc: "VPN passthrough (IPsec, PPTP, L2TP, SSL)", readonly: true },
  "SetVPNPassthrough": { name: "SetVPNPassthrough", category: "VPN", type: "set", desc: "Configure VPN passthrough", readonly: false },

  // QoS
  "GetQosSettings": { name: "GetQosSettings", category: "QoS", type: "get", desc: "QoS settings and bandwidth limits", readonly: true },
  "SetQosSettings": { name: "SetQosSettings", category: "QoS", type: "set", desc: "Configure QoS", readonly: false },
  "GetQosAppList": { name: "GetQosAppList", category: "QoS", type: "get", desc: "QoS app list", readonly: true },
  "GetAIQosSettings": { name: "GetAIQosSettings", category: "QoS", type: "get", desc: "AI QoS settings", readonly: true },
  "SetAIQosSettings": { name: "SetAIQosSettings", category: "QoS", type: "set", desc: "Configure AI QoS", readonly: false },
  "GetAIQosLevel": { name: "GetAIQosLevel", category: "QoS", type: "get", desc: "AI QoS level", readonly: true },
  "SetAIQosLevel": { name: "SetAIQosLevel", category: "QoS", type: "set", desc: "Set AI QoS level", readonly: false },
  "GetAIQosDatastreamInfo": { name: "GetAIQosDatastreamInfo", category: "QoS", type: "get", desc: "AI QoS datastream info", readonly: true },
  "GetAIQosGamingPingLatency": { name: "GetAIQosGamingPingLatency", category: "QoS", type: "get", desc: "AI QoS gaming ping latency", readonly: true },
  "GetAIQosPingStatus": { name: "GetAIQosPingStatus", category: "QoS", type: "get", desc: "AI QoS ping status", readonly: true },
  "GetAIQosOptimization": { name: "GetAIQosOptimization", category: "QoS", type: "get", desc: "AI QoS optimization", readonly: true },
  "GetTrafficControlInfo": { name: "GetTrafficControlInfo", category: "QoS", type: "get", desc: "Traffic control info", readonly: true },

  // SMS
  "GetSMSContactList": { name: "GetSMSContactList", category: "SMS", type: "get", desc: "SMS contact list", readonly: true },
  "GetSMSContentList": { name: "GetSMSContentList", category: "SMS", type: "get", desc: "SMS content by contact", readonly: true },
  "GetSMSListByContactNum": { name: "GetSMSListByContactNum", category: "SMS", type: "get", desc: "SMS list by contact number", readonly: true },
  "GetSingleSMS": { name: "GetSingleSMS", category: "SMS", type: "get", desc: "Single SMS message", readonly: true },
  "GetSMSSettings": { name: "GetSMSSettings", category: "SMS", type: "get", desc: "SMS center, storage, report settings", readonly: true },
  "SetSMSSettings": { name: "SetSMSSettings", category: "SMS", type: "set", desc: "Configure SMS settings", readonly: false },
  "GetSMSStorageState": { name: "GetSMSStorageState", category: "SMS", type: "get", desc: "SMS storage usage and unread count", readonly: true },
  "GetNewSMSFlag": { name: "GetNewSMSFlag", category: "SMS", type: "get", desc: "New SMS flag", readonly: true },
  "SetNewSMSFlag": { name: "SetNewSMSFlag", category: "SMS", type: "set", desc: "Set new SMS flag", readonly: false },
  "GetNewMessage": { name: "GetNewMessage", category: "SMS", type: "get", desc: "Get newest SMS message", readonly: true },
  "GetSendSMSResult": { name: "GetSendSMSResult", category: "SMS", type: "get", desc: "SMS send result", readonly: true },
  "SendSMS": { name: "SendSMS", category: "SMS", type: "action", desc: "Send an SMS message", readonly: false },
  "SaveSMS": { name: "SaveSMS", category: "SMS", type: "action", desc: "Save SMS to device", readonly: false },
  "DeleteSMS": { name: "DeleteSMS", category: "SMS", type: "action", desc: "Delete SMS message(s)", readonly: false },
  "ImportSmsToDevice": { name: "ImportSmsToDevice", category: "SMS", type: "action", desc: "Import SMS to device", readonly: false },

  // USSD
  "SendUSSD": { name: "SendUSSD", category: "USSD", type: "action", desc: "Send USSD code", readonly: false },
  "SetUSSDEnd": { name: "SetUSSDEnd", category: "USSD", type: "set", desc: "End USSD session", readonly: false },
  "GetUSSDSendResult": { name: "GetUSSDSendResult", category: "USSD", type: "get", desc: "USSD send result and content", readonly: true },

  // VoIP/Calling
  "GetVoipConnInfo": { name: "GetVoipConnInfo", category: "VoIP/Calling", type: "get", desc: "VoIP connection info", readonly: true },
  "GetSIPAccountSettings": { name: "GetSIPAccountSettings", category: "VoIP/Calling", type: "get", desc: "SIP account settings", readonly: true },
  "SetSIPAccountSettings": { name: "SetSIPAccountSettings", category: "VoIP/Calling", type: "set", desc: "Configure SIP account", readonly: false },
  "DeleteSIPAccountSettings": { name: "DeleteSIPAccountSettings", category: "VoIP/Calling", type: "action", desc: "Delete SIP account", readonly: false },
  "GetSIPServerSettings": { name: "GetSIPServerSettings", category: "VoIP/Calling", type: "get", desc: "SIP server settings", readonly: true },
  "SetSIPServerSettings": { name: "SetSIPServerSettings", category: "VoIP/Calling", type: "set", desc: "Configure SIP server", readonly: false },
  "GetCallSettings": { name: "GetCallSettings", category: "VoIP/Calling", type: "get", desc: "Call settings", readonly: true },
  "SetCallSettings": { name: "SetCallSettings", category: "VoIP/Calling", type: "set", desc: "Configure call settings", readonly: false },
  "GetCallFoward": { name: "GetCallFoward", category: "VoIP/Calling", type: "get", desc: "Call forwarding settings", readonly: true },
  "SetCallFoward": { name: "SetCallFoward", category: "VoIP/Calling", type: "set", desc: "Configure call forwarding", readonly: false },
  "GetCallWait": { name: "GetCallWait", category: "VoIP/Calling", type: "get", desc: "Call waiting settings", readonly: true },
  "SetCallWait": { name: "SetCallWait", category: "VoIP/Calling", type: "set", desc: "Configure call waiting", readonly: false },
  "GetCallLogList": { name: "GetCallLogList", category: "VoIP/Calling", type: "get", desc: "Call log entries", readonly: true },
  "GetCallLogCountInfo": { name: "GetCallLogCountInfo", category: "VoIP/Calling", type: "get", desc: "Call log counts", readonly: true },
  "ClearCallLog": { name: "ClearCallLog", category: "VoIP/Calling", type: "action", desc: "Clear call log", readonly: false },
  "DeleteCallLog": { name: "DeleteCallLog", category: "VoIP/Calling", type: "action", desc: "Delete call log entry", readonly: false },
  "GetVoicemail": { name: "GetVoicemail", category: "VoIP/Calling", type: "get", desc: "Voicemail settings", readonly: true },
  "SetVoicemail": { name: "SetVoicemail", category: "VoIP/Calling", type: "set", desc: "Configure voicemail", readonly: false },
  "GetVoiceCallingStatus": { name: "GetVoiceCallingStatus", category: "VoIP/Calling", type: "get", desc: "Voice call status", readonly: true },
  "SetVoiceCallingStatus": { name: "SetVoiceCallingStatus", category: "VoIP/Calling", type: "set", desc: "Set voice call status", readonly: false },
  "GetVolteCallingStatus": { name: "GetVolteCallingStatus", category: "VoIP/Calling", type: "get", desc: "VoLTE call status", readonly: true },
  "SetVolteCallingStatus": { name: "SetVolteCallingStatus", category: "VoIP/Calling", type: "set", desc: "Set VoLTE call status", readonly: false },
  "GetRj11Type": { name: "GetRj11Type", category: "VoIP/Calling", type: "get", desc: "RJ11 port type", readonly: true },

  // Profiles
  "GetProfileList": { name: "GetProfileList", category: "Profiles", type: "get", desc: "APN profile list", readonly: true },
  "AddNewProfile": { name: "AddNewProfile", category: "Profiles", type: "set", desc: "Add new APN profile", readonly: false },
  "EditProfile": { name: "EditProfile", category: "Profiles", type: "set", desc: "Edit APN profile", readonly: false },
  "DeleteProfile": { name: "DeleteProfile", category: "Profiles", type: "set", desc: "Delete APN profile", readonly: false },
  "SetDefaultProfile": { name: "SetDefaultProfile", category: "Profiles", type: "set", desc: "Set default APN profile", readonly: false },
  "GetMultiProfile": { name: "GetMultiProfile", category: "Profiles", type: "get", desc: "Multi-profile settings", readonly: true },
  "SetMultiProfile": { name: "SetMultiProfile", category: "Profiles", type: "set", desc: "Configure multi-profile", readonly: false },
  "GetMultiProfileWebShowFlag": { name: "GetMultiProfileWebShowFlag", category: "Profiles", type: "get", desc: "Multi-profile web show flag", readonly: true },

  // SIM/PIN
  "UnlockPin": { name: "UnlockPin", category: "SIM/PIN", type: "action", desc: "Unlock SIM with PIN", readonly: false },
  "UnlockPuk": { name: "UnlockPuk", category: "SIM/PIN", type: "action", desc: "Unlock SIM with PUK", readonly: false },
  "UnlockSimlock": { name: "UnlockSimlock", category: "SIM/PIN", type: "action", desc: "Unlock SIM lock", readonly: false },
  "ChangePinCode": { name: "ChangePinCode", category: "SIM/PIN", type: "set", desc: "Change PIN code", readonly: false },
  "ChangePinState": { name: "ChangePinState", category: "SIM/PIN", type: "set", desc: "Enable/disable PIN", readonly: false },
  "GetAutoValidatePinState": { name: "GetAutoValidatePinState", category: "SIM/PIN", type: "get", desc: "Auto PIN validation state", readonly: true },
  "SetAutoValidatePinState": { name: "SetAutoValidatePinState", category: "SIM/PIN", type: "set", desc: "Configure auto PIN validation", readonly: false },

  // Parental Control
  "GetParentalSettings": { name: "GetParentalSettings", category: "Parental Control", type: "get", desc: "Parental control policy and rules", readonly: true },
  "SetParentalSettings": { name: "SetParentalSettings", category: "Parental Control", type: "set", desc: "Configure parental controls", readonly: false },

  // Power/Eco
  "GetPowerSave": { name: "GetPowerSave", category: "Power/Eco", type: "get", desc: "Power save mode settings", readonly: true },
  "SetPowerSave": { name: "SetPowerSave", category: "Power/Eco", type: "set", desc: "Configure power save mode", readonly: false },
  "GetStandbyModeSetting": { name: "GetStandbyModeSetting", category: "Power/Eco", type: "get", desc: "Standby mode settings", readonly: true },
  "SetStandbyModeSetting": { name: "SetStandbyModeSetting", category: "Power/Eco", type: "set", desc: "Configure standby mode", readonly: false },
  "GetEcoModeSetting": { name: "GetEcoModeSetting", category: "Power/Eco", type: "get", desc: "Eco mode settings", readonly: true },
  "SetEcoModeSetting": { name: "SetEcoModeSetting", category: "Power/Eco", type: "set", desc: "Configure eco mode", readonly: false },
  "GetAiEcoStatusSetting": { name: "GetAiEcoStatusSetting", category: "Power/Eco", type: "get", desc: "AI eco status", readonly: true },
  "SetAiEcoStatusSetting": { name: "SetAiEcoStatusSetting", category: "Power/Eco", type: "set", desc: "Configure AI eco", readonly: false },
  "GetAiEcoPowerConsumptionList": { name: "GetAiEcoPowerConsumptionList", category: "Power/Eco", type: "get", desc: "AI eco power consumption history", readonly: true },
  "GetUniversalCharge": { name: "GetUniversalCharge", category: "Power/Eco", type: "get", desc: "Universal charging settings", readonly: true },
  "SetUniversalCharge": { name: "SetUniversalCharge", category: "Power/Eco", type: "set", desc: "Configure universal charging", readonly: false },
  "GetExtendTimes": { name: "GetExtendTimes", category: "Power/Eco", type: "get", desc: "Extended times", readonly: true },
  "SetExtendTimes": { name: "SetExtendTimes", category: "Power/Eco", type: "set", desc: "Set extended times", readonly: false },

  // LED/Indicator
  "GetLedCtrl": { name: "GetLedCtrl", category: "LED/Indicator", type: "get", desc: "LED control state", readonly: true },
  "SetLedCtrl": { name: "SetLedCtrl", category: "LED/Indicator", type: "set", desc: "Configure LED control", readonly: false },
  "GetIndicatorSetting": { name: "GetIndicatorSetting", category: "LED/Indicator", type: "get", desc: "Indicator light schedule", readonly: true },
  "SetIndicatorSetting": { name: "SetIndicatorSetting", category: "LED/Indicator", type: "set", desc: "Configure indicator light", readonly: false },

  // Bluetooth
  "GetBluetoothStatus": { name: "GetBluetoothStatus", category: "Bluetooth", type: "get", desc: "Bluetooth status", readonly: true },
  "SetBluetoothStatus": { name: "SetBluetoothStatus", category: "Bluetooth", type: "set", desc: "Toggle Bluetooth", readonly: false },

  // GPS
  "GetGPSSettings": { name: "GetGPSSettings", category: "GPS", type: "get", desc: "GPS settings", readonly: true },
  "SetGPSSettings": { name: "SetGPSSettings", category: "GPS", type: "set", desc: "Configure GPS", readonly: false },

  // Mesh/EasyMesh
  "GetEasymeshSwitch": { name: "GetEasymeshSwitch", category: "Mesh/EasyMesh", type: "get", desc: "EasyMesh switch and operation mode", readonly: true },
  "SetEasymeshSwitch": { name: "SetEasymeshSwitch", category: "Mesh/EasyMesh", type: "set", desc: "Toggle EasyMesh", readonly: false },
  "GetEasyMeshNodeInfo": { name: "GetEasyMeshNodeInfo", category: "Mesh/EasyMesh", type: "get", desc: "EasyMesh node list", readonly: true },
  "GetMeshDeviceInfo": { name: "GetMeshDeviceInfo", category: "Mesh/EasyMesh", type: "get", desc: "Mesh device info", readonly: true },
  "GetEasymeshConfigState": { name: "GetEasymeshConfigState", category: "Mesh/EasyMesh", type: "get", desc: "Mesh config state", readonly: true },
  "GetEasymeshDenyAgent": { name: "GetEasymeshDenyAgent", category: "Mesh/EasyMesh", type: "get", desc: "Denied mesh agents", readonly: true },
  "SetEasymeshDenyAgent": { name: "SetEasymeshDenyAgent", category: "Mesh/EasyMesh", type: "set", desc: "Deny a mesh agent", readonly: false },
  "SetEasymeshAllowAgent": { name: "SetEasymeshAllowAgent", category: "Mesh/EasyMesh", type: "set", desc: "Allow a mesh agent", readonly: false },
  "SetEasymeshNodeAlias": { name: "SetEasymeshNodeAlias", category: "Mesh/EasyMesh", type: "set", desc: "Set mesh node alias", readonly: false },
  "GetAddNodeStatus": { name: "GetAddNodeStatus", category: "Mesh/EasyMesh", type: "get", desc: "Mesh node add status", readonly: true },
  "AddEasymeshNode": { name: "AddEasymeshNode", category: "Mesh/EasyMesh", type: "set", desc: "Add EasyMesh node", readonly: false },
  "GetActivePicopoint": { name: "GetActivePicopoint", category: "Mesh/EasyMesh", type: "get", desc: "Active picopoint", readonly: true },
  "SetActivePicopoint": { name: "SetActivePicopoint", category: "Mesh/EasyMesh", type: "set", desc: "Set active picopoint", readonly: false },

  // Routing
  "GetStaticRouting": { name: "GetStaticRouting", category: "Routing", type: "get", desc: "Static routing rules", readonly: true },
  "SetStaticRouting": { name: "SetStaticRouting", category: "Routing", type: "set", desc: "Configure static routes", readonly: false },
  "GetDynamicRouting": { name: "GetDynamicRouting", category: "Routing", type: "get", desc: "Dynamic routing settings", readonly: true },
  "SetDynamicRouting": { name: "SetDynamicRouting", category: "Routing", type: "set", desc: "Configure dynamic routing", readonly: false },

  // Diagnostics
  "GetPingTraceroute": { name: "GetPingTraceroute", category: "Diagnostics", type: "get", desc: "Ping/traceroute settings", readonly: true },
  "SetPingTraceroute": { name: "SetPingTraceroute", category: "Diagnostics", type: "set", desc: "Configure ping/traceroute", readonly: false },
  "GetPingTracerouteData": { name: "GetPingTracerouteData", category: "Diagnostics", type: "get", desc: "Ping/traceroute results", readonly: true },
  "SetDetect": { name: "SetDetect", category: "Diagnostics", type: "set", desc: "Start detection", readonly: false },
  "SetDetectData": { name: "SetDetectData", category: "Diagnostics", type: "set", desc: "Set detection data", readonly: false },
  "GetDetectResult": { name: "GetDetectResult", category: "Diagnostics", type: "get", desc: "Detection results", readonly: true },

  // DDNS
  "GetDdnsSettings": { name: "GetDdnsSettings", category: "DDNS", type: "get", desc: "DDNS settings", readonly: true },
  "SetDdnsSettings": { name: "SetDdnsSettings", category: "DDNS", type: "set", desc: "Configure DDNS", readonly: false },

  // UPnP
  "GetUpnpSettings": { name: "GetUpnpSettings", category: "UPnP", type: "get", desc: "UPnP switch state", readonly: true },
  "SetUpnpSettings": { name: "SetUpnpSettings", category: "UPnP", type: "set", desc: "Toggle UPnP", readonly: false },

  // Data Usage
  "GetActiveData": { name: "GetActiveData", category: "Data Usage", type: "get", desc: "Active data connection info", readonly: true },
  "SetActiveData": { name: "SetActiveData", category: "Data Usage", type: "set", desc: "Set active data", readonly: false },
  "GetCurrentData": { name: "GetCurrentData", category: "Data Usage", type: "get", desc: "Current data usage", readonly: true },
  "GetUsageRecord": { name: "GetUsageRecord", category: "Data Usage", type: "get", desc: "Usage records and connection times", readonly: true },
  "GetUsageSettings": { name: "GetUsageSettings", category: "Data Usage", type: "get", desc: "Billing day, monthly plan, used data", readonly: true },
  "SetUsageSettings": { name: "SetUsageSettings", category: "Data Usage", type: "set", desc: "Configure data usage settings", readonly: false },
  "GetM2M": { name: "GetM2M", category: "Data Usage", type: "get", desc: "M2M data", readonly: true },
  "SetM2M": { name: "SetM2M", category: "Data Usage", type: "set", desc: "Configure M2M", readonly: false },

  // Privacy
  "GetPrivacySettings": { name: "GetPrivacySettings", category: "Privacy", type: "get", desc: "Privacy flag", readonly: true },
  "SetPrivacySettings": { name: "SetPrivacySettings", category: "Privacy", type: "set", desc: "Configure privacy", readonly: false },
  "GetQuickSetupprivacyPolicy": { name: "GetQuickSetupprivacyPolicy", category: "Privacy", type: "get", desc: "Quick setup privacy policy", readonly: true },
  "SetQuickSetupprivacyPolicy": { name: "SetQuickSetupprivacyPolicy", category: "Privacy", type: "set", desc: "Set quick setup privacy", readonly: false },

  // QuickSetup
  "GetQuickSetup": { name: "GetQuickSetup", category: "QuickSetup", type: "get", desc: "Quick setup state", readonly: true },
  "SetQuickSetup": { name: "SetQuickSetup", category: "QuickSetup", type: "set", desc: "Run quick setup", readonly: false },

  // Bridge Mode
  "GetBridgeModeSettings": { name: "GetBridgeModeSettings", category: "Bridge Mode", type: "get", desc: "Bridge mode switch", readonly: true },
  "SetBridgeModeSettings": { name: "SetBridgeModeSettings", category: "Bridge Mode", type: "set", desc: "Configure bridge mode", readonly: false },

  // Local Settings
  "GetLocalSettings": { name: "GetLocalSettings", category: "Local Settings", type: "get", desc: "Local settings", readonly: true },
  "SetLocalSettings": { name: "SetLocalSettings", category: "Local Settings", type: "set", desc: "Configure local settings", readonly: false },

  // Client Config
  "GetClientConfiguration": { name: "GetClientConfiguration", category: "Client Config", type: "get", desc: "TR-069 client config (ACS URL, interval)", readonly: true },
  "SetClientConfiguration": { name: "SetClientConfiguration", category: "Client Config", type: "set", desc: "Configure TR-069 client", readonly: false },

  // Schedule
  "GetScheduleSetting": { name: "GetScheduleSetting", category: "Schedule", type: "get", desc: "Reboot/wifi schedule", readonly: true },
  "SetScheduleSetting": { name: "SetScheduleSetting", category: "Schedule", type: "set", desc: "Configure schedules", readonly: false },

  // Protocol Server
  "GetProtocolServeList": { name: "GetProtocolServeList", category: "Protocol Server", type: "get", desc: "Protocol server list", readonly: true },
  "AddProtocolServe": { name: "AddProtocolServe", category: "Protocol Server", type: "set", desc: "Add protocol server", readonly: false },
  "EditProtocolServe": { name: "EditProtocolServe", category: "Protocol Server", type: "set", desc: "Edit protocol server", readonly: false },
  "DelProtocolServe": { name: "DelProtocolServe", category: "Protocol Server", type: "set", desc: "Delete protocol server", readonly: false },

  // East-West Flow
  "GetEastWestFlowSettings": { name: "GetEastWestFlowSettings", category: "East-West Flow", type: "get", desc: "East-west flow settings", readonly: true },
  "SetEastWestFlowSettings": { name: "SetEastWestFlowSettings", category: "East-West Flow", type: "set", desc: "Configure east-west flow", readonly: false },
  "GetEastWestFlowStatus": { name: "GetEastWestFlowStatus", category: "East-West Flow", type: "get", desc: "East-west flow status", readonly: true },
  "SetEastWestFlowStatus": { name: "SetEastWestFlowStatus", category: "East-West Flow", type: "set", desc: "Set east-west flow status", readonly: false },

  // USB
  "GetUSBTetheringStatus": { name: "GetUSBTetheringStatus", category: "USB", type: "get", desc: "USB tethering status", readonly: true },
  "SetUSBTetheringStatus": { name: "SetUSBTetheringStatus", category: "USB", type: "set", desc: "Toggle USB tethering", readonly: false },

  // Position
  "GetPosEnableMode": { name: "GetPosEnableMode", category: "Position", type: "get", desc: "Position enable mode", readonly: true },
  "SetPosEnableMode": { name: "SetPosEnableMode", category: "Position", type: "set", desc: "Configure position mode", readonly: false },

  // IMS
  "GetImsInfo": { name: "GetImsInfo", category: "IMS", type: "get", desc: "IMS info", readonly: true },

  // Diagnostics/QXDM
  "OpenQxdm": { name: "OpenQxdm", category: "Diagnostics/QXDM", type: "action", desc: "Open QXDM diagnostic mode", readonly: false },
  "CloseQxdm": { name: "CloseQxdm", category: "Diagnostics/QXDM", type: "action", desc: "Close QXDM diagnostic mode", readonly: false },
  "GetApLogState": { name: "GetApLogState", category: "Diagnostics/QXDM", type: "get", desc: "AP log state", readonly: true },
  "SetApLogState": { name: "SetApLogState", category: "Diagnostics/QXDM", type: "set", desc: "Configure AP log", readonly: false },

  // Service Visit
  "GetServiceVisitLogs": { name: "GetServiceVisitLogs", category: "Service Visit", type: "get", desc: "Service visit logs", readonly: true },
  "GetServiceVisitSettings": { name: "GetServiceVisitSettings", category: "Service Visit", type: "get", desc: "Service visit settings", readonly: true },
  "SetServiceVisitSettings": { name: "SetServiceVisitSettings", category: "Service Visit", type: "set", desc: "Configure service visit", readonly: false },

  // Device Actions
  "SetDeviceReboot": { name: "SetDeviceReboot", category: "Device Actions", type: "set", desc: "Reboot the router", readonly: false },
  "SetDeviceReset": { name: "SetDeviceReset", category: "Device Actions", type: "set", desc: "Factory reset (dangerous!)", readonly: false },
  "SetDeviceBackup": { name: "SetDeviceBackup", category: "Device Actions", type: "set", desc: "Backup device configuration", readonly: false },
  "SignalClear": { name: "SignalClear", category: "Device Actions", type: "action", desc: "Clear signal", readonly: false },
  "SignalDelete": { name: "SignalDelete", category: "Device Actions", type: "action", desc: "Delete signal", readonly: false },
  "SetDeviceStartUpdate": { name: "SetDeviceStartUpdate", category: "Device Actions", type: "set", desc: "Start device firmware update", readonly: false },
  "SetDeviceUpdateStop": { name: "SetDeviceUpdateStop", category: "Device Actions", type: "set", desc: "Stop device firmware update", readonly: false },

  // Firmware Update
  "GetDeviceNewVersion": { name: "GetDeviceNewVersion", category: "Firmware Update", type: "get", desc: "Check for new firmware version", readonly: true },
  "GetDeviceUpgradeState": { name: "GetDeviceUpgradeState", category: "Firmware Update", type: "get", desc: "Firmware upgrade state", readonly: true },
  "GetFotaUpdateState": { name: "GetFotaUpdateState", category: "Firmware Update", type: "get", desc: "FOTA update state", readonly: true },
  "ResetFotaUpdateState": { name: "ResetFotaUpdateState", category: "Firmware Update", type: "action", desc: "Reset FOTA state", readonly: false },
  "SetFOTAStartDownload": { name: "SetFOTAStartDownload", category: "Firmware Update", type: "set", desc: "Start FOTA download", readonly: false },
  "SetCheckNewVersion": { name: "SetCheckNewVersion", category: "Firmware Update", type: "set", desc: "Check for new version", readonly: false },
  "GetAutoUpdateFlag": { name: "GetAutoUpdateFlag", category: "Firmware Update", type: "get", desc: "Auto-update flag and time range", readonly: true },
  "SetAutoUpdateFlag": { name: "SetAutoUpdateFlag", category: "Firmware Update", type: "set", desc: "Configure auto-update", readonly: false },
  "GetFOTABatteryState": { name: "GetFOTABatteryState", category: "Firmware Update", type: "get", desc: "FOTA battery state", readonly: true },


  // Lower-case methods the web UI calls directly (filters, port forwarding,
  // profiles, SMS internals). Extracted from the router bundle's post() sites.
  "getIPFilterList": { name: "getIPFilterList", category: "Firewall/Security", type: "get", desc: "List IP filter rules", readonly: true },
  "addIPFilter": { name: "addIPFilter", category: "Firewall/Security", type: "set", desc: "Add an IP filter rule", readonly: false },
  "editIPFilter": { name: "editIPFilter", category: "Firewall/Security", type: "set", desc: "Edit an IP filter rule", readonly: false },
  "deleteIPFilter": { name: "deleteIPFilter", category: "Firewall/Security", type: "set", desc: "Delete an IP filter rule", readonly: false },
  "getUrlFilterSettings": { name: "getUrlFilterSettings", category: "Firewall/Security", type: "get", desc: "URL filter / parental control rules", readonly: true },
  "getFirewallSwitch": { name: "getFirewallSwitch", category: "Firewall/Security", type: "get", desc: "Firewall master switch state", readonly: true },
  "setFirewallSwitch": { name: "setFirewallSwitch", category: "Firewall/Security", type: "set", desc: "Toggle the firewall master switch", readonly: false },
  "getDMZInfo": { name: "getDMZInfo", category: "Firewall/Security", type: "get", desc: "DMZ host configuration", readonly: true },
  "setDMZInfo": { name: "setDMZInfo", category: "Firewall/Security", type: "set", desc: "Configure the DMZ host", readonly: false },
  "getPortFwding": { name: "getPortFwding", category: "PortForwarding", type: "get", desc: "List port forwarding rules", readonly: true },
  "addPortFwding": { name: "addPortFwding", category: "PortForwarding", type: "set", desc: "Add a port forwarding rule", readonly: false },
  "editPortFwding": { name: "editPortFwding", category: "PortForwarding", type: "set", desc: "Edit a port forwarding rule", readonly: false },
  "deletePortFwding": { name: "deletePortFwding", category: "PortForwarding", type: "set", desc: "Delete a port forwarding rule", readonly: false },
  "getCurrentProfile": { name: "getCurrentProfile", category: "Profiles", type: "get", desc: "Currently active APN profile", readonly: true },
  "setCurrentProfile": { name: "setCurrentProfile", category: "Profiles", type: "set", desc: "Switch the active APN profile", readonly: false },
  "getSmsInitState": { name: "getSmsInitState", category: "SMS", type: "get", desc: "SMS subsystem initialisation state", readonly: true },
  "getSMSStateByLocation": { name: "getSMSStateByLocation", category: "SMS", type: "get", desc: "SMS state for a storage location", readonly: true },
  "getSMSAutoRedirectSetting": { name: "getSMSAutoRedirectSetting", category: "SMS", type: "get", desc: "SMS auto-redirect settings", readonly: true },
  "setSMSAutoRedirectSetting": { name: "setSMSAutoRedirectSetting", category: "SMS", type: "set", desc: "Configure SMS auto-redirect", readonly: false },
  "getTotalConnection": { name: "getTotalConnection", category: "Devices", type: "get", desc: "Total active connection count", readonly: true },
  "uploadBackupSettings": { name: "uploadBackupSettings", category: "Device Actions", type: "action", desc: "Upload and restore a settings backup", readonly: false },
};

export const ALL_ENDPOINTS: readonly string[] = Object.keys(CATALOG);
export const ENDPOINT_COUNT = ALL_ENDPOINTS.length;

export function getEndpoint(name: string): EndpointInfo | undefined {
  return CATALOG[name];
}

export function endpointsByCategory(): Record<string, EndpointInfo[]> {
  const cats: Record<string, EndpointInfo[]> = {};
  for (const ep of Object.values(CATALOG)) {
    if (!cats[ep.category]) cats[ep.category] = [];
    cats[ep.category].push(ep);
  }
  return cats;
}

export function searchEndpoints(query: string): EndpointInfo[] {
  const q = query.toLowerCase();
  return Object.values(CATALOG).filter(e =>
    e.name.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
  );
}
