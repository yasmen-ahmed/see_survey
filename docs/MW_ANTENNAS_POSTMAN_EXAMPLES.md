# MW Antennas API - Postman Testing Examples

## 🎯 **API Endpoints**
- **Base URL**: `http://localhost:3000`
- **GET**: `/api/mw-antennas/:sessionId`
- **PUT**: `/api/mw-antennas/:sessionId`
- **DELETE**: `/api/mw-antennas/:sessionId`
- **GET**: `/api/mw-antennas/:sessionId/cabinet-options`

---

## 📋 **1. GET MW Antennas Data**

### **Request**
- **Method**: `GET`
- **URL**: `http://localhost:3000/api/mw-antennas/your-session-id`
- **Headers**: None required

### **Response Example (Default - 1 Antenna)**
```json
{
  "success": true,
  "data": {
    "session_id": "your-session-id",
    "numberOfCabinets": 2,
    "mwAntennasData": {
      "how_many_mw_antennas_on_tower": 1,
      "mw_antennas": [
        {
          "antenna_number": 1,
          "height": 0,
          "diameter": 0,
          "azimuth": 0
        }
      ]
    },
    "metadata": {
      "created_at": "2025-06-15T12:00:00.000Z",
      "updated_at": "2025-06-15T12:00:00.000Z",
      "total_mw_antennas": 1,
      "antennas_configured": 0,
      "synced_from_outdoor_cabinets": true
    }
  },
  "message": "MW Antennas data retrieved successfully"
}
```

---

## 📝 **2. PUT (Update) MW Antennas Data**

### **Request**
- **Method**: `PUT`
- **URL**: `http://localhost:3000/api/mw-antennas/your-session-id`
- **Headers**: 
  ```
  Content-Type: application/json
  ```

### **Request Body (2 Antennas Example)**
```json
{
  "how_many_mw_antennas_on_tower": 2,
  "mw_antenna_1_height": 25.5,
  "mw_antenna_1_diameter": 60,
  "mw_antenna_1_azimuth": 90,
  "mw_antenna_2_height": 30.0,
  "mw_antenna_2_diameter": 120,
  "mw_antenna_2_azimuth": 180
}
```

### **Request Body (Alternative Format with Array)**
```json
{
  "how_many_mw_antennas_on_tower": 3,
  "mw_antennas": [
    {
      "height": 25.5,
      "diameter": 60,
      "azimuth": 90
    },
    {
      "height": 30.0,
      "diameter": 120,
      "azimuth": 180
    },
    {
      "height": 35.0,
      "diameter": 90,
      "azimuth": 270
    }
  ]
}
```

### **Request Body (5 Antennas Example)**
```json
{
  "how_many_mw_antennas_on_tower": 5,
  "mw_antenna_1_height": 25.5,
  "mw_antenna_1_diameter": 60,
  "mw_antenna_1_azimuth": 0,
  "mw_antenna_2_height": 30.0,
  "mw_antenna_2_diameter": 120,
  "mw_antenna_2_azimuth": 90,
  "mw_antenna_3_height": 35.0,
  "mw_antenna_3_diameter": 90,
  "mw_antenna_3_azimuth": 180,
  "mw_antenna_4_height": 40.0,
  "mw_antenna_4_diameter": 150,
  "mw_antenna_4_azimuth": 270,
  "mw_antenna_5_height": 45.0,
  "mw_antenna_5_diameter": 180,
  "mw_antenna_5_azimuth": 315
}
```

### **Request Body (Partial Update)**
```json
{
  "how_many_mw_antennas_on_tower": 2,
  "mw_antenna_1_height": 25.5,
  "mw_antenna_1_diameter": 60
}
```

### **Response Example (2 Antennas)**
```json
{
  "success": true,
  "data": {
    "session_id": "your-session-id",
    "numberOfCabinets": 2,
    "mwAntennasData": {
      "how_many_mw_antennas_on_tower": 2,
      "mw_antennas": [
        {
          "antenna_number": 1,
          "height": 25.5,
          "diameter": 60,
          "azimuth": 90
        },
        {
          "antenna_number": 2,
          "height": 30.0,
          "diameter": 120,
          "azimuth": 180
        }
      ]
    },
    "metadata": {
      "created_at": "2025-06-15T12:00:00.000Z",
      "updated_at": "2025-06-15T12:05:00.000Z",
      "total_mw_antennas": 2,
      "antennas_configured": 2,
      "synced_from_outdoor_cabinets": true
    }
  },
  "message": "MW Antennas data updated successfully"
}
```

---

## 🗑️ **3. DELETE MW Antennas Data**

### **Request**
- **Method**: `DELETE`
- **URL**: `http://localhost:3000/api/mw-antennas/your-session-id`
- **Headers**: None required

### **Response Example**
```json
{
  "success": true,
  "data": {
    "deleted": true,
    "deletedCount": 1
  },
  "message": "MW Antennas data deleted successfully"
}
```

---

## 📋 **4. GET Cabinet Options**

### **Request**
- **Method**: `GET`
- **URL**: `http://localhost:3000/api/mw-antennas/your-session-id/cabinet-options`
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

