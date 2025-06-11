# Outdoor General Layout API Documentation

## Overview
The Outdoor General Layout API manages outdoor equipment layout configurations for survey sessions. It handles equipment area information, cable tray specifications, earth bus bar configurations, and site measurement data.

## Architecture

### Model Layer (`OutdoorGeneralLayout`)
- **Focused Structure**: Simplified model for core outdoor layout information
- **Validation**: Comprehensive validation for all configuration fields
- **Relationships**: Proper foreign key constraints with cascade operations
- **Indexing**: Unique index on session_id for performance

### Service Layer (`OutdoorGeneralLayoutService`)
- **Data Transformation**: Handles conversion between API and database formats
- **Advanced Validation**: Business logic validation with detailed error handling
- **Session Management**: Proper session validation and error handling

### Route Layer (`outdoorGeneralLayoutRoutes`)
- **Main Endpoints**: GET/PUT for primary data operations
- **Consistent Response Format**: Standard success/error response structure
- **Health Check**: Module monitoring with feature listing

## API Endpoints

### Main Data Endpoints

#### GET/PUT `/api/outdoor-general-layout/:session_id`

##### GET Request
Retrieves outdoor general layout info for a session. Returns defaults if no data exists.

**Response Format:**
```json
{
  "success": true,
  "data": {
    "session_id": "20231201_site123_001",
    "equipment_area_sunshade": "yes",
    "free_positions_available": 3,
    "cable_tray_config": {
      "height": 50,
      "width": 200,
      "depth": 100
    },
    "cable_tray_space_available": true,
    "earth_bus_bar_config": {
      "available_bars": 2,
      "free_holes": 1
    },
    "has_site_sketch": true,
    "metadata": {
      "created_at": "2023-12-01T10:00:00Z",
      "updated_at": "2023-12-01T11:00:00Z"
    }
  }
}
```

##### PUT Request
Creates or updates outdoor general layout info for a session.

**Request Body Examples:**

1. **Complete Configuration:**
```json
{
  "equipment_area_sunshade": "partially",
  "free_positions_available": 2,
  "cable_tray_config": {
    "height": 75,
    "width": 300,
    "depth": 150
  },
  "cable_tray_space_available": true,
  "earth_bus_bar_config": {
    "available_bars": 3,
    "free_holes": 2
  },
  "has_site_sketch": false
}
```

2. **Partial Update (only cable tray):**
```json
{
  "cable_tray_config": {
    "height": 100,
    "width": 250,
    "depth": 120
  },
  "cable_tray_space_available": false
}
```

3. **Equipment Area Only:**
```json
{
  "equipment_area_sunshade": "no",
  "free_positions_available": 1
}
```

## Field Specifications

### Equipment Area Configuration

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `equipment_area_sunshade` | Enum | `yes`\|`no`\|`partially` | Equipment area covered with sunshade? |
| `free_positions_available` | Integer | 0-5 | How many free positions available for new cabinets installation? |

### Cable Tray Configuration

| Field | Type | Unit | Validation | Description |
|-------|------|------|------------|-------------|
| `cable_tray_config.height` | Number | cm | Positive | Height of existing cable tray from site floor level |
| `cable_tray_config.width` | Number | cm | Positive | Width of existing cable tray |
| `cable_tray_config.depth` | Number | cm | Positive | Depth of existing cable tray |
| `cable_tray_space_available` | Boolean | - | true\|false | Is there available space on existing cable tray for new cables? |

### Earth Bus Bar Configuration

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `earth_bus_bar_config.available_bars` | Integer | 1-3 | How many Earth bus bar available in cabinets location? |
| `earth_bus_bar_config.free_holes` | Integer | 1-3 | How many free holes in existing bus bars? |

### Site Documentation

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `has_site_sketch` | Boolean | true\|false | Do you have sketch with measurements for the site including cabinets? |

## Validation Rules

### Equipment Area Sunshade
- Optional enum field
- Valid values: `yes`, `no`, `partially`
- Default: null

### Free Positions Available
- Optional integer field
- Range: 0-5 positions
- Default: null

### Cable Tray Configuration
- Optional object with height, width, and depth
- All measurements must be positive numbers if provided
- Units: centimeters (cm)
- Default: `{ height: null, width: null, depth: null }`

### Cable Tray Space Available
- Optional boolean field
- Default: null

### Earth Bus Bar Configuration
- Optional object with available_bars and free_holes
- Both fields must be integers between 1-3 if provided
- Default: `{ available_bars: null, free_holes: null }`

