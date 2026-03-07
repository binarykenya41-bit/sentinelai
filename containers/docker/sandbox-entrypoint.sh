#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Sentinel AI — Sandbox Entrypoint
#
# Validates the simulation environment, enforces safety checks,
# then dispatches to the requested tool or module.
#
# Environment variables injected by engine.ts:
#   SENTINEL_SIM_ID       — Simulation UUID
#   SENTINEL_CVE          — CVE being tested
#   SENTINEL_MODULE       — Module ID
#   SANDBOX_TARGET_HOST   — Target host (sandbox only, never production)
#   SANDBOX_TARGET_PORT   — Target port
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SIM_ID="${SENTINEL_SIM_ID:-unknown}"
TARGET="${SANDBOX_TARGET_HOST:-}"
PORT="${SANDBOX_TARGET_PORT:-80}"
MODULE="${SENTINEL_MODULE:-unknown}"
CVE="${SENTINEL_CVE:-}"

log() { echo "[SENTINEL-SANDBOX][$(date -u +%H:%M:%S)] $*"; }

log "=== Sentinel AI Exploit Simulation Sandbox ==="
log "Simulation ID : $SIM_ID"
log "Module        : $MODULE"
log "CVE           : ${CVE:-none}"
log "Target        : ${TARGET}:${PORT}"
log "User          : $(whoami)"
log "Network       : $(ip route 2>/dev/null | head -1 || echo 'isolated')"
log "=============================================="

# Safety: refuse if no target or target looks like production
if [[ -z "$TARGET" ]]; then
  log "ERROR: SANDBOX_TARGET_HOST not set. Aborting."
  exit 1
fi

# Block obviously dangerous production-range IPs
# (In production, iptables rules enforce this at the kernel level)
if [[ "$TARGET" =~ ^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.) ]]; then
  log "WARNING: Target is in RFC-1918 private range: $TARGET"
  log "Ensure this is an isolated sandbox target, not production."
fi

TOOL="${1:-help}"
shift 2>/dev/null || true

case "$TOOL" in
  help)
    echo ""
    echo "Available simulation commands:"
    echo "  nmap [args]           — Port & service enumeration"
    echo "  nikto [args]          — Web server vulnerability scan"
    echo "  sqlmap [args]         — SQL injection testing"
    echo "  hydra [args]          — Credential brute-force simulation"
    echo "  gobuster [args]       — Directory/file enumeration"
    echo "  python3 /tools/...    — Custom exploit scripts"
    echo "  msfconsole -x '...'   — Metasploit Framework"
    echo ""
    ;;

  nmap)
    log "Running nmap against $TARGET"
    exec nmap "$@" "$TARGET"
    ;;

  nikto)
    log "Running nikto against $TARGET:$PORT"
    exec nikto -h "$TARGET" -p "$PORT" "$@"
    ;;

  sqlmap)
    log "Running sqlmap"
    exec sqlmap "$@"
    ;;

  hydra)
    log "Running hydra against $TARGET"
    exec hydra "$@" "$TARGET"
    ;;

  gobuster)
    log "Running gobuster"
    exec gobuster "$@"
    ;;

  python3)
    log "Running python3 script: $*"
    exec python3 "$@"
    ;;

  bash|sh)
    log "Dropping to restricted shell for module: $MODULE"
    exec bash "$@"
    ;;

  msfconsole)
    log "Running Metasploit"
    exec msfconsole "$@"
    ;;

  *)
    # Try to run as a raw command (for module scripts)
    log "Executing: $TOOL $*"
    exec "$TOOL" "$@"
    ;;
esac
