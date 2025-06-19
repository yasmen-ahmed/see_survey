# Antenna Configuration API - Postman Documentation

## Base URL
```
http://localhost:3000/api/antenna-configuration
```

## Endpoints Overview

### 1. GET - Retrieve Antenna Configuration
**URL:** `GET /api/antenna-configuration/:session_id`

**Description:** Retrieves antenna configuration for a specific session. Returns empty structure if no data exists.

**Query Parameters:**
- `with_defaults` (optional): Set to "true" to ensure all antenna objects include all default fields with empty strings and 0 values.

**Example Request:**
```
GET http://localhost:3000/api/antenna-configuration/ABC123
```

**Example Request with defaults:**
```
GET http://localhost:3000/api/antenna-configuration/ABC123?with_defaults=true
```

**Example Response (Empty Data):**
```json
{
  "session_id": "ABC123",
  "antenna_count": 0,
  "antennas": [],
  "created_at": null,
  "updated_at": null,
  "number_of_cabinets": 0
}
```

**Example Response (With Data and with_defaults=true):**
```json
{
  "session_id": "ABC123",
  "antenna_count": 1,
  "antennas": [
    {
      "is_shared_site": true,
      "operator": "Operator 1",
      "base_height": "25.5",
      "tower_leg": "A",
      "sector": 1,
      "technology": ["4G", "5G"],
      "azimuth_angle": "45",
      "mechanical_tilt_exist": true,
      "mechanical_tilt": "2",
      "electrical_tilt": "3",
      "ret_connectivity": "Direct",
      "vendor": "Nokia",
      "is_active_antenna": true,
      "nokia_module_name": "AAHF",
      "nokia_fiber_count": 2,
      "nokia_fiber_length": "50",
      "other_model_number": "",
      "other_length": "",
      "other_width": "",
      "other_depth": "",
      "other_port_types": [],
      "other_bands": [],
      "other_total_ports": 0,
      "other_free_ports": 0,
      "other_free_port_bands": [],
      "other_connected_radio_units": 0,
      "side_arm_length": "1.5",
      "side_arm_diameter": "0.3",
      "side_arm_offset": "2.0",
      "earth_cable_length": "10",
      "included_in_upgrade": true
    }
  ],
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T14:20:00.000Z",
  "number_of_cabinets": 3
}
```

---

### 2. GET - Default Antenna Structure
**URL:** `GET /api/antenna-configuration/default/antenna-structure`

**Description:** Returns a single default antenna object with all fields set to empty strings, empty arrays, or 0 values. Useful for frontend when adding new antennas dynamically.

**Example Request:**
```
GET http://localhost:3000/api/antenna-configuration/default/antenna-structure
```

**Example Response:**
```json
{
  "is_shared_site": false,
  "operator": "",
  "base_height": "",
  "tower_leg": "",
  "sector": 0,
  "technology": [],
  "azimuth_angle": "",
  "mechanical_tilt_exist": false,
  "mechanical_tilt": "",
  "electrical_tilt": "",
  "ret_connectivity": "",
  "vendor": "",
  "is_active_antenna": false,
  "nokia_module_name": "",
  "nokia_fiber_count": 0,
  "nokia_fiber_length": "",
  "other_model_number": "",
  "other_length": "",
  "other_width": "",
  "other_depth": "",
  "other_port_types": [],
  "other_bands": [],
  "other_total_ports": 0,
  "other_free_ports": 0,
  "other_free_port_bands": [],
  "other_connected_radio_units": 0,
  "side_arm_length": "",
  "side_arm_diameter": "",
  "side_arm_offset": "",
  "earth_cable_length": "",
  "included_in_upgrade": false
}
```

---

### 3. POST - Create/Update Antenna Configuration
**URL:** `POST /api/antenna-configuration/:session_id`

**Description:** Creates or updates antenna configuration for a session.

**Example Request:**
```
POST http://localhost:3000/api/antenna-configuration/ABC123
Content-Type: application/json
```

