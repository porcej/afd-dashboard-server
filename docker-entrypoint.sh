#!/bin/sh
set -e
# Apply Alembic migrations when the app starts (idempotent).
flask db upgrade
exec "$@"
