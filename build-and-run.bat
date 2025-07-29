@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting SEE Survey Application Docker Setup...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] docker-compose is not installed. Please install it and try again.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo [WARNING] .env file not found. Creating from template...
    if exist "env.example" (
        copy env.example .env >nul
        echo [SUCCESS] .env file created from template
        echo [WARNING] Please edit .env file with your configuration before continuing
        pause
    ) else (
        echo [ERROR] env.example file not found. Please create .env file manually.
        pause
        exit /b 1
    )
)

:menu
cls
echo.
echo === SEE Survey Application Docker Setup ===
echo 1. Build and run production environment
echo 2. Build and run development environment
echo 3. Stop all services
echo 4. Show production logs
echo 5. Show development logs
echo 6. Clean up everything
echo 7. Exit
echo.
set /p choice="Choose an option (1-7): "

if "%choice%"=="1" goto build_production
if "%choice%"=="2" goto build_development
if "%choice%"=="3" goto stop_services
if "%choice%"=="4" goto show_logs
if "%choice%"=="5" goto show_dev_logs
if "%choice%"=="6" goto cleanup
if "%choice%"=="7" goto exit
echo [ERROR] Invalid option. Please choose 1-7.
pause
goto menu

:build_production
echo [INFO] Building and starting production environment...
echo [INFO] Building Docker images...
docker-compose build
if errorlevel 1 (
    echo [ERROR] Failed to build images
    pause
    goto menu
)

echo [INFO] Starting services...
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Failed to start services
    pause
    goto menu
)

echo [INFO] Waiting for services to be ready...
timeout /t 30 /nobreak >nul

echo [INFO] Checking service status...
docker-compose ps

echo [SUCCESS] Production environment is ready!
echo [INFO] Frontend: http://localhost:80
echo [INFO] Backend API: http://localhost:3000
echo [INFO] Database: localhost:3306
pause
goto menu

:build_development
echo [INFO] Building and starting development environment...
echo [INFO] Building Docker images for development...
docker-compose -f docker-compose.dev.yml build
if errorlevel 1 (
    echo [ERROR] Failed to build development images
    pause
    goto menu
)

echo [INFO] Starting development services...
docker-compose -f docker-compose.dev.yml up -d
if errorlevel 1 (
    echo [ERROR] Failed to start development services
    pause
    goto menu
)

echo [INFO] Waiting for services to be ready...
timeout /t 30 /nobreak >nul

echo [INFO] Checking service status...
docker-compose -f docker-compose.dev.yml ps

echo [SUCCESS] Development environment is ready!
echo [INFO] Frontend: http://localhost:8000
echo [INFO] Backend API: http://localhost:3000
echo [INFO] Database: localhost:3306
pause
goto menu

:stop_services
echo [INFO] Stopping services...
docker-compose down
docker-compose -f docker-compose.dev.yml down
echo [SUCCESS] Services stopped
pause
goto menu

:show_logs
echo [INFO] Showing logs...
docker-compose logs -f
goto menu

:show_dev_logs
echo [INFO] Showing development logs...
docker-compose -f docker-compose.dev.yml logs -f
goto menu

:cleanup
echo [WARNING] This will remove all containers, images, and volumes. Are you sure? (y/N)
set /p cleanup_choice="Enter y to confirm: "
if /i "%cleanup_choice%"=="y" (
    echo [INFO] Cleaning up...
    docker-compose down -v --rmi all
    docker-compose -f docker-compose.dev.yml down -v --rmi all
    docker system prune -f
    echo [SUCCESS] Cleanup completed
) else (
    echo [INFO] Cleanup cancelled
)
pause
goto menu

:exit
echo [INFO] Goodbye!
exit /b 0 