# 2. Architecture

## High-Level Stack

Sentinel AI is built on a **cloud-native microservices architecture**. Each functional domain is isolated into an independently deployable service communicating via authenticated internal APIs.

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│          Next.js 15 Dashboard (frontend/)               │
└────────────────────────┬────────────────────────────────┘
                         │ REST + WebSocket
┌────────────────────────▼────────────────────────────────┐
│                     API GATEWAY                          │
│         Kong · OAuth 2.0 · mTLS · Rate Limiting         │
└──┬──────────┬──────────┬──────────┬──────────┬──────────┘
   │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼
Scan      Exploit    Patch      Attack     Threat
Engine    Sim Eng    Auto Eng   Graph Eng  Intel Agg
   │          │          │          │          │
   └──────────┴──────────┴──────────┴──────────┘
                         │
              ┌──────────▼──────────┐
              │   AI LAYER (Claude) │
              │  Reasoning · Patch  │
              │  Reporting · Audit  │
              └──────────┬──────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                     DATA LAYER                           │
│   PostgreSQL · Neo4j · Redis · S3                        │
└─────────────────────────────────────────────────────────┘
```

---

## Service Inventory

| Layer | Component | Technology | Folder |
|---|---|---|---|
| Presentation | Dashboard UI | Next.js 15, TypeScript, Tailwind | `frontend/` |
| API | API Gateway | Kong, REST, WebSocket | `apis/` |
| Orchestration | Core Orchestrator | Temporal.io | `backend/` |
| Intelligence | AI Layer | Claude API (claude-sonnet-4-6) | `backend/ai/` |
| Scanning | Scan Engine | Semgrep, CodeQL, Trivy, Syft | `backend/scanner/` |
| Simulation | Exploit Engine | Firecracker, gVisor, Metasploit | `exploit-files/` |
| Remediation | Patch Automation | GitHub/GitLab API, CI/CD | `backend/patch/` |
| Graph | Attack Graph | Neo4j, PageRank, Dijkstra | `database/graph/` |
| Threat Intel | TI Aggregator | NVD, MITRE, CISA, EPSS | `backend/intel/` |
| Compliance | Compliance Engine | ISO 27001, SOC 2, PCI-DSS | `backend/compliance/` |
| Data | PostgreSQL | Supabase | `database/` |
| Containers | Orchestration | Kubernetes, Helm, Docker | `containers/` |

---

## Data Flow — Exploit-Patch-Verify Loop

```
1. DETECT      Scan engine discovers CVE → enriched via TI pipeline
2. SIMULATE    Exploit engine executes in isolated Firecracker sandbox
3. ANALYZE     Claude API reasons: blast radius, attack path, fix strategy
4. PATCH       Claude generates context-aware fix in target language
5. COMMIT      GPG-signed branch + PR pushed to version control
6. CI/CD       SAST → unit tests → container build → policy check
7. RE-DEPLOY   Patched artifact deployed to fresh sandbox clone
8. RE-SIMULATE Original exploit re-run against patched environment
9. VALIDATE    Exploit fails → posture score updated → PR approved
```

---

## Security Architecture

- **Zero Trust**: Every API call requires valid SPIFFE SVID via Istio service mesh
- **mTLS**: All inter-service communication with Vault-backed PKI, 24h rotation
- **RBAC**: Casbin-enforced — Viewer / Analyst / Engineer / Admin
- **Encryption**: AES-256-GCM at rest, TLS 1.3 in transit, HashiCorp Vault key management
- **Audit Trail**: Append-only PostgreSQL log with HMAC chaining + Merkle tree
- **Sandbox Isolation**: Firecracker micro-VMs, network namespaces, no production access
