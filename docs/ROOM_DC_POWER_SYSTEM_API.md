# Room DC Power System API Documentation

## Overview

The Room DC Power System API provides endpoints for managing DC power system data specifically for room-based installations. This is separate from the outdoor DC power system and includes additional fields for room-specific requirements.

## Base URL

```
http://localhost:3000/api/room-dc-power-system
```

## Endpoints

### 1. Get Room DC Power System Data

**GET** `/api/room-dc-power-system/:sessionId`

Retrieves or creates room DC power system data for a specific session.

#### Parameters
- `sessionId` (string, required): The session identifier

#### Response
```json
{
  "success": true,
  "data": {
    "session_id": "session-123",
    "numberOfCabinets": 2,
    "roomDCPowerData": {
      "dc_rectifiers": {
        "existing_dc_rectifiers_location": "Existing cabinet #1",
        "existing_dc_rectifiers_vendor": "Nokia",
        "existing_dc_rectifiers_model": "Model XYZ",
        "how_many_existing_dc_rectifier_modules": 2,
        "rectifier_module_capacity": 2.5,
        "total_capacity_existing_dc_power_system": 5.0,
        "how_many_free_slot_available_rectifier": 1,
        "dc_rectifier_condition": "Good",
        "rect_load_current_reading": 10.5,
        "existing_site_temperature": 25.0,
        "blvd_in_dc_power_rack": "Yes",
        "llvd_in_dc_power_rack": "No",
        "pdu_in_dc_power_rack": "Yes",
        "free_cbs_blvd": "Yes",
        "free_cbs_llvd": "",
        "free_cbs_pdu": "No",
        "free_slots_rectifier_modules": "2"
      },
      "batteries": {
        "existing_batteries_strings_location": ["Existing cabinet #1"],
        "existing_batteries_vendor": "Efore",
        "existing_batteries_type": "Lead-acid",
        "how_many_existing_battery_string": 2,
        "total_battery_capacity": 200,
        "how_many_free_slot_available_battery": 1,
        "new_battery_string_installation_location": ["New Nokia cabinet"],
        "batteries_condition": "Good",
        "new_battery_type": "Lithium-ion",
        "new_battery_capacity": 100,
        "new_battery_qty": 1
      },
      "cb_fuse_data_blvd": [
        {
          "rating": 10,
          "connected_module": "BLVD Module A"
        },
        {
          "rating": 15,
          "connected_module": "BLVD Module B"
        }
      ],
      "cb_fuse_data_llvd": [
        {
          "rating": 20,
          "connected_module": "LLVD Module A"
        },
        {
          "rating": 25,
          "connected_module": "LLVD Module B"
        }
      ],
      "cb_fuse_data_pdu": [
        {
          "rating": 30,
          "connected_module": "PDU Module A"
        },
        {
          "rating": 35,
          "connected_module": "PDU Module B"
        }
      ]
    },
    "metadata": {
      "created_at": "2025-01-27T10:00:00.000Z",
      "updated_at": "2025-01-27T10:00:00.000Z",
      "total_rectifier_modules": 2,
      "total_battery_strings": 2,
      "synced_from_outdoor_cabinets": true
    }
  },
  "images": [],
  "message": "Room DC Power System data retrieved successfully"
}
```

### 2. Update Room DC Power System Data

**PUT** `/api/room-dc-power-system/:sessionId`

Updates room DC power system data for a specific session. Supports both form data and file uploads.

#### Parameters
- `sessionId` (string, required): The session identifier

#### Request Body (multipart/form-data)

##### Form Fields
- `dc_rectifiers` (string, JSON): DC rectifiers data
- `batteries` (string, JSON): Batteries data
- `cb_fuse_data_blvd` (string, JSON): BLVD CB/Fuse data array
- `cb_fuse_data_llvd` (string, JSON): LLVD CB/Fuse data array
- `cb_fuse_data_pdu` (string, JSON): PDU CB/Fuse data array

##### File Fields
- `overall_rectifier_cabinet_photo` (file): Overall rectifier cabinet photo
- `rectifier_module_photo_1` to `rectifier_module_photo_20` (file): Individual rectifier module photos
- `free_slots_rectifier_modules` (file): Free slots for new rectifier modules
- `rectifier_cb_photos` (file): Rectifier CB photos
- `rectifier_free_cb_photo` (file): Rectifier free CB photo
- `rect_load_current_reading_photo` (file): RECT load current reading photo
- `existing_site_temperature_photo` (file): Existing site temperature photo
- `rectifier_picture` (file): Rectifier picture
- `rectifier_manufactory_specification_picture` (file): Rectifier manufactory/specification picture
- `battery_string_photo_1` to `battery_string_photo_10` (file): Battery string photos
- `battery_model_photo` (file): Battery model photo
- `battery_cb_photo` (file): Battery CB photo
- `rectifier_main_ac_cb_photo` (file): Rectifier main AC CB photo
- `pdu_photos` (file): PDU photos
- `pdu_free_cb` (file): PDU free CB
- `blvd_in_dc_power_rack` (file): BLVD in DC power rack
- `llvd_in_dc_power_rack` (file): LLVD in DC power rack
- `pdu_in_dc_power_rack` (file): PDU in DC power rack

