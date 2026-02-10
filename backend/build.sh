#!/usr/bin/env bash
# Exit on error
set -o errexit

pip install -r requirements.txt

# Run database migrations
flask db upgrade

# Seed the database (only runs once — skips if data already exists)
python seed_all.py
