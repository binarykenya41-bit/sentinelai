export type ToolStatus = "connected" | "disconnected" | "pending"

export type ConfigField = {
  key: string
  label: string
  type: "text" | "password" | "url" | "select"
  placeholder: string
  options?: string[]
}

export type IntegrationTool = {
  id: string
  name: string
  status: ToolStatus
  description: string
  authType: string
  configFields: ConfigField[]
  dataCollected: string[]
}

export type IntegrationCategory = {
  id: string
  label: string
  description: string
  iconKey: string
  color: string
  tools: IntegrationTool[]
}

export const integrationCategories: IntegrationCategory[] = [
  {
    id: "codebase",
    label: "Codebase & SCM",
    description: "Connect source code repositories to scan for vulnerabilities, secrets, and misconfigurations. Enables automated security PRs and patch commits.",
    iconKey: "code",
    color: "chart-1",
    tools: [
      {
        id: "github",
        name: "GitHub",
        status: "connected",
        description: "Connect GitHub to enable automated security PRs, secret scanning, and code vulnerability detection across all repositories.",
        authType: "OAuth / Personal Access Token",
        configFields: [
          { key: "org", label: "Organization / User", type: "text", placeholder: "my-org" },
          { key: "token", label: "Personal Access Token", type: "password", placeholder: "ghp_..." },
          { key: "webhook_secret", label: "Webhook Secret", type: "password", placeholder: "webhook secret" },
          { key: "default_branch", label: "Default Branch", type: "text", placeholder: "main" },
        ],
        dataCollected: [
          "Repository list",
          "Pull request status",
          "Branch metadata",
          "CI/CD pipeline results",
          "Code scanning alerts",
          "Secret scanning alerts",
        ],
      },
      {
        id: "gitlab",
        name: "GitLab",
        status: "connected",
        description: "Connect GitLab to scan merge requests, enable SAST/DAST pipelines, and auto-create security fix MRs for detected CVEs.",
        authType: "Personal Access Token",
        configFields: [
          { key: "url", label: "GitLab Instance URL", type: "url", placeholder: "https://gitlab.com" },
          { key: "token", label: "Personal Access Token", type: "password", placeholder: "glpat-..." },
          { key: "group", label: "Group / Namespace", type: "text", placeholder: "my-group" },
        ],
        dataCollected: [
          "Project list",
          "Merge request status",
          "Pipeline results",
          "SAST findings",
          "Container registry images",
        ],
      },
      {
        id: "bitbucket",
        name: "Bitbucket",
        status: "disconnected",
        description: "Connect Bitbucket to enable automated security scanning and pull request creation for AI-generated patches.",
        authType: "App Password / OAuth",
        configFields: [
          { key: "workspace", label: "Workspace", type: "text", placeholder: "my-workspace" },
          { key: "username", label: "Username", type: "text", placeholder: "your-username" },
          { key: "app_password", label: "App Password", type: "password", placeholder: "app password" },
        ],
        dataCollected: [
          "Repository list",
          "Pull request status",
          "Pipeline status",
          "Branch metadata",
        ],
      },
    ],
  },
  {
    id: "network",
    label: "Network Infrastructure",
    description: "Integrate with network management platforms to discover topology, monitor traffic, and detect network-level threats.",
    iconKey: "network",
    color: "chart-2",
    tools: [
      {
        id: "cisco-dnac",
        name: "Cisco DNA Center",
        status: "disconnected",
        description: "Connect to Cisco DNA Center for automated network topology discovery, device inventory, and policy automation.",
        authType: "Username / Password (Basic Auth → Token)",
        configFields: [
          { key: "url", label: "DNA Center URL", type: "url", placeholder: "https://dnac.internal" },
          { key: "username", label: "Username", type: "text", placeholder: "admin" },
          { key: "password", label: "Password", type: "password", placeholder: "password" },
        ],
        dataCollected: [
          "Network topology",
          "Device inventory",
          "Interface status",
          "VLAN configuration",
          "Policy state",
          "Health scores",
        ],
      },
      {
        id: "fortimanager",
        name: "FortiManager",
        status: "disconnected",
        description: "Connect FortiManager to retrieve firewall policies, threat logs, and security profiles for all managed FortiGate devices.",
        authType: "API Token",
        configFields: [
          { key: "url", label: "FortiManager URL", type: "url", placeholder: "https://fortimanager.internal" },
          { key: "api_key", label: "API Key", type: "password", placeholder: "api key" },
          { key: "adom", label: "ADOM", type: "text", placeholder: "root" },
        ],
        dataCollected: [
          "Firewall policies",
          "Security profiles",
          "Threat logs",
          "Device inventory",
          "VPN tunnels",
        ],
      },
      {
        id: "juniper",
        name: "Juniper APIs",
        status: "disconnected",
        description: "Connect Juniper network devices via REST/NETCONF to retrieve routing, ACL, and security zone configuration.",
        authType: "Username / Password or SSH Key",
        configFields: [
          { key: "host", label: "Device IP / Hostname", type: "text", placeholder: "192.168.1.1" },
          { key: "username", label: "Username", type: "text", placeholder: "admin" },
          { key: "password", label: "Password", type: "password", placeholder: "password" },
          { key: "port", label: "NETCONF Port", type: "text", placeholder: "830" },
        ],
        dataCollected: [
          "Routing tables",
          "ACL rules",
          "Interface configuration",
          "Security zones",
          "Log streams",
        ],
      },
    ],
  },
  {
    id: "devops",
    label: "DevOps & CI/CD",
    description: "Integrate with CI/CD pipelines and infrastructure-as-code tools to automate security testing and patch deployment.",
    iconKey: "gitmerge",
    color: "primary",
    tools: [
      {
        id: "jenkins",
        name: "Jenkins",
        status: "disconnected",
        description: "Connect Jenkins to trigger security scans on build events and automate patch PR pipeline execution.",
        authType: "API Token",
        configFields: [
          { key: "url", label: "Jenkins URL", type: "url", placeholder: "https://jenkins.internal" },
          { key: "username", label: "Username", type: "text", placeholder: "admin" },
          { key: "token", label: "API Token", type: "password", placeholder: "api token" },
        ],
        dataCollected: [
          "Build status",
          "Pipeline results",
          "Test reports",
          "Artifact metadata",
        ],
      },
      {
        id: "terraform",
        name: "Terraform / Terraform Cloud",
        status: "disconnected",
        description: "Connect Terraform to scan IaC templates for misconfigurations and automate sandbox environment cloning for exploit testing.",
        authType: "API Token",
        configFields: [
          { key: "token", label: "Terraform Cloud Token", type: "password", placeholder: "token" },
          { key: "org", label: "Organization", type: "text", placeholder: "my-org" },
          { key: "workspace", label: "Workspace", type: "text", placeholder: "production" },
        ],
        dataCollected: [
          "Workspace state",
          "Resource inventory",
          "Plan outputs",
          "Infrastructure drift",
        ],
      },
      {
        id: "ansible",
        name: "Ansible / AWX",
        status: "disconnected",
        description: "Connect Ansible to run patch playbooks, configure cloned sandbox environments, and verify remediation results.",
        authType: "OAuth Token",
        configFields: [
          { key: "url", label: "AWX / Tower URL", type: "url", placeholder: "https://awx.internal" },
          { key: "token", label: "OAuth Token", type: "password", placeholder: "token" },
          { key: "org", label: "Organization", type: "text", placeholder: "Default" },
        ],
        dataCollected: [
          "Playbook results",
          "Host inventory",
          "Job status",
          "Credential usage",
        ],
      },
      {
        id: "kubernetes",
        name: "Kubernetes",
        status: "pending",
        description: "Connect Kubernetes clusters to scan running containers, detect misconfigurations, and manage sandbox deployments for exploit simulation.",
        authType: "kubeconfig / Service Account Token",
        configFields: [
          { key: "api_server", label: "API Server URL", type: "url", placeholder: "https://k8s.internal:6443" },
          { key: "token", label: "Service Account Token", type: "password", placeholder: "token" },
          { key: "namespace", label: "Namespace", type: "text", placeholder: "default" },
        ],
        dataCollected: [
          "Pod inventory",
          "Container images",
          "RBAC policies",
          "Network policies",
          "Security contexts",
          "Running workloads",
        ],
      },
    ],
  },
  {
    id: "cloud",
    label: "Cloud Providers",
    description: "Connect cloud accounts to discover assets, monitor configurations, and detect cloud-native threats across AWS, Azure, and GCP.",
    iconKey: "cloud",
    color: "chart-3",
    tools: [
      {
        id: "aws",
        name: "Amazon Web Services",
        status: "connected",
        description: "Connect AWS to enumerate EC2, RDS, S3, IAM, and Lambda resources with full security posture visibility.",
        authType: "IAM Role / Access Keys",
        configFields: [
          { key: "access_key_id", label: "Access Key ID", type: "text", placeholder: "AKIA..." },
          { key: "secret_access_key", label: "Secret Access Key", type: "password", placeholder: "secret" },
          {
            key: "region",
            label: "Default Region",
            type: "select",
            placeholder: "us-east-1",
            options: ["us-east-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1", "ap-northeast-1"],
          },
          { key: "role_arn", label: "IAM Role ARN (optional)", type: "text", placeholder: "arn:aws:iam::123456789:role/SentinelRole" },
        ],
        dataCollected: [
          "EC2 instances",
          "RDS databases",
          "S3 buckets",
          "IAM roles & policies",
          "Security groups",
          "VPC configuration",
          "CloudTrail logs",
          "GuardDuty findings",
        ],
      },
      {
        id: "azure",
        name: "Microsoft Azure",
        status: "disconnected",
        description: "Connect Azure to inventory VMs, AKS clusters, Key Vaults, and ingest Microsoft Defender for Cloud findings.",
        authType: "Service Principal / Managed Identity",
        configFields: [
          { key: "tenant_id", label: "Tenant ID", type: "text", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
          { key: "client_id", label: "Client ID", type: "text", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
          { key: "client_secret", label: "Client Secret", type: "password", placeholder: "client-secret" },
          { key: "subscription_id", label: "Subscription ID", type: "text", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
        ],
        dataCollected: [
          "Virtual machines",
          "AKS clusters",
          "Key Vaults",
          "Storage accounts",
          "NSG rules",
          "Defender for Cloud findings",
          "Entra ID (AAD) roles",
        ],
      },
      {
        id: "gcp",
        name: "Google Cloud Platform",
        status: "disconnected",
        description: "Connect GCP to scan Compute Engine, GKE clusters, Cloud SQL, and ingest Security Command Center findings.",
        authType: "Service Account Key / Workload Identity",
        configFields: [
          { key: "project_id", label: "Project ID", type: "text", placeholder: "my-gcp-project" },
          { key: "service_account_key", label: "Service Account Key (JSON)", type: "password", placeholder: '{ "type": "service_account", ... }' },
        ],
        dataCollected: [
          "Compute instances",
          "GKE clusters",
          "Cloud SQL databases",
          "IAM bindings",
          "Firewall rules",
          "Security Command Center findings",
          "Cloud Logging events",
        ],
      },
    ],
  },
  {
    id: "endpoint",
    label: "Endpoint Management",
    description: "Connect endpoint management platforms to collect patch status, software inventory, and agent telemetry from managed devices.",
    iconKey: "monitor",
    color: "warning",
    tools: [
      {
        id: "ivanti",
        name: "Ivanti Neurons",
        status: "disconnected",
        description: "Connect Ivanti Neurons / Patch for Endpoints to retrieve device inventory, patch compliance, and vulnerability scan results.",
        authType: "OAuth 2.0 / API Key",
        configFields: [
          { key: "url", label: "Ivanti API URL", type: "url", placeholder: "https://ivanti.internal/api/v1" },
          { key: "client_id", label: "Client ID", type: "text", placeholder: "client-id" },
          { key: "client_secret", label: "Client Secret", type: "password", placeholder: "client-secret" },
        ],
        dataCollected: [
          "Device inventory",
          "Patch compliance status",
          "Vulnerability findings",
          "Software inventory",
          "Policy compliance",
        ],
      },
      {
        id: "sccm",
        name: "Microsoft SCCM / Intune",
        status: "disconnected",
        description: "Connect SCCM or Microsoft Intune to retrieve Windows endpoint inventory, patch status, and compliance baselines.",
        authType: "Azure AD Service Principal",
        configFields: [
          { key: "tenant_id", label: "Tenant ID", type: "text", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
          { key: "client_id", label: "Client ID", type: "text", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
          { key: "client_secret", label: "Client Secret", type: "password", placeholder: "client-secret" },
          { key: "sccm_server", label: "SCCM Server (optional)", type: "text", placeholder: "sccm.internal" },
        ],
        dataCollected: [
          "Windows endpoints",
          "Patch compliance",
          "Software inventory",
          "Compliance baselines",
          "Deployment status",
        ],
      },
      {
        id: "jamf",
        name: "Jamf Pro",
        status: "disconnected",
        description: "Connect Jamf Pro to retrieve macOS and iOS device inventory, patch status, and configuration profile compliance.",
        authType: "Client Credentials (OAuth 2.0)",
        configFields: [
          { key: "url", label: "Jamf Pro URL", type: "url", placeholder: "https://company.jamfcloud.com" },
          { key: "client_id", label: "Client ID", type: "text", placeholder: "client-id" },
          { key: "client_secret", label: "Client Secret", type: "password", placeholder: "client-secret" },
        ],
        dataCollected: [
          "macOS / iOS devices",
          "Patch status",
          "Configuration profiles",
          "Software inventory",
          "Extension attributes",
        ],
      },
      {
        id: "kaseya",
        name: "Kaseya VSA",
        status: "disconnected",
        description: "Connect Kaseya VSA to retrieve managed endpoint inventory, patch policies, and monitoring agent data.",
        authType: "API Token",
        configFields: [
          { key: "url", label: "Kaseya VSA URL", type: "url", placeholder: "https://kaseya.internal" },
          { key: "username", label: "Username", type: "text", placeholder: "admin" },
          { key: "api_key", label: "API Key", type: "password", placeholder: "api key" },
        ],
        dataCollected: [
          "Managed endpoints",
          "Patch status",
          "Monitoring alerts",
          "Software inventory",
          "Agent health",
        ],
      },
    ],
  },
  {
    id: "monitoring",
    label: "Monitoring & SIEM",
    description: "Integrate with SIEM and monitoring platforms to ingest security events, correlate logs with CVE data, and forward Sentinel findings.",
    iconKey: "eye",
    color: "chart-4",
    tools: [
      {
        id: "splunk",
        name: "Splunk",
        status: "disconnected",
        description: "Connect Splunk to correlate CVE data with SIEM events, ingest notable alerts, and forward Sentinel findings via HEC.",
        authType: "API Token / HEC Token",
        configFields: [
          { key: "url", label: "Splunk Management URL", type: "url", placeholder: "https://splunk.internal:8089" },
          { key: "token", label: "REST API Token", type: "password", placeholder: "token" },
          { key: "hec_url", label: "HEC URL (for forwarding)", type: "url", placeholder: "https://splunk.internal:8088" },
          { key: "hec_token", label: "HEC Token", type: "password", placeholder: "hec-token" },
          { key: "index", label: "Index", type: "text", placeholder: "main" },
        ],
        dataCollected: [
          "Security alerts",
          "Log events",
          "Notable events",
          "Risk scores",
          "Correlation search results",
        ],
      },
      {
        id: "elk",
        name: "ELK Stack / OpenSearch",
        status: "disconnected",
        description: "Connect Elasticsearch to ingest log data, run CVE correlation queries, and forward Sentinel alerts to Kibana.",
        authType: "Username / Password or API Key",
        configFields: [
          { key: "url", label: "Elasticsearch URL", type: "url", placeholder: "https://elasticsearch.internal:9200" },
          { key: "username", label: "Username", type: "text", placeholder: "elastic" },
          { key: "password", label: "Password", type: "password", placeholder: "password" },
          { key: "index_pattern", label: "Index Pattern", type: "text", placeholder: "logs-*" },
        ],
        dataCollected: [
          "Log events",
          "Security alerts",
          "Kibana dashboard data",
          "Watcher alerts",
        ],
      },
      {
        id: "graylog",
        name: "Graylog",
        status: "disconnected",
        description: "Connect Graylog to ingest syslog streams, correlate security events, and trigger alerts on CVE-related indicators.",
        authType: "API Token",
        configFields: [
          { key: "url", label: "Graylog API URL", type: "url", placeholder: "https://graylog.internal:9000/api" },
          { key: "token", label: "API Token", type: "password", placeholder: "token" },
          { key: "stream_id", label: "Stream ID", type: "text", placeholder: "stream-id" },
        ],
        dataCollected: [
          "Syslog events",
          "Security alerts",
          "Stream messages",
          "Dashboard data",
        ],
      },
      {
        id: "zabbix",
        name: "Zabbix",
        status: "disconnected",
        description: "Connect Zabbix to retrieve host inventory, monitoring triggers, and infrastructure health data for the digital twin.",
        authType: "API Token",
        configFields: [
          { key: "url", label: "Zabbix API URL", type: "url", placeholder: "https://zabbix.internal/api_jsonrpc.php" },
          { key: "token", label: "API Token", type: "password", placeholder: "token" },
        ],
        dataCollected: [
          "Host inventory",
          "Monitoring triggers",
          "Problem events",
          "Performance metrics",
          "Template assignments",
        ],
      },
    ],
  },
  {
    id: "database",
    label: "Database",
    description: "Configure Sentinel's own database connections — PostgreSQL (Supabase), Neo4j for attack graphs, and Redis for caching.",
    iconKey: "database",
    color: "success",
    tools: [
      {
        id: "supabase",
        name: "Supabase (PostgreSQL)",
        status: "pending",
        description: "Primary relational data store for assets, vulnerabilities, exploit results, patch records, compliance reports, and the immutable audit log.",
        authType: "Supabase Project URL + Service Role Key",
        configFields: [
          { key: "url", label: "Supabase Project URL", type: "url", placeholder: "https://xxxxxxxxxxxx.supabase.co" },
          { key: "anon_key", label: "Anon Key", type: "password", placeholder: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          { key: "service_role_key", label: "Service Role Key", type: "password", placeholder: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
        ],
        dataCollected: [
          "organizations",
          "assets",
          "vulnerabilities",
          "exploit_results",
          "patch_records",
          "compliance_reports",
          "audit_log",
        ],
      },
      {
        id: "neo4j",
        name: "Neo4j",
        status: "pending",
        description: "Graph database for attack path topology. Stores infrastructure nodes and directed edges for shortest-path attack graph traversal.",
        authType: "Username / Password",
        configFields: [
          { key: "uri", label: "Bolt URI", type: "text", placeholder: "bolt://neo4j.internal:7687" },
          { key: "username", label: "Username", type: "text", placeholder: "neo4j" },
          { key: "password", label: "Password", type: "password", placeholder: "password" },
          { key: "database", label: "Database Name", type: "text", placeholder: "neo4j" },
        ],
        dataCollected: [
          "Infrastructure nodes (Cloud, Network, Endpoints, Services)",
          "Attack edges between nodes",
          "Shortest path traversal results",
          "Node attributes (OS, open ports, CVEs, patch status)",
        ],
      },
      {
        id: "redis",
        name: "Redis",
        status: "pending",
        description: "In-memory cache for threat intel, auth sessions, graph traversal results, and EPSS scores with per-key TTL policies.",
        authType: "Password / TLS",
        configFields: [
          { key: "host", label: "Host", type: "text", placeholder: "redis.internal" },
          { key: "port", label: "Port", type: "text", placeholder: "6379" },
          { key: "password", label: "Password", type: "password", placeholder: "password" },
          { key: "tls", label: "TLS", type: "select", placeholder: "true", options: ["true", "false"] },
        ],
        dataCollected: [
          "vuln:{cve_id} — enriched VulnRecord (TTL: 1h)",
          "asset:{asset_id} — asset inventory (TTL: 5min)",
          "graph:path:{from}:{to} — shortest path (TTL: 30s)",
          "epss:{cve_id} — EPSS probability (TTL: 24h)",
          "session:{user_id} — auth session (TTL: 15min)",
        ],
      },
    ],
  },
]