#### Example Request
```javascript
const formData = new FormData();
formData.append('dc_rectifiers', JSON.stringify({
  existing_dc_rectifiers_location: 'Existing cabinet #1',
  existing_dc_rectifiers_vendor: 'Nokia',
  existing_dc_rectifiers_model: 'Model XYZ',
  how_many_existing_dc_rectifier_modules: '2',
  rectifier_module_capacity: '2.5',
  total_capacity_existing_dc_power_system: '5.0',
  how_many_free_slot_available_rectifier: '1',
  dc_rectifier_condition: 'Good',
  rect_load_current_reading: '10.5',
  existing_site_temperature: '25.0',
  blvd_in_dc_power_rack: 'Yes',
  llvd_in_dc_power_rack: 'No',
  pdu_in_dc_power_rack: 'Yes',
  free_cbs_blvd: 'Yes',
  free_cbs_llvd: '',
  free_cbs_pdu: 'No',
  free_slots_rectifier_modules: '2'
}));

formData.append('batteries', JSON.stringify({
  existing_batteries_strings_location: ['Existing cabinet #1'],
  existing_batteries_vendor: 'Efore',
  existing_batteries_type: 'Lead-acid',
  how_many_existing_battery_string: '2',
  total_battery_capacity: '200',
  how_many_free_slot_available_battery: '1',
  new_battery_string_installation_location: ['New Nokia cabinet'],
  batteries_condition: 'Good',
  new_battery_type: 'Lithium-ion',
  new_battery_capacity: '100',
  new_battery_qty: '1'
}));

formData.append('cb_fuse_data_blvd', JSON.stringify([
  { rating: 10, connected_module: 'BLVD Module A' },
  { rating: 15, connected_module: 'BLVD Module B' }
]));
formData.append('cb_fuse_data_llvd', JSON.stringify([
  { rating: 20, connected_module: 'LLVD Module A' },
  { rating: 25, connected_module: 'LLVD Module B' }
]));
formData.append('cb_fuse_data_pdu', JSON.stringify([
  { rating: 30, connected_module: 'PDU Module A' },
  { rating: 35, connected_module: 'PDU Module B' }
]));

// Add files if any
if (file) {
  formData.append('overall_rectifier_cabinet_photo', file);
}

await axios.put('/api/room-dc-power-system/session-123', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
```

#### Response
```json
{
  "success": true,
  "data": {
    "session_id": "session-123",
    "numberOfCabinets": 2,
    "roomDCPowerData": {
      // Updated data structure
    },
    "metadata": {
      // Metadata
    }
  },
  "images": [
    {
      "id": 1,
      "image_category": "overall_rectifier_cabinet_photo",
      "original_filename": "cabinet.jpg",
      "file_url": "/uploads/room_dc_power_system/cabinet_123456.jpg",
      "file_size": 1024000,
      "mime_type": "image/jpeg",
      "created_at": "2025-01-27T10:00:00.000Z"
    }
  ],
  "message": "Room DC Power System data updated successfully"
}
```

### 3. Delete Room DC Power System Data

**DELETE** `/api/room-dc-power-system/:sessionId`

Deletes room DC power system data for a specific session.

#### Parameters
- `sessionId` (string, required): The session identifier

#### Response
```json
{
  "success": true,
  "data": {
    "deleted": true,
    "deletedCount": 1
  },
  "message": "Room DC Power System data deleted successfully"
}
```

### 4. Get Cabinet Options

**GET** `/api/room-dc-power-system/:sessionId/cabinet-options`

Retrieves available cabinet options for dropdowns based on outdoor cabinets data.

#### Parameters
- `sessionId` (string, required): The session identifier

#### Response
```json
{
  "success": true,
  "data": {
    "session_id": "session-123",
    "cabinet_options": [
      "Existing cabinet #1",
      "Existing cabinet #2",
      "New Nokia cabinet",
      "Other"
    ]
  },
  "message": "Cabinet options retrieved successfully"
}
```

### 5. Get Images

**GET** `/api/room-dc-power-system/:sessionId/images`

Retrieves all images for a specific session.

#### Parameters
- `sessionId` (string, required): The session identifier

#### Response
```json
{
  "success": true,
  "data": {
    "session_id": "session-123",
    "images": [
      {
        "id": 1,
        "image_category": "overall_rectifier_cabinet_photo",
        "original_filename": "cabinet.jpg",
        "file_url": "/uploads/room_dc_power_system/cabinet_123456.jpg",
        "file_size": 1024000,
        "mime_type": "image/jpeg",
        "description": "Room DC Power System - overall_rectifier_cabinet_photo",
        "created_at": "2025-01-27T10:00:00.000Z"
      }
    ]
  },
  "message": "Room DC Power System images retrieved successfully"
}
```

