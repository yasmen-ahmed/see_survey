# 📡 New Antennas API - Postman Testing Examples

## Overview
Simple API for managing antenna configurations by session ID with default empty values when no data exists.

---

## 🔌 API Endpoints

### 1. GET All Antennas by Session ID
**Returns only existing antennas for the session with clean default values**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/api/new-antennas/session_123"
}
```

#### Response (When No Data Exists):
```json
{
  "session_id": "session_123",
  "new_antennas_planned": 1,
  "antennas": [],
  "total_antennas": 0
}
```

#### Response (With Existing Data):
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
      "azimuth_angle_shift": "120.5",
      "base_height_from_tower": "25.0",
      "tower_leg_location": "A",
      "tower_leg_section": "Angular",
      "angular_l1_dimension": "100.0",
      "angular_l2_dimension": "100.0",
      "tubular_cross_section": "",
      "side_arm_type": "New side arm need to be supplied",
      "side_arm_length": "2.5",
      "side_arm_cross_section": "60.0",
      "side_arm_offset": "15.0",
      "earth_bus_bar_exists": "Yes",
      "earth_cable_length": "50.0",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total_antennas": 1
}
```

### 2. GET Single Antenna by Index
**Returns specific antenna or default empty values if doesn't exist**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/api/new-antennas/session_123/1"
}
```

#### Response (When Antenna Doesn't Exist):
```json
{
  "id": null,
  "session_id": "session_123",
  "antenna_index": 1,
  "sector_number": "",
  "new_or_swap": "",
  "antenna_technology": [],
  "azimuth_angle_shift": "",
  "base_height_from_tower": "",
  "tower_leg_location": "",
  "tower_leg_section": "",
  "angular_l1_dimension": "",
  "angular_l2_dimension": "",
  "tubular_cross_section": "",
  "side_arm_type": "",
  "side_arm_length": "",
  "side_arm_cross_section": "",
  "side_arm_offset": "",
  "earth_bus_bar_exists": "",
  "earth_cable_length": "",
  "created_at": null,
  "updated_at": null
}
```

### 3. CREATE Antenna
**Creates a new antenna configuration**

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

#### Response:
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
    "azimuth_angle_shift": "120.5",
    "base_height_from_tower": "25.0",
    "tower_leg_location": "A",
    "tower_leg_section": "Angular",
    "angular_l1_dimension": "100.0",
    "angular_l2_dimension": "100.0",
    "tubular_cross_section": "",
    "side_arm_type": "New side arm need to be supplied",
    "side_arm_length": "2.5",
    "side_arm_cross_section": "60.0",
    "side_arm_offset": "15.0",
    "earth_bus_bar_exists": "Yes",
    "earth_cable_length": "50.0",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. UPDATE Antenna (Partial)
**Updates only provided fields**

```json
{
  "method": "PUT",
  "url": "http://localhost:3000/api/new-antennas/session_123/1",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "sector_number": "2",
    "azimuth_angle_shift": 240.0
  }
}
```

### 5. GET Configuration Info
**Returns planning data from new_radio_installations**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/api/new-antennas/session_123/config"
}
```

