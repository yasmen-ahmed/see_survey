# New Radio Units API - Multiple Units Support

This API has been modified to support multiple radio units per session instead of just one. Here's how to use the updated endpoints.

## Overview

The API now supports:
- ✅ Creating multiple radio units in a single request
- ✅ Getting all radio units for a session
- ✅ Updating multiple radio units at once
- ✅ Updating individual radio units by index
- ✅ Deleting specific radio units or all units
- ✅ Proper validation for all operations

## Base URL
```
/api/new-radio-units
```

## Endpoints

### 1. Get Configuration
```http
GET /api/new-radio-units/:session_id/config
```
Returns planning data and configuration information.

**Response:**
```json
{
  "session_id": "test-session-123",
  "new_radio_units_planned": 3,
  "existing_radio_units_swapped": 1,
  "radio_units_count": 2,
  "has_radio_units_data": true,
  "has_radio_installations_data": true
}
```

### 2. Get All Radio Units
```http
GET /api/new-radio-units/:session_id
```
Returns all radio units for a session, formatted according to planning data.

**Response:**
```json
{
  "session_id": "test-session-123",
  "new_radio_units_planned": 3,
  "existing_radio_units_swapped": 1,
  "data": [
    {
      "id": 1,
      "session_id": "test-session-123",
      "radio_unit_index": 1,
      "radio_unit_number": 1,
      "new_radio_unit_sector": "1",
      "connected_to_antenna": "New",
      "connected_antenna_technology": ["4G", "5G"],
      "new_radio_unit_model": "Nokia Model A",
      "radio_unit_location": "Tower leg A",
      "feeder_length_to_antenna": "15.5",
      "tower_leg_section": "Angular",
      "angular_l1_dimension": "100.0",
      "angular_l2_dimension": "100.0",
      "side_arm_type": "New side arm need to be supplied",
      "side_arm_length": "2.5",
      "side_arm_cross_section": "50.0",
      "side_arm_offset": "25.0",
      "dc_power_source": "Direct from rectifier distribution",
      "dc_power_cable_length": "20.0",
      "fiber_cable_length": "30.0",
      "jumper_length": "1.5",
      "earth_bus_bar_exists": "Yes",
      "earth_cable_length": "10.0",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    // ... more radio units
  ],
  "has_data": true
}
```

### 3. Create/Replace Multiple Radio Units
```http
PUT /api/new-radio-units/:session_id
```
Creates or replaces all radio units for a session. Accepts either a single object or an array.

**Request Body (Array):**
```json
[
  {
    "radio_unit_index": 1,
    "radio_unit_number": 1,
    "new_radio_unit_sector": "1",
    "connected_to_antenna": "New",
    "connected_antenna_technology": ["4G", "5G"],
    "new_radio_unit_model": "Nokia Model A",
    "radio_unit_location": "Tower leg A",
    "feeder_length_to_antenna": 15.5,
    "tower_leg_section": "Angular",
    "angular_l1_dimension": 100.0,
    "angular_l2_dimension": 100.0,
    "side_arm_type": "New side arm need to be supplied",
    "side_arm_length": 2.5,
    "side_arm_cross_section": 50.0,
    "side_arm_offset": 25.0,
    "dc_power_source": "Direct from rectifier distribution",
    "dc_power_cable_length": 20.0,
    "fiber_cable_length": 30.0,
    "jumper_length": 1.5,
    "earth_bus_bar_exists": "Yes",
    "earth_cable_length": 10.0
  },
  {
    "radio_unit_index": 2,
    "radio_unit_number": 2,
    "new_radio_unit_sector": "2",
    "connected_to_antenna": "Existing",
    "connected_antenna_technology": ["3G", "4G"],
    "new_radio_unit_model": "Nokia Model B",
    "radio_unit_location": "Tower leg B",
    "feeder_length_to_antenna": 12.0,
    "tower_leg_section": "Tubular",
    "tubular_cross_section": 75.0,
    "side_arm_type": "Use existing empty side arm",
    "side_arm_length": 2.0,
    "side_arm_cross_section": 40.0,
    "side_arm_offset": 20.0,
    "dc_power_source": "New FPFH",
    "dc_power_cable_length": 15.0,
    "fiber_cable_length": 25.0,
    "jumper_length": 1.2,
    "earth_bus_bar_exists": "No",
    "earth_cable_length": 8.0
  }
]
```

**Response:**
```json
{
  "message": "New radio units for session test-session-123 updated successfully",
  "session_id": "test-session-123",
  "new_radio_units_planned": 3,
  "existing_radio_units_swapped": 1,
  "data": [...], // Array of created radio units
  "units_created": 2
}
```

### 4. Partial Update Multiple Radio Units
```http
PATCH /api/new-radio-units/:session_id
```
Updates multiple radio units with partial data. Creates units if they don't exist.