**Request Body:**
```json
{
  "antenna_count": 2,
  "antennas": [
    {
      "is_shared_site": true,
      "operator": "Operator 1",
      "base_height": "25.5",
      "tower_leg": "A",
      "sector": 1,
      "technology": ["4G", "5G"],
      "azimuth_angle": "45",
      "mechanical_tilt_exist": true,
      "mechanical_tilt": "2",
      "electrical_tilt": "3",
      "ret_connectivity": "Direct",
      "vendor": "Nokia",
      "is_active_antenna": true,
      "nokia_module_name": "AAHF",
      "nokia_fiber_count": 2,
      "nokia_fiber_length": "50",
      "side_arm_length": "1.5",
      "side_arm_diameter": "0.3",
      "side_arm_offset": "2.0",
      "earth_cable_length": "10",
      "included_in_upgrade": true
    },
    {
      "is_shared_site": false,
      "base_height": "30.0",
      "tower_leg": "B",
      "sector": 2,
      "technology": ["2G", "3G", "4G"],
      "azimuth_angle": "135",
      "mechanical_tilt_exist": false,
      "electrical_tilt": "5",
      "ret_connectivity": "Chaining",
      "vendor": "Other",
      "other_model_number": "ANT-2400",
      "other_length": "1.2",
      "other_width": "0.3",
      "other_depth": "0.15",
      "other_port_types": ["7/16", "4.3-10"],
      "other_bands": ["800", "1800", "2100"],
      "other_total_ports": 4,
      "other_free_ports": 2,
      "other_free_port_bands": ["800", "1800"],
      "other_connected_radio_units": 2,
      "side_arm_length": "2.0",
      "side_arm_diameter": "0.4",
      "side_arm_offset": "1.8",
      "earth_cable_length": "12",
      "included_in_upgrade": false
    }
  ]
}
```

**Response:** Same as GET response with created/updated data.

---

### 4. PUT - Full Update Antenna Configuration
**URL:** `PUT /api/antenna-configuration/:session_id`

**Description:** Completely replaces antenna configuration data.

**Example Request:**
```
PUT http://localhost:3000/api/antenna-configuration/ABC123
Content-Type: application/json
```

**Request Body:** Same as POST request body.

---

### 5. PUT - Partial Update Antenna Configuration
**URL:** `PUT /api/antenna-configuration/:session_id`

**Description:** Partially updates antenna configuration (only provided fields).

**Example Request:**
```
PUT http://localhost:3000/api/antenna-configuration/ABC123
Content-Type: application/json
```

**Request Body (Update only antenna count):**
```json
{
  "antenna_count": 3
}
```

**Request Body (Update specific antenna in array):**
```json
{
  "antennas": [
    {
      "vendor": "COMMSCOPE",
      "azimuth_angle": "90"
    },
    {
      "sector": 3,
      "electrical_tilt": "4"
    }
  ]
}
```

---

### 6. PUT - Update Specific Antenna
**URL:** `PUT /api/antenna-configuration/:session_id/antenna/:antenna_index`

**Description:** Updates a specific antenna by index (0-based).

**Example Request:**
```
PUT http://localhost:3000/api/antenna-configuration/ABC123/antenna/0
Content-Type: application/json
```

**Request Body:**
```json
{
  "vendor": "Huawei",
  "azimuth_angle": "60",
  "electrical_tilt": "4"
}
```

---

### 7. DELETE - Delete Antenna Configuration
**URL:** `DELETE /api/antenna-configuration/:session_id`

**Description:** Deletes antenna configuration for a session.

**Example Request:**
```
DELETE http://localhost:3000/api/antenna-configuration/ABC123
```

**Example Response:**
```json
{
  "message": "Antenna configuration deleted successfully"
}
```

---

## Field Validation Rules

### Antenna Count
- Type: Integer
- Range: 1-15
- Required: No (defaults to 0)

### Antenna Object Fields

#### Basic Information
- **is_shared_site**: Boolean (default: false)
- **operator**: String (if shared site) - Valid values: "Operator 1", "Operator 2", "Operator 3", "Operator 4" (default: "")
- **base_height**: String/Number (meters) (default: "")
- **tower_leg**: String - Valid values: "A", "B", "C", "D" (default: "")
- **sector**: Integer - Range: 1-5 (default: 0)
- **technology**: Array of strings - Valid values: ["2G", "3G", "4G", "5G"] (default: [])

#### Angles and Tilt
- **azimuth_angle**: String/Number - Range: 0-360 degrees (default: "")
- **mechanical_tilt_exist**: Boolean (default: false)
- **mechanical_tilt**: String/Number (degrees) (default: "")
- **electrical_tilt**: String/Number (degrees) (default: "")

#### Connectivity and Vendor
- **ret_connectivity**: String - Valid values: "Chaining", "Direct", "Not applicable" (default: "")
- **vendor**: String - Valid values: "Nokia", "PROS", "COMMSCOPE", "Kathrine", "Huawei", "Andrew", "Other" (default: "")

#### Nokia Specific Fields (if vendor = "Nokia")
- **is_active_antenna**: Boolean (default: false)
- **nokia_module_name**: String (if active antenna) (default: "")
- **nokia_fiber_count**: Integer - Valid values: 1, 2, 3, 4 (if active antenna) (default: 0)
- **nokia_fiber_length**: String/Number (meters, if active antenna) (default: "")

