# Antenna Structure API - Postman Testing Examples

## 🎯 **API Endpoints**
- **Base URL**: `http://localhost:3000`
- **GET**: `/api/antenna-structure/:sessionId`
- **PUT**: `/api/antenna-structure/:sessionId`
- **DELETE**: `/api/antenna-structure/:sessionId`
- **GET**: `/api/antenna-structure/:sessionId/cabinet-options`
- **GET**: `/api/antenna-structure/form-options`

---

## 📋 **1. GET Antenna Structure Data**

### **Request**
- **Method**: `GET`
- **URL**: `http://localhost:3000/api/antenna-structure/your-session-id`
- **Headers**: None required

### **Response Example**
```json
{
  "success": true,
  "data": {
    "session_id": "your-session-id",
    "numberOfCabinets": 2,
    "antennaStructureData": {
      "has_sketch_with_measurements": "",
      "tower_type": [],
      "gf_antenna_structure_height": 0,
      "rt_how_many_structures_onsite": "",
      "rt_existing_heights": [],
      "rt_building_height": 0,
      "lightening_system_installed": "",
      "earthing_bus_bars_exist": "",
      "how_many_free_holes_bus_bars": ""
    },
    "formOptions": {
      "tower_types": [
        "GF tower",
        "GF Monopole", 
        "GF Palm tree",
        "RT tower",
        "RT poles",
        "Wall mounted",
        "Other"
      ],
      "existing_heights": ["3m", "6m", "9m", "12m", "15m", "Other"],
      "free_holes_options": ["1 / 2 / 3 / ... / 10", "more than 10"],
      "yes_no_options": ["Yes", "No"],
      "structures_onsite_range": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    },
    "metadata": {
      "created_at": "2025-06-15T12:00:00.000Z",
      "updated_at": "2025-06-15T12:00:00.000Z",
      "tower_types_selected": 0,
      "has_gf_tower": false,
      "has_rt_tower": false,
      "synced_from_outdoor_cabinets": true
    }
  },
  "message": "Antenna Structure data retrieved successfully"
}
```

---

## 📝 **2. PUT (Update) Antenna Structure Data**

### **Request**
- **Method**: `PUT`
- **URL**: `http://localhost:3000/api/antenna-structure/your-session-id`
- **Headers**: 
  ```
  Content-Type: application/json
  ```

### **Request Body (Complete Example with GF Tower)**
```json
{
  "has_sketch_with_measurements": "Yes",
  "tower_type": ["GF tower", "GF Monopole"],
  "gf_antenna_structure_height": 45.5,
  "lightening_system_installed": "Yes",
  "earthing_bus_bars_exist": "Yes",
  "how_many_free_holes_bus_bars": "1 / 2 / 3 / ... / 10"
}
```

### **Request Body (Complete Example with RT Tower)**
```json
{
  "has_sketch_with_measurements": "No",
  "tower_type": ["RT tower", "RT poles"],
  "rt_how_many_structures_onsite": 3,
  "rt_existing_heights": ["6m", "9m", "12m"],
  "rt_building_height": 25.0,
  "lightening_system_installed": "No",
  "earthing_bus_bars_exist": "Yes",
  "how_many_free_holes_bus_bars": "more than 10"
}
```

### **Request Body (Mixed Tower Types)**
```json
{
  "has_sketch_with_measurements": "Yes",
  "tower_type": ["GF tower", "RT tower", "Wall mounted"],
  "gf_antenna_structure_height": 40.0,
  "rt_how_many_structures_onsite": 2,
  "rt_existing_heights": ["3m", "6m"],
  "rt_building_height": 15.5,
  "lightening_system_installed": "Yes",
  "earthing_bus_bars_exist": "No",
  "how_many_free_holes_bus_bars": "1 / 2 / 3 / ... / 10"
}
```

### **Request Body (Minimal Example)**
```json
{
  "has_sketch_with_measurements": "Yes",
  "tower_type": ["GF tower"]
}
```

### **Response Example**
```json
{
  "success": true,
  "data": {
    "session_id": "your-session-id",
    "numberOfCabinets": 2,
    "antennaStructureData": {
      "has_sketch_with_measurements": "Yes",
      "tower_type": ["GF tower", "RT tower", "Wall mounted"],
      "gf_antenna_structure_height": 40.0,
      "rt_how_many_structures_onsite": 2,
      "rt_existing_heights": ["3m", "6m"],
      "rt_building_height": 15.5,
      "lightening_system_installed": "Yes",
      "earthing_bus_bars_exist": "No",
      "how_many_free_holes_bus_bars": "1 / 2 / 3 / ... / 10"
    },
    "formOptions": {
      "tower_types": ["GF tower", "GF Monopole", "GF Palm tree", "RT tower", "RT poles", "Wall mounted", "Other"],
      "existing_heights": ["3m", "6m", "9m", "12m", "15m", "Other"],
      "free_holes_options": ["1 / 2 / 3 / ... / 10", "more than 10"],
      "yes_no_options": ["Yes", "No"],
      "structures_onsite_range": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    },
    "metadata": {
      "created_at": "2025-06-15T12:00:00.000Z",
      "updated_at": "2025-06-15T12:05:00.000Z",
      "tower_types_selected": 3,
      "has_gf_tower": true,
      "has_rt_tower": true,
      "synced_from_outdoor_cabinets": true
    }
  },
  "message": "Antenna Structure data updated successfully"
}
```

---

## 🗑️ **3. DELETE Antenna Structure Data**

### **Request**
- **Method**: `DELETE`
- **URL**: `http://localhost:3000/api/antenna-structure/your-session-id`
- **Headers**: None required

### **Response Example**
```json
{
  "success": true,
  "data": {
    "deleted": true,
    "deletedCount": 1
  },
  "message": "Antenna Structure data deleted successfully"
}
```

