# 📡 New Radio Installations API - Postman Testing Guide

## 🚀 **API Endpoints Overview**

Base URL: `http://localhost:3000/api/new-radio-installations`

### **Available Endpoints:**
1. `GET /:session_id` - Get all installation data
2. `GET /:session_id/antennas-count` - Get antenna count and details
3. `POST /:session_id` - Create/Update installation data
4. `PUT /:session_id` - Update all installation data
5. `PUT /:session_id/antennas-count` - Update antenna count
6. `PUT /:session_id/antenna/:antenna_index` - Update specific antenna
7. `DELETE /:session_id` - Delete installation data

---

## 📋 **1. GET Installation Data**

### **Get All Data**
```http
GET http://localhost:3000/api/new-radio-installations/session-123
```

**Expected Response:**
```json
{
  "session_id": "session-123",
  "new_sectors_planned": 1,
  "new_radio_units_planned": 1,
  "existing_radio_units_swapped": 1,
  "new_antennas_planned": 1,
  "existing_antennas_swapped": 1,
  "new_fpfh_installed": 1,
  "new_antennas": [],
  "created_at": null,
  "updated_at": null
}
```

### **Get Antenna Count Only**
```http
GET http://localhost:3000/api/new-radio-installations/session-123/antennas-count
```

**Expected Response:**
```json
{
  "session_id": "session-123",
  "new_antennas_planned": 1,
  "new_antennas": [],
  "antenna_count": 0
}
```

---

## 🆕 **2. CREATE Installation Data**

### **Basic Creation**
```http
POST http://localhost:3000/api/new-radio-installations/session-456
Content-Type: application/json

{
  "new_sectors_planned": 3,
  "new_radio_units_planned": 2,
  "existing_radio_units_swapped": 1,
  "new_antennas_planned": 2,
  "existing_antennas_swapped": 1,
  "new_fpfh_installed": 1
}
```

### **With New Antennas Data**
```http
POST http://localhost:3000/api/new-radio-installations/session-789
Content-Type: application/json

{
  "new_antennas_planned": 2,
  "new_antennas": [
    {
      "antenna_number": 1,
      "sector_number": 1,
      "new_or_swap": "New",
      "antenna_technology": "2G",
      "azimuth_angle": 45,
      "base_height": 25,
      "tower_leg": "A",
      "tower_leg_section": "Angular",
      "angular_dimensions": [100, 200],
      "side_arm": "New side arm need to be supplied",
      "side_arm_length": 1.5,
      "side_arm_cross_section": 50,
      "side_arm_offset": 10,
      "earth_bus_bar_exists": "Yes",
      "earth_cable_length": 5
    },
    {
      "antenna_number": 2,
      "sector_number": 2,
      "new_or_swap": "Swap",
      "antenna_technology": "3G",
      "azimuth_angle": 135,
      "base_height": 30,
      "tower_leg": "B",
      "tower_leg_section": "Tubular",
      "tubular_dimensions": 150,
      "side_arm": "Use existing empty side arm",
      "earth_bus_bar_exists": "No",
      "earth_cable_length": 0
    }
  ]
}
```

---

## 🔄 **3. UPDATE Antenna Count**

### **Update Antenna Count (Auto-generates structures)**
```http
PUT http://localhost:3000/api/new-radio-installations/session-789/antennas-count
Content-Type: application/json

{
  "new_antennas_planned": 3
}
```

