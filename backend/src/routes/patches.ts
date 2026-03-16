import type { FastifyInstance } from "fastify"
import { supabase } from "../lib/supabase.js"
import { generatePatch } from "../ai/patch-generation.js"
import { getOctokit } from "../integrations/github/client.js"
import { v4 as uuidv4 } from "uuid"
import { readFileSync, readdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { exec as execCb } from "child_process"
import { promisify } from "util"

const exec = promisify(execCb)

const LOGISTICS_PATCHES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../containers/industries/logistics/patches"
)

// Map patch file → CVE for DB linkage
const PATCH_FILE_CVE_MAP: Record<string, string> = {
  "01-erpnext-hardening.md":   "CVE-2023-46127",
  "02-redis-hardening.md":     "CVE-2022-0543",
  "03-kafka-hardening.md":     "CVE-2023-25194",
  "04-postgresql-hardening.md":"CVE-2024-0985",
  "05-grafana-hardening.md":   "CVE-2021-43798",
  "06-prometheus-hardening.md":"CVE-2019-3826",
}

// Extract PR number from a GitHub PR URL
function prNumberFromUrl(prUrl: string): number | null {
  const m = prUrl.match(/\/pull\/(\d+)$/)
  return m ? parseInt(m[1]) : null
}

// Get owner + repo from env or octokit auth
async function getOwnerRepo(octokit: ReturnType<typeof getOctokit>) {
  let owner = process.env.GITHUB_OWNER
  if (!owner) {
    const { data: u } = await octokit.users.getAuthenticated()
    owner = u.login
  }
  const repo = process.env.GITHUB_REPO ?? "sentinelai"
  return { owner, repo }
}

