/**
 * Sandbox Lifecycle Manager
 *
 * Manages Docker containers used as isolated exploit simulation sandboxes.
 * Each simulation runs in a dedicated container that is:
 *  - Network-namespaced (no route to production)
 *  - CPU/memory limited
 *  - Auto-destroyed post-run
 *
 * Requires Docker to be available on the host. In production this integrates
 * with the Firecracker micro-VM fleet via the sandbox API.
 */
import { exec } from "child_process";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";
const execAsync = promisify(exec);
const SANDBOX_NETWORK = process.env.SANDBOX_NETWORK ?? "sentinel-sandbox";
const SANDBOX_IMAGE_DEFAULT = "sentinelai/sandbox:latest";
export function generateSandboxId() {
    return `sb-${uuidv4()}`;
}
/**
 * Ensure the isolated sandbox Docker network exists.
 * This network has no route to production subnets.
 */
export async function ensureSandboxNetwork() {
    try {
        await execAsync(`docker network inspect ${SANDBOX_NETWORK}`);
    }
    catch {
        await execAsync(`docker network create --driver bridge --internal ${SANDBOX_NETWORK}`);
    }
}
/**
 * Run a simulation inside a Docker sandbox container.
 * Container is automatically removed after execution.
 */
export async function runSandbox(config) {
    const sandboxId = generateSandboxId();
    const startTime = Date.now();
    const envFlags = Object.entries(config.env ?? {})
        .map(([k, v]) => `-e ${k}="${v}"`)
        .join(" ");
    const targetEnv = [
        config.target_host ? `-e SANDBOX_TARGET_HOST="${config.target_host}"` : "",
        config.target_port ? `-e SANDBOX_TARGET_PORT="${config.target_port}"` : "",
    ]
        .filter(Boolean)
        .join(" ");
    const cpuFlag = config.cpu_quota ? `--cpu-quota ${config.cpu_quota}` : "--cpu-quota 50000";
    const memFlag = config.memory_mb ? `--memory ${config.memory_mb}m` : "--memory 512m";
    const image = config.image ?? SANDBOX_IMAGE_DEFAULT;
    const cmd = config.command.map((c) => `"${c}"`).join(" ");
    const dockerCmd = [
        "docker run",
        "--rm",
        `--name ${sandboxId}`,
        `--network ${SANDBOX_NETWORK}`,
        "--cap-drop ALL",
        "--security-opt no-new-privileges",
        "--read-only",
        `--tmpfs /tmp:rw,size=64m`,
        cpuFlag,
        memFlag,
        "--pids-limit 100",
        envFlags,
        targetEnv,
        image,
        cmd,
    ]
        .filter(Boolean)
        .join(" ");
    let stdout = "";
    let stderr = "";
    let exit_code = 0;
    let timed_out = false;
    const timeoutMs = Math.min(config.timeout_ms, 600_000); // max 10 min
    try {
        const result = await Promise.race([
            execAsync(dockerCmd, { maxBuffer: 5 * 1024 * 1024 }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("SANDBOX_TIMEOUT")), timeoutMs)),
        ]);
        stdout = result.stdout;
        stderr = result.stderr;
    }
    catch (err) {
        const error = err;
        if (error.message === "SANDBOX_TIMEOUT") {
            timed_out = true;
            stderr = "Sandbox execution timed out";
            // Kill the container
            try {
                await execAsync(`docker kill ${sandboxId}`);
            }
            catch { /* already gone */ }
        }
        else {
            exit_code = error.code ?? 1;
            stdout = error.stdout ?? "";
            stderr = error.stderr ?? error.message;
        }
    }
    return {
        sandbox_id: sandboxId,
        exit_code,
        stdout: stdout.slice(0, 50_000), // cap output
        stderr: stderr.slice(0, 10_000),
        duration_ms: Date.now() - startTime,
        timed_out,
    };
}
/**
 * Kill a running sandbox container immediately.
 */
export async function killSandbox(sandboxId) {
    await execAsync(`docker kill ${sandboxId}`).catch(() => { });
}
/**
 * List all currently running sandbox containers (by name prefix).
 */
export async function listRunningSandboxes() {
    const { stdout } = await execAsync(`docker ps --filter "name=sb-" --format "{{.Names}}" 2>/dev/null || echo ""`);
    return stdout.trim().split("\n").filter(Boolean);
}
//# sourceMappingURL=sandbox.js.map