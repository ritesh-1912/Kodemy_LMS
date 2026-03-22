#!/usr/bin/env bash
# Start API (:5002) + Next (:3000) from repo root (folder with backend/ and frontend/).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ ! -d "$ROOT/backend" || ! -d "$ROOT/frontend" ]]; then
  echo "Run from Kodemy repo root (need backend/ and frontend/)."
  exit 1
fi

echo ""
echo "  Kodemy — starting dev servers"
echo "  API:  http://localhost:5002/api/health"
echo "  Site: http://localhost:3000"
echo "  Stop: Ctrl+C"
echo ""

(cd "$ROOT/backend" && npm run dev) &
BACK_PID=$!
(cd "$ROOT/frontend" && npm run dev) &
FRONT_PID=$!

cleanup() {
  kill "$BACK_PID" "$FRONT_PID" 2>/dev/null || true
}
trap cleanup INT TERM

wait "$BACK_PID" || true
wait "$FRONT_PID" || true
