# DC Power System API - Postman Testing Examples

## 🎯 **API Endpoints**
- **Base URL**: `http://localhost:3000`
- **GET**: `/api/dc-power-system/:sessionId`
- **PUT**: `/api/dc-power-system/:sessionId`
- **DELETE**: `/api/dc-power-system/:sessionId`
- **GET**: `/api/dc-power-system/:sessionId/cabinet-options`

---

## 📋 **1. GET DC Power System Data**

### **Request**
- **Method**: `GET`
- **URL**: `http://localhost:3000/api/dc-power-system/your-session-id`
- **Headers**: None required

### **Response Example**
```json
{
  "success": true,
  "data": {
    "session_id": "your-session-id",
    "numberOfCabinets": 2,
    "dcPowerData": {
      "dc_rectifiers": {
        "existing_dc_rectifiers_location": "",
        "existing_dc_rectifiers_vendor": "",
        "existing_dc_rectifiers_model": "",
        "how_many_existing_dc_rectifier_modules": 1,
        "rectifier_module_capacity": 0,
        "total_capacity_existing_dc_power_system": 0,
        "how_many_free_slot_available_rectifier": 1
      },
      "batteries": {
        "existing_batteries_strings_location": "",
        "existing_batteries_vendor": "",
        "existing_batteries_type": "",
        "how_many_existing_battery_string": 1,
        "total_battery_capacity": 0,
        "how_many_free_slot_available_battery": 1,
        "new_battery_string_installation_location": []
      }
    },
    "metadata": {
      "created_at": "2025-06-15T12:00:00.000Z",
      "updated_at": "2025-06-15T12:00:00.000Z",
      "total_rectifier_modules": 1,
      "total_battery_strings": 1,
      "synced_from_outdoor_cabinets": true
    }
  },
  "message": "DC Power System data retrieved successfully"
}
```

---

## 📝 **2. PUT (Update) DC Power System Data**

### **Request**
- **Method**: `PUT`
- **URL**: `http://localhost:3000/api/dc-power-system/your-session-id`
- **Headers**: 
  ```
  Content-Type: application/json
  ```

### **Request Body (Complete Example)**
```json
{
  "existing_dc_rectifiers_location": "Existing cabinet #1",
  "existing_dc_rectifiers_vendor": "Nokia",
  "existing_dc_rectifiers_model": "Nokia Rectifier Model X1",
  "how_many_existing_dc_rectifier_modules": 5,
  "rectifier_module_capacity": 2.5,
  "total_capacity_existing_dc_power_system": 12.5,
  "how_many_free_slot_available_rectifier": 3,
  "existing_batteries_strings_location": "Existing cabinet #2",
  "existing_batteries_vendor": "Narada",
  "existing_batteries_type": "Lithium",
  "how_many_existing_battery_string": 4,
  "total_battery_capacity": 200,
  "how_many_free_slot_available_battery": 2,
  "new_battery_string_installation_location": ["Existing cabinet #1", "New Nokia cabinet"]
}
```

### **Request Body (Minimal Example)**
```json
{
  "existing_dc_rectifiers_vendor": "Nokia",
  "existing_batteries_vendor": "Narada",
  "existing_batteries_type": "Lead acid"
}
```

