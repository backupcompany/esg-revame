#!/usr/bin/env bash
# Corgea-aligned Go BFF check: vet, tests, short fuzz.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"
go vet ./...
go run honnef.co/go/tools/cmd/staticcheck@latest ./...
go test ./...
go test ./internal/httpx/ -fuzz=FuzzValidEmail -fuzztime=3s
go test ./internal/httpx/ -fuzz=FuzzHTTPSURL -fuzztime=3s
echo "ok"
