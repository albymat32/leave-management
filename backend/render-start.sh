#!/usr/bin/env bash
set -e

echo "Starting Leave Management API..."

alembic upgrade head || echo "Alembic skipped"

exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}