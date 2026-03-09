import type { FastifyInstance } from "fastify"
import { supabase } from "../lib/supabase.js"
import { generatePatch } from "../ai/patch-generation.js"
import { getOctokit } from "../integrations/github/client.js"
import { v4 as uuidv4 } from "uuid"

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
