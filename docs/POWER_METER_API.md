# Power Meter API Documentation

## Overview
The Power Meter API manages power meter configurations and measurements for survey sessions. It follows the same enterprise patterns as other modules with proper validation, error handling, and single endpoint design.

## Architecture

### Model Layer (`PowerMeter`)
- **Normalization**: Uses JSON fields for complex configurations (cable and CB specs)
- **Validation**: Built-in Sequelize validators for data integrity
- **Relationships**: Proper foreign key constraints with cascade operations
- **Indexing**: Unique index on session_id for performance

### Service Layer (`PowerMeterService`)
- **Separation of Concerns**: Business logic separated from route handlers
- **Data Transformation**: Handles conversion between API and database formats
- **Error Handling**: Centralized error processing and formatting
- **Validation**: Domain-specific validation logic

### Route Layer (`powerMeterRoutes`)
- **Single Endpoint Pattern**: One route handles both GET and PUT operations
- **Consistent Response Format**: Standard success/error response structure
- **Health Check**: Module health monitoring endpoint

## API Endpoints

### GET/PUT `/api/power-meter/:session_id`

#### GET Request
Retrieves power meter info for a session. Returns defaults if no data exists.

**Response Format:**
```json
{
  "success": true,
  "data": {
    "session_id": "20231201_site123_001",
    "serial_number": "PM123456",
    "meter_reading": 1250.75,
    "ac_power_source_type": "three_phase",
    "power_cable_config": {
      "length": 25.5,
      "cross_section": 16.0
    },
    "main_cb_config": {
      "rating": 63.0,
      "type": "three_phase"
    },
    "metadata": {
      "created_at": "2023-12-01T10:00:00Z",
      "updated_at": "2023-12-01T11:00:00Z"
    }
  }
}
```

#### PUT Request
Creates or updates power meter info for a session.

**Request Body Examples:**

1. **Basic Power Meter Info:**
```json
{
  "serial_number": "PM123456",
  "meter_reading": 1250.75,
  "ac_power_source_type": "three_phase"
}
```

2. **Complete Configuration:**
```json
{
  "serial_number": "PM789012",
  "meter_reading": 2500.0,
  "ac_power_source_type": "single_phase",
  "power_cable_config": {
    "length": 30.0,
    "cross_section": 25.0
  },
  "main_cb_config": {
    "rating": 100.0,
    "type": "single_phase"
  }
}
```

3. **Partial Update (only cable config):**
```json
{
  "power_cable_config": {
    "length": 15.0,
    "cross_section": 10.0
  }
}
```

4. **Partial Update (only CB config):**
```json
{
  "main_cb_config": {
    "rating": 80.0,
    "type": "three_phase"
  }
}
```

## Field Specifications

### Power Meter Fields

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `serial_number` | String | Max 100 chars | Power meter serial number |
| `meter_reading` | Number | Positive | Current meter reading |
| `ac_power_source_type` | Enum | `three_phase` \| `single_phase` | AC power source type |

### Power Cable Configuration

| Field | Type | Unit | Validation | Description |
|-------|------|------|------------|-------------|
| `length` | Number | meters (m) | Positive | Length of power cable from input to power meter |
| `cross_section` | Number | mm² | Positive | Cross section of power cable |

### Main CB (Circuit Breaker) Configuration

| Field | Type | Unit | Validation | Description |
|-------|------|------|------------|-------------|
| `rating` | Number | Amperes (Amp) | Positive | Main CB rating connecting power meter with AC panel |
| `type` | Enum | - | `three_phase` \| `single_phase` | Main CB type |

## Validation Rules

### Serial Number
- Optional string field
- Maximum 100 characters
- Default: empty string

### Meter Reading
- Optional positive number
- Minimum value: 0
- Default: null

### AC Power Source Type
- Optional enum field
- Valid values: `three_phase`, `single_phase`
- Default: null

### Power Cable Configuration
- Optional object with length and cross_section
- Both fields must be positive numbers if provided
- Default: `{ length: null, cross_section: null }`

### Main CB Configuration
- Optional object with rating and type
- Rating must be positive number if provided
- Type must be valid enum value if provided
- Default: `{ rating: null, type: null }`

## Error Handling

### Validation Errors (400)
```json
{
  "success": false,
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Data validation failed",
    "errors": [
      {
        "field": "meter_reading",
        "message": "Meter reading must be a positive number",
        "value": -100
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
CREATE TABLE power_meter (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  serial_number VARCHAR(100) DEFAULT '',
  meter_reading FLOAT DEFAULT NULL,
  ac_power_source_type ENUM('three_phase', 'single_phase') DEFAULT NULL,
  power_cable_config JSON DEFAULT NULL,
  main_cb_config JSON DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES survey(session_id) ON DELETE CASCADE ON UPDATE CASCADE
);
```

## Frontend Integration Examples

### 1. Load Existing Data
```javascript
// GET request to load data on page load
const response = await fetch(`/api/power-meter/${sessionId}`);
const result = await response.json();

if (result.success) {
  // Populate form fields
  const data = result.data;
  document.getElementById('serial_number').value = data.serial_number;
  document.getElementById('meter_reading').value = data.meter_reading || '';
  document.getElementById('ac_power_source').value = data.ac_power_source_type || '';
  document.getElementById('cable_length').value = data.power_cable_config?.length || '';
  document.getElementById('cable_cross_section').value = data.power_cable_config?.cross_section || '';
  document.getElementById('cb_rating').value = data.main_cb_config?.rating || '';
  document.getElementById('cb_type').value = data.main_cb_config?.type || '';
}
```

### 2. Save Form Data
```javascript
// PUT request to save form data
const formData = {
  serial_number: document.getElementById('serial_number').value,
  meter_reading: parseFloat(document.getElementById('meter_reading').value) || null,
  ac_power_source_type: document.getElementById('ac_power_source').value || null,
  power_cable_config: {
    length: parseFloat(document.getElementById('cable_length').value) || null,
    cross_section: parseFloat(document.getElementById('cable_cross_section').value) || null
  },
  main_cb_config: {
    rating: parseFloat(document.getElementById('cb_rating').value) || null,
    type: document.getElementById('cb_type').value || null
  }
};

const response = await fetch(`/api/power-meter/${sessionId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(formData)
});

const result = await response.json();
if (result.success) {
  console.log('Power meter info saved successfully');
} else {
  console.error('Error saving data:', result.error);
}
```

## Performance Considerations

- **JSON Fields**: Efficient storage for nested configurations
- **Single Record per Session**: Prevents data duplication
- **Cascade Operations**: Automatic cleanup when surveys are deleted
- **Indexed Session ID**: Fast lookups and updates
- **Connection Pooling**: Configured for high concurrent access

## Health Check

```http
GET /api/power-meter/health/check
```

**Response:**
```json
{
  "success": true,
  "module": "power-meter",
  "status": "healthy",
  "timestamp": "2023-12-01T12:00:00.000Z"
}
``` 