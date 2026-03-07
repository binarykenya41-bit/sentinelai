import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export function SampleReport() {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-0">
        {/* ================================================================== */}
        {/* REPORT HEADER - Follows NIST / OWASP / pentest standard cover page */}
        {/* ================================================================== */}
        <div className="border-b border-border px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                CONFIDENTIAL
              </p>
              <h1 className="mt-2 text-xl font-bold text-card-foreground">
                Security Assessment Report
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Automated Penetration Test & Vulnerability Assessment
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Report ID</p>
              <p className="font-mono text-sm font-semibold text-card-foreground">SAR-2026-0303-001</p>
              <p className="mt-1 text-xs text-muted-foreground">Classification</p>
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                TLP:RED
              </Badge>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* DOCUMENT CONTROL TABLE                                              */}
        {/* ================================================================== */}
        <div className="border-b border-border px-8 py-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Document Control
          </h2>
          <table className="w-full text-xs">
            <tbody>
              {[
                ["Prepared For", "Sentinel Security Corp -- Executive Leadership"],
                ["Prepared By", "SentinelAI Autonomous Security Platform v4.2.1"],
                ["Assessment Date", "2026-02-24 through 2026-03-03"],
                ["Report Date", "2026-03-03"],
                ["Assessment Type", "Automated Continuous Penetration Test (Black Box + Grey Box)"],
                ["Scope", "Production, Staging, and Development Environments"],
                ["Methodology", "OWASP Testing Guide v4.2, PTES, NIST SP 800-115, MITRE ATT&CK v14"],
                ["Distribution", "CISO, VP Engineering, Security Operations Team"],
              ].map(([label, value]) => (
                <tr key={label} className="border-b border-border/50 last:border-0">
                  <td className="w-48 py-2 font-semibold text-muted-foreground">{label}</td>
                  <td className="py-2 text-card-foreground">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================================================================== */}
        {/* 1. EXECUTIVE SUMMARY                                                */}
        {/* ================================================================== */}
        <div className="border-b border-border px-8 py-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-card-foreground">
            1. Executive Summary
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-card-foreground">
            This report presents the findings of an automated security assessment conducted by the SentinelAI platform between February 24 and March 3, 2026. The assessment targeted all internet-facing and internal infrastructure components across production, staging, and development environments. The platform executed a full lifecycle of vulnerability scanning, exploit simulation, automated patching, and re-verification.
          </p>
          <p className="mb-3 text-sm leading-relaxed text-card-foreground">
            The overall security posture score stands at <span className="font-semibold text-primary">78 / 100</span>, reflecting an improvement of +4.2 points since the last assessment cycle. While the majority of systems demonstrate adequate hardening, <span className="font-semibold text-destructive">12 critical vulnerabilities</span> and <span className="font-semibold text-warning">5 actively exploitable issues</span> require immediate remediation. The platform confirmed exploit viability through controlled simulation in isolated sandbox environments, and has automatically generated patch pull requests for 8 of the identified vulnerabilities.
          </p>
          <p className="text-sm leading-relaxed text-card-foreground">
            Immediate executive action is required on three findings where exploit simulation achieved remote code execution with privilege escalation to root-level access on production systems.
          </p>
        </div>

        {/* ================================================================== */}
        {/* 2. OVERALL RISK RATING                                              */}
        {/* ================================================================== */}
        <div className="border-b border-border px-8 py-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-card-foreground">
            2. Overall Risk Rating
          </h2>
          <div className="mb-4 flex items-center gap-6">
            <div className="flex flex-col items-center rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-4">
              <span className="text-3xl font-bold text-destructive">HIGH</span>
              <span className="mt-1 text-xs text-muted-foreground">Overall Risk Level</span>
            </div>
            <div className="flex flex-col gap-2 text-sm text-card-foreground">
              <p>The assessed environment presents a <span className="font-semibold">HIGH</span> risk posture due to the presence of remotely exploitable critical vulnerabilities in production systems with confirmed exploit paths to sensitive data stores.</p>
            </div>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Risk Factor</th>
                <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Rating</th>
                <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Justification</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Likelihood of Exploitation", "Very High", "EPSS scores above 0.70 for 3 critical CVEs; public exploits available"],
                ["Business Impact", "High", "RCE on production systems with access to customer PII and payment data"],
                ["Ease of Exploitation", "High", "No authentication required for initial access vector (CVE-2026-21001)"],
                ["Remediation Complexity", "Medium", "Patches auto-generated; CI/CD integration active for 2 of 3 repositories"],
              ].map(([factor, rating, justification]) => (
                <tr key={factor} className="border-b border-border/50 last:border-0">
                  <td className="py-2 text-card-foreground">{factor}</td>
                  <td className="py-2">
                    <Badge variant="outline" className={
                      rating === "Very High" ? "bg-destructive/10 text-destructive border-destructive/20" :
                      rating === "High" ? "bg-warning/10 text-warning border-warning/20" :
                      "bg-chart-1/10 text-chart-1 border-chart-1/20"
                    }>{rating}</Badge>
                  </td>
                  <td className="py-2 text-muted-foreground">{justification}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================================================================== */}
        {/* 3. SCOPE & METHODOLOGY                                              */}
        {/* ================================================================== */}
        <div className="border-b border-border px-8 py-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-card-foreground">
            3. Scope & Methodology
          </h2>
          <div className="mb-4">
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">3.1 Scope Definition</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Environment</th>
                  <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Assets</th>
                  <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">IP Range / Namespace</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Production", "42 hosts, 12 containers, 3 databases", "10.0.12.0/24, k8s-prod-*"],
                  ["Staging", "18 hosts, 6 containers, 1 database", "10.0.24.0/24, k8s-staging-*"],
                  ["Development", "8 hosts, 4 containers, 1 database", "10.0.36.0/24"],
                ].map(([env, assets, range]) => (
                  <tr key={env} className="border-b border-border/50 last:border-0">
                    <td className="py-2 font-semibold text-card-foreground">{env}</td>
                    <td className="py-2 text-card-foreground">{assets}</td>
                    <td className="py-2 font-mono text-muted-foreground">{range}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">3.2 Testing Methodology</h3>
            <p className="text-sm leading-relaxed text-card-foreground">
              The assessment followed a hybrid methodology combining automated continuous scanning with AI-driven exploit simulation. Phase 1 (Reconnaissance & Scanning) utilized network discovery, service enumeration, and vulnerability scanning aligned with NIST SP 800-115 guidelines. Phase 2 (Exploit Simulation) executed controlled exploit attempts in sandboxed environments mirroring production topology, following the Penetration Testing Execution Standard (PTES). Phase 3 (Analysis & Verification) mapped findings to MITRE ATT&CK v14 techniques and validated EPSS scores against observed exploit success rates. Phase 4 (Remediation & Verification) generated patches, pushed to CI/CD pipelines, and re-tested to confirm closure.
            </p>
          </div>
        </div>

        {/* ================================================================== */}
        {/* 4. FINDINGS SUMMARY                                                 */}
        {/* ================================================================== */}
        <div className="border-b border-border px-8 py-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-card-foreground">
            4. Findings Summary
          </h2>
          <div className="mb-4 grid grid-cols-4 gap-3">
            {[
              { severity: "Critical", count: 3, color: "border-destructive/30 bg-destructive/5 text-destructive" },
              { severity: "High", count: 3, color: "border-warning/30 bg-warning/5 text-warning" },
              { severity: "Medium", count: 2, color: "border-chart-1/30 bg-chart-1/5 text-chart-1" },
              { severity: "Low", count: 0, color: "border-border bg-secondary/50 text-muted-foreground" },
            ].map((s) => (
              <div key={s.severity} className={`flex flex-col items-center rounded-lg border px-4 py-3 ${s.color}`}>
                <span className="text-2xl font-bold">{s.count}</span>
                <span className="text-xs font-semibold uppercase">{s.severity}</span>
              </div>
            ))}
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">ID</th>
                <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">CVE</th>
                <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Component</th>
                <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Severity</th>
                <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">EPSS</th>
                <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Exploit Confirmed</th>
                <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: "F-001", cve: "CVE-2026-21001", component: "OpenSSL 3.1.4", severity: "Critical", epss: "0.94", exploit: "Yes", status: "Unpatched" },
                { id: "F-002", cve: "CVE-2026-18823", component: "log4j-core 2.17.1", severity: "High", epss: "0.87", exploit: "Yes", status: "Unpatched" },
                { id: "F-003", cve: "CVE-2026-15447", component: "linux-kernel 6.2.14", severity: "Critical", epss: "0.72", exploit: "Yes", status: "Patched" },
                { id: "F-004", cve: "CVE-2026-08112", component: "containerd 1.7.2", severity: "Critical", epss: "0.81", exploit: "Yes", status: "Unpatched" },
                { id: "F-005", cve: "CVE-2026-12990", component: "nginx 1.24.0", severity: "High", epss: "0.65", exploit: "No", status: "Unpatched" },
                { id: "F-006", cve: "CVE-2026-06221", component: "redis 7.0.11", severity: "High", epss: "0.69", exploit: "Yes", status: "Unpatched" },
                { id: "F-007", cve: "CVE-2026-09871", component: "PostgreSQL 15.3", severity: "Medium", epss: "0.58", exploit: "No", status: "Verified" },
                { id: "F-008", cve: "CVE-2026-07445", component: "express 4.18.2", severity: "Medium", epss: "0.42", exploit: "No", status: "Patched" },
              ].map((f) => (
                <tr key={f.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2 font-mono font-semibold text-card-foreground">{f.id}</td>
                  <td className="py-2 font-mono text-primary">{f.cve}</td>
                  <td className="py-2 text-card-foreground">{f.component}</td>
                  <td className="py-2">
                    <Badge variant="outline" className={
                      f.severity === "Critical" ? "bg-destructive/10 text-destructive border-destructive/20" :
                      f.severity === "High" ? "bg-warning/10 text-warning border-warning/20" :
                      "bg-chart-1/10 text-chart-1 border-chart-1/20"
                    }>{f.severity}</Badge>
                  </td>
                  <td className="py-2 font-mono text-card-foreground">{f.epss}</td>
                  <td className="py-2">
                    <span className={f.exploit === "Yes" ? "font-semibold text-destructive" : "text-muted-foreground"}>
                      {f.exploit}
                    </span>
                  </td>
                  <td className="py-2">
                    <Badge variant="outline" className={
                      f.status === "Unpatched" ? "bg-destructive/10 text-destructive border-destructive/20" :
                      f.status === "Patched" ? "bg-warning/10 text-warning border-warning/20" :
                      "bg-success/10 text-success border-success/20"
                    }>{f.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================================================================== */}
        {/* 5. DETAILED FINDINGS (Top 3 Critical)                               */}
        {/* ================================================================== */}
        <div className="border-b border-border px-8 py-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-card-foreground">
            5. Detailed Findings
          </h2>

          {/* Finding F-001 */}
          <div className="mb-5 rounded-lg border border-border bg-background p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-card-foreground">F-001</span>
                <Separator orientation="vertical" className="h-4 bg-border" />
                <span className="font-mono text-sm text-primary">CVE-2026-21001</span>
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Critical</Badge>
              </div>
              <span className="font-mono text-xs text-muted-foreground">CVSS 9.8 / EPSS 0.94</span>
            </div>
            <h3 className="mb-2 text-sm font-semibold text-card-foreground">Buffer Overflow in OpenSSL 3.1.x TLS 1.3 Handshake</h3>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">Affected Asset:</span>
                <span className="ml-2 font-mono text-card-foreground">web-prod-01.internal (10.0.12.44)</span>
              </div>
              <div>
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">MITRE ATT&CK:</span>
                <span className="ml-2 font-mono text-primary">T1190 - Exploit Public-Facing Application</span>
              </div>
              <div>
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">Description:</span>
                <p className="mt-1 leading-relaxed text-card-foreground">
                  A buffer overflow vulnerability exists in the TLS 1.3 handshake processing of OpenSSL 3.1.4. An unauthenticated remote attacker can send a crafted ClientHello message with an oversized session ticket extension to trigger the overflow, overwrite the return address on the stack, and achieve remote code execution with the privileges of the TLS termination process. No user interaction is required. The vulnerability is remotely exploitable from the internet through the load balancer.
                </p>
              </div>
              <div>
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">Exploit Simulation Result:</span>
                <p className="mt-1 leading-relaxed text-card-foreground">
                  The SentinelAI exploit engine successfully achieved remote code execution on the target host. Initial access was obtained as www-data (uid=33). A subsequent privilege escalation chain via CVE-2026-15447 (kernel use-after-free) elevated access to root (uid=0). Full host compromise was confirmed with read/write access to the application database connection credentials stored in /etc/app/db.conf.
                </p>
              </div>
              <div>
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">Recommendation:</span>
                <p className="mt-1 leading-relaxed text-card-foreground">
                  Upgrade OpenSSL to version 3.1.5 immediately. An automated patch PR has been generated on branch security/CVE-2026-21001. As an interim measure, restrict TLS cipher suites to disable vulnerable handshake paths and deploy WAF rules to detect malformed ClientHello packets. Review and rotate all credentials accessible from the compromised host.
                </p>
              </div>
              <div>
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">Remediation Status:</span>
                <Badge variant="outline" className="ml-2 bg-destructive/10 text-destructive border-destructive/20">Unpatched - Awaiting Merge</Badge>
              </div>
            </div>
          </div>

          {/* Finding F-004 */}
          <div className="mb-5 rounded-lg border border-border bg-background p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-card-foreground">F-004</span>
                <Separator orientation="vertical" className="h-4 bg-border" />
                <span className="font-mono text-sm text-primary">CVE-2026-08112</span>
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Critical</Badge>
              </div>
              <span className="font-mono text-xs text-muted-foreground">CVSS 9.1 / EPSS 0.81</span>
            </div>
            <h3 className="mb-2 text-sm font-semibold text-card-foreground">Container Escape via Malicious OCI Image Layer in containerd</h3>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">Affected Asset:</span>
                <span className="ml-2 font-mono text-card-foreground">k8s-node-07.internal (10.0.12.107)</span>
              </div>
              <div>
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">MITRE ATT&CK:</span>
                <span className="ml-2 font-mono text-primary">T1611 - Escape to Host</span>
              </div>
              <div>
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">Description:</span>
                <p className="mt-1 leading-relaxed text-card-foreground">
                  A path traversal vulnerability in containerd 1.7.2 allows a malicious OCI image containing specially crafted symlinks in its layers to write files outside the container root filesystem during image extraction. An attacker who can push images to a registry consumed by the target cluster can achieve full container-to-host breakout, gaining write access to the host filesystem.
                </p>
              </div>
              <div>
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">Exploit Simulation Result:</span>
                <p className="mt-1 leading-relaxed text-card-foreground">
                  Simulation confirmed host filesystem write access. The exploit created a cron job on the host for persistent access and exfiltrated kubeconfig credentials, enabling lateral movement across the Kubernetes cluster. All 12 production containers on the affected node were potentially compromised.
                </p>
              </div>
              <div>
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">Recommendation:</span>
                <p className="mt-1 leading-relaxed text-card-foreground">
                  Upgrade containerd to 1.7.3 or later. Enable OCI image signature verification using cosign/sigstore. Apply the auto-generated patch that adds SecureJoin validation for symlink resolution during layer extraction. Audit all images in the production registry for malicious layers. Rotate kubeconfig and all service account tokens on the affected node.
                </p>
              </div>
              <div>
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">Remediation Status:</span>
                <Badge variant="outline" className="ml-2 bg-warning/10 text-warning border-warning/20">Patch PR in Draft</Badge>
              </div>
            </div>
          </div>

          {/* Finding F-006 */}
          <div className="rounded-lg border border-border bg-background p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-card-foreground">F-006</span>
                <Separator orientation="vertical" className="h-4 bg-border" />
                <span className="font-mono text-sm text-primary">CVE-2026-06221</span>
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">High</Badge>
              </div>
              <span className="font-mono text-xs text-muted-foreground">CVSS 8.4 / EPSS 0.69</span>
            </div>
            <h3 className="mb-2 text-sm font-semibold text-card-foreground">Lua Sandbox Escape in Redis Scripting Engine</h3>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">Affected Asset:</span>
                <span className="ml-2 font-mono text-card-foreground">cache-prod-01.internal (10.0.12.201)</span>
              </div>
              <div>
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">MITRE ATT&CK:</span>
                <span className="ml-2 font-mono text-primary">T1059 - Command and Scripting Interpreter</span>
              </div>
              <div>
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">Description:</span>
                <p className="mt-1 leading-relaxed text-card-foreground">
                  A flaw in the Lua scripting sandbox of Redis 7.0.11 allows authenticated users with EVAL permissions to escape the sandbox via crafted coroutine manipulation. Once escaped, arbitrary OS commands execute with the Redis process privileges, typically running as the redis user with network access to internal services.
                </p>
              </div>
              <div>
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">Exploit Simulation Result:</span>
                <p className="mt-1 leading-relaxed text-card-foreground">
                  Sandbox escape confirmed. The simulation executed OS commands to enumerate the internal network and accessed API credentials stored in Redis keys. The redis process had network access to the production database on port 5432.
                </p>
              </div>
              <div>
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">Recommendation:</span>
                <p className="mt-1 leading-relaxed text-card-foreground">
                  Upgrade Redis to 7.0.12 or later. Immediately restrict EVAL permissions to admin-only ACLs. Apply the auto-generated patch disabling coroutine access within the Lua sandbox. Implement network segmentation to prevent Redis from reaching the production database directly.
                </p>
              </div>
              <div>
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">Remediation Status:</span>
                <Badge variant="outline" className="ml-2 bg-destructive/10 text-destructive border-destructive/20">Unpatched</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* 6. EXPLOIT VERIFICATION SUMMARY                                     */}
        {/* ================================================================== */}
        <div className="border-b border-border px-8 py-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-card-foreground">
            6. Exploit Verification Summary
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-card-foreground">
            All exploit simulations were conducted in isolated sandbox environments replicating production topology. No production systems were directly targeted. The following table summarizes simulation outcomes:
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Simulation</th>
                <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">CVE</th>
                <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Initial Access</th>
                <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Priv Escalation</th>
                <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Data Access</th>
                <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Lateral Movement</th>
              </tr>
            </thead>
            <tbody>
              {[
                { sim: "SIM-001", cve: "CVE-2026-21001", access: "RCE (www-data)", privEsc: "Root via kernel UAF", data: "DB credentials", lateral: "Yes - DB access" },
                { sim: "SIM-002", cve: "CVE-2026-18823", access: "RCE (app-user)", privEsc: "No", data: "App config, API keys", lateral: "Yes - internal APIs" },
                { sim: "SIM-004", cve: "CVE-2026-08112", access: "Host FS write", privEsc: "Root via cron", data: "Kubeconfig", lateral: "Yes - cluster-wide" },
                { sim: "SIM-005", cve: "CVE-2026-06221", access: "OS cmd (redis)", privEsc: "No", data: "Redis keys, API creds", lateral: "Yes - DB port 5432" },
              ].map((s) => (
                <tr key={s.sim} className="border-b border-border/50 last:border-0">
                  <td className="py-2 font-mono font-semibold text-card-foreground">{s.sim}</td>
                  <td className="py-2 font-mono text-primary">{s.cve}</td>
                  <td className="py-2 text-card-foreground">{s.access}</td>
                  <td className="py-2 text-card-foreground">{s.privEsc}</td>
                  <td className="py-2 text-card-foreground">{s.data}</td>
                  <td className="py-2 text-card-foreground">{s.lateral}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================================================================== */}
        {/* 7. PATCH VELOCITY & AUTOMATION METRICS                              */}
        {/* ================================================================== */}
        <div className="border-b border-border px-8 py-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-card-foreground">
            7. Patch Velocity & Automation Metrics
          </h2>
          <div className="mb-4 grid grid-cols-4 gap-3">
            {[
              { label: "Mean Time to Detect", value: "< 4 min", sublabel: "from CVE publication" },
              { label: "Mean Time to Patch Gen", value: "8 min", sublabel: "automated patch creation" },
              { label: "Mean Time to PR Merge", value: "2.4 hrs", sublabel: "with human approval" },
              { label: "Mean Time to Verify", value: "12 min", sublabel: "post-deployment re-scan" },
            ].map((m) => (
              <div key={m.label} className="flex flex-col items-center rounded-lg border border-border bg-secondary/50 px-4 py-3">
                <span className="font-mono text-xl font-bold text-primary">{m.value}</span>
                <span className="mt-1 text-center text-xs font-semibold text-card-foreground">{m.label}</span>
                <span className="text-center text-[10px] text-muted-foreground">{m.sublabel}</span>
              </div>
            ))}
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">CVE</th>
                <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Patch Generated</th>
                <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">PR Created</th>
                <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">CI Status</th>
                <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Merged</th>
                <th className="py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Verified</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cve: "CVE-2026-21001", gen: "02:22 UTC", pr: "02:23 UTC", ci: "Passing", merged: "Pending", verified: "--" },
                { cve: "CVE-2026-18823", gen: "01:50 UTC", pr: "01:51 UTC", ci: "Passing", merged: "Pending", verified: "--" },
                { cve: "CVE-2026-15447", gen: "Feb 28 14:10", pr: "Feb 28 14:11", ci: "Passing", merged: "Feb 28 16:30", verified: "Feb 28 16:42" },
                { cve: "CVE-2026-08112", gen: "20:18 UTC", pr: "20:19 UTC", ci: "Running", merged: "Pending", verified: "--" },
                { cve: "CVE-2026-06221", gen: "18:50 UTC", pr: "18:51 UTC", ci: "Passing", merged: "Mar 2 21:00", verified: "Mar 2 21:12" },
              ].map((p) => (
                <tr key={p.cve} className="border-b border-border/50 last:border-0">
                  <td className="py-2 font-mono text-primary">{p.cve}</td>
                  <td className="py-2 font-mono text-card-foreground">{p.gen}</td>
                  <td className="py-2 font-mono text-card-foreground">{p.pr}</td>
                  <td className="py-2">
                    <Badge variant="outline" className={
                      p.ci === "Passing" ? "bg-success/10 text-success border-success/20" :
                      "bg-chart-1/10 text-chart-1 border-chart-1/20"
                    }>{p.ci}</Badge>
                  </td>
                  <td className="py-2 font-mono text-card-foreground">{p.merged}</td>
                  <td className="py-2 font-mono text-card-foreground">{p.verified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================================================================== */}
        {/* 8. STRATEGIC RECOMMENDATIONS                                        */}
        {/* ================================================================== */}
        <div className="border-b border-border px-8 py-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-card-foreground">
            8. Strategic Recommendations
          </h2>
          <div className="flex flex-col gap-3">
            {[
              { priority: "P0", title: "Immediate: Patch Critical RCE Vulnerabilities", desc: "Merge pending PRs for CVE-2026-21001 and CVE-2026-08112 within 24 hours. These findings have confirmed exploit paths to root-level access on production systems." },
              { priority: "P0", title: "Immediate: Credential Rotation", desc: "Rotate all database credentials, API keys, and kubeconfig tokens that were accessible during exploit simulations. Assume compromise of all credentials on affected hosts." },
              { priority: "P1", title: "Short-term: Network Segmentation Review", desc: "Redis (cache-prod-01) should not have direct network access to the production database. Implement microsegmentation to enforce least-privilege network policies across all service-to-service communication." },
              { priority: "P1", title: "Short-term: Container Image Supply Chain", desc: "Deploy image signature verification (cosign/sigstore) and admission controllers to prevent unsigned or untrusted images from being deployed to production clusters." },
              { priority: "P2", title: "Medium-term: RBAC Hardening", desc: "Restrict Redis EVAL permissions, PostgreSQL extension privileges, and Kubernetes RBAC roles to enforce principle of least privilege across all data plane components." },
            ].map((r, i) => (
              <div key={i} className="flex gap-3 rounded-lg border border-border bg-background p-3">
                <Badge variant="outline" className={
                  r.priority === "P0" ? "mt-0.5 shrink-0 bg-destructive/10 text-destructive border-destructive/20" :
                  r.priority === "P1" ? "mt-0.5 shrink-0 bg-warning/10 text-warning border-warning/20" :
                  "mt-0.5 shrink-0 bg-chart-1/10 text-chart-1 border-chart-1/20"
                }>{r.priority}</Badge>
                <div>
                  <h4 className="text-xs font-semibold text-card-foreground">{r.title}</h4>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================================================================== */}
        {/* 9. APPENDIX                                                         */}
        {/* ================================================================== */}
        <div className="px-8 py-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-card-foreground">
            9. Appendix
          </h2>
          <div className="flex flex-col gap-2 text-xs">
            <div>
              <span className="font-semibold text-muted-foreground">A. Tools & Versions:</span>
              <span className="ml-2 text-card-foreground">SentinelAI Scanner v4.2.1, SentinelAI Exploit Engine v3.8.0, Nmap 7.94, Nuclei v3.1.8</span>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground">B. Scoring References:</span>
              <span className="ml-2 text-card-foreground">CVSS v3.1 (NIST NVD), EPSS v3 (FIRST.org), MITRE ATT&CK v14</span>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground">C. Compliance Mapping:</span>
              <span className="ml-2 text-card-foreground">ISO 27001:2022, SOC 2 Type II (TSC 2017), PCI-DSS v4.0</span>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground">D. Revision History:</span>
              <span className="ml-2 text-card-foreground">v1.0 (2026-03-03) -- Initial report generation</span>
            </div>
          </div>
          <Separator className="my-4 bg-border" />
          <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">
            End of Report -- SentinelAI Autonomous Security Platform -- CONFIDENTIAL
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
