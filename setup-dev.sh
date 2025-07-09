#!/bin/bash

# PlotWeaver Web Development Setup Script
# One-click setup for development environment

set -e

echo "🚀 Setting up PlotWeaver Web development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 20+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        print_error "Node.js version 20+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) is installed"
}

# Check if Python is installed
check_python() {
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.8+ first."
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
    print_success "Python $(python3 --version) is installed"
}

# Check if pip is installed
check_pip() {
    if ! command -v pip3 &> /dev/null; then
        print_error "pip3 is not installed. Please install pip3 first."
        exit 1
    fi
    
    print_success "pip3 is available"
}

# Install root dependencies
install_root_deps() {
    print_status "Installing root dependencies..."
    npm install
    print_success "Root dependencies installed"
}

# Install frontend dependencies
install_frontend_deps() {
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    print_success "Frontend dependencies installed"
}

# Install backend dependencies
install_backend_deps() {
    print_status "Installing backend dependencies..."
    cd bff
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment and install dependencies
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    deactivate
    cd ..
    print_success "Backend dependencies installed"
}

# Create .env files if they don't exist
create_env_files() {
    print_status "Setting up environment files..."
    
    # Frontend .env.local
    if [ ! -f "frontend/.env.local" ]; then
        cat > frontend/.env.local << EOF
# Development environment variables
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_ENV=development
EOF
        print_success "Created frontend/.env.local"
    else
        print_warning "frontend/.env.local already exists"
    fi
    
    # Backend .env
    if [ ! -f "bff/.env" ]; then
        cat > bff/.env << EOF
# Development environment variables
ENVIRONMENT=development
API_HOST=0.0.0.0
API_PORT=8000
FRONTEND_URL=http://localhost:3000
DEBUG=true
EOF
        print_success "Created bff/.env"
    else
        print_warning "bff/.env already exists"
    fi
}

# Verify setup
verify_setup() {
    print_status "Verifying setup..."
    
    # Check if frontend can build
    cd frontend
    npm run type-check
    cd ..
    
    # Check if backend imports work
    cd bff
    source venv/bin/activate
    python -c "import server.main; print('Backend imports successful')"
    deactivate
    cd ..
    
    print_success "Setup verification complete"
}

# Main setup process
main() {
    print_status "Starting development environment setup..."
    
    # Prerequisites check
    check_node
    check_python
    check_pip
    
    # Install dependencies
    install_root_deps
    install_frontend_deps
    install_backend_deps
    
    # Setup environment
    create_env_files
    
    # Verify everything works
    verify_setup
    
    print_success "🎉 Development environment setup complete!"
    echo
    echo "Next steps:"
    echo "  1. Run 'make dev' to start development servers"
    echo "  2. Open http://localhost:3000 for frontend"
    echo "  3. API will be available at http://localhost:8000"
    echo
    echo "Available commands:"
    echo "  make help    - Show available make targets"
    echo "  make dev     - Start development servers"
    echo "  make test    - Run tests"
    echo "  make lint    - Run linters"
}

# Run main function
main "$@"