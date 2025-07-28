# SEE Survey Application - Docker Setup

This document provides instructions for running the SEE Survey application using Docker containers.

## Architecture

The application consists of three main components:
- **Frontend**: React application served by Nginx
- **Backend**: Node.js Express API
- **Database**: MySQL 8.0

## Prerequisites

- Docker and Docker Compose installed on your system
- At least 4GB of available RAM
- 10GB of available disk space

## Quick Start

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd see_survey_backend
   ```

2. **Set up environment variables**:
   ```bash
   cp env.example .env
   ```
   Edit the `.env` file with your desired configuration.

3. **Build and start all services**:
   ```bash
   docker-compose up --build
   ```

4. **Access the application**:
   - Frontend: http://localhost:80
   - Backend API: http://localhost:3000
   - Database: localhost:3306

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=mysql
DB_NAME=see_survey_db
DB_USER=survey_user
DB_PASSWORD=survey_password
MYSQL_ROOT_PASSWORD=rootpassword

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production

# Application Configuration
NODE_ENV=production
PORT=3000

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:3000
```

## Docker Commands

### Build Images
```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend
```

### Start Services
```bash
# Start all services in background
docker-compose up -d

# Start specific service
docker-compose up -d backend
docker-compose up -d frontend
```

### View Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql

# Follow logs in real-time
docker-compose logs -f
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This will delete all data)
docker-compose down -v
```

### Health Checks
```bash
# Check service status
docker-compose ps

# Check health status
docker-compose exec backend wget -qO- http://localhost:3000/health
docker-compose exec frontend wget -qO- http://localhost:80/
```

## Individual Docker Images

### Backend Image
```bash
# Build backend image
docker build -t see-survey-backend ./see_survey_backend

# Run backend container
docker run -d \
  --name see-survey-backend \
  -p 3000:3000 \
  -e DB_HOST=your_db_host \
  -e DB_NAME=your_db_name \
  -e DB_USER=your_db_user \
  -e DB_PASSWORD=your_db_password \
  -e JWT_SECRET=your_jwt_secret \
  see-survey-backend
```

### Frontend Image
```bash
# Build frontend image
docker build -t see-survey-frontend ./see_survey_frontend

# Run frontend container
docker run -d \
  --name see-survey-frontend \
  -p 80:80 \
  see-survey-frontend
```

## Database Management

### Access MySQL Container
```bash
# Connect to MySQL container
docker-compose exec mysql mysql -u root -p

# Connect with specific user
docker-compose exec mysql mysql -u survey_user -p see_survey_db
```

### Database Backup
```bash
# Create backup
docker-compose exec mysql mysqldump -u root -p see_survey_db > backup.sql

# Restore backup
docker-compose exec -T mysql mysql -u root -p see_survey_db < backup.sql
```

### Reset Database
```bash
# Stop services and remove volumes
docker-compose down -v

# Start services (will recreate database)
docker-compose up -d
```

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :3000
   
   # Kill the process or change ports in docker-compose.yml
   ```

2. **Database connection issues**:
   ```bash
   # Check if MySQL is running
   docker-compose ps mysql
   
   # Check MySQL logs
   docker-compose logs mysql
   ```

3. **Permission issues with uploads**:
   ```bash
   # Fix uploads directory permissions
   docker-compose exec backend chmod -R 755 /app/uploads
   ```

4. **Frontend not loading**:
   ```bash
   # Check if frontend is built correctly
   docker-compose exec frontend ls -la /usr/share/nginx/html
   
   # Check nginx logs
   docker-compose logs frontend
   ```

### Logs and Debugging
```bash
# View real-time logs
docker-compose logs -f

# Access container shell
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec mysql bash
```

## Production Deployment

For production deployment, consider the following:

1. **Use proper secrets management**:
   - Use Docker secrets or external secret management
   - Never commit `.env` files to version control

2. **Configure reverse proxy**:
   - Use Nginx or Traefik for SSL termination
   - Set up proper domain names

3. **Database persistence**:
   - Use external database or managed service
   - Set up regular backups

4. **Monitoring**:
   - Add monitoring and logging solutions
   - Set up alerts for service health

5. **Security**:
   - Use non-root users in containers
   - Regularly update base images
   - Scan images for vulnerabilities

## Development

For development, you can override the production Dockerfile:

```bash
# Use development docker-compose file
docker-compose -f docker-compose.dev.yml up
```

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs`
2. Verify environment variables
3. Ensure all prerequisites are met
4. Check the troubleshooting section above 