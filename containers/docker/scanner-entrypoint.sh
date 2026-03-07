#!/usr/bin/env bash
# Sentinel AI Scanner Entrypoint
# Usage: docker run sentinelai/scanner [trivy|grype|semgrep|depcheck] [args...]

set -euo pipefail

TOOL="${1:-trivy}"
shift || true

case "$TOOL" in
  trivy)
    exec trivy "$@"
    ;;
  grype)
    exec grype "$@"
    ;;
  semgrep)
    exec semgrep "$@"
    ;;
  depcheck|dependency-check)
    exec dependency-check "$@"
    ;;
  *)
    echo "Unknown tool: $TOOL"
    echo "Available: trivy, grype, semgrep, depcheck"
    exit 1
    ;;
esac
