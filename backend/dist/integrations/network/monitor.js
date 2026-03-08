/**
 * Network Monitoring Integration
 *
 * Aggregates data from open-source network monitoring tools:
 *  - Zeek (network traffic analysis)
 *  - Suricata (IDS/IPS alerts)
 *  - ntopng (real-time traffic stats via REST API)
 *  - Zabbix (infrastructure monitoring via API)
 *
 * All run as local services accessible on localhost in the Docker Compose stack.
 */
import axios from "axios";
// ── ntopng REST API ─────────────────────────────────────────────────────────
const NTOPNG_BASE = process.env.NTOPNG_URL ?? "http://localhost:3000";
const NTOPNG_USER = process.env.NTOPNG_USER ?? "admin";
const NTOPNG_PASS = process.env.NTOPNG_PASS ?? "admin";
async function ntopngAuth() {
    const { data } = await axios.post(`${NTOPNG_BASE}/lua/rest/v2/login.lua`, new URLSearchParams({ username: NTOPNG_USER, password: NTOPNG_PASS }), { timeout: 8_000 });
    return data?.rsp?.session_id ?? "";
}
export async function getTopFlows(ifaceId = 0, limit = 50) {
    try {
        const session = await ntopngAuth();
        const { data } = await axios.get(`${NTOPNG_BASE}/lua/rest/v2/get/flow/list.lua`, {
            params: { ifid: ifaceId, currentPage: 1, perPage: limit },
            headers: { Cookie: `session=${session}` },
            timeout: 10_000,
        });
        return (data?.rsp?.flows ?? []).map((f) => ({
            client_ip: f["cli.ip"],
            server_ip: f["srv.ip"],
            client_port: f["cli.port"],
            server_port: f["srv.port"],
            protocol: f["proto.l4"],
            bytes_sent: f["bytes.sent"],
            bytes_rcvd: f["bytes.rcvd"],
            duration_ms: f["duration"] * 1000,
            first_seen: new Date(f["seen.first"] * 1000).toISOString(),
            last_seen: new Date(f["seen.last"] * 1000).toISOString(),
            score: f["score"] ?? 0,
        }));
    }
    catch {
        return [];
    }
}
export async function getInterfaces() {
    try {
        const session = await ntopngAuth();
        const { data } = await axios.get(`${NTOPNG_BASE}/lua/rest/v2/get/interface/list.lua`, {
            headers: { Cookie: `session=${session}` },
            timeout: 8_000,
        });
        return (data?.rsp ?? []).map((i) => ({
            id: i.id,
            name: i.ifname,
            speed: i.speed,
            packets: i.stats?.packets ?? 0,
            bytes: i.stats?.bytes ?? 0,
            drops: i.stats?.drops ?? 0,
        }));
    }
    catch {
        return [];
    }
}
// ── Suricata EVE JSON log parsing ───────────────────────────────────────────
import { createReadStream } from "fs";
import { createInterface } from "readline";
const SURICATA_EVE = process.env.SURICATA_EVE_LOG ?? "/var/log/suricata/eve.json";
export async function getRecentSuricataAlerts(maxLines = 200) {
    const alerts = [];
    try {
        const rl = createInterface({ input: createReadStream(SURICATA_EVE, { encoding: "utf8" }) });
        for await (const line of rl) {
            try {
                const evt = JSON.parse(line);
                if (evt.event_type === "alert") {
                    alerts.push({
                        timestamp: evt.timestamp,
                        src_ip: evt.src_ip,
                        src_port: evt.src_port,
                        dest_ip: evt.dest_ip,
                        dest_port: evt.dest_port,
                        proto: evt.proto,
                        alert: evt.alert,
                        flow_id: evt.flow_id,
                    });
                }
            }
            catch { /* skip malformed lines */ }
            if (alerts.length >= maxLines)
                break;
        }
    }
    catch { /* file may not exist in dev */ }
    return alerts.slice(-maxLines);
}
// ── Zabbix API ───────────────────────────────────────────────────────────────
const ZABBIX_URL = process.env.ZABBIX_URL ?? "http://localhost:8080/api_jsonrpc.php";
const ZABBIX_TOKEN = process.env.ZABBIX_API_TOKEN ?? "";
let _zabbixToken = ZABBIX_TOKEN;
async function zabbixLogin() {
    if (_zabbixToken)
        return _zabbixToken;
    const { data } = await axios.post(ZABBIX_URL, {
        jsonrpc: "2.0",
        method: "user.login",
        params: {
            username: process.env.ZABBIX_USER ?? "Admin",
            password: process.env.ZABBIX_PASS ?? "zabbix",
        },
        id: 1,
    }, { timeout: 8_000 });
    _zabbixToken = data.result;
    return _zabbixToken;
}
const ZABBIX_SEVERITY = {
    0: "not_classified", 1: "info", 2: "warning", 3: "average", 4: "high", 5: "disaster",
};
export async function getZabbixProblems(minSeverity = 2) {
    try {
        const token = await zabbixLogin();
        const { data } = await axios.post(ZABBIX_URL, {
            jsonrpc: "2.0",
            method: "problem.get",
            params: {
                output: "extend",
                selectHosts: ["host"],
                minseverity: minSeverity,
                recent: true,
                limit: 100,
            },
            auth: token,
            id: 2,
        }, { timeout: 10_000 });
        return (data.result ?? []).map((p) => ({
            event_id: p.eventid,
            host: (p.hosts[0])?.host ?? "unknown",
            name: p.name,
            severity: ZABBIX_SEVERITY[parseInt(p.severity)] ?? "not_classified",
            acknowledged: p.acknowledged === "1",
            clock: new Date(parseInt(p.clock) * 1000).toISOString(),
        }));
    }
    catch {
        return [];
    }
}
// ── Aggregated network posture ───────────────────────────────────────────────
export async function getNetworkPosture() {
    const [flows, ifaces, suricataAlerts, zabbixProblems] = await Promise.all([
        getTopFlows(0, 20),
        getInterfaces(),
        getRecentSuricataAlerts(50),
        getZabbixProblems(2),
    ]);
    const criticalAlerts = suricataAlerts.filter((a) => a.alert.severity <= 2);
    const highZabbix = zabbixProblems.filter((p) => p.severity === "high" || p.severity === "disaster");
    return {
        sampled_at: new Date().toISOString(),
        interfaces: ifaces,
        active_flows: flows.length,
        suspicious_flows: flows.filter((f) => f.score > 50).length,
        top_flows: flows.slice(0, 10),
        suricata: {
            total_alerts: suricataAlerts.length,
            critical: criticalAlerts.length,
            recent: suricataAlerts.slice(-10),
        },
        zabbix: {
            total_problems: zabbixProblems.length,
            high_disaster: highZabbix.length,
            recent: zabbixProblems.slice(0, 10),
        },
        posture_score: Math.max(0, 100 - criticalAlerts.length * 10 - highZabbix.length * 5 - flows.filter((f) => f.score > 80).length * 15),
    };
}
//# sourceMappingURL=monitor.js.map