### Site Sketch Availability
- Optional boolean field
- Default: null

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
        "field": "cable_tray_config.height",
        "message": "Cable tray height must be a positive number",
        "value": -50
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
    "type": "SERVICE_ERROR",
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
CREATE TABLE outdoor_general_layout (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  equipment_area_sunshade ENUM('yes', 'no', 'partially') DEFAULT NULL,
  free_positions_available INT DEFAULT NULL,
  cable_tray_config JSON DEFAULT NULL,
  cable_tray_space_available BOOLEAN DEFAULT NULL,
  earth_bus_bar_config JSON DEFAULT NULL,
  has_site_sketch BOOLEAN DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES survey(session_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT check_free_positions CHECK (free_positions_available BETWEEN 0 AND 5)
);
```

## Frontend Integration Examples

### 1. Load Existing Data
```javascript
// GET request to load data on page load
const response = await fetch(`/api/outdoor-general-layout/${sessionId}`);
const result = await response.json();

if (result.success) {
  const data = result.data;
  
  // Populate form fields
  document.getElementById('equipment_sunshade').value = data.equipment_area_sunshade || '';
  document.getElementById('free_positions').value = data.free_positions_available || '';
  document.getElementById('cable_height').value = data.cable_tray_config?.height || '';
  document.getElementById('cable_width').value = data.cable_tray_config?.width || '';
  document.getElementById('cable_depth').value = data.cable_tray_config?.depth || '';
  document.getElementById('cable_space_available').checked = data.cable_tray_space_available === true;
  document.getElementById('earth_bars_available').value = data.earth_bus_bar_config?.available_bars || '';
  document.getElementById('earth_free_holes').value = data.earth_bus_bar_config?.free_holes || '';
  document.getElementById('has_site_sketch').checked = data.has_site_sketch === true;
}
```

### 2. Save Form Data
```javascript
// PUT request to save form data
const formData = {
  equipment_area_sunshade: document.getElementById('equipment_sunshade').value || null,
  free_positions_available: parseInt(document.getElementById('free_positions').value) || null,
  cable_tray_config: {
    height: parseFloat(document.getElementById('cable_height').value) || null,
    width: parseFloat(document.getElementById('cable_width').value) || null,
    depth: parseFloat(document.getElementById('cable_depth').value) || null
  },
  cable_tray_space_available: document.getElementById('cable_space_available').checked,
  earth_bus_bar_config: {
    available_bars: parseInt(document.getElementById('earth_bars_available').value) || null,
    free_holes: parseInt(document.getElementById('earth_free_holes').value) || null
  },
  has_site_sketch: document.getElementById('has_site_sketch').checked
};

const response = await fetch(`/api/outdoor-general-layout/${sessionId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(formData)
});

const result = await response.json();
if (result.success) {
  console.log('Outdoor general layout saved successfully');
} else {
  console.error('Error saving data:', result.error);
}
```

### 3. Real-time Validation
```javascript
// Validate cable tray dimensions in real-time
function validateCableTrayDimensions() {
  const height = parseFloat(document.getElementById('cable_height').value);
  const width = parseFloat(document.getElementById('cable_width').value);
  const depth = parseFloat(document.getElementById('cable_depth').value);
  
  if (height && (isNaN(height) || height <= 0)) {
    showFieldError('cable_height', 'Height must be a positive number');
    return false;
  }
  
  if (width && (isNaN(width) || width <= 0)) {
    showFieldError('cable_width', 'Width must be a positive number');
    return false;
  }
  
  if (depth && (isNaN(depth) || depth <= 0)) {
    showFieldError('cable_depth', 'Depth must be a positive number');
    return false;
  }
  
  clearFieldErrors();
  return true;
}

// Validate earth bus bar configuration
function validateEarthBusBar() {
  const availableBars = parseInt(document.getElementById('earth_bars_available').value);
  const freeHoles = parseInt(document.getElementById('earth_free_holes').value);
  
  if (availableBars && (isNaN(availableBars) || availableBars < 1 || availableBars > 3)) {
    showFieldError('earth_bars_available', 'Available bars must be between 1 and 3');
    return false;
  }
  
  if (freeHoles && (isNaN(freeHoles) || freeHoles < 1 || freeHoles > 3)) {
    showFieldError('earth_free_holes', 'Free holes must be between 1 and 3');
    return false;
  }
  
  return true;
}
```

## Performance Considerations

- **JSON Storage**: Efficient for nested configuration data
- **Single Record per Session**: Prevents data duplication
- **Cascade Operations**: Automatic cleanup when surveys are deleted
- **Indexed Session ID**: Fast lookups and updates
- **Connection Pooling**: Configured for high concurrent access

## Health Check

```http
GET /api/outdoor-general-layout/health/check
```

**Response:**
```json
{
  "success": true,
  "module": "outdoor-general-layout",
  "status": "healthy",
  "timestamp": "2023-12-01T12:00:00.000Z",
  "features": [
    "multiple_cb_tables",
    "complex_configurations",
    "auto_column_generation",
    "cable_tray_management",
    "earth_bus_bar_config"
  ]
}
```

## Summary

The Outdoor General Layout API provides:

✅ **Complete form field coverage** matching the provided screenshot  
✅ **Session-based operations** with proper validation  
✅ **Flexible configuration** with partial update support  
✅ **Comprehensive validation** at multiple layers  
✅ **Error handling** with detailed feedback  
✅ **Performance optimization** with proper indexing  
✅ **Frontend-ready** with complete integration examples  

The API is now ready for integration with your frontend application and properly handles all the fields shown in your outdoor general layout form. 