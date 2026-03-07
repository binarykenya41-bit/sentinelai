// Auto-generated TypeScript types for Sentinel AI database schema
// Re-generate after schema changes: supabase gen types typescript --project-id <id> > database/types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          org_id: string
          name: string
          plan_tier: "smb" | "mid-market" | "enterprise" | null
          compliance_frameworks: string[] | null
          api_keys: string[] | null
          created_at: string
        }
        Insert: {
          org_id?: string
          name: string
          plan_tier?: "smb" | "mid-market" | "enterprise" | null
          compliance_frameworks?: string[] | null
          api_keys?: string[] | null
          created_at?: string
        }
        Update: {
          org_id?: string
          name?: string
          plan_tier?: "smb" | "mid-market" | "enterprise" | null
          compliance_frameworks?: string[] | null
          api_keys?: string[] | null
          created_at?: string
        }
      }

      assets: {
        Row: {
          asset_id: string
          org_id: string | null
          type: "server" | "container" | "service" | "database" | "cloud_resource" | "network_device" | "endpoint" | null
          hostname: string | null
          ip: string[] | null
          tags: string[] | null
          criticality: "low" | "medium" | "high" | "critical" | null
          os_version: string | null
          installed_apps: Json | null
          open_ports: number[] | null
          patch_status: "current" | "behind" | "unknown" | null
          last_patch_date: string | null
          source: string | null
          external_id: string | null
          last_scan_at: string | null
          created_at: string
        }
        Insert: {
          asset_id?: string
          org_id?: string | null
          type?: "server" | "container" | "service" | "database" | "cloud_resource" | "network_device" | "endpoint" | null
          hostname?: string | null
          ip?: string[] | null
          tags?: string[] | null
          criticality?: "low" | "medium" | "high" | "critical" | null
          os_version?: string | null
          installed_apps?: Json | null
          open_ports?: number[] | null
          patch_status?: "current" | "behind" | "unknown" | null
          last_patch_date?: string | null
          source?: string | null
          external_id?: string | null
          last_scan_at?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["assets"]["Insert"]>
      }

      vulnerabilities: {
        Row: {
          vuln_id: string
          cve_id: string
          cvss_v3: number | null
          cwe_ids: string[] | null
          mitre_techniques: string[] | null
          epss_score: number | null
          kev_status: boolean
          affected_assets: string[] | null
          blast_radius: string | null
          scan_source: string | null
          detection_at: string
          remediation_status: "open" | "in_progress" | "patched" | "verified" | null
        }
        Insert: {
          vuln_id?: string
          cve_id: string
          cvss_v3?: number | null
          cwe_ids?: string[] | null
          mitre_techniques?: string[] | null
          epss_score?: number | null
          kev_status?: boolean
          affected_assets?: string[] | null
          blast_radius?: string | null
          scan_source?: string | null
          detection_at?: string
          remediation_status?: "open" | "in_progress" | "patched" | "verified" | null
        }
        Update: Partial<Database["public"]["Tables"]["vulnerabilities"]["Insert"]>
      }

      exploit_results: {
        Row: {
          result_id: string
          vuln_id: string | null
          sandbox_id: string | null
          success: boolean | null
          confidence: number | null
          technique: string | null
          payload_hash: string | null
          output_log_ref: string | null
          duration_ms: number | null
          executed_at: string
        }
        Insert: {
          result_id?: string
          vuln_id?: string | null
          sandbox_id?: string | null
          success?: boolean | null
          confidence?: number | null
          technique?: string | null
          payload_hash?: string | null
          output_log_ref?: string | null
          duration_ms?: number | null
          executed_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["exploit_results"]["Insert"]>
      }

      patch_records: {
        Row: {
          patch_id: string
          vuln_id: string | null
          branch_name: string | null
          commit_sha: string | null
          pr_url: string | null
          ci_status: "pending" | "running" | "passed" | "failed" | null
          resim_result: "pending" | "exploit_failed" | "exploit_succeeded" | null
          merge_status: "open" | "approved" | "merged" | "blocked" | null
          authored_by: string
          created_at: string
        }
        Insert: {
          patch_id?: string
          vuln_id?: string | null
          branch_name?: string | null
          commit_sha?: string | null
          pr_url?: string | null
          ci_status?: "pending" | "running" | "passed" | "failed" | null
          resim_result?: "pending" | "exploit_failed" | "exploit_succeeded" | null
          merge_status?: "open" | "approved" | "merged" | "blocked" | null
          authored_by?: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["patch_records"]["Insert"]>
      }

      compliance_reports: {
        Row: {
          report_id: string
          org_id: string | null
          framework: "iso27001" | "soc2" | "pcidss" | null
          period_start: string | null
          period_end: string | null
          controls_mapped: Json | null
          evidence_refs: string[] | null
          generated_at: string
          pdf_ref: string | null
        }
        Insert: {
          report_id?: string
          org_id?: string | null
          framework?: "iso27001" | "soc2" | "pcidss" | null
          period_start?: string | null
          period_end?: string | null
          controls_mapped?: Json | null
          evidence_refs?: string[] | null
          generated_at?: string
          pdf_ref?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["compliance_reports"]["Insert"]>
      }

      audit_log: {
        Row: {
          log_id: string
          actor: string
          action: string
          resource_type: string | null
          resource_id: string | null
          payload: Json | null
          hmac: string | null
          logged_at: string
        }
        Insert: {
          log_id?: string
          actor: string
          action: string
          resource_type?: string | null
          resource_id?: string | null
          payload?: Json | null
          hmac?: string | null
          logged_at?: string
        }
        // audit_log is append-only — no Update type exposed
      }

      integrations: {
        Row: {
          integration_id: string
          org_id: string | null
          category: string
          tool_id: string
          name: string
          status: "connected" | "disconnected" | "pending" | "error"
          config: Json | null
          last_sync_at: string | null
          last_sync_status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          integration_id?: string
          org_id?: string | null
          category: string
          tool_id: string
          name: string
          status?: "connected" | "disconnected" | "pending" | "error"
          config?: Json | null
          last_sync_at?: string | null
          last_sync_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["integrations"]["Insert"]>
      }

      infrastructure_nodes: {
        Row: {
          node_id: string
          org_id: string | null
          name: string
          type: "cloud" | "network_device" | "endpoint" | "application" | null
          environment: "production" | "staging" | "development" | null
          description: string | null
          ip_address: string | null
          hostname: string | null
          mac_address: string | null
          network_segment: string | null
          open_ports: string | null
          protocols: string[] | null
          os_name: string | null
          os_version: string | null
          installed_apps: Json | null
          container_platform: string | null
          firewall_present: boolean | null
          endpoint_agent: string | null
          antivirus_edr: string | null
          auth_type: string | null
          encryption_protocols: string[] | null
          patch_status: "current" | "behind" | "unknown" | null
          last_patch_date: string | null
          known_cves: string[] | null
          cvss_scores: Json | null
          external_tool: string | null
          api_endpoint: string | null
          log_source: string | null
          created_at: string
        }
        Insert: {
          node_id?: string
          org_id?: string | null
          name: string
          type?: "cloud" | "network_device" | "endpoint" | "application" | null
          environment?: "production" | "staging" | "development" | null
          description?: string | null
          ip_address?: string | null
          hostname?: string | null
          mac_address?: string | null
          network_segment?: string | null
          open_ports?: string | null
          protocols?: string[] | null
          os_name?: string | null
          os_version?: string | null
          installed_apps?: Json | null
          container_platform?: string | null
          firewall_present?: boolean | null
          endpoint_agent?: string | null
          antivirus_edr?: string | null
          auth_type?: string | null
          encryption_protocols?: string[] | null
          patch_status?: "current" | "behind" | "unknown" | null
          last_patch_date?: string | null
          known_cves?: string[] | null
          cvss_scores?: Json | null
          external_tool?: string | null
          api_endpoint?: string | null
          log_source?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["infrastructure_nodes"]["Insert"]>
      }
    }

    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ---------------------------------------------------------------------------
// Convenience row types (use these throughout the app)
// ---------------------------------------------------------------------------
export type Organization = Database["public"]["Tables"]["organizations"]["Row"]
export type Asset = Database["public"]["Tables"]["assets"]["Row"]
export type Vulnerability = Database["public"]["Tables"]["vulnerabilities"]["Row"]
export type ExploitResult = Database["public"]["Tables"]["exploit_results"]["Row"]
export type PatchRecord = Database["public"]["Tables"]["patch_records"]["Row"]
export type ComplianceReport = Database["public"]["Tables"]["compliance_reports"]["Row"]
export type AuditLogEntry = Database["public"]["Tables"]["audit_log"]["Row"]
export type Integration = Database["public"]["Tables"]["integrations"]["Row"]
export type InfrastructureNode = Database["public"]["Tables"]["infrastructure_nodes"]["Row"]
