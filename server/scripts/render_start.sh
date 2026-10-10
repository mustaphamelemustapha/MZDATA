#!/usr/bin/env bash
set -euo pipefail

if [ -z "${FORWARD_TARGET_URL:-}" ]; then
  alembic upgrade head
fi

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
