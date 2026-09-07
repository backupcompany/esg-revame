#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
go run -C backend ./cmd/api &
API_PID=$!
trap 'kill $API_PID 2>/dev/null || true' EXIT
bunx vite --port 3000
