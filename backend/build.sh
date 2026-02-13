#!/usr/bin/env bash
# Exit on error
set -o errexit

pip install -r requirements.txt

# Run database migrations
flask db upgrade

# Update returns table with missing columns
python update_returns_table.py

# Seed the database (only runs once — skips if data already exists)
python seed_all.py