**Request Body:**
```json
[
  {
    "radio_unit_index": 1,
    "new_radio_unit_model": "Nokia Model A Updated",
    "feeder_length_to_antenna": 20.0
  },
  {
    "radio_unit_index": 2,
    "dc_power_cable_length": 18.0
  }
]
```

### 5. Update Single Radio Unit
```http
PATCH /api/new-radio-units/:session_id/:radio_unit_index
```
Updates a specific radio unit by its index.

**Request Body:**
```json
{
  "new_radio_unit_model": "Nokia Model A Updated",
  "feeder_length_to_antenna": 20.0,
  "side_arm_length": 3.5
}
```

### 6. Delete All Radio Units
```http
DELETE /api/new-radio-units/:session_id
```
Deletes all radio units for a session.

**Response:**
```json
{
  "message": "3 radio units for session test-session-123 deleted successfully",
  "deleted_count": 3
}
```

### 7. Delete Specific Radio Unit
```http
DELETE /api/new-radio-units/:session_id/:radio_unit_index
```
Deletes a specific radio unit by its index.

**Response:**
```json
{
  "message": "Radio unit 2 for session test-session-123 deleted successfully"
}
```

## Data Validation

### Required Fields
- `radio_unit_index`: Integer starting from 1

### Enum Validations
- `new_radio_unit_sector`: '1', '2', '3', '4', '5', '6'
- `connected_to_antenna`: 'New', 'Existing'
- `connected_antenna_technology`: Array of ['2G', '3G', '4G', '5G']
- `radio_unit_location`: 'Tower leg A', 'Tower leg B', 'Tower leg C', 'Tower leg D', 'On the ground'
- `tower_leg_section`: 'Angular', 'Tubular'
- `side_arm_type`: 'Use existing empty side arm', 'Use existing antenna side arm', 'New side arm need to be supplied'
- `dc_power_source`: 'Direct from rectifier distribution', 'New FPFH', 'Existing FPFH', 'Existing DC PDU (not FPFH)'
- `earth_bus_bar_exists`: 'Yes', 'No'

### Numeric Fields
All numeric fields must be positive numbers:
- `radio_unit_number`
- `feeder_length_to_antenna`
- `angular_l1_dimension`
- `angular_l2_dimension`
- `tubular_cross_section`
- `side_arm_length`
- `side_arm_cross_section`
- `side_arm_offset`
- `dc_power_cable_length`
- `fiber_cable_length`
- `jumper_length`
- `earth_cable_length`

## Error Responses

### Validation Error
```json
{
  "error": "Validation error for radio unit 1: Invalid new_radio_unit_sector: INVALID"
}
```

### Not Found
```json
{
  "error": "No radio units found for session test-session-123"
}
```

### Server Error
```json
{
  "error": "Internal server error message"
}
```

## Testing

### Using Node.js Test Script
```bash
# Install dependencies first
npm install axios

# Run the comprehensive test
node test_radio_units_api.js
```

### Using PowerShell (Windows)
```powershell
# Run the PowerShell test script
.\test_api_powershell.ps1
```

### Using Shell Script (Linux/Mac)
```bash
# Make executable and run
chmod +x test_api_curl.sh
./test_api_curl.sh
```

## Key Changes from Previous Version

1. **Multiple Units Support**: Can now handle arrays of radio units instead of single objects
2. **Index-based Operations**: Each radio unit has a `radio_unit_index` for individual operations
3. **Flexible Input**: PUT and PATCH endpoints accept both single objects and arrays
4. **Enhanced Validation**: Better error messages and validation for array inputs
5. **Individual Unit Operations**: Can update/delete specific radio units by index
6. **Backward Compatibility**: Single object inputs still work for compatibility

## Example Usage Scenarios

### Scenario 1: Create 3 Radio Units
```javascript
const radioUnits = [
  { radio_unit_index: 1, /* ... unit 1 data ... */ },
  { radio_unit_index: 2, /* ... unit 2 data ... */ },
  { radio_unit_index: 3, /* ... unit 3 data ... */ }
];

// Create all units
await fetch('/api/new-radio-units/session-123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(radioUnits)
});
```

### Scenario 2: Update Only Unit 2
```javascript
const updateData = {
  new_radio_unit_model: "Updated Model",
  feeder_length_to_antenna: 25.0
};

// Update only unit 2
await fetch('/api/new-radio-units/session-123/2', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updateData)
});
```

### Scenario 3: Update Multiple Units Partially
```javascript
const updates = [
  { radio_unit_index: 1, new_radio_unit_model: "New Model A" },
  { radio_unit_index: 3, feeder_length_to_antenna: 30.0 }
];

// Update multiple units
await fetch('/api/new-radio-units/session-123', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updates)
});
``` 