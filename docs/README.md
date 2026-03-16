# SENTINEL AI — Developer Documentation

> Autonomous Exploit Simulation & Self-Healing Security Platform
> Version 1.0 | March 2026 | Classification: CONFIDENTIAL

---

## Table of Contents

1. [Platform Overview](./01-platform-overview.md)
2. [Architecture](./02-architecture.md)
3. [Frontend Guide](./03-frontend-guide.md)
4. [Backend Guide](./04-backend-guide.md)
5. [Database Schema](./05-database-schema.md)
6. [APIs Reference](./06-api-reference.md)
7. [Exploit Simulation Engine](./07-exploit-simulation.md)
8. [AI Intelligence Layer](./08-ai-layer.md)
9. [Containers & Deployment](./09-containers-deployment.md)
10. [Compliance & Governance](./10-compliance.md)
16. [Claude Code Session 2026-03-15](./16-claude-session-2026-03-15.md) — Full env audit, install, and bring-up

---

## Quick Start

```bash
# 1. Clone and install frontend
cd frontend && npm install && npm run dev

# 2. Set environment variables
cp ../.env .env.local   # fill in your Supabase credentials

# 3. Start the dev server
npm run dev   # http://localhost:3000
```

---

## Project Structure

```
sentinelai/
├── frontend/       Next.js 15 dashboard (TypeScript + Tailwind)
├── backend/        API server (Node.js / Python FastAPI — TBD)
├── apis/           REST & WebSocket API definitions
├── database/       Supabase client, schema, migrations
├── containers/     Docker, Kubernetes, Helm charts
├── exploit-files/  Sandbox exploit scripts and PoC payloads
└── docs/           This documentation
```

---

## Brand & Theme

| Token       | Value       | Usage                      |
|-------------|-------------|----------------------------|
| Primary     | `#00d4ff`   | Cyan — buttons, active nav, scores |
| Secondary   | `#7c3aed`   | Purple — tables, charts, badges |
| Background  | `#080c18`   | Deep navy page background  |
| Card        | `#0d1220`   | Panel/card background      |
| Border      | `#1a2540`   | Dividers, card borders     |
| Success     | `#22c55e`   | Patched / resolved states  |
| Danger      | `#ef4444`   | Critical CVEs, failures    |
| Warning     | `#f59e0b`   | Medium severity alerts     |