---

## 📋 **4. GET Cabinet Options**

### **Request**
- **Method**: `GET`
- **URL**: `http://localhost:3000/api/antenna-structure/your-session-id/cabinet-options`
- **Headers**: None required

### **Response Example**
```json
{
  "success": true,
  "data": {
    "session_id": "your-session-id",
    "cabinet_options": [
      "Existing cabinet #1",
      "Existing cabinet #2",
      "Other"
    ]
  },
  "message": "Cabinet options retrieved successfully"
}
```

---

## 📋 **5. GET Form Options**

### **Request**
- **Method**: `GET`
- **URL**: `http://localhost:3000/api/antenna-structure/form-options`
- **Headers**: None required

### **Response Example**
```json
{
  "success": true,
  "data": {
    "tower_types": [
      "GF tower",
      "GF Monopole",
      "GF Palm tree", 
      "RT tower",
      "RT poles",
      "Wall mounted",
      "Other"
    ],
    "existing_heights": [
      "3m",
      "6m", 
      "9m",
      "12m",
      "15m",
      "Other"
    ],
    "free_holes_options": [
      "1 / 2 / 3 / ... / 10",
      "more than 10"
    ],
    "yes_no_options": [
      "Yes",
      "No"
    ],
    "structures_onsite_range": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  "message": "Form options retrieved successfully"
}
```

---

## 🔧 **Field Validation Rules**

### **Radio Button Options**
- `has_sketch_with_measurements`: "Yes" | "No"
- `lightening_system_installed`: "Yes" | "No"
- `earthing_bus_bars_exist`: "Yes" | "No"

### **Checkbox Options (Multiple Selection)**
- `tower_type`: Array of ["GF tower", "GF Monopole", "GF Palm tree", "RT tower", "RT poles", "Wall mounted", "Other"]
- `rt_existing_heights`: Array of ["3m", "6m", "9m", "12m", "15m", "Other"]

### **Dropdown Options**
- `rt_how_many_structures_onsite`: 1-10
- `how_many_free_holes_bus_bars`: "1 / 2 / 3 / ... / 10" | "more than 10"

### **Number Fields (Meters)**
- `gf_antenna_structure_height`: Float (≥0)
- `rt_building_height`: Float (≥0)

### **Conditional Logic**
- **GF Tower fields** are relevant when `tower_type` includes: "GF tower", "GF Monopole", or "GF Palm tree"
- **RT Tower fields** are relevant when `tower_type` includes: "RT tower" or "RT poles"

---

## 🧪 **Quick Test Steps in Postman**

### **Step 1: Get Form Options**
1. Create new request: `GET http://localhost:3000/api/antenna-structure/form-options`
2. Send request
3. Note the available options for dropdowns and checkboxes

### **Step 2: Test GET (Initial)**
1. Create new request: `GET http://localhost:3000/api/antenna-structure/test-session-123`
2. Send request
3. Should return default/empty data structure with form options

### **Step 3: Test PUT (GF Tower)**
1. Create new request: `PUT http://localhost:3000/api/antenna-structure/test-session-123`
2. Add header: `Content-Type: application/json`
3. Add body (use GF Tower example above)
4. Send request
5. Should return updated data with GF tower fields populated

### **Step 4: Test PUT (RT Tower)**
1. Use the same PUT request from Step 3
2. Change body to RT Tower example
3. Send request
4. Should return updated data with RT tower fields populated

### **Step 5: Test GET (Verify)**
1. Use the same GET request from Step 2
2. Send request
3. Should return the RT tower data you just saved

### **Step 6: Test Cabinet Options**
1. Create new request: `GET http://localhost:3000/api/antenna-structure/test-session-123/cabinet-options`
2. Send request
3. Should return available cabinet options

---

## ⚠️ **Common Error Responses**

### **400 - Validation Error**
```json
{
  "success": false,
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Value must be one of: Yes, No"
  }
}
```

### **404 - Not Found**
```json
{
  "success": false,
  "error": {
    "type": "NOT_FOUND",
    "message": "Antenna Structure data not found for this session"
  }
}
```

---

## 🎯 **Key Features**

✅ **Cabinet Syncing**: Automatically syncs `numberOfCabinets` from OutdoorCabinets table  
✅ **Conditional Fields**: Handles GF Tower and RT Tower specific fields based on selection  
✅ **Multiple Selection**: Supports checkbox arrays for tower types and heights  
✅ **Validation**: All form fields are validated according to the form requirements  
✅ **Form Options**: Provides all dropdown and checkbox options in the response  
✅ **Smart Metadata**: Tracks which tower types are selected and shows relevant flags  
✅ **Flexible Updates**: Can update individual fields or complete data structure  
✅ **Error Handling**: Comprehensive error responses with specific error types  

---

## 📊 **Form Logic Examples**

### **Scenario 1: User selects GF Tower**
```json
{
  "tower_type": ["GF tower"],
  "gf_antenna_structure_height": 30.0
}
```
**Result**: Only GF-specific fields are required/relevant

### **Scenario 2: User selects RT Tower**
```json
{
  "tower_type": ["RT tower"],
  "rt_how_many_structures_onsite": 2,
  "rt_existing_heights": ["6m", "9m"],
  "rt_building_height": 20.0
}
```
**Result**: Only RT-specific fields are required/relevant

### **Scenario 3: User selects both GF and RT**
```json
{
  "tower_type": ["GF tower", "RT tower"],
  "gf_antenna_structure_height": 35.0,
  "rt_how_many_structures_onsite": 1,
  "rt_existing_heights": ["12m"],
  "rt_building_height": 15.0
}
```
**Result**: Both GF and RT fields are relevant

---

**Replace `your-session-id` with your actual session ID when testing!** 