### 6. Delete Image

**DELETE** `/api/room-dc-power-system/:sessionId/images/:imageId`

Deletes a specific image.

#### Parameters
- `sessionId` (string, required): The session identifier
- `imageId` (integer, required): The image ID

#### Response
```json
{
  "success": true,
  "data": {
    "deleted": true,
    "image_id": 1
  },
  "message": "Image deleted successfully"
}
```

## Data Models

### DC Rectifiers Data Structure
```javascript
{
  existing_dc_rectifiers_location: string,        // Cabinet location
  existing_dc_rectifiers_vendor: string,         // Vendor name
  existing_dc_rectifiers_model: string,          // Model number
  how_many_existing_dc_rectifier_modules: number, // Number of modules (1-20)
  rectifier_module_capacity: number,             // Capacity per module in KW
  total_capacity_existing_dc_power_system: number, // Total capacity in KW
  how_many_free_slot_available_rectifier: number, // Free slots (1-10)
  dc_rectifier_condition: string,                // Good/Satisfying/Bad/Not working
  rect_load_current_reading: number,             // Load current in A
  existing_site_temperature: number,             // Temperature in C
  blvd_in_dc_power_rack: string,                 // Yes/No
  llvd_in_dc_power_rack: string,                 // Yes/No
  pdu_in_dc_power_rack: string,                  // Yes/No
  free_cbs_blvd: string,                         // Yes/No (if BLVD exists)
  free_cbs_llvd: string,                         // Yes/No (if LLVD exists)
  free_cbs_pdu: string,                          // Yes/No (if PDU exists)
  free_slots_rectifier_modules: string           // Number of free slots
}
```

### Batteries Data Structure
```javascript
{
  existing_batteries_strings_location: string[], // Array of cabinet locations
  existing_batteries_vendor: string,             // Vendor name
  existing_batteries_type: string,               // Lead-acid/Lithium-ion
  how_many_existing_battery_string: number,      // Number of strings (1-10)
  total_battery_capacity: number,                // Total capacity in Ah
  how_many_free_slot_available_battery: number,  // Free slots (1-10)
  new_battery_string_installation_location: string[], // Array of locations
  batteries_condition: string,                   // Good/Satisfying/Bad/Not working
  new_battery_type: string,                      // New battery type
  new_battery_capacity: number,                  // New battery capacity in Ah
  new_battery_qty: number                        // New battery quantity
}
```

### CB/Fuse Data Structures

#### BLVD CB/Fuse Data Structure
```javascript
[
  {
    rating: number,              // CB/fuse rating in Amps
    connected_module: string     // Name of connected module
  }
]
```

#### LLVD CB/Fuse Data Structure
```javascript
[
  {
    rating: number,              // CB/fuse rating in Amps
    connected_module: string     // Name of connected module
  }
]
```

#### PDU CB/Fuse Data Structure
```javascript
[
  {
    rating: number,              // CB/fuse rating in Amps
    connected_module: string     // Name of connected module
  }
]
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Invalid data format"
  }
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "error": {
    "type": "NOT_FOUND",
    "message": "Room DC Power System data not found for this session"
  }
}
```

### Internal Server Error (500)
```json
{
  "success": false,
  "error": {
    "type": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## File Upload Specifications

### Supported File Types
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### File Size Limits
- Maximum file size: 10MB per file

### Upload Directory
- Files are stored in: `uploads/room_dc_power_system/`
- Files are renamed with unique identifiers to prevent conflicts

## Database Schema

### room_dc_power_system Table
```sql
CREATE TABLE room_dc_power_system (
  session_id VARCHAR(255) PRIMARY KEY,
  number_of_cabinets INT NOT NULL DEFAULT 1,
  room_dc_power_data JSON NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_session_id (session_id)
);
```

### room_dc_power_system_images Table
```sql
CREATE TABLE room_dc_power_system_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(255) NOT NULL,
  record_index INT NOT NULL DEFAULT 1,
  image_category VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL UNIQUE,
  file_path VARCHAR(500) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_session_id (session_id),
  INDEX idx_session_category (session_id, image_category),
  INDEX idx_stored_filename (stored_filename)
);
```

## Integration with Frontend

The Room DC Power System form in the frontend (`DCsystemform.jsx`) is already configured to use these API endpoints. The form includes:

1. **DC Rectifiers Section**: All rectifier-related fields including BLVD, LLVD, and PDU options
2. **Batteries Section**: Battery configuration and new battery installation options
3. **Dynamic Tables**: CB/Fuse data tables that appear conditionally
4. **Image Upload**: Comprehensive image upload functionality for all categories
5. **Real-time Validation**: Form validation and unsaved changes detection

## Testing

Use the provided test script to verify API functionality:

```bash
node test-room-dc-api.js
```

This will test all endpoints and verify that data is properly saved and retrieved. 