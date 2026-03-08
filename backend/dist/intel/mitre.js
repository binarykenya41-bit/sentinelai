/**
 * MITRE ATT&CK Integration
 *
 * Data source hierarchy (tries in order):
 *  1. MITRE CTI GitHub — raw STIX 2.0 JSON bundle (fastest, no auth)
 *     https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json
 *
 *  2. TAXII 2.0 REST API — cti-taxii.mitre.org (official server)
 *     Server:     https://cti-taxii.mitre.org/taxii/
 *     Collection: 95ecc380-afe9-11e4-9b6c-751b66dd541e
 *
 * STIX object types used:
 *   attack-pattern  → Techniques / Sub-techniques
 *   x-mitre-tactic  → Tactics
 *   course-of-action → Mitigations
 *   relationship    → Technique ↔ Mitigation links
 *
 * Equivalent Python approach (for reference):
 *   from taxii2client.v20 import Server
 *   server = Server("https://cti-taxii.mitre.org/taxii/")
 *   collection = server.collections["95ecc380-afe9-11e4-9b6c-751b66dd541e"]
 *   bundle = collection.get_objects()
 */
import axios from "axios";
// ── Source URLs ───────────────────────────────────────────────────────────────
const MITRE_GITHUB_STIX = "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json";
const TAXII_BASE = "https://cti-taxii.mitre.org";
const TAXII_COLLECTION = "95ecc380-afe9-11e4-9b6c-751b66dd541e"; // Enterprise ATT&CK
// ── Cache ─────────────────────────────────────────────────────────────────────
let techniqueCache = null;
let tacticCache = null;
let stixRelationships = [];
let cacheTime = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
// ── CWE → ATT&CK technique mapping (curated) ─────────────────────────────────
const CWE_TO_TECHNIQUES = {
    "CWE-78": ["T1059", "T1059.004"],
    "CWE-79": ["T1059.007"],
    "CWE-89": ["T1190"],
    "CWE-22": ["T1083", "T1005"],
    "CWE-94": ["T1059", "T1203"],
    "CWE-287": ["T1078", "T1110"],
    "CWE-306": ["T1078.001"],
    "CWE-502": ["T1059", "T1203"],
    "CWE-611": ["T1190", "T1083"],
    "CWE-918": ["T1090", "T1090.001"],
    "CWE-295": ["T1557", "T1040"],
    "CWE-416": ["T1203", "T1068"],
    "CWE-787": ["T1203", "T1068"],
    "CWE-190": ["T1203"],
    "CWE-798": ["T1552.001"],
    "CWE-276": ["T1083", "T1005"],
    "CWE-434": ["T1105", "T1190"],
    "CWE-352": ["T1185", "T1539"],
    "CWE-601": ["T1566.002"],
    "CWE-770": ["T1499"],
    "CWE-400": ["T1499.001"],
    "CWE-20": ["T1190"],
    "CWE-200": ["T1005", "T1083"],
    "CWE-312": ["T1552"],
    "CWE-321": ["T1552.001"],
    "CWE-330": ["T1110"],
    "CWE-338": ["T1110"],
    "CWE-427": ["T1574.008"],
    "CWE-862": ["T1078"],
    "CWE-863": ["T1548"],
};
// ── STIX object parsers ───────────────────────────────────────────────────────
function parseAttackPattern(obj) {
    const extRefs = obj["external_references"] ?? [];
    const attackRef = extRefs.find((r) => r.source_name === "mitre-attack");
    if (!attackRef?.external_id)
        return null;
    const techId = attackRef.external_id;
    const phases = (obj["kill_chain_phases"] ?? []).map((p) => p.phase_name);
    return {
        id: techId,
        stix_id: obj.id,
        name: obj.name,
        description: obj.description ?? "",
        tactic_phases: phases,
        platforms: obj["x-mitre-platforms"] ?? [],
        detection: obj["x-mitre-detection"] ?? "",
        data_sources: obj["x-mitre-data-sources"] ?? [],
        url: attackRef.url ?? `https://attack.mitre.org/techniques/${techId.replace(".", "/")}/`,
        is_subtechnique: obj["x-mitre-is-subtechnique"] ?? false,
        parent_id: techId.includes(".") ? techId.split(".")[0] : undefined,
        mitigations: [],
        permissions_required: obj["x-mitre-permissions-required"] ?? [],
        defense_bypassed: obj["x-mitre-defense-bypassed"] ?? [],
    };
}
function parseTactic(obj) {
    const extRefs = obj["external_references"] ?? [];
    const attackRef = extRefs.find((r) => r.source_name === "mitre-attack");
    if (!attackRef?.external_id)
        return null;
    const name = obj.name;
    const shortName = obj["x-mitre-shortname"]
        || name.toLowerCase().replace(/ /g, "-");
    return {
        id: attackRef.external_id,
        stix_id: obj.id,
        name,
        short_name: shortName,
        description: obj.description ?? "",
        url: attackRef.url ?? `https://attack.mitre.org/tactics/${attackRef.external_id}/`,
    };
}
// ── Bundle loader ─────────────────────────────────────────────────────────────
async function fetchBundleFromGitHub() {
    const { data } = await axios.get(MITRE_GITHUB_STIX, {
        timeout: 60_000,
        headers: { Accept: "application/json" },
    });
    return (data.objects ?? []);
}
async function fetchBundleFromTaxii() {
    // TAXII 2.0 — query the collection objects endpoint
    const url = `${TAXII_BASE}/stix/collections/${TAXII_COLLECTION}/objects/`;
    const { data } = await axios.get(url, {
        timeout: 60_000,
        headers: {
            Accept: "application/vnd.oasis.stix+json; version=2.0",
            "Content-Type": "application/vnd.oasis.stix+json; version=2.0",
        },
    });
    return (data.objects ?? []);
}
async function loadBundle() {
    if (techniqueCache && Date.now() - cacheTime < CACHE_TTL_MS) {
        return { techniques: techniqueCache, tactics: tacticCache, relationships: stixRelationships };
    }
    // Try GitHub first (larger payload but no auth; always up-to-date)
    let objects = [];
    try {
        console.log("[MITRE] Loading ATT&CK STIX bundle from GitHub...");
        objects = await fetchBundleFromGitHub();
        console.log(`[MITRE] Loaded ${objects.length} STIX objects from GitHub`);
    }
    catch (err) {
        console.warn("[MITRE] GitHub fetch failed, falling back to TAXII 2.0...", err);
        objects = await fetchBundleFromTaxii();
        console.log(`[MITRE] Loaded ${objects.length} STIX objects from TAXII`);
    }
    const techniques = new Map();
    const tactics = new Map();
    const relationships = [];
    const mitigationNames = new Map(); // stix_id → name
    for (const obj of objects) {
        const deprecated = obj["x-mitre-deprecated"] ?? false;
        const revoked = obj["revoked"] ?? false;
        if (deprecated || revoked)
            continue;
        switch (obj.type) {
            case "attack-pattern": {
                const t = parseAttackPattern(obj);
                if (t)
                    techniques.set(t.id, t);
                break;
            }
            case "x-mitre-tactic": {
                const tactic = parseTactic(obj);
                if (tactic)
                    tactics.set(tactic.id, tactic); // key by TA-id to avoid empty short_name collisions
                break;
            }
            case "course-of-action":
                mitigationNames.set(obj.id, obj.name);
                break;
            case "relationship":
                relationships.push({
                    source_ref: obj.source_ref,
                    target_ref: obj.target_ref,
                    relationship_type: obj.relationship_type,
                });
                break;
        }
    }
    // Wire mitigations onto techniques
    for (const rel of relationships) {
        if (rel.relationship_type === "mitigates") {
            // target_ref is the technique stix_id
            const mitName = mitigationNames.get(rel.source_ref);
            if (!mitName)
                continue;
            for (const tech of techniques.values()) {
                if (tech.stix_id === rel.target_ref) {
                    tech.mitigations.push(mitName);
                }
            }
        }
    }
    techniqueCache = techniques;
    tacticCache = tactics;
    stixRelationships = relationships;
    cacheTime = Date.now();
    return { techniques, tactics, relationships };
}
// ── Public API ────────────────────────────────────────────────────────────────
export async function getTechnique(techniqueId) {
    const { techniques } = await loadBundle();
    return techniques.get(techniqueId.toUpperCase()) ?? null;
}
export async function getTactics() {
    const { tactics } = await loadBundle();
    return Array.from(tactics.values());
}
export async function getTechniquesByTactic(tactic) {
    const { techniques } = await loadBundle();
    const normalized = tactic.toLowerCase().replace(/ /g, "-");
    return Array.from(techniques.values()).filter((t) => t.tactic_phases.some((p) => p.toLowerCase().replace(/ /g, "-") === normalized));
}
export async function mapCweToTechniques(cweIds) {
    const { techniques } = await loadBundle();
    const ids = new Set();
    for (const cwe of cweIds) {
        const normalized = cwe.startsWith("CWE-") ? cwe : `CWE-${cwe}`;
        (CWE_TO_TECHNIQUES[normalized] ?? []).forEach((id) => ids.add(id));
    }
    return Array.from(ids)
        .map((id) => techniques.get(id))
        .filter((t) => t !== undefined);
}
export async function searchTechniques(query) {
    const { techniques } = await loadBundle();
    const q = query.toLowerCase();
    return Array.from(techniques.values()).filter((t) => t.id.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q));
}
export async function listAllTechniques() {
    const { techniques } = await loadBundle();
    return Array.from(techniques.values());
}
export async function getAttackChain(techniqueIds) {
    const { techniques, tactics } = await loadBundle();
    const nodes = [];
    for (const id of techniqueIds) {
        const t = techniques.get(id);
        if (t)
            nodes.push(t);
    }
    // Build tactic-ordered flow
    const tacticOrder = [
        "reconnaissance", "resource-development", "initial-access",
        "execution", "persistence", "privilege-escalation",
        "defense-evasion", "credential-access", "discovery",
        "lateral-movement", "collection", "command-and-control",
        "exfiltration", "impact",
    ];
    const usedTactics = new Set(nodes.flatMap((n) => n.tactic_phases));
    const tactic_flow = tacticOrder.filter((t) => usedTactics.has(t));
    // Edges: connect techniques that share adjacent tactics
    const edges = [];
    for (let i = 0; i < nodes.length - 1; i++) {
        edges.push({
            source: nodes[i].id,
            target: nodes[i + 1].id,
            type: "follows",
        });
        // Also add parent→sub-technique edges
        if (nodes[i + 1].parent_id === nodes[i].id) {
            edges[edges.length - 1].type = "subtechnique";
        }
    }
    return { nodes, edges, tactic_flow };
}
export async function warmCache() {
    const { techniques, tactics } = await loadBundle();
    return { techniques: techniques.size, tactics: tactics.size };
}
//# sourceMappingURL=mitre.js.map