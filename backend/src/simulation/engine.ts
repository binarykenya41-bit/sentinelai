/**
 * Exploit Simulation Engine — Orchestrator
 *
 * Coordinates the full simulation lifecycle:
 *  1. Validate request + CVSS gate
 *  2. Resolve exploit module
 *  3. Provision sandbox
 *  4. Execute + stream logs
 *  5. Persist ExploitResult to Supabase
 *  6. Destroy sandbox
 */
import { createHash } from "crypto"
import { v4 as uuidv4 } from "uuid"
import { supabase } from "../lib/supabase.js"
import { runSandbox, killSandbox, listRunningSandboxes, ensureSandboxNetwork } from "./sandbox.js"
import {
  getModuleById,
  getModulesForCve,
  MODULE_CATALOG,
  type ExploitModule,
} from "./modules.js"

export interface SimulationRequest {
  vuln_id: string           // Supabase vulnerability UUID
  cve_id?: string           // optional — used for module auto-selection
  module_id?: string        // explicit module to run
  target_host: string       // IP or hostname of isolated sandbox target
  target_port?: number
  operator_id: string       // who triggered this simulation
  dry_run?: boolean         // if true, skip actual execution
}

export interface SimulationStatus {
  result_id: string
  vuln_id: string
  module_id: string
  sandbox_id: string | null
  status: "pending" | "running" | "completed" | "failed" | "killed"
  success: boolean | null
  confidence: number | null
  technique: string | null
  duration_ms: number | null
  executed_at: string
  output_summary: string | null
}

// In-memory running simulations map (sandbox_id → status)
const runningSimulations = new Map<string, SimulationStatus>()

function computeConfidence(
  module: ExploitModule,
  exitCode: number,
  timedOut: boolean,
  stdout: string
): { success: boolean; confidence: number } {
  if (timedOut) return { success: false, confidence: 0.1 }

  // Heuristic: look for success indicators in output
  const output = stdout.toLowerCase()
  const successSignals = [
    "vulnerable", "exploited", "success", "shell", "access granted",
    "authentication bypass", "rce confirmed", "injection successful",
  ]
  const failSignals = [
    "not vulnerable", "patched", "mitigated", "blocked", "refused",
    "connection refused", "forbidden",
  ]

  const successHits = successSignals.filter((s) => output.includes(s)).length
  const failHits = failSignals.filter((s) => output.includes(s)).length

  const success = exitCode === 0 && successHits > failHits
  const confidence = success
    ? Math.min(0.5 + successHits * 0.1, 0.95)
    : Math.max(0.1, 0.5 - failHits * 0.1)

  return { success, confidence }
}

export async function runSimulation(req: SimulationRequest): Promise<SimulationStatus> {
  await ensureSandboxNetwork()

  // Resolve module
  let module: ExploitModule | undefined = req.module_id
    ? getModuleById(req.module_id)
    : req.cve_id
    ? getModulesForCve(req.cve_id)[0]
    : MODULE_CATALOG[0]

  if (!module) {
    throw new Error(`No exploit module found for module_id=${req.module_id} cve_id=${req.cve_id}`)
  }

  const resultId = uuidv4()
  const status: SimulationStatus = {
    result_id: resultId,
    vuln_id: req.vuln_id,
    module_id: module.module_id,
    sandbox_id: null,
    status: "pending",
    success: null,
    confidence: null,
    technique: module.technique_ids[0] ?? null,
    duration_ms: null,
    executed_at: new Date().toISOString(),
    output_summary: null,
  }

  if (req.dry_run) {
    status.status = "completed"
    status.success = false
    status.confidence = 0
    status.output_summary = "[DRY RUN] Simulation skipped — no sandbox provisioned"
    return status
  }

  // Execute sandbox
  status.status = "running"

  const sandboxResult = await runSandbox({
    image: module.sandbox_image,
    command: [...module.entry_command, req.target_host, String(req.target_port ?? 80)],
    target_host: req.target_host,
    target_port: req.target_port,
    timeout_ms: module.timeout_ms,
    env: {
      SENTINEL_SIM_ID: resultId,
      SENTINEL_CVE: req.cve_id ?? "",
      SENTINEL_MODULE: module.module_id,
    },
  })

  status.sandbox_id = sandboxResult.sandbox_id
  runningSimulations.set(sandboxResult.sandbox_id, status)

  const { success, confidence } = computeConfidence(
    module,
    sandboxResult.exit_code,
    sandboxResult.timed_out,
    sandboxResult.stdout
  )

  const payloadHash = createHash("sha256")
    .update(module.entry_command.join(" ") + req.target_host)
    .digest("hex")

  status.status = sandboxResult.timed_out ? "failed" : "completed"
  status.success = success
  status.confidence = confidence
  status.duration_ms = sandboxResult.duration_ms
  status.output_summary = sandboxResult.stdout.slice(0, 500) + (sandboxResult.stderr ? `\n[STDERR] ${sandboxResult.stderr.slice(0, 200)}` : "")

  // Persist to Supabase
  await supabase.from("exploit_results").insert({
    result_id: resultId,
    vuln_id: req.vuln_id,
    sandbox_id: sandboxResult.sandbox_id,
    success,
    confidence,
    technique: status.technique,
    payload_hash: payloadHash,
    output_log_ref: null, // TODO: upload stdout to Supabase Storage
    duration_ms: sandboxResult.duration_ms,
    executed_at: status.executed_at,
  })

  runningSimulations.delete(sandboxResult.sandbox_id)
  return status
}

export async function killSimulation(sandboxId: string): Promise<void> {
  await killSandbox(sandboxId)
  const status = runningSimulations.get(sandboxId)
  if (status) {
    status.status = "killed"
    runningSimulations.delete(sandboxId)
  }
}

export async function killAllSimulations(): Promise<string[]> {
  const running = await listRunningSandboxes()
  await Promise.allSettled(running.map(killSandbox))
  running.forEach((id) => runningSimulations.delete(id))
  return running
}

export function getRunningSimulations(): SimulationStatus[] {
  return Array.from(runningSimulations.values())
}
