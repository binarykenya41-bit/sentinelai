# 11. Infrastructure Integration Architecture

This document describes how Sentinel AI connects to external infrastructure, builds a live digital twin, creates sandbox environments, runs simulations, and processes real-time telemetry.

---

## 2. API Integration Layer

Sentinel connects to external systems using REST APIs, syslog streams, and agent telemetry.

### External Platforms Integrated

| Category | Tools |
|---|---|
| Endpoint Management | Ivanti, SCCM, Jamf, Kaseya, PDQ |
| Network Infrastructure | Cisco DNA Center, FortiManager, Juniper APIs |
| Monitoring Platforms | Zabbix, Nagios, PRTG |
| SIEM | Splunk, ELK Stack, Graylog |
| Cloud Providers | AWS, Azure, Google Cloud |

### Data Collected via APIs

Each integration provides Sentinel with:

- Infrastructure inventory
- Device configuration
- Patch status
- Installed software
- Security events
- Network topology
- System logs
- Vulnerability reports

### Data Flow

```
External Tools
     |
     v
API Integration Layer
     |
     v
Data Normalization Engine
     |
     v
Sentinel Infrastructure Database
```

This allows Sentinel to maintain a live inventory of all infrastructure assets.

---

## 3. Digital Twin Infrastructure Model

Sentinel builds a digital twin of the entire IT environment.

A digital twin is a virtual representation of real infrastructure, including:

- Cloud resources
- Network devices
- Endpoints
- Applications
- Identity systems

### Infrastructure Nodes

Each asset becomes a node in the system.

| Node Type | Examples |
|---|---|
| Cloud | VMs, managed databases, serverless functions |
| Network | Firewalls, routers, switches |
| Endpoints | Workstations, servers, IoT devices |
| Services | API services, containerized workloads |

### Node Attributes

Each node contains metadata:

| Attribute | Description |
|---|---|
| OS version | Operating system and version string |
| Installed applications | Package list with versions |
| Open ports | Listening services and protocols |
| Network connections | Active connections to other nodes |
| Patch status | Current patching state |
| Vulnerabilities | Linked CVEs with severity |
| Access permissions | IAM roles, ACLs, credentials in scope |

### Relationship Mapping

Nodes are connected to show relationships:

```
Endpoint -> Switch -> Firewall -> Cloud VM -> Database
```

This structure enables attack path modeling and lateral movement analysis. Relationships are stored as edges in Neo4j (see `docs/02-architecture.md` — Attack Graph Engine).

---

## 4. Environment Cloning (Sandbox Infrastructure)

To safely test exploits and patches, Sentinel creates sandbox environments that replicate production infrastructure.

### Cloning Process

1. Sentinel gathers system information via APIs and agents
2. Infrastructure metadata is extracted:
   - OS versions
   - Service versions
   - Network configuration
   - Installed packages
3. The system generates a replica environment

### Technologies Used

| Tool | Purpose |
|---|---|
| Terraform | Replicates cloud infrastructure |
| Docker / Kubernetes | Replicates containerized services |
| Virtual machines (Firecracker) | Replicates operating system environments |
| Ansible | Configures cloned environments to match production |

### Sandbox Purpose

The cloned environment allows:

- Exploit testing
- Vulnerability validation
- Patch testing
- Attack simulations

This ensures production systems are never directly exposed to testing risks.

> See `docs/07-exploit-simulation.md` for sandbox isolation controls and kill-switch implementation.

---

## 5. Attack Simulation

Sentinel simulates cyber attacks in the digital twin environment.

### Simulation Frameworks

| Framework | Usage |
|---|---|
| MITRE ATT&CK | Technique-mapped attack sequences |
| Atomic Red Team | Atomic test execution per technique |
| Metasploit | Module-based exploit execution |
| Custom exploit modules | CVE-specific PoC scripts from Exploit-DB |

### Simulation Goals

- Validate exploitability of detected CVEs
- Test endpoint detection capabilities
- Measure response time
- Identify attack paths and lateral movement routes

### Simulation Workflow

```
CVE detected
     |
     v
Check vulnerable nodes
     |
     v
Clone environment
     |
     v
Run exploit simulation
     |
     v
Evaluate impact
```

> See `docs/07-exploit-simulation.md` for full ExploitResult schema, confidence calibration, and MFA enforcement for CVSS >= 9.0.

---

## 6. Patch Simulation

