#!/bin/bash
# Restart backend server

echo "Stopping backend server..."
pkill -f "python.*run.py"
sleep 2

echo "Starting backend server..."
cd /home/kelvin/Development/Phase-5/ELectrical-Shop/backend
source venv/bin/activate
python run.py &

echo "Backend server restarted!"