**Expected Response:**
```json
{
  "message": "Antennas count updated successfully",
  "data": {
    "session_id": "session-789",
    "new_antennas_planned": 3,
    "new_antennas": [
      {
        "antenna_number": 1,
        "sector_number": 1,
        "new_or_swap": "New",
        "antenna_technology": "2G",
        "azimuth_angle": 0,
        "base_height": 0,
        "tower_leg": "A",
        "tower_leg_section": "Angular",
        "angular_dimensions": [0, 0],
        "tubular_dimensions": 0,
        "side_arm": "Use existing empty side arm",
        "side_arm_length": 0,
        "side_arm_cross_section": 0,
        "side_arm_offset": 0,
        "earth_bus_bar_exists": "Yes",
        "earth_cable_length": 0
      },
      {
        "antenna_number": 2,
        "sector_number": 1,
        "new_or_swap": "New",
        "antenna_technology": "2G",
        "azimuth_angle": 0,
        "base_height": 0,
        "tower_leg": "A",
        "tower_leg_section": "Angular",
        "angular_dimensions": [0, 0],
        "tubular_dimensions": 0,
        "side_arm": "Use existing empty side arm",
        "side_arm_length": 0,
        "side_arm_cross_section": 0,
        "side_arm_offset": 0,
        "earth_bus_bar_exists": "Yes",
        "earth_cable_length": 0
      },
      {
        "antenna_number": 3,
        "sector_number": 1,
        "new_or_swap": "New",
        "antenna_technology": "2G",
        "azimuth_angle": 0,
        "base_height": 0,
        "tower_leg": "A",
        "tower_leg_section": "Angular",
        "angular_dimensions": [0, 0],
        "tubular_dimensions": 0,
        "side_arm": "Use existing empty side arm",
        "side_arm_length": 0,
        "side_arm_cross_section": 0,
        "side_arm_offset": 0,
        "earth_bus_bar_exists": "Yes",
        "earth_cable_length": 0
      }
    ],
    "antenna_count": 3
  }
}
```

---

## 🎯 **4. UPDATE Specific Antenna**

### **Update Antenna #1**
```http
PUT http://localhost:3000/api/new-radio-installations/session-789/antenna/0
Content-Type: application/json

{
  "sector_number": 1,
  "new_or_swap": "New",
  "antenna_technology": "4G",
  "azimuth_angle": 90,
  "base_height": 35,
  "tower_leg": "B",
  "tower_leg_section": "Angular",
  "angular_dimensions": [120, 180],
  "side_arm": "New side arm need to be supplied",
  "side_arm_length": 2.0,
  "side_arm_cross_section": 75,
  "side_arm_offset": 15,
  "earth_bus_bar_exists": "Yes",
  "earth_cable_length": 8
}
```

### **Update Antenna #2 (Tubular Section)**
```http
PUT http://localhost:3000/api/new-radio-installations/session-789/antenna/1
Content-Type: application/json

{
  "sector_number": 3,
  "new_or_swap": "Swap",
  "antenna_technology": "5G",
  "azimuth_angle": 180,
  "base_height": 40,
  "tower_leg": "C",
  "tower_leg_section": "Tubular",
  "tubular_dimensions": 200,
  "side_arm": "Use swapped antenna side arm",
  "side_arm_length": 1.8,
  "side_arm_cross_section": 60,
  "side_arm_offset": 12,
  "earth_bus_bar_exists": "No",
  "earth_cable_length": 0
}
```

---

## 🔄 **5. COMPLETE UPDATE (PUT)**

### **Full Data Update**
```http
PUT http://localhost:3000/api/new-radio-installations/session-complete
Content-Type: application/json

{
  "new_sectors_planned": 5,
  "new_radio_units_planned": 3,
  "existing_radio_units_swapped": 2,
  "new_antennas_planned": 3,
  "existing_antennas_swapped": 1,
  "new_fpfh_installed": 2,
  "new_antennas": [
    {
      "antenna_number": 1,
      "sector_number": 1,
      "new_or_swap": "New",
      "antenna_technology": "2G/3G/4G",
      "azimuth_angle": 45,
      "base_height": 30,
      "tower_leg": "A",
      "tower_leg_section": "Angular",
      "angular_dimensions": [150, 200],
      "side_arm": "New side arm need to be supplied",
      "side_arm_length": 2.5,
      "side_arm_cross_section": 80,
      "side_arm_offset": 20,
      "earth_bus_bar_exists": "Yes",
      "earth_cable_length": 10
    },
    {
      "antenna_number": 2,
      "sector_number": 2,
      "new_or_swap": "New",
      "antenna_technology": "4G/5G",
      "azimuth_angle": 135,
      "base_height": 35,
      "tower_leg": "B",
      "tower_leg_section": "Tubular",
      "tubular_dimensions": 180,
      "side_arm": "Use existing empty side arm",
      "earth_bus_bar_exists": "Yes",
      "earth_cable_length": 6
    },
    {
      "antenna_number": 3,
      "sector_number": 3,
      "new_or_swap": "Swap",
      "antenna_technology": "5G",
      "azimuth_angle": 225,
      "base_height": 28,
      "tower_leg": "C",
      "tower_leg_section": "Angular",
      "angular_dimensions": [100, 150],
      "side_arm": "Use swapped antenna side arm",
      "side_arm_length": 1.8,
      "side_arm_cross_section": 65,
      "side_arm_offset": 18,
      "earth_bus_bar_exists": "No",
      "earth_cable_length": 0
    }
  ]
}
```