## 🔧 **Field Validation Rules**

### **Dropdown Options**
- `how_many_mw_antennas_on_tower`: Integer from 1 to 10

### **Number Fields**
- `height`: Float (≥0) - Antenna height in meters
- `diameter`: Float (≥0) - Antenna diameter in centimeters
- `azimuth`: Float (≥0) - Antenna azimuth in degrees (0-360)

### **Dynamic Antenna Fields**
The API supports two input formats:

**Format 1: Individual Fields**
```json
{
  "mw_antenna_1_height": 25.5,
  "mw_antenna_1_diameter": 60,
  "mw_antenna_1_azimuth": 90,
  "mw_antenna_2_height": 30.0,
  "mw_antenna_2_diameter": 120,
  "mw_antenna_2_azimuth": 180
}
```

**Format 2: Array Format**
```json
{
  "mw_antennas": [
    { "height": 25.5, "diameter": 60, "azimuth": 90 },
    { "height": 30.0, "diameter": 120, "azimuth": 180 }
  ]
}
```

---

## 🧪 **Quick Test Steps in Postman**

### **Step 1: Test GET (Initial)**
1. Create new request: `GET http://localhost:3000/api/mw-antennas/test-session-123`
2. Send request
3. Should return default data with 1 antenna (all values = 0)

### **Step 2: Test PUT (2 Antennas)**
1. Create new request: `PUT http://localhost:3000/api/mw-antennas/test-session-123`
2. Add header: `Content-Type: application/json`
3. Add body (use 2 antennas example above)
4. Send request
5. Should return data with 2 configured antennas

### **Step 3: Test PUT (Increase to 5 Antennas)**
1. Use the same PUT request from Step 2
2. Change body to 5 antennas example
3. Send request
4. Should return data with 5 antennas

### **Step 4: Test PUT (Decrease to 1 Antenna)**
1. Use the same PUT request
2. Change body to:
   ```json
   {
     "how_many_mw_antennas_on_tower": 1,
     "mw_antenna_1_height": 20.0,
     "mw_antenna_1_diameter": 90,
     "mw_antenna_1_azimuth": 45
   }
   ```
3. Send request
4. Should return data with only 1 antenna (previous antennas removed)

### **Step 5: Test GET (Verify)**
1. Use the same GET request from Step 1
2. Send request
3. Should return the single antenna data you just saved

### **Step 6: Test Cabinet Options**
1. Create new request: `GET http://localhost:3000/api/mw-antennas/test-session-123/cabinet-options`
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
    "message": "No data provided for update"
  }
}
```

### **404 - Not Found**
```json
{
  "success": false,
  "error": {
    "type": "NOT_FOUND",
    "message": "MW Antennas data not found for this session"
  }
}
```

---

## 🎯 **Key Features**

✅ **Dynamic Antenna Count**: Supports 1-10 antennas based on dropdown selection  
✅ **Auto Array Management**: Automatically adjusts antenna array size based on quantity  
✅ **Flexible Input**: Accepts both individual fields and array format  
✅ **Cabinet Syncing**: Automatically syncs `numberOfCabinets` from OutdoorCabinets table  
✅ **Validation**: All numeric fields validated (≥0)  
✅ **Smart Metadata**: Tracks total antennas and how many are configured  
✅ **Partial Updates**: Can update individual antenna fields  
✅ **Error Handling**: Comprehensive error responses with specific error types  

---

## 📊 **Dynamic Behavior Examples**

### **Scenario 1: User selects 2 antennas**
**Input:**
```json
{
  "how_many_mw_antennas_on_tower": 2,
  "mw_antenna_1_height": 25.0,
  "mw_antenna_2_height": 30.0
}
```
**Result:** Creates exactly 2 antenna objects

### **Scenario 2: User increases from 2 to 4 antennas**
**Input:**
```json
{
  "how_many_mw_antennas_on_tower": 4,
  "mw_antenna_3_height": 35.0,
  "mw_antenna_4_height": 40.0
}
```
**Result:** Keeps existing antennas 1-2, adds new antennas 3-4

### **Scenario 3: User decreases from 4 to 2 antennas**
**Input:**
```json
{
  "how_many_mw_antennas_on_tower": 2
}
```
**Result:** Keeps only antennas 1-2, removes antennas 3-4

---

## 📋 **Complete Test Collection for Postman**

### **Collection: MW Antennas API Tests**

1. **GET Default Data** - `GET /api/mw-antennas/test-session-123`
2. **PUT 2 Antennas** - `PUT /api/mw-antennas/test-session-123` (with 2 antennas body)
3. **PUT 5 Antennas** - `PUT /api/mw-antennas/test-session-123` (with 5 antennas body)
4. **PUT Back to 1** - `PUT /api/mw-antennas/test-session-123` (with 1 antenna body)
5. **GET Final Data** - `GET /api/mw-antennas/test-session-123`
6. **GET Cabinet Options** - `GET /api/mw-antennas/test-session-123/cabinet-options`
7. **DELETE Data** - `DELETE /api/mw-antennas/test-session-123`

---

**Replace `your-session-id` with your actual session ID when testing!** 