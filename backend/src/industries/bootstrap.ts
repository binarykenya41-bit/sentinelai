import { supabase } from "../lib/supabase"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import { getLogisticsData } from "./seeds/logistics"
import { getFintechData } from "./seeds/fintech"
import { getEcommerceData } from "./seeds/ecommerce"
import { getHealthcareData } from "./seeds/healthcare"

const execAsync = promisify(exec)

export type Industry = "logistics" | "fintech" | "ecommerce" | "healthcare"

import { fileURLToPath } from "url"
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const COMPOSE_BASE = path.resolve(__dirname, "../../../containers/industries")

export async function bootstrapIndustry(industry: Industry): Promise<{
  status: "ok"
  org_id: string
  services: string[]
  containers: string
}> {
  const data = getSeedData(industry)

  await wipeDemoData()
  await seedOrganization(data.org)
  await seedAssets(data.assets)
  await seedVulnerabilities(data.vulnerabilities)
  await seedExploitResults(data.exploit_results)
  await seedPatchRecords(data.patch_records)
  await seedComplianceReports(data.compliance_reports)

  // Start containers asynchronously — don't block the response
  const composePath = path.join(COMPOSE_BASE, industry, "docker-compose.yml")
  startContainers(composePath, industry).catch((err) =>
    console.warn(`[bootstrap] container start warning for ${industry}:`, err.message)
  )

  return {
    status: "ok",
    org_id: data.org.org_id,
    services: data.assets.map((a: { hostname: string }) => a.hostname),
    containers: `containers/industries/${industry}/docker-compose.yml`,
  }
}

async function wipeDemoData() {
  // Delete in FK-safe order (children first)
  const NEVER_ID = "00000000-0000-0000-0000-000000000000"
  await supabase.from("patch_records").delete().neq("patch_id", NEVER_ID)
  await supabase.from("exploit_results").delete().neq("result_id", NEVER_ID)
  await supabase.from("compliance_reports").delete().neq("report_id", NEVER_ID)
  await supabase.from("vulnerabilities").delete().neq("vuln_id", NEVER_ID)
  await supabase.from("assets").delete().neq("asset_id", NEVER_ID)
  await supabase.from("organizations").delete().neq("org_id", NEVER_ID)
}

async function seedOrganization(org: Record<string, unknown>) {
  const { error } = await supabase.from("organizations").upsert(org, { onConflict: "org_id" })
  if (error) throw new Error(`org seed failed: ${error.message}`)
}

async function seedAssets(assets: Record<string, unknown>[]) {
  const { error } = await supabase.from("assets").upsert(assets, { onConflict: "asset_id" })
  if (error) throw new Error(`assets seed failed: ${error.message}`)
}

async function seedVulnerabilities(vulns: Record<string, unknown>[]) {
  const { error } = await supabase.from("vulnerabilities").upsert(vulns, { onConflict: "vuln_id" })
  if (error) throw new Error(`vulnerabilities seed failed: ${error.message}`)
}

async function seedExploitResults(results: Record<string, unknown>[]) {
  if (!results.length) return
  const { error } = await supabase.from("exploit_results").upsert(results, { onConflict: "result_id" })
  if (error) throw new Error(`exploit_results seed failed: ${error.message}`)
}

async function seedPatchRecords(records: Record<string, unknown>[]) {
  if (!records.length) return
  const { error } = await supabase.from("patch_records").upsert(records, { onConflict: "patch_id" })
  if (error) throw new Error(`patch_records seed failed: ${error.message}`)
}

async function seedComplianceReports(reports: Record<string, unknown>[]) {
  if (!reports.length) return
  const { error } = await supabase.from("compliance_reports").upsert(reports, { onConflict: "report_id" })
  if (error) throw new Error(`compliance_reports seed failed: ${error.message}`)
}

async function startContainers(composePath: string, industry: string) {
  console.log(`[bootstrap] Starting ${industry} containers from ${composePath}`)
  try {
    await execAsync(`docker compose -f "${composePath}" up -d --remove-orphans`, {
      timeout: 120_000,
    })
    console.log(`[bootstrap] ${industry} containers started successfully`)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`[bootstrap] docker compose warning for ${industry}:`, msg)
  }
}

function getSeedData(industry: Industry) {
  switch (industry) {
    case "logistics": return getLogisticsData()
    case "fintech": return getFintechData()
    case "ecommerce": return getEcommerceData()
    case "healthcare": return getHealthcareData()
  }
}
