#!/usr/bin/env python3
"""Simple script to create/update database tables."""

from app import create_app
from app.models import db

app = create_app()

with app.app_context():
    db.create_all()
    print("Database tables created/updated successfully")