### **Response Example**
```json
{
  "success": true,
  "data": {
    "session_id": "your-session-id",
    "numberOfCabinets": 2,
    "dcPowerData": {
      "dc_rectifiers": {
        "existing_dc_rectifiers_location": "Existing cabinet #1",
        "existing_dc_rectifiers_vendor": "Nokia",
        "existing_dc_rectifiers_model": "Nokia Rectifier Model X1",
        "how_many_existing_dc_rectifier_modules": 5,
        "rectifier_module_capacity": 2.5,
        "total_capacity_existing_dc_power_system": 12.5,
        "how_many_free_slot_available_rectifier": 3
      },
      "batteries": {
        "existing_batteries_strings_location": "Existing cabinet #2",
        "existing_batteries_vendor": "Narada",
        "existing_batteries_type": "Lithium",
        "how_many_existing_battery_string": 4,
        "total_battery_capacity": 200,
        "how_many_free_slot_available_battery": 2,
        "new_battery_string_installation_location": ["Existing cabinet #1", "New Nokia cabinet"]
      }
    },
    "metadata": {
      "created_at": "2025-06-15T12:00:00.000Z",
      "updated_at": "2025-06-15T12:05:00.000Z",
      "total_rectifier_modules": 5,
      "total_battery_strings": 4,
      "synced_from_outdoor_cabinets": true
    }
  },
  "message": "DC Power System data updated successfully"
}
```

---

## 🗑️ **3. DELETE DC Power System Data**

### **Request**
- **Method**: `DELETE`
- **URL**: `http://localhost:3000/api/dc-power-system/your-session-id`
- **Headers**: None required

### **Response Example**
```json
{
  "success": true,
  "data": {
    "deleted": true,
    "deletedCount": 1
  },
  "message": "DC Power System data deleted successfully"
}
```

---

## 📋 **4. GET Cabinet Options**

### **Request**
- **Method**: `GET`
- **URL**: `http://localhost:3000/api/dc-power-system/your-session-id/cabinet-options`
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
      "New Nokia cabinet",
      "Other"
    ]
  },
  "message": "Cabinet options retrieved successfully"
}
```

---

## 🔧 **Field Validation Rules**

### **DC Rectifiers Vendor Options**
- Nokia
- Ericsson
- Huawei
- ZTE
- Other
- (empty string)

### **Battery Vendor Options**
- Elore
- Enersys
- Leoch battery
- Narada
- Polarium
- Shoto
- Other
- (empty string)

### **Battery Type Options**
- Lead acid
- Lithium
- (empty string)

### **Number Ranges**
- `how_many_existing_dc_rectifier_modules`: 1-20
- `how_many_free_slot_available_rectifier`: 1-10
- `how_many_existing_battery_string`: 1-10
- `how_many_free_slot_available_battery`: 1-10

### **Number Fields (KW/Ah)**
- `rectifier_module_capacity`: Float (≥0)
- `total_capacity_existing_dc_power_system`: Float (≥0)
- `total_battery_capacity`: Float (≥0)

---

## 🧪 **Quick Test Steps in Postman**

### **Step 1: Test GET (Initial)**
1. Create new request: `GET http://localhost:3000/api/dc-power-system/test-session-123`
2. Send request
3. Should return default/empty data structure

### **Step 2: Test PUT (Update)**
1. Create new request: `PUT http://localhost:3000/api/dc-power-system/test-session-123`
2. Add header: `Content-Type: application/json`
3. Add body (use complete example above)
4. Send request
5. Should return updated data

### **Step 3: Test GET (Verify)**
1. Use the same GET request from Step 1
2. Send request
3. Should return the data you just saved

### **Step 4: Test Cabinet Options**
1. Create new request: `GET http://localhost:3000/api/dc-power-system/test-session-123/cabinet-options`
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
    "message": "Battery vendor must be one of: Elore, Enersys, Leoch battery, Narada, Polarium, Shoto, Other"
  }
}
```

### **404 - Not Found**
```json
{
  "success": false,
  "error": {
    "type": "NOT_FOUND",
    "message": "DC Power System data not found for this session"
  }
}
```

---

## 🎯 **Key Features**

✅ **Cabinet Syncing**: Automatically syncs `numberOfCabinets` from OutdoorCabinets table  
✅ **Validation**: All form fields are validated according to the form requirements  
✅ **Default Values**: Creates sensible defaults when no data exists  
✅ **Flexible Updates**: Can update individual fields or complete data structure  
✅ **Error Handling**: Comprehensive error responses with specific error types  

---

**Replace `your-session-id` with your actual session ID when testing!** 