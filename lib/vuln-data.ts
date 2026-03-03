export interface Vulnerability {
  cve: string
  component: string
  severity: "Critical" | "High" | "Medium" | "Low"
  epss: number
  exploitVerified: boolean
  mitreTechnique: string
  status: "Unpatched" | "Patched" | "Verified"
  environment: "Production" | "Staging" | "Development"
  description: string
  attackScenario: string
  suggestedPatch: string
}

export const vulnerabilities: Vulnerability[] = [
  {
    cve: "CVE-2026-21001",
    component: "OpenSSL 3.1.4",
    severity: "Critical",
    epss: 0.94,
    exploitVerified: true,
    mitreTechnique: "T1190 - Exploit Public-Facing Application",
    status: "Unpatched",
    environment: "Production",
    description: "Buffer overflow in TLS 1.3 handshake processing allows remote code execution via crafted ClientHello message. CVSS 9.8. Affects all deployments exposing TLS endpoints.",
    attackScenario: "An attacker sends a malformed TLS 1.3 ClientHello with an oversized session ticket extension. The buffer overflow in the handshake parser allows the attacker to overwrite the return address on the stack and redirect execution to shellcode embedded in the handshake payload. This provides remote code execution with the privileges of the TLS termination process.",
    suggestedPatch: `--- a/ssl/statem/extensions_clnt.c\n+++ b/ssl/statem/extensions_clnt.c\n@@ -412,7 +412,9 @@\n-    memcpy(session_ticket, data, len);\n+    if (len > MAX_SESSION_TICKET_LEN) {\n+        SSLfatal(s, SSL_AD_DECODE_ERROR, SSL_R_TICKET_TOO_LONG);\n+        return 0;\n+    }\n+    memcpy(session_ticket, data, len);`,
  },
  {
    cve: "CVE-2026-18823",
    component: "log4j-core 2.17.1",
    severity: "High",
    epss: 0.87,
    exploitVerified: true,
    mitreTechnique: "T1059 - Command and Scripting Interpreter",
    status: "Unpatched",
    environment: "Production",
    description: "JNDI injection via crafted log message patterns bypasses existing lookup restrictions. Allows arbitrary code execution on Java-based systems processing untrusted log data.",
    attackScenario: "Attacker injects a crafted JNDI lookup string via user-controlled input that gets logged. The lookup bypasses the allowlist by using a nested resolution pattern, connecting to an attacker-controlled LDAP server which serves a malicious Java class.",
    suggestedPatch: `--- a/log4j-core/src/main/java/org/apache/logging/log4j/core/lookup/JndiLookup.java\n+++ b/log4j-core/src/main/java/org/apache/logging/log4j/core/lookup/JndiLookup.java\n@@ -58,6 +58,8 @@\n+    if (name != null && NESTED_PATTERN.matcher(name).find()) {\n+        LOGGER.warn("Blocked nested JNDI lookup: {}", name);\n+        return null;\n+    }`,
  },
  {
    cve: "CVE-2026-15447",
    component: "linux-kernel 6.2.14",
    severity: "Critical",
    epss: 0.72,
    exploitVerified: true,
    mitreTechnique: "T1068 - Exploitation for Privilege Escalation",
    status: "Patched",
    environment: "Production",
    description: "Use-after-free in netfilter nf_tables allows local privilege escalation to root. Requires local access but no special privileges.",
    attackScenario: "A local attacker triggers a race condition in nf_tables set element destruction. By carefully timing concurrent operations, the attacker can force a use-after-free condition, spray the freed memory with controlled data, and escalate to root privileges.",
    suggestedPatch: `--- a/net/netfilter/nf_tables_api.c\n+++ b/net/netfilter/nf_tables_api.c\n@@ -5821,6 +5821,7 @@\n+    mutex_lock(&nft_net->commit_mutex);\n     nft_set_elem_destroy(set, elem);\n+    mutex_unlock(&nft_net->commit_mutex);`,
  },
  {
    cve: "CVE-2026-12990",
    component: "nginx 1.24.0",
    severity: "High",
    epss: 0.65,
    exploitVerified: false,
    mitreTechnique: "T1499 - Endpoint Denial of Service",
    status: "Unpatched",
    environment: "Staging",
    description: "HTTP/2 CONTINUATION frame flooding causes unbounded memory allocation leading to denial of service. Remote, unauthenticated exploitation.",
    attackScenario: "An attacker opens multiple HTTP/2 connections and sends a stream of CONTINUATION frames without END_HEADERS. Nginx buffers these frames indefinitely, causing memory exhaustion that crashes the worker process.",
    suggestedPatch: `--- a/src/http/v2/ngx_http_v2.c\n+++ b/src/http/v2/ngx_http_v2.c\n@@ -1245,6 +1245,10 @@\n+    if (h2c->continuation_count++ > NGX_HTTP_V2_MAX_CONTINUATIONS) {\n+        ngx_log_error(NGX_LOG_INFO, h2c->connection->log, 0,\n+                      "client exceeded continuation limit");\n+        return ngx_http_v2_connection_error(h2c, NGX_HTTP_V2_ENHANCE_YOUR_CALM);\n+    }`,
  },
  {
    cve: "CVE-2026-09871",
    component: "PostgreSQL 15.3",
    severity: "Medium",
    epss: 0.58,
    exploitVerified: false,
    mitreTechnique: "T1078 - Valid Accounts",
    status: "Verified",
    environment: "Development",
    description: "SQL injection in pg_stat_statements extension allows authenticated users to execute arbitrary SQL as the postgres superuser role.",
    attackScenario: "An authenticated database user crafts a query that exploits unsanitized input handling in the pg_stat_statements query normalization. The injected SQL runs with the permissions of the extension owner (typically the superuser).",
    suggestedPatch: `--- a/contrib/pg_stat_statements/pg_stat_statements.c\n+++ b/contrib/pg_stat_statements/pg_stat_statements.c\n@@ -892,6 +892,8 @@\n+    query_txt = sanitize_query_text(query_txt, query_len);\n+    if (query_txt == NULL) return;`,
  },
  {
    cve: "CVE-2026-08112",
    component: "containerd 1.7.2",
    severity: "Critical",
    epss: 0.81,
    exploitVerified: true,
    mitreTechnique: "T1611 - Escape to Host",
    status: "Unpatched",
    environment: "Production",
    description: "Container escape via malicious OCI image layer allows host filesystem write access. Full container-to-host breakout achieved in exploit simulation.",
    attackScenario: "Attacker pushes a malicious OCI image with a specially crafted layer containing symlinks that resolve outside the container rootfs during extraction. This grants write access to the host filesystem, enabling persistence and lateral movement.",
    suggestedPatch: `--- a/pkg/archive/diff.go\n+++ b/pkg/archive/diff.go\n@@ -156,6 +156,10 @@\n+    resolved, err := securejoin.SecureJoin(root, hdr.Linkname)\n+    if err != nil {\n+        return fmt.Errorf("blocked symlink escape: %w", err)\n+    }\n+    hdr.Linkname = resolved`,
  },
  {
    cve: "CVE-2026-07445",
    component: "express 4.18.2",
    severity: "Medium",
    epss: 0.42,
    exploitVerified: false,
    mitreTechnique: "T1190 - Exploit Public-Facing Application",
    status: "Patched",
    environment: "Staging",
    description: "Prototype pollution via crafted JSON body parsing in Express middleware chain. May lead to denial of service or authentication bypass depending on application logic.",
    attackScenario: "An attacker sends a POST request with a JSON body containing __proto__ keys. The body parser merges these into Object.prototype, potentially overriding security-critical properties in downstream middleware.",
    suggestedPatch: `--- a/lib/middleware/json.js\n+++ b/lib/middleware/json.js\n@@ -89,6 +89,7 @@\n+    const parsed = JSON.parse(body, (key, value) => key === '__proto__' ? undefined : value);`,
  },
  {
    cve: "CVE-2026-06221",
    component: "redis 7.0.11",
    severity: "High",
    epss: 0.69,
    exploitVerified: true,
    mitreTechnique: "T1059 - Command and Scripting Interpreter",
    status: "Unpatched",
    environment: "Production",
    description: "Lua sandbox escape in Redis scripting engine allows execution of arbitrary OS commands. Requires authenticated access to EVAL command.",
    attackScenario: "An authenticated Redis user with EVAL permissions crafts a Lua script that escapes the sandbox through a flaw in the coroutine library. Once escaped, the script executes OS commands with Redis process privileges.",
    suggestedPatch: `--- a/src/scripting.c\n+++ b/src/scripting.c\n@@ -324,6 +324,8 @@\n+    luaL_requiref(lua, "coroutine", NULL, 0);\n+    lua_pop(lua, 1); /* Remove coroutine from sandbox */`,
  },
]