#### Response:
```json
{
  "session_id": "session_123",
  "new_antennas_planned": 3,
  "existing_antennas_swapped": 1,
  "current_antennas_count": 2,
  "has_radio_installations_data": true
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: New Session (No Data)

1. **Check if antennas exist**
```json
GET http://localhost:3000/api/new-antennas/new_session_456
```

**Expected Response:**
```json
{
  "session_id": "new_session_456",
  "new_antennas_planned": 1,
  "antennas": [],
  "total_antennas": 0
}
```

2. **Get specific antenna (doesn't exist)**
```json
GET http://localhost:3000/api/new-antennas/new_session_456/1
```

**Expected Response:** Default empty values with empty strings

### Scenario 2: Create and Update Flow

1. **First set up radio installations planning**
```json
{
  "method": "PUT",
  "url": "http://localhost:3000/api/new-radio-installations/session_789",
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

2. **Create first antenna**
```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/new-antennas/session_789/1",
  "body": {
    "sector_number": "1",
    "new_or_swap": "New",
    "antenna_technology": ["4G", "5G"],
    "azimuth_angle_shift": 0,
    "base_height_from_tower": 25,
    "tower_leg_location": "A",
    "tower_leg_section": "Angular",
    "angular_l1_dimension": 100,
    "angular_l2_dimension": 100,
    "side_arm_type": "New side arm need to be supplied",
    "side_arm_length": 2.5,
    "side_arm_cross_section": 60,
    "side_arm_offset": 15,
    "earth_bus_bar_exists": "Yes",
    "earth_cable_length": 50
  }
}
```

3. **Create second antenna (Tubular)**
```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/new-antennas/session_789/2",
  "body": {
    "sector_number": "2",
    "new_or_swap": "New",
    "antenna_technology": ["4G", "5G"],
    "azimuth_angle_shift": 120,
    "base_height_from_tower": 25,
    "tower_leg_location": "B",
    "tower_leg_section": "Tubular",
    "tubular_cross_section": 150,
    "side_arm_type": "Use existing empty side arm",
    "earth_bus_bar_exists": "Yes",
    "earth_cable_length": 45
  }
}
```

4. **Create third antenna (Swap)**
```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/new-antennas/session_789/3",
  "body": {
    "sector_number": "3",
    "new_or_swap": "Swap",
    "antenna_technology": ["3G", "4G"],
    "azimuth_angle_shift": 240,
    "base_height_from_tower": 20,
    "tower_leg_location": "C",
    "tower_leg_section": "Angular",
    "angular_l1_dimension": 80,
    "angular_l2_dimension": 80,
    "side_arm_type": "Use swapped antenna side arm",
    "earth_bus_bar_exists": "No"
  }
}
```

5. **Get all antennas**
```json
GET http://localhost:3000/api/new-antennas/session_789
```

**Expected Response:** Array with 3 antennas, `new_antennas_planned: 3`

### Scenario 3: Validation Testing

**Test Invalid Sector Number:**
```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/new-antennas/session_123/1",
  "body": {
    "sector_number": "7"
  }
}
```

**Expected Response:** `400 Bad Request - Invalid sector_number: 7`

**Test Invalid Technology:**
```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/new-antennas/session_123/1",
  "body": {
    "antenna_technology": ["4G", "6G"]
  }
}
```

**Expected Response:** `400 Bad Request - Invalid antenna technology: 6G`

### Scenario 4: Update Testing

**Partial Update (only change azimuth):**
```json
{
  "method": "PUT",
  "url": "http://localhost:3000/api/new-antennas/session_789/1",
  "body": {
    "azimuth_angle_shift": 45
  }
}
```

**Complete Update:**
```json
{
  "method": "PUT",
  "url": "http://localhost:3000/api/new-antennas/session_789/1",
  "body": {
    "sector_number": "1",
    "new_or_swap": "New",
    "antenna_technology": ["2G", "3G", "4G", "5G"],
    "azimuth_angle_shift": 90,
    "base_height_from_tower": 30,
    "tower_leg_location": "A",
    "tower_leg_section": "Angular",
    "angular_l1_dimension": 120,
    "angular_l2_dimension": 120,
    "side_arm_type": "New side arm need to be supplied",
    "side_arm_length": 3.0,
    "side_arm_cross_section": 80,
    "side_arm_offset": 20,
    "earth_bus_bar_exists": "Yes",
    "earth_cable_length": 60
  }
}
```

---

## 📋 Valid Values Reference

### Dropdown Options:
- **sector_number**: "1", "2", "3", "4", "5", "6"
- **new_or_swap**: "New", "Swap"
- **tower_leg_location**: "A", "B", "C", "D"
- **tower_leg_section**: "Angular", "Tubular"
- **side_arm_type**: 
  - "Use existing empty side arm"
  - "Use swapped antenna side arm"
  - "New side arm need to be supplied"
- **earth_bus_bar_exists**: "Yes", "No"
- **antenna_technology**: Array containing ["2G", "3G", "4G", "5G"]

### Numeric Fields:
All numeric fields accept positive numbers or empty strings as defaults.

---

## 🚀 Key Features

1. **Clean Defaults**: Returns empty strings instead of null values
2. **Session-Only Data**: Only returns antennas that actually exist for the session
3. **Integration**: Automatically fetches `new_antennas_planned` from radio installations
4. **Validation**: Comprehensive validation for all fields
5. **Flexible Updates**: Supports both partial (PUT) and complete (PUT) updates

The API now provides clean, predictable responses with proper default values for easy frontend integration! 