import { google } from "googleapis"
import { getGcpAuth, getProjectId } from "./client.js"
import { supabase } from "../../lib/supabase.js"

export interface GcpInstance {
  id: string
  name: string
  zone: string
  machine_type: string
  status: string
  internal_ip: string | null
  external_ip: string | null
  os_name: string | null
  tags: string[]
  labels: Record<string, string>
  creation_timestamp: string
  last_start_timestamp: string | null
}

// Fetch all VM instances across all zones in the project
export async function listAllInstances(): Promise<GcpInstance[]> {
  const auth = getGcpAuth()
  const compute = google.compute({ version: "v1", auth })
  const projectId = getProjectId()

  const { data } = await compute.instances.aggregatedList({
    project: projectId,
    maxResults: 500,
  })

  const instances: GcpInstance[] = []

  for (const [, zoneData] of Object.entries(data.items ?? {})) {
    for (const vm of zoneData.instances ?? []) {
      const networkInterface = vm.networkInterfaces?.[0]
      const externalIp =
        networkInterface?.accessConfigs?.[0]?.natIP ?? null

      // Derive zone short name from full URL like zones/us-central1-a
      const zoneFull = vm.zone ?? ""
      const zone = zoneFull.split("/").pop() ?? zoneFull

      instances.push({
        id: vm.id ?? "",
        name: vm.name ?? "",
        zone,
        machine_type: (vm.machineType ?? "").split("/").pop() ?? "",
        status: vm.status ?? "UNKNOWN",
        internal_ip: networkInterface?.networkIP ?? null,
        external_ip: externalIp,
        os_name: vm.disks?.[0]?.licenses?.[0]?.split("/").pop() ?? null,
        tags: vm.tags?.items ?? [],
        labels: (vm.labels as Record<string, string>) ?? {},
        creation_timestamp: vm.creationTimestamp ?? "",
        last_start_timestamp: vm.lastStartTimestamp ?? null,
      })
    }
  }

  return instances
}

// Sync GCP instances into Sentinel assets table
export async function syncGcpInstancesToAssets(orgId: string): Promise<{ synced: number; errors: number }> {
  const instances = await listAllInstances()
  let synced = 0
  let errors = 0

  for (const vm of instances) {
    const ip: string[] = []
    if (vm.internal_ip) ip.push(vm.internal_ip)
    if (vm.external_ip) ip.push(vm.external_ip)

    const { error } = await supabase.from("assets").upsert(
      {
        org_id: orgId,
        type: "cloud_resource",
        hostname: vm.name,
        ip,
        tags: [`gcp`, `zone:${vm.zone}`, vm.machine_type],
        criticality: vm.external_ip ? "high" : "medium",
        os_version: vm.os_name ?? null,
        patch_status: "unknown",
        source: "gcp",
        external_id: vm.id,
        last_scan_at: new Date().toISOString(),
      },
      { onConflict: "source,external_id" }
    )

    if (error) {
      console.error(`[gcp/compute] upsert failed for ${vm.name}:`, error.message)
      errors++
    } else {
      synced++
    }
  }

  return { synced, errors }
}
