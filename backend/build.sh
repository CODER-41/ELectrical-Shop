#!/usr/bin/env bash
# Exit on error
set -o errexit

pip install -r requirements.txt
# DB operations (migrations, seeding) run at start time, not build time,
# because Render's internal DB hostname is only reachable at runtime.
