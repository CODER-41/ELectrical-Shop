#!/bin/bash

# Electronics Shop - Setup Script
# This script sets up the development environment for new contributors

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend/electricalshop-app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check for required tools
check_requirements() {
    print_step "Checking requirements..."

    local missing=()

    if ! command -v python3 &> /dev/null; then
        missing+=("python3")
    fi

    if ! command -v pip3 &> /dev/null && ! command -v pip &> /dev/null; then
        missing+=("pip")
    fi

    if ! command -v node &> /dev/null; then
        missing+=("node")
    fi

    if ! command -v npm &> /dev/null; then
        missing+=("npm")
    fi

    if ! command -v psql &> /dev/null; then
        missing+=("postgresql")
    fi

    if [ ${#missing[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing[*]}"
        echo ""
        echo "Please install the missing tools:"
        echo "  - Python 3: https://www.python.org/downloads/"
        echo "  - Node.js: https://nodejs.org/"
        echo "  - PostgreSQL: https://www.postgresql.org/download/"
        exit 1
    fi

    print_success "All required tools are installed"
}

# Setup backend
setup_backend() {
    print_step "Setting up backend..."

    cd "$BACKEND_DIR"

    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_step "Creating Python virtual environment..."
        python3 -m venv venv
        print_success "Virtual environment created"
    else
        print_success "Virtual environment already exists"
    fi

    # Activate virtual environment
    source venv/bin/activate

    # Upgrade pip
    print_step "Upgrading pip..."
    pip install --upgrade pip > /dev/null 2>&1

    # Install dependencies
    print_step "Installing Python dependencies..."
    pip install -r requirements.txt > /dev/null 2>&1
    print_success "Python dependencies installed"

    # Setup environment file
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Created .env from .env.example"
            echo ""
            echo -e "${YELLOW}IMPORTANT: You need to update backend/.env with your credentials!${NC}"
            echo ""
            echo "At minimum, update the DATABASE_URL with your PostgreSQL password:"
            echo "  DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/electronics_shop"
            echo ""
            echo "Open backend/.env in another terminal/editor and update it now."
            echo ""
            read -p "Press Enter after updating the DATABASE_URL in .env..."
        else
            print_error ".env.example not found"
            exit 1
        fi
    else
        print_success ".env file already exists"
    fi

    cd "$PROJECT_ROOT"
}

# Test database connection using .env credentials
test_db_connection() {
    cd "$BACKEND_DIR"
    source venv/bin/activate

    python3 -c "
import os
from dotenv import load_dotenv
load_dotenv()

db_url = os.getenv('DATABASE_URL', '')
print(f'Testing connection to: {db_url[:db_url.rfind(\"@\")+1]}***')

try:
    from sqlalchemy import create_engine
    engine = create_engine(db_url)
    conn = engine.connect()
    conn.close()
    print('SUCCESS')
    exit(0)
except Exception as e:
    print(f'FAILED: {e}')
    exit(1)
" 2>&1
}

# Setup database
setup_database() {
    print_step "Setting up PostgreSQL database..."

    # First, check if we need to update .env
    print_step "Testing database connection..."

    cd "$BACKEND_DIR"

    # Load DATABASE_URL from .env
    if [ -f ".env" ]; then
        DB_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2-)
    fi

    # Test connection
    if test_db_connection | grep -q "SUCCESS"; then
        print_success "Database connection successful"
    else
        print_warning "Database connection failed!"
        echo ""
        echo -e "${YELLOW}The default database credentials in .env may not match your PostgreSQL setup.${NC}"
        echo ""
        echo "Current DATABASE_URL in backend/.env:"
        echo -e "  ${BLUE}$DB_URL${NC}"
        echo ""
        echo -e "${YELLOW}Please update backend/.env with your PostgreSQL credentials:${NC}"
        echo ""
        echo "  1. Open backend/.env in a text editor"
        echo "  2. Update DATABASE_URL with your credentials:"
        echo "     DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/electronics_shop"
        echo ""
        echo "  Common configurations:"
        echo "     - If using peer auth: postgresql://postgres@localhost:5432/electronics_shop"
        echo "     - With password:      postgresql://postgres:yourpassword@localhost:5432/electronics_shop"
        echo ""
        echo "  3. Make sure the database 'electronics_shop' exists:"
        echo "     sudo -u postgres createdb electronics_shop"
        echo ""
        read -p "Press Enter after updating .env and creating the database..."

        # Test again
        if test_db_connection | grep -q "SUCCESS"; then
            print_success "Database connection successful"
        else
            print_error "Database connection still failing. Please check your credentials."
            echo ""
            test_db_connection
            echo ""
            read -p "Press Enter to try again, or Ctrl+C to exit..."
            setup_database  # Recursive retry
            return
        fi
    fi

    cd "$PROJECT_ROOT"
}

# Run migrations
run_migrations() {
    print_step "Running database migrations..."

    cd "$BACKEND_DIR"
    source venv/bin/activate

    export FLASK_APP=run.py

    # Check if migrations folder has versions
    if [ -d "migrations/versions" ] && [ "$(ls -A migrations/versions 2>/dev/null)" ]; then
        flask db upgrade
        print_success "Migrations applied"
    else
        print_warning "No migrations found. Initializing..."
        flask db migrate -m "Initial migration"
        flask db upgrade
        print_success "Initial migration created and applied"
    fi

    cd "$PROJECT_ROOT"
}

# Seed database
seed_database() {
    print_step "Seeding database with sample data..."

    cd "$BACKEND_DIR"
    source venv/bin/activate

    python seed_all.py

    print_success "Database seeded successfully"

    cd "$PROJECT_ROOT"
}

# Setup frontend
setup_frontend() {
    print_step "Setting up frontend..."

    cd "$FRONTEND_DIR"

    # Setup environment file
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Created frontend .env from .env.example"
        else
            print_warning "Frontend .env.example not found, creating default .env"
            echo "VITE_API_URL=http://localhost:5000/api" > .env
            echo "VITE_BACKEND_URL=http://localhost:5000" >> .env
            print_success "Created frontend .env with defaults"
        fi
    else
        print_success "Frontend .env file already exists"
    fi

    # Install npm dependencies
    print_step "Installing Node.js dependencies..."
    npm install > /dev/null 2>&1
    print_success "Node.js dependencies installed"

    cd "$PROJECT_ROOT"
}

# Print final instructions
print_instructions() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Setup Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Update backend/.env with your credentials:"
    echo "   - Database connection (if different)"
    echo "   - Email settings (MAIL_USERNAME, MAIL_PASSWORD)"
    echo "   - Google OAuth (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)"
    echo "   - Cloudinary (CLOUDINARY_CLOUD_NAME, etc.)"
    echo "   - M-Pesa (MPESA_CONSUMER_KEY, etc.)"
    echo "   - Web3Forms (WEB3FORMS_ACCESS_KEY)"
    echo ""
    echo "2. Start the development servers:"
    echo ""
    echo "   Option A - Run both together:"
    echo "   ./start.sh"
    echo ""
    echo "   Option B - Run separately:"
    echo "   # Terminal 1 - Backend"
    echo "   cd backend && source venv/bin/activate && python run.py"
    echo ""
    echo "   # Terminal 2 - Frontend"
    echo "   cd frontend/electricalshop-app && npm run dev"
    echo ""
    echo "3. Access the application:"
    echo "   - Frontend: http://localhost:5173"
    echo "   - Backend API: http://localhost:5000"
    echo "   - Health check: http://localhost:5000/api/health"
    echo ""
}

# Main execution
main() {
    echo ""
    echo "====================================="
    echo "  Electronics Shop - Setup Script"
    echo "====================================="
    echo ""

    check_requirements
    setup_backend
    setup_database
    run_migrations
    seed_database
    setup_frontend
    print_instructions
}

# Run main function
main
