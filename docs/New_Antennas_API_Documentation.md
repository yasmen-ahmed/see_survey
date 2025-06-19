# 📡 New Antennas API Documentation

## Overview
The New Antennas API manages detailed antenna configurations for radio installations. It integrates with the New Radio Installations table to automatically create antenna slots based on the `new_antennas_planned` value.

## 🏗️ Architecture

### Database Schema
```sql
new_radio_installations (
  session_id VARCHAR(255) PRIMARY KEY,
  new_antennas_planned INT DEFAULT 1,
  existing_antennas_swapped INT DEFAULT 1,
  ...
)

new_antennas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) FOREIGN KEY,
  antenna_index INT,
  sector_number ENUM('1','2','3','4','5','6'),
  new_or_swap ENUM('New','Swap'),
  antenna_technology JSON,
  azimuth_angle_shift DECIMAL(10,3),
  base_height_from_tower DECIMAL(10,3),
  tower_leg_location ENUM('A','B','C','D'),
  tower_leg_section ENUM('Angular','Tubular'),
  angular_l1_dimension DECIMAL(10,2),
  angular_l2_dimension DECIMAL(10,2),
  tubular_cross_section DECIMAL(10,2),
  side_arm_type ENUM(...),
  side_arm_length DECIMAL(10,3),
  side_arm_cross_section DECIMAL(10,2),
  side_arm_offset DECIMAL(10,2),
  earth_bus_bar_exists ENUM('Yes','No'),
  earth_cable_length DECIMAL(10,2),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(session_id, antenna_index)
)
```

### Key Features
- **Auto-slot Creation**: Automatically creates antenna slots based on `new_antennas_planned`
- **Individual Management**: Each antenna can be managed independently
- **Data Validation**: Comprehensive validation for all fields
- **Integration**: Seamless integration with New Radio Installations

---

## 🔌 API Endpoints

### 1. GET All Antennas for Session
**Endpoint**: `GET /api/new-antennas/:session_id`

**Description**: Retrieves all antennas for a session with auto-slot creation

