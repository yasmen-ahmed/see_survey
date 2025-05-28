# Backend Project with Node.js and MySQL

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Create a `.env` file in the root directory with the following content:
     ```
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=your_password
     DB_NAME=backend_db
     PORT=3000
     ```

4. **Create MySQL database and tables**
   - Run the SQL schema file:
     ```bash
     mysql -u root -p < db/schema.sql
     ```

5. **Start the server**
   - Development mode:
     ```bash
     npm run dev
     ```
   - Production mode:
     ```bash
     npm start
     ```

## API Endpoints

### Site Location
- **GET** `/api/sites` - Get all site locations
- **GET** `/api/sites/:id` - Get site location by ID
- **POST** `/api/sites` - Create new site location
- **PUT** `/api/sites/:id` - Update site location
- **DELETE** `/api/sites/:id` - Delete site location

### Survey
- **GET** `/api/surveys` - Get all surveys
- **GET** `/api/surveys/:siteId/:createdAt` - Get survey by site_id and created_at
- **POST** `/api/surveys` - Create new survey
- **PUT** `/api/surveys/:siteId/:createdAt` - Update survey
- **DELETE** `/api/surveys/:siteId/:createdAt` - Delete survey

## Technologies Used
- Node.js
- Express
- MySQL
- Sequelize ORM