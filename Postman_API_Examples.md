# Postman API Test Examples

This document provides comprehensive Postman examples for testing both the New Radio Units API and FPFH API.

## Setup

### Base URL
```
http://localhost:3000
```

### Headers (for all requests)
```
Content-Type: application/json
```

---

## 🔧 New Radio Units API Examples

### 1. Get Configuration
**Method:** `GET`  
**URL:** `{{base_url}}/api/new-radio-units/test-session-123/config`  
**Headers:** `Content-Type: application/json`

**Expected Response:**
```json
{
  "session_id": "test-session-123",
  "new_radio_units_planned": 3,
  "existing_radio_units_swapped": 1,
  "radio_units_count": 0,
  "has_radio_units_data": false,
  "has_radio_installations_data": false
}
```

### 2. Get All Radio Units (Empty State)
**Method:** `GET`  
**URL:** `{{base_url}}/api/new-radio-units/test-session-123`  
**Headers:** `Content-Type: application/json`

### 3. Create Multiple Radio Units
**Method:** `PUT`  
**URL:** `{{base_url}}/api/new-radio-units/test-session-123`  
**Headers:** `Content-Type: application/json`

**Body (raw JSON):**
```json
[
  {
    "radio_unit_index": 1,
    "radio_unit_number": 1,
    "new_radio_unit_sector": "1",
    "connected_to_antenna": "New",
    "connected_antenna_technology": ["4G", "5G"],
    "new_radio_unit_model": "Nokia AEHC",
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
    "new_radio_unit_model": "Nokia AEHD",
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
  },
  {
    "radio_unit_index": 3,
    "radio_unit_number": 3,
    "new_radio_unit_sector": "3",
    "connected_to_antenna": "New",
    "connected_antenna_technology": ["2G", "3G", "4G", "5G"],
    "new_radio_unit_model": "Nokia AEHE",
    "radio_unit_location": "Tower leg C",
    "feeder_length_to_antenna": 18.0,
    "tower_leg_section": "Angular",
    "angular_l1_dimension": 120.0,
    "angular_l2_dimension": 120.0,
    "side_arm_type": "Use existing antenna side arm",
    "side_arm_length": 3.0,
    "side_arm_cross_section": 60.0,
    "side_arm_offset": 30.0,
    "dc_power_source": "Existing FPFH",
    "dc_power_cable_length": 25.0,
    "fiber_cable_length": 35.0,
    "jumper_length": 1.8,
    "earth_bus_bar_exists": "Yes",
    "earth_cable_length": 12.0
  }
]
```

### 4. Update Single Radio Unit
**Method:** `PATCH`  
**URL:** `{{base_url}}/api/new-radio-units/test-session-123/1`  
**Headers:** `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "new_radio_unit_model": "Nokia AEHC Updated",
  "feeder_length_to_antenna": 20.0,
  "side_arm_length": 3.5,
  "dc_power_cable_length": 22.0
}
```

### 5. Update Multiple Radio Units (Partial)
**Method:** `PATCH`  
**URL:** `{{base_url}}/api/new-radio-units/test-session-123`  
**Headers:** `Content-Type: application/json`

**Body (raw JSON):**
```json
[
  {
    "radio_unit_index": 2,
    "new_radio_unit_model": "Nokia AEHD Updated v2",
    "dc_power_cable_length": 18.0
  },
  {
    "radio_unit_index": 3,
    "new_radio_unit_model": "Nokia AEHE Updated v2",
    "fiber_cable_length": 40.0
  }
]
```

### 6. Delete Single Radio Unit
**Method:** `DELETE`  
**URL:** `{{base_url}}/api/new-radio-units/test-session-123/3`  
**Headers:** `Content-Type: application/json`

### 7. Delete All Radio Units
**Method:** `DELETE`  
**URL:** `{{base_url}}/api/new-radio-units/test-session-123`  
**Headers:** `Content-Type: application/json`

### 8. Test Validation Errors
**Method:** `PUT`  
**URL:** `{{base_url}}/api/new-radio-units/test-session-123`  
**Headers:** `Content-Type: application/json`

**Body (raw JSON) - Invalid Data:**
```json
[
  {
    "radio_unit_index": 1,
    "new_radio_unit_sector": "INVALID_SECTOR",
    "connected_to_antenna": "INVALID_CONNECTION",
    "feeder_length_to_antenna": -5,
    "radio_unit_location": "Invalid Location"
  }
]
```

---

## 🔌 FPFH API Examples

### 1. Get All FPFHs for Session
**Method:** `GET`  
**URL:** `{{base_url}}/api/new-fpfh/test-session-123`  
**Headers:** `Content-Type: application/json`

### 2. Get Specific FPFH
**Method:** `GET`  
**URL:** `{{base_url}}/api/new-fpfh/test-session-123/1`  
**Headers:** `Content-Type: application/json`