#### Postman Example
```json
{
  "method": "GET",
  "url": "http://localhost:3000/api/new-antennas/session_123",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

#### Response
```json
{
  "session_id": "session_123",
  "new_antennas_planned": 3,
  "antennas": [
    {
      "id": 1,
      "session_id": "session_123",
      "antenna_index": 1,
      "sector_number": "1",
      "new_or_swap": "New",
      "antenna_technology": ["4G", "5G"],
      "azimuth_angle_shift": 120.5,
      "base_height_from_tower": 25.0,
      "tower_leg_location": "A",
      "tower_leg_section": "Angular",
      "angular_l1_dimension": 100.0,
      "angular_l2_dimension": 100.0,
      "tubular_cross_section": null,
      "side_arm_type": "New side arm need to be supplied",
      "side_arm_length": 2.5,
      "side_arm_cross_section": 60.0,
      "side_arm_offset": 15.0,
      "earth_bus_bar_exists": "Yes",
      "earth_cable_length": 50.0,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "metadata": {
    "total_antennas": 3,
    "expected_antennas": 3,
    "slots_created": true
  }
}
```

### 2. GET Single Antenna
**Endpoint**: `GET /api/new-antennas/:session_id/:antenna_index`

#### Postman Example
```json
{
  "method": "GET",
  "url": "http://localhost:3000/api/new-antennas/session_123/1",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

### 3. CREATE/UPDATE Antenna (POST)
**Endpoint**: `POST /api/new-antennas/:session_id/:antenna_index`

#### Postman Example
```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/new-antennas/session_123/1",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "sector_number": "1",
    "new_or_swap": "New",
    "antenna_technology": ["4G", "5G"],
    "azimuth_angle_shift": 120.5,
    "base_height_from_tower": 25.0,
    "tower_leg_location": "A",
    "tower_leg_section": "Angular",
    "angular_l1_dimension": 100.0,
    "angular_l2_dimension": 100.0,
    "side_arm_type": "New side arm need to be supplied",
    "side_arm_length": 2.5,
    "side_arm_cross_section": 60.0,
    "side_arm_offset": 15.0,
    "earth_bus_bar_exists": "Yes",
    "earth_cable_length": 50.0
  }
}
```

#### Response
```json
{
  "message": "Antenna 1 created successfully",
  "data": {
    "id": 1,
    "session_id": "session_123",
    "antenna_index": 1,
    "sector_number": "1",
    "new_or_swap": "New",
    "antenna_technology": ["4G", "5G"],
    "azimuth_angle_shift": 120.5,
    "base_height_from_tower": 25.0,
    "tower_leg_location": "A",
    "tower_leg_section": "Angular",
    "angular_l1_dimension": 100.0,
    "angular_l2_dimension": 100.0,
    "tubular_cross_section": null,
    "side_arm_type": "New side arm need to be supplied",
    "side_arm_length": 2.5,
    "side_arm_cross_section": 60.0,
    "side_arm_offset": 15.0,
    "earth_bus_bar_exists": "Yes",
    "earth_cable_length": 50.0,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. PARTIAL UPDATE Antenna (PUT)
**Endpoint**: `PUT /api/new-antennas/:session_id/:antenna_index`

#### Postman Example
```json
{
  "method": "PUT",
  "url": "http://localhost:3000/api/new-antennas/session_123/1",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "sector_number": "2",
    "azimuth_angle_shift": 240.0,
    "antenna_technology": ["3G", "4G", "5G"]
  }
}
```

### 5. GET Configuration Info
**Endpoint**: `GET /api/new-antennas/:session_id/config`

#### Postman Example
```json
{
  "method": "GET",
  "url": "http://localhost:3000/api/new-antennas/session_123/config",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

#### Response
```json
{
  "session_id": "session_123",
  "new_antennas_planned": 3,
  "existing_antennas_swapped": 1,
  "current_antennas_count": 2,
  "has_radio_installations_data": true,
  "metadata": {
    "slots_needed": 3,
    "slots_created": 2,
    "slots_remaining": 1
  }
}
```

### 6. BULK CREATE Antennas
**Endpoint**: `POST /api/new-antennas/:session_id/bulk`

#### Postman Example
```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/new-antennas/session_123/bulk",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "antennas": [
      {
        "antenna_index": 1,
        "sector_number": "1",
        "new_or_swap": "New",
        "antenna_technology": ["4G", "5G"],
        "azimuth_angle_shift": 0.0,
        "base_height_from_tower": 25.0,
        "tower_leg_location": "A",
        "tower_leg_section": "Angular",
        "angular_l1_dimension": 100.0,
        "angular_l2_dimension": 100.0,
        "side_arm_type": "New side arm need to be supplied",
        "side_arm_length": 2.5,
        "side_arm_cross_section": 60.0,
        "side_arm_offset": 15.0,
        "earth_bus_bar_exists": "Yes",
        "earth_cable_length": 50.0
      },
      {
        "antenna_index": 2,
        "sector_number": "2",
        "new_or_swap": "New",
        "antenna_technology": ["4G", "5G"],
        "azimuth_angle_shift": 120.0,
        "base_height_from_tower": 25.0,
        "tower_leg_location": "B",
        "tower_leg_section": "Angular",
        "angular_l1_dimension": 100.0,
        "angular_l2_dimension": 100.0,
        "side_arm_type": "Use existing empty side arm",
        "earth_bus_bar_exists": "Yes",
        "earth_cable_length": 45.0
      },
      {
        "antenna_index": 3,
        "sector_number": "3",
        "new_or_swap": "Swap",
        "antenna_technology": ["3G", "4G"],
        "azimuth_angle_shift": 240.0,
        "base_height_from_tower": 20.0,
        "tower_leg_location": "C",
        "tower_leg_section": "Tubular",
        "tubular_cross_section": 150.0,
        "side_arm_type": "Use swapped antenna side arm",
        "earth_bus_bar_exists": "No"
      }
    ]
  }
}
```

### 7. DELETE Single Antenna
**Endpoint**: `DELETE /api/new-antennas/:session_id/:antenna_index`

#### Postman Example
```json
{
  "method": "DELETE",
  "url": "http://localhost:3000/api/new-antennas/session_123/1",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

### 8. DELETE All Antennas for Session
**Endpoint**: `DELETE /api/new-antennas/:session_id`

#### Postman Example
```json
{
  "method": "DELETE",
  "url": "http://localhost:3000/api/new-antennas/session_123",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: Complete Antenna Configuration Flow

1. **Set up Radio Installations**
```json
{
  "method": "PUT",
  "url": "http://localhost:3000/api/new-radio-installations/session_123",
  "body": {
    "new_antennas_planned": 3,
    "new_sectors_planned": 3,
    "new_radio_units_planned": 2,
    "existing_radio_units_swapped": 1,
    "existing_antennas_swapped": 1,
    "new_fpfh_installed": 2
  }
}
```

2. **Get Antenna Configuration**
```json
{
  "method": "GET",
  "url": "http://localhost:3000/api/new-antennas/session_123/config"
}
```

3. **Configure Antenna 1 (New Angular)**
```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/new-antennas/session_123/1",
  "body": {
    "sector_number": "1",
    "new_or_swap": "New",
    "antenna_technology": ["4G", "5G"],
    "azimuth_angle_shift": 0.0,
    "base_height_from_tower": 25.0,
    "tower_leg_location": "A",
    "tower_leg_section": "Angular",
    "angular_l1_dimension": 100.0,
    "angular_l2_dimension": 100.0,
    "side_arm_type": "New side arm need to be supplied",
    "side_arm_length": 2.5,
    "side_arm_cross_section": 60.0,
    "side_arm_offset": 15.0,
    "earth_bus_bar_exists": "Yes",
    "earth_cable_length": 50.0
  }
}
```

4. **Configure Antenna 2 (New Tubular)**
```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/new-antennas/session_123/2",
  "body": {
    "sector_number": "2",
    "new_or_swap": "New",
    "antenna_technology": ["4G", "5G"],
    "azimuth_angle_shift": 120.0,
    "base_height_from_tower": 25.0,
    "tower_leg_location": "B",
    "tower_leg_section": "Tubular",
    "tubular_cross_section": 150.0,
    "side_arm_type": "Use existing empty side arm",
    "earth_bus_bar_exists": "Yes",
    "earth_cable_length": 45.0
  }
}
```

5. **Configure Antenna 3 (Swap)**
```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/new-antennas/session_123/3",
  "body": {
    "sector_number": "3",
    "new_or_swap": "Swap",
    "antenna_technology": ["3G", "4G"],
    "azimuth_angle_shift": 240.0,
    "base_height_from_tower": 20.0,
    "tower_leg_location": "C",
    "tower_leg_section": "Angular",
    "angular_l1_dimension": 80.0,
    "angular_l2_dimension": 80.0,
    "side_arm_type": "Use swapped antenna side arm",
    "earth_bus_bar_exists": "No"
  }
}
```

6. **Get All Configured Antennas**
```json
{
  "method": "GET",
  "url": "http://localhost:3000/api/new-antennas/session_123"
}
```

### Scenario 2: Validation Testing

**Test Invalid Sector Number**
```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/new-antennas/session_123/1",
  "body": {
    "sector_number": "7", // Invalid - should be 1-6
    "new_or_swap": "New"
  }
}
```

**Expected Response**: `400 Bad Request`
```json
{
  "error": "Invalid sector_number: 7"
}
```

**Test Invalid Technology**
```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/new-antennas/session_123/1",
  "body": {
    "antenna_technology": ["4G", "6G"], // Invalid - 6G not supported
    "new_or_swap": "New"
  }
}
```

**Expected Response**: `400 Bad Request`
```json
{
  "error": "Invalid antenna technology: 6G"
}
```

### Scenario 3: Partial Updates

**Update Only Azimuth**
```json
{
  "method": "PUT",
  "url": "http://localhost:3000/api/new-antennas/session_123/1",
  "body": {
    "azimuth_angle_shift": 45.0
  }
}
```

**Add Technology**
```json
{
  "method": "PUT",
  "url": "http://localhost:3000/api/new-antennas/session_123/1",
  "body": {
    "antenna_technology": ["2G", "3G", "4G", "5G"]
  }
}
```

---

## 🔗 Integration with New Radio Installations

### Auto-Slot Creation
When you call `GET /api/new-antennas/:session_id`, the system:

1. Fetches `new_antennas_planned` from `new_radio_installations`
2. Checks existing antenna slots
3. Creates missing slots automatically
4. Returns all antennas with metadata

### Configuration Sync
```json
// First set the antenna count
PUT /api/new-radio-installations/session_123
{
  "new_antennas_planned": 5
}

// Then get antennas - 5 slots will be auto-created
GET /api/new-antennas/session_123
```

### Data Validation Rules

1. **Sector Number**: Must be 1-6
2. **New or Swap**: Must be "New" or "Swap"
3. **Antenna Technology**: Array containing 2G, 3G, 4G, 5G
4. **Tower Leg Location**: Must be A, B, C, or D
5. **Tower Leg Section**: Must be "Angular" or "Tubular"
6. **Side Arm Type**: Predefined enum values
7. **Earth Bus Bar**: Must be "Yes" or "No"
8. **Numeric Fields**: Must be positive numbers
9. **Antenna Index**: Must be positive integer

### Error Handling

- **404**: Antenna not found
- **400**: Validation errors
- **500**: Server errors
- **Foreign Key**: Session must exist in new_radio_installations

---

## 💡 Frontend Integration Tips

### React Component Example
```jsx
const AntennaForm = ({ sessionId, antennaIndex }) => {
  const [antenna, setAntenna] = useState({});
  const [config, setConfig] = useState({});

  useEffect(() => {
    // Get configuration first
    fetch(`/api/new-antennas/${sessionId}/config`)
      .then(res => res.json())
      .then(setConfig);
    
    // Get specific antenna
    fetch(`/api/new-antennas/${sessionId}/${antennaIndex}`)
      .then(res => res.json())
      .then(setAntenna);
  }, [sessionId, antennaIndex]);

  const handleSave = async (data) => {
    const response = await fetch(`/api/new-antennas/${sessionId}/${antennaIndex}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Antenna saved:', result);
    }
  };

  return (
    <form onSubmit={handleSave}>
      <p>Planning {config.new_antennas_planned} antennas</p>
      <p>Antenna {antennaIndex} of {config.new_antennas_planned}</p>
      
      <select name="sector_number" value={antenna.sector_number}>
        {[1,2,3,4,5,6].map(n => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      
      <select name="new_or_swap" value={antenna.new_or_swap}>
        <option value="New">New</option>
        <option value="Swap">Swap</option>
      </select>
      
      {/* More form fields... */}
    </form>
  );
};
```

This comprehensive API provides everything needed for robust antenna configuration management with seamless integration to the radio installations planning system. 