#!/usr/bin/env bash
# =============================================================================
# Sentinel AI — Start All Services
# =============================================================================
# Usage:
#   chmod +x start.sh
#   ./start.sh              # start everything
#   ./start.sh --no-docker  # skip Docker containers (frontend + backend only)
#   ./start.sh --stop       # stop all background processes
# =============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT/.logs"
PID_FILE="$ROOT/.sentinel.pids"

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

info()    { echo -e "${CYAN}[INFO]${RESET}  $*"; }
ok()      { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
err()     { echo -e "${RED}[ERROR]${RESET} $*"; }
section() { echo -e "\n${BOLD}${CYAN}━━━ $* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"; }

# ── Parse flags ───────────────────────────────────────────────────────────────
SKIP_DOCKER=false
STOP_MODE=false

for arg in "$@"; do
  case "$arg" in
    --no-docker)  SKIP_DOCKER=true ;;
    --stop)       STOP_MODE=true ;;
  esac
done

# ── Stop mode ─────────────────────────────────────────────────────────────────
if $STOP_MODE; then
  section "Stopping Sentinel AI"

  if [[ -f "$PID_FILE" ]]; then
    while IFS= read -r pid; do
      if kill -0 "$pid" 2>/dev/null; then
        kill "$pid" && ok "Killed PID $pid"
      fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
  else
    warn "No PID file found"
  fi

  # Stop docker containers
  if command -v docker &>/dev/null; then
    cd "$ROOT/containers/docker"
    docker compose --profile company-infra down 2>/dev/null && ok "Docker company-infra stopped"
  fi

  ok "All services stopped"
  exit 0
fi

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}"
echo "  ╔══════════════════════════════════════════════════════╗"
echo "  ║          SENTINEL AI — Full Stack Launcher          ║"
echo "  ╚══════════════════════════════════════════════════════╝"
echo -e "${RESET}"

mkdir -p "$LOG_DIR"
: > "$PID_FILE"

# ── Prerequisite checks ───────────────────────────────────────────────────────
section "Checking Prerequisites"

check_cmd() {
  if command -v "$1" &>/dev/null; then
    ok "$1 found ($(command -v "$1"))"
  else
    err "$1 not found — see SETUP.md"
    exit 1
  fi
}

check_cmd node
check_cmd npm
check_cmd docker

NODE_VER=$(node -e "console.log(process.versions.node.split('.')[0])")
if [[ "$NODE_VER" -lt 20 ]]; then
  err "Node.js >= 20 required (found v$NODE_VER). Install from https://nodejs.org"
  exit 1
fi
ok "Node.js v$(node --version | tr -d v) (>= 20)"

# ── Backend ───────────────────────────────────────────────────────────────────
section "Backend (Fastify — port 8000)"

BACKEND_DIR="$ROOT/backend"

if [[ ! -f "$BACKEND_DIR/.env" ]]; then
  warn ".env not found in backend/ — copying from root .env"
  if [[ -f "$ROOT/.env" ]]; then
    cp "$ROOT/.env" "$BACKEND_DIR/.env"
    ok "Copied root .env → backend/.env"
  else
    err "No .env file found. Copy backend/.env.example → backend/.env and fill in values."
    exit 1
  fi
fi

info "Installing backend dependencies..."
cd "$BACKEND_DIR"
npm install --silent

info "Building backend..."
npm run build 2>&1 | grep -E "error|Error" | head -5 || true

info "Starting backend on port 8000..."
node dist/server.js > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "$BACKEND_PID" >> "$PID_FILE"

# Wait for backend health check
for i in {1..15}; do
  if curl -sf http://localhost:8000/health &>/dev/null; then
    ok "Backend running (PID $BACKEND_PID) → http://localhost:8000"
    ok "Health: $(curl -s http://localhost:8000/health | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d["status"])' 2>/dev/null || echo ok)"
    break
  fi
  if [[ $i -eq 15 ]]; then
    err "Backend did not start in time. Check: tail -50 $LOG_DIR/backend.log"
    exit 1
  fi
  sleep 1
done

# ── Frontend ──────────────────────────────────────────────────────────────────
section "Frontend (Next.js — port 3000)"

FRONTEND_DIR="$ROOT/frontend"

if [[ ! -f "$FRONTEND_DIR/.env.local" ]]; then
  warn ".env.local not found in frontend/ — creating default"
  cat > "$FRONTEND_DIR/.env.local" <<'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Sentinel AI
EOF
  ok "Created frontend/.env.local"
fi

