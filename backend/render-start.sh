#!/usr/bin/env bash
set -e

echo "Starting Leave Management API..."

# Mark migrations as applied (NO table creation)
python -m alembic stamp head

# Start FastAPI
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}