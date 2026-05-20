#!/usr/bin/env bash
set -o errexit

echo "==> Running database migrations..."
flask db upgrade

echo "==> Applying column/table patches..."
python update_returns_table.py

echo "==> Seeding database (skips if data already exists)..."
python seed_all.py

echo "==> Starting gunicorn..."
exec gunicorn run:app