#### Other Vendor Fields (if vendor = "Other")
- **other_model_number**: String (default: "")
- **other_length**: String/Number (cm) (default: "")
- **other_width**: String/Number (cm) (default: "")
- **other_depth**: String/Number (cm) (default: "")
- **other_port_types**: Array of strings - Valid values: ["7/16", "4.3-10", "MQ4", "MQ5"] (default: [])
- **other_bands**: Array of strings - Valid values: ["700", "800", "900", "1800", "2100", "2600"] (default: [])
- **other_total_ports**: String/Number (default: 0)
- **other_free_ports**: String/Number (default: 0)
- **other_free_port_bands**: Array of strings (same values as other_bands) (default: [])
- **other_connected_radio_units**: String/Number (default: 0)

#### Physical Measurements
- **side_arm_length**: String/Number (cm) (default: "")
- **side_arm_diameter**: String/Number (cm) (default: "")
- **side_arm_offset**: String/Number (cm) (default: "")
- **earth_cable_length**: String/Number (meters) (default: "")

#### Planning
- **included_in_upgrade**: Boolean (default: false)

---

## Error Responses

### Validation Error Example
```json
{
  "error": "Validation errors",
  "details": [
    "Antenna 1: Invalid operator selection",
    "Antenna 2: Azimuth angle must be between 0 and 360 degrees",
    "Antenna 1: Nokia fiber count must be 1, 2, 3, or 4"
  ]
}
```

### Server Error Example
```json
{
  "error": "Internal server error",
  "details": "Database connection failed"
}
```

---

## Frontend Integration Examples

### 1. Get Default Antenna Structure for New Antenna
```javascript
// When user clicks "Add Antenna" button
const response = await fetch('/api/antenna-configuration/default/antenna-structure');
const defaultAntenna = await response.json();
// Use this to populate a new antenna form with default values
```

### 2. Get Configuration with All Default Fields
```javascript
// Get existing data with all fields populated (useful for forms)
const response = await fetch('/api/antenna-configuration/ABC123?with_defaults=true');
const config = await response.json();
// All antenna objects will have all fields with defaults
```

### 3. Initialize Empty Form
```javascript
// For a completely new session
const response = await fetch('/api/antenna-configuration/NEW_SESSION_123');
const config = await response.json();
// Returns: { session_id: "NEW_SESSION_123", antenna_count: 0, antennas: [], ... }
```

---

## Testing Examples

### Postman Collection Variables
Set these variables in your Postman environment:
- `baseUrl`: `http://localhost:3000`
- `sessionId`: `TEST_SESSION_123`

### Test Scenario 1: Get Default Structure
```
GET {{baseUrl}}/api/antenna-configuration/default/antenna-structure
```

### Test Scenario 2: Get Empty Configuration
```
GET {{baseUrl}}/api/antenna-configuration/{{sessionId}}
```

### Test Scenario 3: Get Configuration with Defaults
```
GET {{baseUrl}}/api/antenna-configuration/{{sessionId}}?with_defaults=true
```

### Test Scenario 4: Nokia Active Antenna
```json
{
  "antenna_count": 1,
  "antennas": [
    {
      "is_shared_site": false,
      "base_height": "25",
      "tower_leg": "A",
      "sector": 1,
      "technology": ["4G", "5G"],
      "azimuth_angle": "0",
      "mechanical_tilt_exist": true,
      "mechanical_tilt": "2",
      "electrical_tilt": "3",
      "ret_connectivity": "Direct",
      "vendor": "Nokia",
      "is_active_antenna": true,
      "nokia_module_name": "AAHF",
      "nokia_fiber_count": 2,
      "nokia_fiber_length": "100",
      "side_arm_length": "150",
      "side_arm_diameter": "30",
      "side_arm_offset": "200",
      "earth_cable_length": "15",
      "included_in_upgrade": true
    }
  ]
}
```

### Test Scenario 5: Other Vendor Antenna
```json
{
  "antenna_count": 1,
  "antennas": [
    {
      "is_shared_site": true,
      "operator": "Operator 2",
      "base_height": "30",
      "tower_leg": "B",
      "sector": 2,
      "technology": ["2G", "3G"],
      "azimuth_angle": "120",
      "mechanical_tilt_exist": false,
      "electrical_tilt": "5",
      "ret_connectivity": "Chaining",
      "vendor": "Other",
      "other_model_number": "COMMSCOPE-XYZ",
      "other_length": "120",
      "other_width": "25",
      "other_depth": "15",
      "other_port_types": ["7/16"],
      "other_bands": ["800", "900", "1800"],
      "other_total_ports": 6,
      "other_free_ports": 2,
      "other_free_port_bands": ["800", "1800"],
      "other_connected_radio_units": 4,
      "side_arm_length": "180",
      "side_arm_diameter": "35",
      "side_arm_offset": "220",
      "earth_cable_length": "20",
      "included_in_upgrade": false
    }
  ]
}
``` 