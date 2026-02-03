#!/bin/bash

# Electronics Shop - Development Start Script
# Starts both backend (Flask) and frontend (Vite) servers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend/electricalshop-app"

# PID files for cleanup
BACKEND_PID=""
FRONTEND_PID=""

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"

    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo -e "${BLUE}Stopping backend server (PID: $BACKEND_PID)${NC}"
        kill "$BACKEND_PID" 2>/dev/null || true
    fi

    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo -e "${BLUE}Stopping frontend server (PID: $FRONTEND_PID)${NC}"
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi

    # Kill any remaining processes on the ports
    lsof -ti:5000 | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true

    echo -e "${GREEN}Servers stopped.${NC}"
    exit 0
}

# Trap signals for cleanup
trap cleanup SIGINT SIGTERM EXIT

# Print header
print_header() {
    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}       Electronics Shop - Dev Server        ${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
}

# Check if command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed${NC}"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"

    check_command "python3"
    check_command "npm"

    # Check for pip or pipenv
    if ! command -v pip3 &> /dev/null && ! command -v pipenv &> /dev/null; then
        echo -e "${RED}Error: Neither pip3 nor pipenv is installed${NC}"
        exit 1
    fi

    echo -e "${GREEN}All prerequisites met.${NC}"
    echo ""
}

# Start backend server
start_backend() {
    echo -e "${YELLOW}Starting backend server...${NC}"

    cd "$BACKEND_DIR"

    # Check if virtual environment exists
    if [ -d "venv" ]; then
        echo -e "${BLUE}Activating virtual environment...${NC}"
        source venv/bin/activate
    elif [ -f "Pipfile" ] && command -v pipenv &> /dev/null; then
        echo -e "${BLUE}Using Pipenv environment...${NC}"
        pipenv run python run.py &
        BACKEND_PID=$!
        cd "$PROJECT_ROOT"
        return
    fi

    # Check if .env file exists
    if [ ! -f ".env" ] && [ -f ".env.example" ]; then
        echo -e "${YELLOW}Warning: .env file not found. Copying from .env.example${NC}"
        cp .env.example .env
        echo -e "${YELLOW}Please update .env with your actual configuration.${NC}"
    fi

    # Install dependencies if needed
    if [ -f "requirements.txt" ]; then
        echo -e "${BLUE}Installing backend dependencies...${NC}"
        pip3 install -r requirements.txt -q
    fi

    # Start Flask server
    python3 run.py &
    BACKEND_PID=$!

    cd "$PROJECT_ROOT"

    echo -e "${GREEN}Backend server started on http://localhost:5000${NC}"
    echo ""
}

# Start frontend server
start_frontend() {
    echo -e "${YELLOW}Starting frontend server...${NC}"

    cd "$FRONTEND_DIR"

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}Installing frontend dependencies...${NC}"
        npm install
    fi

    # Start Vite dev server
    npm run dev &
    FRONTEND_PID=$!

    cd "$PROJECT_ROOT"

    echo -e "${GREEN}Frontend server started on http://localhost:5173${NC}"
    echo ""
}

# Wait for servers to be ready
wait_for_servers() {
    echo -e "${YELLOW}Waiting for servers to be ready...${NC}"

    # Wait for backend
    local backend_ready=false
    for i in {1..30}; do
        if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
            backend_ready=true
            break
        fi
        sleep 1
    done

    if [ "$backend_ready" = true ]; then
        echo -e "${GREEN}Backend is ready.${NC}"
    else
        echo -e "${YELLOW}Backend may still be starting...${NC}"
    fi

    # Wait for frontend
    local frontend_ready=false
    for i in {1..30}; do
        if curl -s http://localhost:5173 > /dev/null 2>&1; then
            frontend_ready=true
            break
        fi
        sleep 1
    done

    if [ "$frontend_ready" = true ]; then
        echo -e "${GREEN}Frontend is ready.${NC}"
    else
        echo -e "${YELLOW}Frontend may still be starting...${NC}"
    fi

    echo ""
}

# Print server info
print_info() {
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  Development servers are running!          ${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo -e "  ${YELLOW}Frontend:${NC}"
    echo -e "    App:        ${BLUE}http://localhost:5173${NC}"
    echo ""
    echo -e "  ${YELLOW}Backend API:${NC}"
    echo -e "    Base URL:   ${BLUE}http://localhost:5000${NC}"
    echo -e "    API Docs:   ${BLUE}http://localhost:5000/api/docs${NC}"
    echo -e "    Swagger UI: ${BLUE}http://localhost:5000/api/swagger${NC}"
    echo -e "    Health:     ${BLUE}http://localhost:5000/api/health${NC}"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
    echo ""
}

# Main execution
main() {
    print_header
    check_prerequisites
    start_backend
    start_frontend
    wait_for_servers
    print_info

    # Keep script running
    while true; do
        sleep 1

        # Check if processes are still running
        if [ -n "$BACKEND_PID" ] && ! kill -0 "$BACKEND_PID" 2>/dev/null; then
            echo -e "${RED}Backend server stopped unexpectedly${NC}"
            cleanup
        fi

        if [ -n "$FRONTEND_PID" ] && ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
            echo -e "${RED}Frontend server stopped unexpectedly${NC}"
            cleanup
        fi
    done
}

# Run main function
main "$@"
