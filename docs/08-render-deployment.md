# Deploying the Backend on Render

## Overview

The SentinelAI backend is a Fastify + TypeScript server (port 8000). Render's **Web Service** tier builds and runs it with zero infrastructure management. This guide covers the full deployment, environment variables, and how to point the frontend at the live URL.

---

## 1. Prerequisites

- A [Render account](https://render.com) (free tier works for testing)
- The `Alphaxide/sentinelai` GitHub repo connected to Render
- Your Supabase project credentials (already in `.env`)
- Your Anthropic API key

---

## 2. Connect GitHub to Render

1. Go to **https://dashboard.render.com**
2. Click **New → Web Service**
3. Select **Connect a repository** → authorize GitHub → choose `Alphaxide/sentinelai`

---

## 3. Configure the Web Service

| Field | Value |
|-------|-------|
| **Name** | `sentinelai-backend` |
| **Region** | Frankfurt EU (or closest to you) |
| **Branch** | `main` (or `logistics-patches` for latest) |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` |
| **Instance Type** | Free (512 MB RAM) — or Starter ($7/mo) for always-on |

> **Important:** The free tier spins down after 15 min inactivity. Use Starter if you need the exploit buttons to respond instantly.

---

## 4. Environment Variables

In Render → your service → **Environment**, add every variable below.

### Required

| Variable | Value | Where to get it |
|----------|-------|-----------------|
| `NODE_ENV` | `production` | — |
| `BACKEND_PORT` | `8000` | — (Render overrides with `PORT` automatically) |
| `SUPABASE_URL` | `https://lpivheudrpyzjqkegxww.supabase.co` | `.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | `.env` |
| `SUPABASE_ANON_KEY` | `eyJhbGc...` | `.env` |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | `.env` |
| `BACKEND_CORS_ORIGINS` | `https://your-frontend.vercel.app,http://localhost:3000` | Your frontend URL |

### Optional (intel / CVE sync)

| Variable | Value |
|----------|-------|
| `NVD_API_KEY` | `9276f8ff-2e38-4503-89fc-f38cdc88b743` |
| `VULDB_API_KEY` | `b9658d48154624beafb2599823cfbf88` |
| `REDIS_URL` | `redis://...` (Render Redis add-on or Upstash) |
| `DEFAULT_ORG_ID` | `a1b2c3d4-0001-0001-0001-000000000001` |
| `AUTO_SIM_ENABLED` | `false` |
| `AUTO_SIM_DRY_RUN` | `true` |

### Note on PORT

Render injects `PORT` automatically. The backend reads `BACKEND_PORT` but Render's routing uses its own `PORT`. Update `server.ts` to prefer `process.env.PORT`:

```typescript
// backend/src/server.ts — already handles this:
const PORT = Number(process.env.PORT ?? process.env.BACKEND_PORT ?? 8000)
await app.listen({ port: PORT, host: "0.0.0.0" })
```

---

## 5. Fix server.ts for Render's PORT injection

Render sets `process.env.PORT` (not `BACKEND_PORT`). Make sure the listen call uses it:

```typescript
// In backend/src/server.ts, the last lines should be:
const PORT = Number(process.env.PORT ?? process.env.BACKEND_PORT ?? 8000)
await app.listen({ port: PORT, host: "0.0.0.0" })
```

---

## 6. Deploy

Click **Create Web Service**. Render will:

1. Clone `backend/` from GitHub
2. Run `npm install && npm run build` (compiles TypeScript → `dist/`)
3. Run `npm run start` → `node dist/server.js`
4. Assign a URL like: `https://sentinelai-backend.onrender.com`

Logs are visible in real-time in the Render dashboard.

---

## 7. Point the Frontend at the Render URL

Once deployed, update `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=https://sentinelai-backend.onrender.com
```

Or in Vercel/Netlify dashboard, set the same env var.

---

## 8. Health Check

Render pings a health check URL every 30s. Add this to `server.ts` (already present):

```
GET /healthz → 200 { status: "ok" }
```

In Render → Settings → Health Check Path: `/healthz`

---

## 9. Running Exploits Against the Render Backend

Once deployed, the `/api/logistics/exploit` endpoint will run Python scripts **on the Render server**, not against your local logistics containers. This means:

### What works on Render

| Endpoint | Works | Notes |
|----------|-------|-------|
| `GET /api/logistics/status` | Partially | Only ports reachable from Render's network |
| `POST /api/logistics/seed` | ✅ | Seeds Supabase — no Docker needed |
| `GET /api/logistics/vulnerabilities` | ✅ | Pure Supabase query |
| `GET /api/logistics/results` | ✅ | Pure Supabase query |
| `POST /api/logistics/exploit` | ❌ | Python scripts target `localhost:9379` etc. — those ports don't exist on Render |
| `GET /api/simulation/*` | ✅ | Results from Supabase |
| `POST /api/simulation/run` | ❌ | Needs Docker sandbox on the server |
| All `/api/ai/*` | ✅ | Just calls Anthropic API |
| All `/api/intel/*` | ✅ | Calls NVD, EPSS, CISA, VulDB |

### Making exploits work from Render

The exploit scripts connect to `localhost:9379`, `localhost:9432`, etc. — ports that only exist in your local Codespace. There are two approaches:

**Option A — Keep exploits local, use Render for everything else**

Run the exploit backend locally (Codespace) and expose it via Cloudflare Tunnel:

```bash
# In Codespace terminal:
cloudflared tunnel --url http://localhost:8000

# Sets NEXT_PUBLIC_API_URL to the tunnel URL in .env.local
# Exploit buttons hit your local backend → your local containers
```

**Option B — Deploy a Logistics Target Stack on Render**

Use Render's Docker deploy to run the logistics containers as separate services, then set target hosts to their internal Render URLs. This is the production-grade approach but requires a paid Render plan.

**Option C — Hybrid (recommended)**

- Render backend handles: AI, intel, Supabase CRUD, compliance, attack graph
- Cloudflare Tunnel handles: live exploit simulation (points to local logistics stack)
- Frontend switches `NEXT_PUBLIC_API_URL` based on which feature you're using

---

## 10. Recommended render.yaml (Infrastructure as Code)

Create this at the repo root to auto-configure Render:

```yaml
# render.yaml
services:
  - type: web
    name: sentinelai-backend
    runtime: node
    rootDir: backend
    buildCommand: npm install && npm run build
    startCommand: npm run start
    healthCheckPath: /healthz
    envVars:
      - key: NODE_ENV
        value: production
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: BACKEND_CORS_ORIGINS
        sync: false
      - key: NVD_API_KEY
        value: 9276f8ff-2e38-4503-89fc-f38cdc88b743
      - key: VULDB_API_KEY
        value: b9658d48154624beafb2599823cfbf88
      - key: DEFAULT_ORG_ID
        value: a1b2c3d4-0001-0001-0001-000000000001
      - key: AUTO_SIM_ENABLED
        value: false
      - key: AUTO_SIM_DRY_RUN
        value: true
```

Push `render.yaml` to the repo root and Render will pick it up automatically on next deploy.

---

## 11. Deployment Checklist

- [ ] `backend/src/server.ts` uses `process.env.PORT` (not just `BACKEND_PORT`)
- [ ] All required env vars set in Render dashboard
- [ ] `BACKEND_CORS_ORIGINS` includes your frontend URL
- [ ] Health check path set to `/healthz`
- [ ] Branch set to `logistics-patches` for latest features
- [ ] Test: `curl https://sentinelai-backend.onrender.com/healthz`
- [ ] Test: `curl https://sentinelai-backend.onrender.com/api/logistics/vulnerabilities`
- [ ] Frontend `.env.local` updated with Render URL