### 3. Create/Update FPFH
**Method:** `POST`  
**URL:** `{{base_url}}/api/new-fpfh/test-session-123/1`  
**Headers:** `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "fpfh_index": 1,
  "fpfh_number": 1,
  "fpfh_installation_type": "Standalone",
  "fpfh_location": "On ground",
  "fpfh_base_height": 1.5,
  "fpfh_tower_leg": "A",
  "fpfh_dc_power_source": "from new DC rectifier cabinet",
  "dc_distribution_source": "BLVD",
  "ethernet_cable_length": 50.0,
  "dc_power_cable_length": 30.0,
  "earth_bus_bar_exists": "Yes",
  "earth_cable_length": 15.0
}
```

### 4. Create Second FPFH
**Method:** `POST`  
**URL:** `{{base_url}}/api/new-fpfh/test-session-123/2`  
**Headers:** `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "fpfh_index": 2,
  "fpfh_number": 2,
  "fpfh_installation_type": "Stacked with other Nokia modules",
  "fpfh_location": "On tower",
  "fpfh_base_height": 12.0,
  "fpfh_tower_leg": "B",
  "fpfh_dc_power_source": "from the existing rectifier cabinet",
  "dc_distribution_source": "LLVD",
  "ethernet_cable_length": 25.0,
  "dc_power_cable_length": 20.0,
  "earth_bus_bar_exists": "No",
  "earth_cable_length": 10.0
}
```

### 5. Update FPFH (Partial)
**Method:** `PATCH`  
**URL:** `{{base_url}}/api/new-fpfh/test-session-123/1`  
**Headers:** `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "fpfh_installation_type": "Other",
  "ethernet_cable_length": 60.0,
  "dc_power_cable_length": 35.0
}
```

### 6. Delete Specific FPFH
**Method:** `DELETE`  
**URL:** `{{base_url}}/api/new-fpfh/test-session-123/2`  
**Headers:** `Content-Type: application/json`

### 7. Test FPFH Validation Errors
**Method:** `POST`  
**URL:** `{{base_url}}/api/new-fpfh/test-session-123/1`  
**Headers:** `Content-Type: application/json`

**Body (raw JSON) - Invalid Data:**
```json
{
  "fpfh_index": 1,
  "fpfh_installation_type": "INVALID_TYPE",
  "fpfh_location": "Invalid Location",
  "fpfh_base_height": -5,
  "fpfh_tower_leg": "INVALID_LEG",
  "ethernet_cable_length": "not_a_number"
}
```

---

## 📋 Postman Collection Setup

### Environment Variables
Create a Postman environment with:
```
base_url: http://localhost:3000
session_id: test-session-123
```

### Collection Variables
```
Content-Type: application/json
```

### Test Scripts

#### For GET requests, add this test script:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response time is less than 1000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(1000);
});

pm.test("Response has required fields", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('session_id');
});
```

#### For POST/PUT/PATCH requests, add this test script:
```javascript
pm.test("Status code is 200 or 201", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201]);
});

pm.test("Response has success message", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('message');
});
```

#### For DELETE requests, add this test script:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Deletion confirmed", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.message).to.include('deleted successfully');
});
```

---

## 🎯 Testing Scenarios

### Scenario 1: Complete Radio Units Workflow
1. Get Config → Get Empty State → Create 3 Units → Get All → Update Unit 1 → Delete Unit 3 → Get All → Delete All

### Scenario 2: FPFH Management
1. Get All FPFHs → Create FPFH 1 → Create FPFH 2 → Update FPFH 1 → Get Specific FPFH → Delete FPFH 2

### Scenario 3: Error Testing
1. Test Radio Units validation errors
2. Test FPFH validation errors
3. Test invalid session IDs
4. Test invalid indexes

---

## 📝 Valid Values Reference

### Radio Units Enums:
- **new_radio_unit_sector**: '1', '2', '3', '4', '5', '6'
- **connected_to_antenna**: 'New', 'Existing'
- **connected_antenna_technology**: ['2G', '3G', '4G', '5G']
- **radio_unit_location**: 'Tower leg A', 'Tower leg B', 'Tower leg C', 'Tower leg D', 'On the ground'
- **tower_leg_section**: 'Angular', 'Tubular'
- **side_arm_type**: 'Use existing empty side arm', 'Use existing antenna side arm', 'New side arm need to be supplied'
- **dc_power_source**: 'Direct from rectifier distribution', 'New FPFH', 'Existing FPFH', 'Existing DC PDU (not FPFH)'
- **earth_bus_bar_exists**: 'Yes', 'No'

### FPFH Enums:
- **fpfh_installation_type**: 'Stacked with other Nokia modules', 'Standalone', 'Other'
- **fpfh_location**: 'On ground', 'On tower'
- **fpfh_tower_leg**: 'A', 'B', 'C', 'D'
- **fpfh_dc_power_source**: 'from new DC rectifier cabinet', 'from the existing rectifier cabinet', 'Existing external DC PDU #1', 'Existing external DC PDU #2', 'Existing external DC PDU #n'
- **dc_distribution_source**: 'BLVD', 'LLVD', 'PDU'
- **earth_bus_bar_exists**: 'Yes', 'No'

---

## 🚀 Quick Start

1. Import this collection into Postman
2. Set up environment variables (base_url, session_id)
3. Start with GET requests to test connectivity
4. Progress through CRUD operations
5. Test error scenarios to validate API robustness 