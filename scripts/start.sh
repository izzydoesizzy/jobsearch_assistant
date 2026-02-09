#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-5500}"
HOST="${HOST:-0.0.0.0}"

cd "$ROOT_DIR"

echo "Starting Job Search Assistant on http://${HOST}:${PORT}"
exec python3 -m http.server "$PORT" --bind "$HOST"
