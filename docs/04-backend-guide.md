# 4. Backend Guide

## Overview

The backend is the orchestration core of Sentinel AI. It coordinates the full **Scan → Simulate → Patch → Verify** lifecycle using a Temporal.io workflow engine.

---

## Planned Stack

| Component | Technology | Status |
|---|---|---|
| API Server | Node.js (Fastify) or Python (FastAPI) | To build |
| Workflow Engine | Temporal.io | To build |
| AI Integration | Anthropic Claude API | To build |
| Message Queue | Apache Kafka | To build |
| Cache | Redis | To build |
| Scan Engine | Semgrep, CodeQL, Trivy, Syft | To build |
| Graph Engine | Neo4j | To build |

---

## Folder Structure (Target)

```
backend/
├── src/
│   ├── server.ts               Fastify/Express entry point
│   ├── orchestrator/           Temporal.io workflow definitions
│   │   ├── workflows/
│   │   │   ├── scan.workflow.ts
│   │   │   ├── simulate.workflow.ts
│   │   │   ├── patch.workflow.ts
│   │   │   └── verify.workflow.ts
│   │   └── activities/
│   ├── scanner/                Multi-modal scan engine adapters
│   │   ├── sast.ts             Semgrep + CodeQL
│   │   ├── sca.ts              Syft + Grype (SBOM)
│   │   ├── container.ts        Trivy
│   │   └── iac.ts              Checkov + tfsec
│   ├── intel/                  Threat intelligence aggregator
│   │   ├── nvd.ts              NVD API 2.0 adapter
│   │   ├── mitre.ts            MITRE ATT&CK TAXII 2.1
│   │   ├── cisa.ts             CISA KEV feed
│   │   ├── epss.ts             FIRST EPSS API
│   │   └── github.ts           GitHub Security Advisory API
│   ├── ai/                     Claude API integration
│   │   ├── client.ts           Anthropic SDK setup
│   │   ├── risk-reasoning.ts   Contextual vulnerability analysis
│   │   ├── patch-generation.ts Code fix generation
│   │   ├── compliance-mapping.ts Control framework mapping
│   │   └── reporting.ts        Executive report authoring
│   ├── patch/                  Patch automation engine
│   │   ├── github.ts           GitHub PR + branch automation
│   │   ├── gitlab.ts           GitLab integration
│   │   └── cicd.ts             CI pipeline trigger
│   ├── compliance/             Compliance engine
│   │   ├── iso27001.ts
│   │   ├── soc2.ts
│   │   └── pcidss.ts
│   └── graph/                  Attack graph queries (Neo4j)
│       ├── shortest-path.ts
│       └── risk-propagation.ts
├── package.json
└── tsconfig.json
```

---

## AI Layer — Claude API

The AI layer uses `claude-sonnet-4-6` for:

| Task | Claude Usage |
|---|---|
| Risk Reasoning | Analyze VulnRecord + asset context → narrative risk assessment |
| Attack Scenario | Generate multi-step attack chain narrative from CVE + topology |
| Patch Generation | Produce syntactically correct fix in target language (CWE-guided) |
| Compliance Mapping | Map CVE → ISO 27001 / SOC 2 / PCI-DSS controls + audit text |
| Executive Reporting | Translate technical metrics → board-level business risk language |

### Safety Controls
- AI patches never execute in production — must pass CI/CD pipeline first
- Patches to auth/crypto/access-control require human approval
- All Claude calls logged with full prompt/response audit trail
- Confidence < 0.75 escalates to human security engineer

---

## Environment Variables (Backend)

```env
BACKEND_PORT=8000
BACKEND_SECRET_KEY=<jwt-secret>
BACKEND_CORS_ORIGINS=http://localhost:3000

# Claude API
ANTHROPIC_API_KEY=<your-key>

# Temporal.io
TEMPORAL_ADDRESS=localhost:7233

# Kafka
KAFKA_BROKERS=localhost:9092

# Redis
REDIS_URL=redis://localhost:6379

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=<password>

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
```
