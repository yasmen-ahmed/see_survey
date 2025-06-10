# AC Connection Info API Documentation

## Overview
The AC Connection Info API manages power source configurations for survey sessions. It implements a single endpoint pattern for both retrieval and updates, following RESTful principles.

## Architecture

### Model Layer (`AcConnectionInfo`)
- **Normalization**: Uses JSON fields for complex nested data instead of flat columns
- **Validation**: Built-in Sequelize validators for data integrity
- **Relationships**: Proper foreign key constraints with cascade operations
- **Indexing**: Unique index on session_id for performance

### Service Layer (`AcConnectionService`)
- **Separation of Concerns**: Business logic separated from route handlers
- **Data Transformation**: Handles conversion between API and database formats
- **Error Handling**: Centralized error processing and formatting
- **Validation**: Domain-specific validation logic

### Route Layer (`acConnectionInfoRoutes`)
- **Single Endpoint Pattern**: One route handles both GET and PUT operations
- **Middleware Chain**: Validation → Business Logic → Response
- **Consistent Response Format**: Standard success/error response structure
- **Health Check**: Module health monitoring endpoint

## API Endpoints

### GET/PUT `/api/ac-connection-info/:session_id`

#### GET Request
Retrieves AC connection info for a session. Returns defaults if no data exists.

**Response Format:**
```json
{
  "success": true,
  "data": {
    "session_id": "20231201_site123_001",
    "power_sources": ["diesel_generator"],
    "diesel_config": {
      "count": 2,
      "generators": [
        {
          "capacity": 100,
          "status": "active",
          "name": "Generator 1"
        },
        {
          "capacity": 150,
          "status": "standby", 
          "name": "Generator 2"
        }
      ]
    },
    "solar_config": null,
    "metadata": {
      "created_at": "2023-12-01T10:00:00Z",
      "updated_at": "2023-12-01T11:00:00Z"
    }
  }
}
```

#### PUT Request
Creates or updates AC connection info for a session.

**Request Body Examples:**

1. **Commercial Power Only:**
```json
{
  "power_sources": ["commercial_power"]
}
```

2. **Diesel Generator (1 unit):**
```json
{
  "power_sources": ["diesel_generator"],
  "diesel_config": {
    "count": 1,
    "generators": [
      {
        "capacity": 100,
        "status": "active"
      }
    ]
  }
}
```

3. **Diesel Generator (2 units):**
```json
{
  "power_sources": ["diesel_generator"],
  "diesel_config": {
    "count": 2,
    "generators": [
      {
        "capacity": 100,
        "status": "active"
      },
      {
        "capacity": 150,
        "status": "standby"
      }
    ]
  }
}
```

4. **Solar Cell:**
```json
{
  "power_sources": ["solar_cell"],
  "solar_config": {
    "capacity": 75
  }
}
```

5. **Multiple Sources:**
```json
{
  "power_sources": ["commercial_power", "diesel_generator", "solar_cell"],
  "diesel_config": {
    "count": 1,
    "generators": [
      {
        "capacity": 50,
        "status": "standby"
      }
    ]
  },
  "solar_config": {
    "capacity": 25
  }
}
```

## Validation Rules

### Power Sources
- Must be an array
- Valid values: `commercial_power`, `diesel_generator`, `solar_cell`, `other`

### Diesel Configuration
- Required when `diesel_generator` is selected
- `count`: Must be 1 or 2
- `generators`: Array with exactly `count` elements
- Each generator requires:
  - `capacity`: Positive number (KVA)
  - `status`: One of `active`, `standby`, `faulty`, `not_working`

### Solar Configuration
- Required when `solar_cell` is selected
- `capacity`: Positive number

## Error Handling

### Validation Errors (400)
```json
{
  "success": false,
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "errors": [
      {
        "field": "power_sources",
        "message": "power_sources must be an array",
        "value": "invalid_value"
      }
    ]
  }
}
```

### Foreign Key Errors (400)
```json
{
  "success": false,
  "error": {
    "type": "FOREIGN_KEY_ERROR",
    "message": "Survey with session_id 'invalid_session' not found. Please create a survey first."
  }
}
```

### Service Errors (500)
```json
{
  "success": false,
  "error": {
    "type": "SERVICE_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## Database Schema

```sql
CREATE TABLE ac_connection_info (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  power_sources JSON DEFAULT ('[]'),
  diesel_config JSON DEFAULT NULL,
  solar_config JSON DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES survey(session_id) ON DELETE CASCADE ON UPDATE CASCADE
);
```

## Frontend Integration Flow

1. **Page Load**: GET request to retrieve existing data or defaults
2. **User Interaction**: Update local state based on checkbox selections
3. **Form Submission**: PUT request with complete form data
4. **Success**: Display confirmation and updated data
5. **Error**: Display validation errors to user

## Performance Considerations

- **JSON Fields**: Efficient for complex nested data, indexed for fast queries
- **Single Record per Session**: Prevents data duplication
- **Cascade Operations**: Automatic cleanup when surveys are deleted
- **Connection Pooling**: Configured for high concurrent access 