info "Installing frontend dependencies..."
cd "$FRONTEND_DIR"
npm install --silent

info "Starting frontend on port 3000..."
npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "$FRONTEND_PID" >> "$PID_FILE"

# Wait for frontend
for i in {1..30}; do
  if curl -sf http://localhost:3000 &>/dev/null; then
    ok "Frontend running (PID $FRONTEND_PID) → http://localhost:3000"
    break
  fi
  if [[ $i -eq 30 ]]; then
    warn "Frontend taking longer than expected. Check: tail -50 $LOG_DIR/frontend.log"
  fi
  sleep 2
done

# ── Docker (company-infra) ────────────────────────────────────────────────────
if $SKIP_DOCKER; then
  warn "Skipping Docker containers (--no-docker flag)"
else
  section "Company Infrastructure Containers (Docker)"

  if ! docker info &>/dev/null; then
    warn "Docker daemon not running — skipping containers"
  else
    cd "$ROOT/containers/docker"

    info "Pulling and starting company-infra containers..."
    info "  Services: GitLab · WordPress · ERPNext · Keycloak · PostgreSQL · Grafana · Prometheus"

    # Start all except GitLab first (faster boot)
    docker compose --profile company-infra up -d \
      grafana-vuln prometheus-vuln keycloak-vuln \
      postgres-vuln wordpress-vuln wordpress-db \
      2>&1 | grep -E "Started|Created|Error|error" | head -20

    ok "Core company-infra services started"

    # Start GitLab separately (large image, slow first boot)
    info "Starting GitLab (first boot takes 3-5 min for initialization)..."
    docker compose --profile company-infra up -d gitlab-vuln 2>&1 | grep -E "Started|Created|Error" | head -5

    # ERPNext — start in background (needs MariaDB init)
    info "Starting ERPNext (may take 5-10 min on first run)..."
    docker compose --profile company-infra up -d erpnext-vuln 2>&1 | grep -E "Started|Created|Error" | head -5 || \
      warn "ERPNext start failed — check docker-compose logs"

    echo ""
    docker ps --format "  {{.Names}}\t{{.Status}}\t{{.Ports}}" \
      | grep "sentinel-" | sort
  fi
fi

# ── Summary ───────────────────────────────────────────────────────────────────
section "All Services Running"

echo ""
echo -e "  ${BOLD}Core Services${RESET}"
echo -e "  ├─ Frontend         ${GREEN}http://localhost:3000${RESET}"
echo -e "  ├─ Backend API      ${GREEN}http://localhost:8000${RESET}"
echo -e "  └─ Backend Health   ${GREEN}http://localhost:8000/health${RESET}"
echo ""
echo -e "  ${BOLD}API Endpoints${RESET}"
echo -e "  ├─ Infra Scanner    ${CYAN}POST http://localhost:8000/api/infra-scan/run${RESET}"
echo -e "  ├─ Vulnerabilities  ${CYAN}GET  http://localhost:8000/api/vulnerabilities${RESET}"
echo -e "  ├─ Attack Graph     ${CYAN}POST http://localhost:8000/api/attack-graph/build-auto${RESET}"
echo -e "  └─ CVE Sync         ${CYAN}POST http://localhost:8000/api/sync/all${RESET}"
echo ""
echo -e "  ${BOLD}Company Infrastructure Clones${RESET}"
echo -e "  ├─ GitLab           http://localhost:8200  (CVE-2023-7028 — CVSS 10.0)"
echo -e "  ├─ WordPress        http://localhost:8201  (CVE-2024-6386 — CVSS 9.9)"
echo -e "  ├─ ERPNext          http://localhost:8202  (CVE-2024-25136 — CVSS 9.1)"
echo -e "  ├─ Keycloak         http://localhost:8203  (CVE-2024-1132  — CVSS 8.1)"
echo -e "  ├─ PostgreSQL       localhost:8204         (CVE-2024-0985  — CVSS 8.0)"
echo -e "  ├─ Grafana          http://localhost:8205  (CVE-2021-43798 — CVSS 7.5)"
echo -e "  └─ Prometheus       http://localhost:8206  (CVE-2019-3826  — CVSS 6.1)"
echo ""
echo -e "  ${BOLD}Logs${RESET}"
echo -e "  ├─ Backend   $LOG_DIR/backend.log"
echo -e "  └─ Frontend  $LOG_DIR/frontend.log"
echo ""
echo -e "  ${BOLD}To stop all services:${RESET}  ./start.sh --stop"
echo ""
