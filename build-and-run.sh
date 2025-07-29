#!/bin/bash

# SEE Survey Application - Docker Build and Run Script

set -e

echo "🚀 Starting SEE Survey Application Docker Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install it and try again."
    exit 1
fi

# Function to check if .env file exists
check_env_file() {
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        if [ -f "env.example" ]; then
            cp env.example .env
            print_success ".env file created from template"
            print_warning "Please edit .env file with your configuration before continuing"
            read -p "Press Enter to continue after editing .env file..."
        else
            print_error "env.example file not found. Please create .env file manually."
            exit 1
        fi
    fi
}

# Function to build and run production
build_production() {
    print_status "Building and starting production environment..."
    
    # Build images
    print_status "Building Docker images..."
    docker-compose build
    
    # Start services
    print_status "Starting services..."
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Check service status
    print_status "Checking service status..."
    docker-compose ps
    
    print_success "Production environment is ready!"
    print_status "Frontend: http://localhost:80"
    print_status "Backend API: http://localhost:3000"
    print_status "Database: localhost:3306"
}

# Function to build and run development
build_development() {
    print_status "Building and starting development environment..."
    
    # Build images
    print_status "Building Docker images for development..."
    docker-compose -f docker-compose.dev.yml build
    
    # Start services
    print_status "Starting development services..."
    docker-compose -f docker-compose.dev.yml up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Check service status
    print_status "Checking service status..."
    docker-compose -f docker-compose.dev.yml ps
    
    print_success "Development environment is ready!"
    print_status "Frontend: http://localhost:8000"
    print_status "Backend API: http://localhost:3000"
    print_status "Database: localhost:3306"
}

# Function to stop services
stop_services() {
    print_status "Stopping services..."
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
    print_success "Services stopped"
}

# Function to show logs
show_logs() {
    print_status "Showing logs..."
    docker-compose logs -f
}

# Function to show development logs
show_dev_logs() {
    print_status "Showing development logs..."
    docker-compose -f docker-compose.dev.yml logs -f
}

# Function to clean up
cleanup() {
    print_warning "This will remove all containers, images, and volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Cleaning up..."
        docker-compose down -v --rmi all
        docker-compose -f docker-compose.dev.yml down -v --rmi all
        docker system prune -f
        print_success "Cleanup completed"
    else
        print_status "Cleanup cancelled"
    fi
}

# Main menu
show_menu() {
    echo ""
    echo "=== SEE Survey Application Docker Setup ==="
    echo "1. Build and run production environment"
    echo "2. Build and run development environment"
    echo "3. Stop all services"
    echo "4. Show production logs"
    echo "5. Show development logs"
    echo "6. Clean up everything"
    echo "7. Exit"
    echo ""
}

# Main script logic
main() {
    check_env_file
    
    while true; do
        show_menu
        read -p "Choose an option (1-7): " choice
        
        case $choice in
            1)
                build_production
                ;;
            2)
                build_development
                ;;
            3)
                stop_services
                ;;
            4)
                show_logs
                ;;
            5)
                show_dev_logs
                ;;
            6)
                cleanup
                ;;
            7)
                print_status "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-7."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function
main 