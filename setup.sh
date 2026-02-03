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
            print_warning "Please update .env with your actual credentials"
        else
            print_error ".env.example not found"
            exit 1
        fi
    else
        print_success ".env file already exists"
    fi

    cd "$PROJECT_ROOT"
}

# Setup database
setup_database() {
    print_step "Setting up PostgreSQL database..."

    # Check if database exists
    if PGPASSWORD=postgres psql -U postgres -h localhost -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw electronics_shop; then
        print_success "Database 'electronics_shop' already exists"
    else
        print_step "Creating database 'electronics_shop'..."

        # Try to create database
        if PGPASSWORD=postgres psql -U postgres -h localhost -c "CREATE DATABASE electronics_shop;" 2>/dev/null; then
            print_success "Database created"
        else
            print_warning "Could not create database automatically"
            echo ""
            echo "Please create the database manually:"
            echo "  sudo -u postgres createdb electronics_shop"
            echo ""
            echo "Or if using password authentication:"
            echo "  PGPASSWORD=yourpassword psql -U postgres -h localhost -c \"CREATE DATABASE electronics_shop;\""
            echo ""
            read -p "Press Enter after creating the database to continue..."
        fi
    fi
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

# Setup frontend
setup_frontend() {
    print_step "Setting up frontend..."

    cd "$FRONTEND_DIR"

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
    setup_frontend
    print_instructions
}

# Run main function
main