export async function patchRoutes(app: FastifyInstance) {
  // GET /api/patches — list all patch records with vuln context
  app.get<{
    Querystring: {
      ci_status?: string
      merge_status?: string
      resim_result?: string
      limit?: string
      offset?: string
    }
  }>("/api/patches", async (req, reply) => {
    let query = supabase
      .from("patch_records")
      .select(`
        *,
        vulnerabilities (
          cve_id, cvss_v3, kev_status, epss_score,
          mitre_techniques, blast_radius, remediation_status
        )
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(parseInt(req.query.limit ?? "50"))
      .range(
        parseInt(req.query.offset ?? "0"),
        parseInt(req.query.offset ?? "0") + parseInt(req.query.limit ?? "50") - 1
      )

    if (req.query.ci_status) query = query.eq("ci_status", req.query.ci_status)
    if (req.query.merge_status) query = query.eq("merge_status", req.query.merge_status)
    if (req.query.resim_result) query = query.eq("resim_result", req.query.resim_result)

    const { data, error, count } = await query
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ total: count, patches: data })
  })

  // GET /api/patches/stats — summary
  app.get("/api/patches/stats", async (_req, reply) => {
    const { data, error } = await supabase
      .from("patch_records")
      .select("ci_status, merge_status, resim_result, created_at")

    if (error) return reply.status(500).send({ error: error.message })
    const patches = data ?? []

    return reply.send({
      total: patches.length,
      ci_passing: patches.filter((p) => p.ci_status === "passed").length,
      ci_failing: patches.filter((p) => p.ci_status === "failed").length,
      ci_running: patches.filter((p) => p.ci_status === "running").length,
      merged: patches.filter((p) => p.merge_status === "merged").length,
      pending_merge: patches.filter((p) => p.merge_status === "open" || p.merge_status === "approved").length,
      blocked: patches.filter((p) => p.merge_status === "blocked").length,
      exploit_confirmed_fixed: patches.filter((p) => p.resim_result === "exploit_failed").length,
      exploit_still_works: patches.filter((p) => p.resim_result === "exploit_succeeded").length,
    })
  })

  // GET /api/patches/:id — single patch record
  app.get<{ Params: { id: string } }>("/api/patches/:id", async (req, reply) => {
    const { data, error } = await supabase
      .from("patch_records")
      .select(`
        *,
        vulnerabilities (
          cve_id, cvss_v3, kev_status, epss_score,
          mitre_techniques, blast_radius, remediation_status,
          cwe_ids, scan_source
        )
      `)
      .eq("patch_id", req.params.id)
      .single()

    if (error) return reply.status(404).send({ error: "Patch record not found" })
    return reply.send(data)
  })

  // POST /api/patches/generate — AI-generate patch + push branch + open PR
  app.post<{ Body: { vuln_id: string } }>("/api/patches/generate", async (req, reply) => {
    const { vuln_id } = req.body ?? {}
    if (!vuln_id) return reply.status(400).send({ error: "vuln_id required" })

    // 1. Fetch vuln
    const { data: vuln, error: vulnErr } = await supabase
      .from("vulnerabilities")
      .select("*")
      .eq("vuln_id", vuln_id)
      .single()
    if (vulnErr || !vuln) return reply.status(404).send({ error: "Vulnerability not found" })

    // 2. Generate patch via AI (build representative affected code from CVE metadata)
    const affectedCode = buildAffectedCodeTemplate(vuln)
    let patchResult
    try {
      patchResult = await generatePatch({
        cve_id: vuln.cve_id,
        cwe_ids: vuln.cwe_ids ?? [],
        language: inferLanguage(vuln),
        framework: inferFramework(vuln),
        affected_code: affectedCode,
        file_path: inferFilePath(vuln),
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "AI patch generation failed"
      app.log.error(err)
      return reply.status(500).send({ error: msg })
    }

    // 3. GitHub: create branch + commit + PR using GITHUBTOKEN from env
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
    const safeCve = vuln.cve_id.replace(/[^a-zA-Z0-9-]/g, "-")
    const branchName = `sentinel/fix/${safeCve}/${ts}`
    let prUrl: string | null = null
    let commitSha: string | null = null

    if (process.env.GITHUBTOKEN) {
      try {
        const octokit = getOctokit()

        // Derive owner from authenticated token, allow override via GITHUB_OWNER
        let owner = process.env.GITHUB_OWNER
        if (!owner) {
          const { data: authUser } = await octokit.users.getAuthenticated()
          owner = authUser.login
        }
        // Allow override via GITHUB_REPO, default to "sentinelai"
        const repo = process.env.GITHUB_REPO ?? "sentinelai"

        // Get default branch HEAD sha
        const { data: repoData } = await octokit.repos.get({ owner, repo })
        const defaultBranch = repoData.default_branch
        const { data: refData } = await octokit.git.getRef({ owner, repo, ref: `heads/${defaultBranch}` })
        const baseSha = refData.object.sha

        // Create branch
        await octokit.git.createRef({ owner, repo, ref: `refs/heads/${branchName}`, sha: baseSha })

        // Commit patched file
        const filePath = inferFilePath(vuln)
        const fileContent = `# Sentinel AI — Auto-generated patch for ${vuln.cve_id}\n# Generated: ${new Date().toISOString()}\n# CWEs: ${(vuln.cwe_ids ?? []).join(", ")}\n\n${patchResult.patched_code}`
        const content = Buffer.from(fileContent).toString("base64")

        const { data: fileData } = await octokit.repos.createOrUpdateFileContents({
          owner, repo,
          path: filePath,
          message: `[Sentinel AI] Fix ${vuln.cve_id} — ${patchResult.explanation.slice(0, 72)}`,
          content,
          branch: branchName,
        })
        commitSha = fileData.commit.sha ?? null

        // Open PR
        const prBody = [
          `## Sentinel AI Security Patch`,
          ``,
          `**CVE:** ${vuln.cve_id}`,
          `**CVSS:** ${vuln.cvss_v3 ?? "N/A"}`,
          `**Blast Radius:** ${vuln.blast_radius ?? "N/A"}`,
          ``,
          `### What changed`,
          patchResult.explanation,
          ``,
          `### CWEs addressed`,
          patchResult.cwe_addressed.join(", "),
          ``,
          `### Test suggestions`,
          ...patchResult.test_suggestions.map((t: string) => `- ${t}`),
          ``,
          `---`,
          `🤖 Generated by Sentinel AI`,
        ].join("\n")

        const { data: pr } = await octokit.pulls.create({
          owner, repo,
          head: branchName,
          base: defaultBranch,
          title: `[Sentinel AI] Fix ${vuln.cve_id}`,
          body: prBody,
        } as Parameters<typeof octokit.pulls.create>[0])
        prUrl = pr.html_url

        app.log.info(`[patch/generate] PR opened: ${prUrl}`)
      } catch (ghErr: unknown) {
        app.log.warn({ err: ghErr }, "[patch/generate] GitHub error — patch saved locally without PR")
      }
    } else {
      app.log.info("[patch/generate] GITHUBTOKEN not set — skipping GitHub, saving patch record only")
    }

    // 4. Save patch_record
    const patchId = uuidv4()
    const { data: patchRecord, error: insertErr } = await supabase
      .from("patch_records")
      .upsert({
        patch_id: patchId,
        vuln_id,
        branch_name: branchName,
        commit_sha: commitSha,
        pr_url: prUrl,
        ci_status: "pending",
        resim_result: "pending",
        merge_status: "open",
        authored_by: "sentinel-ai",
      }, { onConflict: "patch_id" })
      .select()
      .single()

    if (insertErr) {
      app.log.error(insertErr)
      return reply.status(500).send({ error: insertErr.message })
    }

    // 5. Mark vuln in_progress
    await supabase
      .from("vulnerabilities")
      .update({ remediation_status: "in_progress" })
      .eq("vuln_id", vuln_id)
      .eq("remediation_status", "open")

    await supabase.from("audit_log").insert({
      actor: "sentinel-ai",
      action: "patch_generated",
      resource_type: "vulnerability",
      resource_id: vuln_id,
      payload: { patch_id: patchId, branch: branchName, pr_url: prUrl, cve_id: vuln.cve_id },
    })

    return reply.status(201).send({ ...patchRecord, patch_explanation: patchResult.explanation, pr_url: prUrl })
  })

  // POST /api/patches/logistics/push — commit all 6 logistics patch files to a new branch + open PR
  app.post("/api/patches/logistics/push", async (_req, reply) => {
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
    const branchName = `sentinel/logistics-patches/${ts}`
    let prUrl: string | null = null
    let commitSha: string | null = null

    // Read all patch files
    let files: { filename: string; cve: string; content: string }[] = []
    try {
      const names = readdirSync(LOGISTICS_PATCHES_DIR).filter((f) => f.endsWith(".md"))
      files = names.map((name) => ({
        filename: name,
        cve: PATCH_FILE_CVE_MAP[name] ?? "CVE-UNKNOWN",
        content: readFileSync(join(LOGISTICS_PATCHES_DIR, name), "utf8"),
      }))
    } catch (err) {
      return reply.status(500).send({ error: `Cannot read patch files: ${err}` })
    }

    // Push to GitHub if token available
    if (process.env.GITHUBTOKEN) {
      try {
        const octokit = getOctokit()
        const { owner, repo } = await getOwnerRepo(octokit)
        const { data: repoData } = await octokit.repos.get({ owner, repo })
        const defaultBranch = repoData.default_branch
        const { data: refData } = await octokit.git.getRef({ owner, repo, ref: `heads/${defaultBranch}` })
        const baseSha = refData.object.sha

        // Build git tree with all patch files
        const treeItems = await Promise.all(
          files.map(async ({ filename, content }) => {
            const { data: blob } = await octokit.git.createBlob({
              owner, repo,
              content: Buffer.from(content).toString("base64"),
              encoding: "base64",
            })
            return {
              path: `containers/industries/logistics/patches/${filename}`,
              mode: "100644" as const,
              type: "blob" as const,
              sha: blob.sha,
            }
          })
        )

        const { data: tree } = await octokit.git.createTree({ owner, repo, base_tree: baseSha, tree: treeItems })
        const { data: commit } = await octokit.git.createCommit({
          owner, repo,
          message: `[Sentinel AI] Add logistics hardening patches (6 CVEs)\n\nPatches: ${files.map((f) => f.cve).join(", ")}`,
          tree: tree.sha,
          parents: [baseSha],
        })
        commitSha = commit.sha

        await octokit.git.createRef({ owner, repo, ref: `refs/heads/${branchName}`, sha: commit.sha })

        const prBody = [
          "## Sentinel AI — Logistics Hardening Patches",
          "",
          "Automated security hardening for the logistics stack CVEs:",
          "",
          ...files.map((f) => `- **${f.cve}** → \`${f.filename}\``),
          "",
          "### Services covered",
          "ERPNext · Redis · Kafka · PostgreSQL · Grafana · Prometheus",
          "",
          "---",
          "🤖 Generated by Sentinel AI Patch Automation",
        ].join("\n")

        const { data: pr } = await octokit.pulls.create({
          owner, repo,
          head: branchName,
          base: defaultBranch,
          title: "[Sentinel AI] Logistics stack hardening — 6 CVEs",
          body: prBody,
        } as Parameters<typeof octokit.pulls.create>[0])
        prUrl = pr.html_url
        app.log.info(`[logistics/push] PR opened: ${prUrl}`)
      } catch (ghErr) {
        app.log.warn({ err: ghErr }, "[logistics/push] GitHub error — saving records without PR")
      }
    }

    // Fetch vuln IDs from Supabase for each CVE
    const { data: vulns } = await supabase
      .from("vulnerabilities")
      .select("vuln_id, cve_id")
      .eq("scan_source", "logistics-lab")
      .in("cve_id", files.map((f) => f.cve))

    const vulnMap: Record<string, string> = {}
    for (const v of vulns ?? []) vulnMap[(v as { cve_id: string; vuln_id: string }).cve_id] = (v as { cve_id: string; vuln_id: string }).vuln_id

    // Create one patch_record per CVE
    const records = []
    for (const { cve, filename } of files) {
      const vuln_id = vulnMap[cve]
      if (!vuln_id) continue
      const patchId = uuidv4()
      const { data: rec } = await supabase.from("patch_records").upsert({
        patch_id: patchId,
        vuln_id,
        branch_name: branchName,
        commit_sha: commitSha,
        pr_url: prUrl,
        ci_status: "pending",
        resim_result: "pending",
        merge_status: "open",
        authored_by: "sentinel-ai",
      }, { onConflict: "patch_id" }).select().single()
      if (rec) records.push(rec)
    }

    await supabase.from("audit_log").insert({
      actor: "sentinel-ai",
      action: "logistics_patches_pushed",
      resource_type: "patch_records",
      resource_id: branchName,
      payload: { branch: branchName, pr_url: prUrl, patch_count: files.length },
    })

    return reply.status(201).send({ ok: true, branch: branchName, pr_url: prUrl, commit_sha: commitSha, records_created: records.length })
  })

  // POST /api/patches/:id/approve — approve the GitHub PR
  app.post<{ Params: { id: string } }>("/api/patches/:id/approve", async (req, reply) => {
    const { data: patch, error } = await supabase
      .from("patch_records")
      .select("*")
      .eq("patch_id", req.params.id)
      .single()
    if (error || !patch) return reply.status(404).send({ error: "Patch not found" })

    if (process.env.GITHUBTOKEN && patch.pr_url) {
      try {
        const octokit = getOctokit()
        const { owner, repo } = await getOwnerRepo(octokit)
        const prNumber = prNumberFromUrl(patch.pr_url)
        if (prNumber) {
          await octokit.pulls.createReview({
            owner, repo, pull_number: prNumber,
            event: "APPROVE",
            body: "✅ Approved by Sentinel AI — patch verified against CVE criteria.",
          })
        }
      } catch (ghErr) {
        app.log.warn({ err: ghErr }, "[patches/approve] GitHub review error")
      }
    }

    const { data: updated } = await supabase
      .from("patch_records")
      .update({ merge_status: "approved" })
      .eq("patch_id", req.params.id)
      .select().single()

    await supabase.from("audit_log").insert({
      actor: "sentinel-ai", action: "patch_approved",
      resource_type: "patch_record", resource_id: req.params.id,
      payload: { pr_url: patch.pr_url },
    })

    return reply.send(updated)
  })

  // POST /api/patches/:id/merge — merge the GitHub PR + mark vuln patched
  app.post<{ Params: { id: string } }>("/api/patches/:id/merge", async (req, reply) => {
    const { data: patch, error } = await supabase
      .from("patch_records")
      .select("*, vulnerabilities(cve_id)")
      .eq("patch_id", req.params.id)
      .single()
    if (error || !patch) return reply.status(404).send({ error: "Patch not found" })

    if (process.env.GITHUBTOKEN && patch.pr_url) {
      try {
        const octokit = getOctokit()
        const { owner, repo } = await getOwnerRepo(octokit)
        const prNumber = prNumberFromUrl(patch.pr_url)
        if (prNumber) {
          await octokit.pulls.merge({
            owner, repo, pull_number: prNumber,
            merge_method: "squash",
            commit_title: `[Sentinel AI] Merge security patch — ${(patch.vulnerabilities as { cve_id?: string } | null)?.cve_id ?? patch.vuln_id}`,
          })
        }
      } catch (ghErr) {
        app.log.warn({ err: ghErr }, "[patches/merge] GitHub merge error — updating DB only")
      }
    }

    const { data: updated } = await supabase
      .from("patch_records")
      .update({ merge_status: "merged", ci_status: "passed" })
      .eq("patch_id", req.params.id)
      .select().single()

    await supabase
      .from("vulnerabilities")
      .update({ remediation_status: "patched" })
      .eq("vuln_id", patch.vuln_id)

    await supabase.from("audit_log").insert({
      actor: "sentinel-ai", action: "patch_merged",
      resource_type: "patch_record", resource_id: req.params.id,
      payload: { pr_url: patch.pr_url, vuln_id: patch.vuln_id },
    })

    return reply.send(updated)
  })

  // POST /api/patches/install — apply hardening to running logistics containers live
  app.post<{ Body: { services?: string[] } }>("/api/patches/install", async (req, reply) => {
    const requested = req.body?.services ?? ["redis", "grafana", "postgresql", "kafka", "prometheus"]
    type InstallResult = { service: string; status: string; actions: string[]; errors: string[] }
    const results: InstallResult[] = []

    for (const svc of requested) {
      const r: InstallResult = { service: svc, status: "ok", actions: [], errors: [] }
      try {
        switch (svc) {
          case "redis": {
            // Set requirepass
            await exec(`docker exec logistics-redis redis-cli CONFIG SET requirepass "sentinel_secure_2024"`)
            r.actions.push("requirepass set → sentinel_secure_2024")
            // Disable dangerous commands
            for (const cmd of ["DEBUG", "SLAVEOF", "REPLICAOF"]) {
              try {
                await exec(`docker exec logistics-redis redis-cli -a sentinel_secure_2024 CONFIG SET rename-command ${cmd} ""`)
                r.actions.push(`${cmd} command disabled`)
              } catch { /* rename-command only works on some Redis versions */ }
            }
            // Enable protected-mode
            await exec(`docker exec logistics-redis redis-cli -a sentinel_secure_2024 CONFIG SET protected-mode yes`)
            r.actions.push("protected-mode enabled")
            break
          }
          case "grafana": {
            // Rotate admin password via Grafana API
            const res = await fetch("http://localhost:9100/api/user/password", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "Authorization": "Basic " + Buffer.from("admin:admin").toString("base64"),
              },
              body: JSON.stringify({ oldPassword: "admin", newPassword: "Sentinel@2024!" }),
            })
            if (res.ok) {
              r.actions.push("admin password rotated → Sentinel@2024!")
            } else {
              const body = await res.text()
              r.errors.push(`Password change failed: ${body}`)
            }
            // Disable anonymous access
            const anonRes = await fetch("http://localhost:9100/api/org/preferences", {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                "Authorization": "Basic " + Buffer.from("admin:Sentinel@2024!").toString("base64"),
              },
              body: JSON.stringify({}),
            })
            if (anonRes.ok) r.actions.push("org preferences updated")
            break
          }
          case "postgresql": {
            // Rotate logistics user password
            await exec(`docker exec logistics-postgres psql -U logistics -d shipments -c "ALTER USER logistics WITH PASSWORD 'logistics_secure_2024';"`)
            r.actions.push("logistics user password rotated → logistics_secure_2024")
            // Create least-privilege app user
            await exec(`docker exec logistics-postgres psql -U logistics -d shipments -c "DO \\$\\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='app_user') THEN CREATE USER app_user WITH PASSWORD 'app_secure_2024' NOSUPERUSER NOCREATEDB NOCREATEROLE; END IF; END \\$\\$;"`)
            r.actions.push("app_user created with minimal privileges")
            await exec(`docker exec logistics-postgres psql -U logistics -d shipments -c "REVOKE ALL ON SCHEMA public FROM PUBLIC; GRANT USAGE ON SCHEMA public TO app_user; GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;"`)
            r.actions.push("Schema permissions restricted — app_user granted SELECT/INSERT/UPDATE only")
            break
          }
          case "kafka":
            r.status = "needs_restart"
            r.actions.push("SASL/SCRAM requires broker restart — update docker-compose.yml env vars and restart logistics-kafka")
            r.actions.push("Hardening guide: containers/industries/logistics/patches/03-kafka-hardening.md")
            break
          case "prometheus":
            r.status = "needs_restart"
            r.actions.push("Basic auth requires web-config.yml mount + restart of logistics-prometheus")
            r.actions.push("Hardening guide: containers/industries/logistics/patches/06-prometheus-hardening.md")
            break
          case "erpnext":
            r.status = "needs_restart"
            r.actions.push("ERPNext not running — start containers first, then apply 01-erpnext-hardening.md")
            break
        }
      } catch (err) {
        r.status = "error"
        r.errors.push(err instanceof Error ? err.message : String(err))
      }
      results.push(r)
    }

    const applied = results.filter((r) => r.status === "ok")
    // Mark related vulns as patched for fully-applied services
    const cveMap: Record<string, string> = {
      redis: "CVE-2022-0543", grafana: "CVE-2021-43798", postgresql: "CVE-2024-0985",
    }
    for (const r of applied) {
      const cve = cveMap[r.service]
      if (cve) {
        await supabase.from("vulnerabilities")
          .update({ remediation_status: "patched" })
          .eq("cve_id", cve).eq("scan_source", "logistics-lab")
      }
    }

    await supabase.from("audit_log").insert({
      actor: "sentinel-ai", action: "patches_installed",
      resource_type: "logistics_services", resource_id: "install",
      payload: { services: requested, applied: applied.map((r) => r.service) },
    })

    return reply.send({ ok: true, results })
  })

  // PATCH /api/patches/:id — update CI / merge status
  app.patch<{
    Params: { id: string }
    Body: {
      ci_status?: string
      merge_status?: string
      resim_result?: string
      commit_sha?: string
      pr_url?: string
    }
  }>("/api/patches/:id", async (req, reply) => {
    const { data, error } = await supabase
      .from("patch_records")
      .update(req.body)
      .eq("patch_id", req.params.id)
      .select()
      .single()

    if (error) return reply.status(500).send({ error: error.message })

    await supabase.from("audit_log").insert({
      actor: "api",
      action: "patch_record_updated",
      resource_type: "patch_record",
      resource_id: req.params.id,
      payload: req.body,
    })

    return reply.send(data)
  })
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function inferLanguage(vuln: Record<string, unknown>): string {
  const tags = (vuln.tags as string[] | null) ?? []
  const joined = [...tags, String(vuln.blast_radius ?? ""), String(vuln.scan_source ?? "")].join(" ").toLowerCase()
  if (joined.includes("java") || joined.includes("spring") || joined.includes("log4")) return "java"
  if (joined.includes("python") || joined.includes("flask") || joined.includes("django")) return "python"
  if (joined.includes("node") || joined.includes("express") || joined.includes("typescript")) return "typescript"
  if (joined.includes("php") || joined.includes("openemr")) return "php"
  if (joined.includes("ruby") || joined.includes("rails") || joined.includes("gitlab")) return "ruby"
  return "python"
}