Before deploying real patches, Sentinel performs mock patch testing in the cloned environment.

### Patch Testing Steps

1. Identify the vulnerable system
2. Apply the AI-generated patch in the cloned environment
3. Monitor system stability (service uptime, resource usage)
4. Validate service functionality (smoke tests, integration checks)
5. Confirm vulnerability remediation by re-running the original exploit

If the patch passes simulation, it is promoted for deployment to production infrastructure via the CI/CD pipeline.

> See `docs/07-exploit-simulation.md` (re-simulation stage) and `ROADMAP.md` Phase 7 (Patch Automation & CI/CD).

---

## 7. Infrastructure Input Forms

Users can manually add infrastructure through structured forms when automated discovery is unavailable or incomplete.

### Form Structure

#### 1. General Information

| Field | Options |
|---|---|
| Infrastructure Name | Free text |
| Infrastructure Type | Cloud / Network Device / Endpoint / Application |
| Environment | Production / Staging / Development |
| Description | Free text |

#### 2. Network Details

| Field | Description |
|---|---|
| IP Address | IPv4 or IPv6 |
| Hostname | DNS hostname |
| MAC Address | Hardware address |
| Network Segment / VLAN | Segment identifier |
| Open Ports | Comma-separated port list |
| Protocols Used | TCP, UDP, ICMP, etc. |

#### 3. System Configuration

| Field | Description |
|---|---|
| Operating System | OS name |
| OS Version | Version string |
| Installed Applications | Package list |
| Application Versions | Version per package |
| Container Platform | Docker, Kubernetes, etc. (if applicable) |

#### 4. Security Configuration

| Field | Description |
|---|---|
| Firewall Present | Yes / No |
| Endpoint Security Agent | Agent name and version |
| Antivirus / EDR | Product name |
| Authentication Type | Password, MFA, certificate, SSO |
| Encryption Protocols | TLS version, cipher suites |

#### 5. Patch & Vulnerability Status

| Field | Description |
|---|---|
| Patch Status | Current / Behind / Unknown |
| Last Patch Date | Date of most recent patch applied |
| Known Vulnerabilities | CVE list |
| Vulnerability Severity | CVSS scores per CVE |

#### 6. Integration Settings

| Field | Description |
|---|---|
| External Management Tool | e.g. Ivanti, SCCM, Jamf |
| API Endpoint | URL of the external tool's API |
| API Key / Auth Method | Credential or auth mechanism |
| Log Source Configuration | Syslog address, log format |

These form submissions are stored in the Sentinel Infrastructure Database and immediately reflected in the digital twin model.

---

## 8. Real-Time Monitoring Architecture

Sentinel processes infrastructure data through a continuous real-time pipeline.

```
Endpoints / Network Devices / Cloud APIs
                 |
                 v
        Telemetry Collectors
                 |
                 v
          Streaming Queue
        (Kafka / Message Bus)
                 |
                 v
        Analytics Engine
                 |
                 v
          Digital Twin Model
                 |
                 v
     Simulation / Alerts / Reports
```

### Component Roles

| Component | Responsibility |
|---|---|
| Telemetry Collectors | Agent-based and agentless data ingestion from endpoints, devices, and cloud APIs |
| Streaming Queue (Kafka) | High-throughput event transport with guaranteed delivery and replay capability |
| Analytics Engine | Real-time correlation, anomaly detection, CVE matching against live inventory |
| Digital Twin Model | Live virtual replica updated continuously from telemetry |
| Simulation / Alerts / Reports | Downstream consumers — exploit engine, alert system, compliance engine, report generator |

> Related: `docs/02-architecture.md` covers Kafka topic `vuln.enriched` and the full data layer.

---

## 9. Key Capabilities

Sentinel enables end-to-end autonomous security management:

| Capability | Description |
|---|---|
| Infrastructure Discovery | Automated asset inventory via APIs, agents, and manual forms |
| Digital Twin Modeling | Live virtual replica of the entire IT environment |
| Attack Path Analysis | Graph-based shortest-path computation from attacker entry to critical assets |
| Exploit Simulation | Controlled CVE validation in isolated sandbox environments |
| Patch Validation | AI-generated patches tested in cloned environments before production deployment |
| Real-Time Monitoring | Continuous telemetry ingestion with Kafka-backed streaming pipeline |
| Automated Remediation Workflows | Full Scan → Simulate → Patch → Verify loop with minimal human intervention |