---

## ❌ **6. VALIDATION Testing**

### **Invalid Sector Number**
```http
PUT http://localhost:3000/api/new-radio-installations/session-789/antenna/0
Content-Type: application/json

{
  "sector_number": 7,
  "azimuth_angle": 90
}
```

**Expected Error Response:**
```json
{
  "error": "Antenna 1: Sector number must be between 1-6"
}
```

### **Invalid Azimuth Angle**
```http
PUT http://localhost:3000/api/new-radio-installations/session-789/antenna/0
Content-Type: application/json

{
  "azimuth_angle": 400
}
```

**Expected Error Response:**
```json
{
  "error": "Antenna 1: Azimuth angle must be between 0-360 degrees"
}
```

### **Invalid Antenna Count**
```http
PUT http://localhost:3000/api/new-radio-installations/session-789/antennas-count
Content-Type: application/json

{
  "new_antennas_planned": 25
}
```

**Expected Error Response:**
```json
{
  "error": "new_antennas_planned must be an integer between 1 and 20"
}
```

---

## 🗑️ **7. DELETE Data**

### **Delete Installation Data**
```http
DELETE http://localhost:3000/api/new-radio-installations/session-789
```

**Expected Response:**
```json
{
  "message": "New radio installations data deleted successfully"
}
```

---

## 🏗️ **8. Frontend Integration Examples**