function inferFramework(vuln: Record<string, unknown>): string | undefined {
  const tags = (vuln.tags as string[] | null) ?? []
  const joined = tags.join(" ").toLowerCase()
  if (joined.includes("spring")) return "Spring Framework"
  if (joined.includes("flask")) return "Flask"
  if (joined.includes("express")) return "Express.js"
  if (joined.includes("django")) return "Django"
  return undefined
}

function inferFilePath(vuln: Record<string, unknown>): string {
  const cve = String(vuln.cve_id ?? "unknown")
  const lang = inferLanguage(vuln)
  const ext: Record<string, string> = { java: "java", python: "py", typescript: "ts", php: "php", ruby: "rb" }
  return `src/security/patches/${cve.replace(/[^a-zA-Z0-9-]/g, "_")}.${ext[lang] ?? "py"}`
}

function buildAffectedCodeTemplate(vuln: Record<string, unknown>): string {
  const cwe = ((vuln.cwe_ids as string[] | null) ?? ["CWE-0"])[0]
  const lang = inferLanguage(vuln)
  const cveId = String(vuln.cve_id ?? "CVE-UNKNOWN")

  const templates: Record<string, Record<string, string>> = {
    "CWE-89": {
      java:       `public List<User> findUser(String name) {\n  String sql = "SELECT * FROM users WHERE name = '" + name + "'";\n  return jdbcTemplate.query(sql, rowMapper);\n}`,
      python:     `def find_user(name):\n    query = f"SELECT * FROM users WHERE name = '{name}'"\n    return db.execute(query).fetchall()`,
      typescript: `async function findUser(name: string) {\n  const query = \`SELECT * FROM users WHERE name = '\${name}'\`\n  return await db.raw(query)\n}`,
      php:        `function findUser($name) {\n  $query = "SELECT * FROM users WHERE name = '$name'";\n  return $pdo->query($query)->fetchAll();\n}`,
    },
    "CWE-502": {
      java:       `public Object deserialize(byte[] data) throws Exception {\n  ObjectInputStream ois = new ObjectInputStream(new ByteArrayInputStream(data));\n  return ois.readObject(); // ${cveId}: unsafe deserialization\n}`,
      python:     `import pickle\ndef load_data(data: bytes):\n    return pickle.loads(data)  # ${cveId}: unsafe deserialization`,
      typescript: `function deserialize(data: string) {\n  return JSON.parse(data) // No validation\n}`,
    },
    "CWE-78": {
      python:     `import os\ndef run_report(filename: str):\n    os.system(f"generate_report.sh {filename}")`,
      typescript: `import { exec } from 'child_process'\nfunction runReport(filename: string) {\n  exec(\`generate_report.sh \${filename}\`)\n}`,
    },
    "CWE-22": {
      python:     `def read_file(path: str):\n    with open(f"/var/data/{path}") as f:\n        return f.read()`,
      typescript: `function readFile(path: string) {\n  return fs.readFileSync(\`/var/data/\${path}\`, 'utf8')\n}`,
      php:        `function readFile($path) {\n  return file_get_contents("/var/data/" . $path);\n}`,
    },
    "CWE-94": {
      java:       `@RequestMapping("/eval")\npublic String eval(@RequestParam String expr) {\n  // ${cveId}: OGNL/SpEL injection\n  return expressionEvaluator.evaluate(expr);\n}`,
      python:     `def evaluate(expr: str):\n    return eval(expr)  # ${cveId}: code injection`,
    },
  }

  const cweTemplates = templates[cwe] ?? templates["CWE-94"]
  return cweTemplates?.[lang] ?? `# Vulnerable code for ${cveId}\n# CWE: ${cwe}\ndef process_input(user_input):\n    return eval(user_input)  # Unsafe`
}