### **React Hook for Antenna Management**
```javascript
// useNewAntennas.js
import { useState, useEffect } from 'react';

export const useNewAntennas = (sessionId) => {
  const [antennas, setAntennas] = useState([]);
  const [antennaCount, setAntennaCount] = useState(1);
  const [loading, setLoading] = useState(false);

  // Fetch antenna data
  const fetchAntennas = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/new-radio-installations/${sessionId}/antennas-count`);
      const data = await response.json();
      setAntennas(data.new_antennas || []);
      setAntennaCount(data.new_antennas_planned || 1);
    } catch (error) {
      console.error('Error fetching antennas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update antenna count
  const updateAntennaCount = async (count) => {
    try {
      const response = await fetch(`/api/new-radio-installations/${sessionId}/antennas-count`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_antennas_planned: count })
      });
      const data = await response.json();
      setAntennas(data.data.new_antennas);
      setAntennaCount(data.data.new_antennas_planned);
      return data;
    } catch (error) {
      console.error('Error updating antenna count:', error);
      throw error;
    }
  };

  // Update specific antenna
  const updateAntenna = async (index, antennaData) => {
    try {
      const response = await fetch(`/api/new-radio-installations/${sessionId}/antenna/${index}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(antennaData)
      });
      const data = await response.json();
      await fetchAntennas(); // Refresh data
      return data;
    } catch (error) {
      console.error('Error updating antenna:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchAntennas();
    }
  }, [sessionId]);

  return {
    antennas,
    antennaCount,
    loading,
    updateAntennaCount,
    updateAntenna,
    refetch: fetchAntennas
  };
};
```

### **React Component Example**
```jsx
// AntennaConfigForm.jsx
import React from 'react';
import { useNewAntennas } from './useNewAntennas';

const AntennaConfigForm = ({ sessionId }) => {
  const { antennas, antennaCount, updateAntennaCount, updateAntenna } = useNewAntennas(sessionId);

  const handleCountChange = async (count) => {
    try {
      await updateAntennaCount(parseInt(count));
    } catch (error) {
      alert('Error updating antenna count');
    }
  };

  const handleAntennaUpdate = async (index, field, value) => {
    try {
      const updatedData = { [field]: value };
      await updateAntenna(index, updatedData);
    } catch (error) {
      alert('Error updating antenna');
    }
  };

  return (
    <div className="antenna-config-form">
      <div className="count-selector">
        <label>How many new antennas planned?</label>
        <select 
          value={antennaCount} 
          onChange={(e) => handleCountChange(e.target.value)}
        >
          {[...Array(20)].map((_, i) => (
            <option key={i + 1} value={i + 1}>{i + 1}</option>
          ))}
        </select>
      </div>

      {antennas.map((antenna, index) => (
        <div key={index} className="antenna-form">
          <h3>New antenna #{antenna.antenna_number}</h3>
          
          <div className="form-group">
            <label>Sector Number</label>
            <select 
              value={antenna.sector_number || 1}
              onChange={(e) => handleAntennaUpdate(index, 'sector_number', parseInt(e.target.value))}
            >
              {[1,2,3,4,5,6].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>New or swap?</label>
            <div className="radio-group">
              <label>
                <input 
                  type="radio" 
                  name={`new_or_swap_${index}`}
                  value="New"
                  checked={antenna.new_or_swap === 'New'}
                  onChange={(e) => handleAntennaUpdate(index, 'new_or_swap', e.target.value)}
                />
                New
              </label>
              <label>
                <input 
                  type="radio" 
                  name={`new_or_swap_${index}`}
                  value="Swap"
                  checked={antenna.new_or_swap === 'Swap'}
                  onChange={(e) => handleAntennaUpdate(index, 'new_or_swap', e.target.value)}
                />
                Swap
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Azimuth angle shift from zero north direction (degree)</label>
            <input 
              type="number"
              min="0"
              max="360"
              value={antenna.azimuth_angle || 0}
              onChange={(e) => handleAntennaUpdate(index, 'azimuth_angle', parseInt(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label>New antenna base height from tower base level (meter)</label>
            <input 
              type="number"
              min="0"
              step="0.1"
              value={antenna.base_height || 0}
              onChange={(e) => handleAntennaUpdate(index, 'base_height', parseFloat(e.target.value))}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default AntennaConfigForm;
```

---

## 🎯 **Testing Checklist**

### **✅ API Endpoints**
- [ ] GET all installation data
- [ ] GET antenna count only
- [ ] POST create with basic data
- [ ] POST create with antenna details
- [ ] PUT update antenna count
- [ ] PUT update specific antenna
- [ ] PUT complete update
- [ ] DELETE installation data

### **✅ Validation Testing**
- [ ] Invalid sector numbers (< 1 or > 6)
- [ ] Invalid azimuth angles (< 0 or > 360)
- [ ] Invalid antenna counts (< 1 or > 20)
- [ ] Invalid base heights (negative values)
- [ ] Invalid antenna indexes

### **✅ Data Integrity**
- [ ] Auto-generation of antenna structures
- [ ] Proper antenna numbering
- [ ] Array resize on count changes
- [ ] Default values application

### **✅ Edge Cases**
- [ ] Non-existent session handling
- [ ] Empty antenna arrays
- [ ] Partial updates
- [ ] Database connection errors

---

## 🚀 **Production Considerations**

### **Performance Optimizations**
1. **Database Indexing**: Add indexes on session_id
2. **Caching**: Implement Redis for frequent reads
3. **Validation**: Move complex validation to database triggers
4. **Pagination**: For admin endpoints with many records

### **Security Enhancements**
1. **Authentication**: Add JWT token validation
2. **Rate Limiting**: Prevent API abuse
3. **Input Sanitization**: SQL injection prevention
4. **CORS**: Proper cross-origin configuration

### **Monitoring & Logging**
1. **API Metrics**: Response times, error rates
2. **Database Performance**: Query optimization
3. **Error Tracking**: Detailed error logging
4. **Health Checks**: Database connectivity monitoring

This comprehensive API provides robust antenna configuration management with proper validation, error handling, and frontend integration capabilities. 🎯 