# 🎯 Radio Units API - Complete Guide & Postman Examples

## 📋 **API Endpoints Overview**

| Method | Endpoint | Description |
|--------|----------|-------------|
| **GET** | `/api/radio-units/:session_id` | Get radio units data |
| **GET** | `/api/radio-units/relations/:session_id` | Get cabinet numbers, DC CB/fuse options & External DC PDU ratings |
| **GET** | `/api/radio-units/cabinet-dc-options/:session_id/:cabinet_number` | Get DC options for specific cabinet |
| **POST** | `/api/radio-units/:session_id` | Create radio units data |
| **PUT** | `/api/radio-units/:session_id` | Update radio units data |
| **PUT** | `/api/radio-units/:session_id/unit/:unit_index` | Update specific radio unit |
| **DELETE** | `/api/radio-units/:session_id` | Delete radio units data |

---

## 🚀 **1. Get Enhanced Relations (Cabinet Numbers & DC Options & PDU Ratings)**

**🎯 This is the MASTER endpoint that gets ALL relation data!**

**GET** `http://localhost:3000/api/radio-units/relations/2025-06-10T13:19:14.277Zsite1`

**Response:**
```json
{
  "session_id": "2025-06-10T13:19:14.277Zsite1",
  "cabinet_numbers": [
    {
      "cabinet_number": 1,
      "display_text": "Cabinet 1",
      "value": "cabinet_1"
    },
    {
      "cabinet_number": 2,
      "display_text": "Cabinet 2", 
      "value": "cabinet_2"
    }
  ],
  "dc_cb_fuse_options": [
    {
      "source": "External DC PDU",
      "pdu_number": 1,
      "cb_fuse": "Fuse_32A",
      "display_text": "External DC PDU #1 - Fuse_32A",
      "value": "external_pdu_1_Fuse_32A",
      "cabinet_ref": "1-BLVD-0",
      "model": "Nokia FPFH"
    },
    {
      "source": "Cabinet BLVD",
      "cabinet_number": 1,
      "distribution_type": "BLVD",
      "distribution_index": 0,
      "rating": 2,
      "connected_load": "dd",
      "display_text": "Cabinet 1 - BLVD 1 (2A, dd)",
      "value": "cabinet_1_blvd_0"
    }
  ],
  "external_dc_pdu_ratings": [
    {
      "pdu_number": 1,
      "pdu_id": "pdu_1",
      "dc_distribution_model": "Nokia FPFH",
      "dc_distribution_location": "On ground level",
      "dc_feed_distribution_type": "BLVD",
      "dc_feed_cabinet": "1-BLVD-0",
      "dc_feed_cb_fuse": "Fuse_32A",
      "dc_feed_cable_length": 25,
      "dc_feed_cable_cross_section": 4,
      "is_shared_panel": "No",
      "has_free_cbs_fuses": "Yes",
      "ratings": [
        {
          "rating_index": -1,
          "rating_value": "Fuse_32A",
          "rating_type": "Main Feed",
          "connected_load": "",
          "display_text": "Main Feed - Fuse_32A",
          "value": "pdu_1_main_feed",
          "is_main": true
        },
        {
          "rating_index": 0,
          "rating_value": "16A",
          "rating_type": "Fuse",
          "connected_load": "Radio Unit 1",
          "display_text": "Fuse 16A (Radio Unit 1)",
          "value": "pdu_1_rating_0"
        }
      ]
    }
  ],
  "metadata": {
    "total_cabinets": 2,
    "total_dc_options": 5,
    "total_pdu_ratings": 1,
    "generated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## 🎯 **2. Get Cabinet-Specific DC Options + External DC PDU Ratings (ENHANCED!)**

**🎯 When user selects Cabinet 1, this returns Cabinet 1 options PLUS related External DC PDU ratings!**

**GET** `http://localhost:3000/api/radio-units/cabinet-dc-options/2025-06-10T13:19:14.277Zsite1/1`

**Response:**
```json
{
  "session_id": "2025-06-10T13:19:14.277Zsite1",
  "cabinet_number": 1,
  "cabinet_name": "Cabinet 1",
  "dc_options": [
    {
      "source": "BLVD",
      "distribution_type": "BLVD",
      "distribution_index": 0,
      "field_number": 1,
      "rating": 2,
      "connected_load": "dd",
      "display_text": "BLVD 1 - 2A (dd)",
      "value": "cabinet_1_blvd_0"
    },
    {
      "source": "LLVD",
      "distribution_type": "LLVD",
      "distribution_index": 0,
      "field_number": 1,
      "rating": 0,
      "connected_load": "test",
      "display_text": "LLVD 1 - 0A (test)",
      "value": "cabinet_1_llvd_0"
    },
    {
      "source": "PDU",
      "distribution_type": "PDU",
      "distribution_index": 0,
      "field_number": 1,
      "rating": 0,
      "connected_load": "dd",
      "display_text": "PDU 1 - 0A (dd)",
      "value": "cabinet_1_pdu_0"
    },
    {
      "source": "External DC PDU",
      "distribution_type": "External PDU",
      "pdu_number": 1,
      "rating": "Fuse_32A",
      "connected_load": "Main Feed",
      "display_text": "External PDU #1 - Fuse_32A (Main Feed)",
      "value": "external_pdu_1_main_feed"
    },
    {
      "source": "External DC PDU",
      "distribution_type": "External PDU",
      "pdu_number": 1,
      "rating": "16A",
      "connected_load": "Radio Unit 1",
      "display_text": "External PDU #1 - Fuse 16A (Radio Unit 1)",
      "value": "pdu_1_rating_0"
    }
  ],
  "external_dc_pdu_ratings": [
    {
      "pdu_number": 1,
      "pdu_id": "pdu_1",
      "dc_distribution_model": "Nokia FPFH",
      "dc_distribution_location": "On ground level",
      "dc_feed_distribution_type": "BLVD",
      "dc_feed_cabinet": "1-BLVD-0",
      "dc_feed_cb_fuse": "Fuse_32A",
      "dc_feed_cable_length": 25,
      "dc_feed_cable_cross_section": 4,
      "is_shared_panel": "No",
      "has_free_cbs_fuses": "Yes",
      "ratings": [
        {
          "rating_index": -1,
          "rating_value": "Fuse_32A",
          "rating_type": "Main Feed",
          "connected_load": "",
          "display_text": "Main Feed - Fuse_32A",
          "value": "pdu_1_main_feed",
          "is_main": true
        },
        {
          "rating_index": 0,
          "rating_value": "16A",
          "rating_type": "Fuse",
          "connected_load": "Radio Unit 1",
          "display_text": "Fuse 16A (Radio Unit 1)",
          "value": "pdu_1_rating_0"
        },
        {
          "rating_index": 1,
          "rating_value": "20A",
          "rating_type": "Fuse",
          "connected_load": "Radio Unit 2",
          "display_text": "Fuse 20A (Radio Unit 2)",
          "value": "pdu_1_rating_1"
        }
      ],
      "cabinet_relation": {
        "has_relation": true,
        "relation_type": "new_format",
        "cabinet_number": 1,
        "distribution_type": "BLVD",
        "distribution_index": 0,
        "reference": "1-BLVD-0"
      }
    }
  ],
  "metadata": {
    "cabinet_dc_counts": {
      "total_blvd": 3,
      "total_llvd": 3,
      "total_pdu": 2
    },
    "external_dc_counts": {
      "total_related_pdus": 1,
      "total_pdu_ratings": 3
    },
    "total_options": 8
  }
}
```

**🎯 Key Features:**
- ✅ **Cabinet BLVD/LLVD/PDU options**
- ✅ **External DC PDU ratings filtered by cabinet**
- ✅ **Combined in `dc_options` for dropdown**
- ✅ **Detailed PDU info in `external_dc_pdu_ratings`**
- ✅ **Cabinet relation detection (new/legacy formats)**

---

## 🎯 **3. Create Radio Units with Nokia Port Connectivity**

**POST** `http://localhost:3000/api/radio-units/2025-06-10T13:19:14.277Zsite1`

**Request Body:**
```json
{
  "radio_unit_count": 2,
  "radio_units": [
    {
      "operator": "Operator 1",
      "base_height": 20,
      "tower_leg": "A",
      "vendor": "Nokia",
      "nokia_model": "AAOA",
      "nokia_ports": "4",
      "nokia_port_connectivity": [
        {
          "sector": 1,
          "antenna": 1,
          "jumper_length": 15
        },
        {
          "sector": 2,
          "antenna": 2,
          "jumper_length": 18
        },
        {
          "sector": 3,
          "antenna": 3,
          "jumper_length": 12
        },
        {
          "sector": 1,
          "antenna": 4,
          "jumper_length": 20
        }
      ],
      "other_vendor_model": "",
      "other_length": 0,
      "other_width": 0,
      "other_depth": 0,
      "radio_unit_side_arm": "A",
      "radio_unit_side_arm_length": 0,
      "radio_unit_side_arm_diameter": 0,
      "radio_unit_side_arm_offset": 0,
      "dc_power_source": "cabinet_1",
      "dc_cb_fuse": "cabinet_1_blvd_0",
      "dc_power_cable_length": 25,
      "dc_power_cable_cross_section": 4,
      "fiber_cable_length": 50,
      "jumper_length_antenna_radio": "1 to 15",
      "feeder_type": "7/8 inch",
      "feeder_length": 30,
      "swap_upgrade_plan": "Yes",
      "earth_cable_length": 10
    }
  ]
}
```

---

## 📊 **4. Understanding the Enhanced Relationship Architecture**

### **🏗️ How Cabinet Selection Logic Works:**

#### **Frontend Flow:**
```javascript
// 1. Load initial relations (all data)
const relations = await fetch('/api/radio-units/relations/session_id');

// 2. User selects cabinet from dropdown
const selectedCabinet = 1;

// 3. Load cabinet-specific DC options
const cabinetOptions = await fetch(`/api/radio-units/cabinet-dc-options/session_id/${selectedCabinet}`);

// 4. Populate DC CB/Fuse dropdown with cabinet-specific options
updateDcCbFuseDropdown(cabinetOptions.dc_options);
```

#### **Data Sources:**

1. **Cabinet Numbers** → From `outdoor_cabinets.number_of_cabinets`
2. **External DC PDU Ratings** → From `external_dc_distribution.dc_pdus` (ALL ratings data)
3. **Cabinet DC Options** → From `outdoor_cabinets.cabinets[x].{blvdCBsRatings, llvdCBsRatings, pduCBsRatings}`

---

## 🎯 **5. Frontend Integration Examples**

### **React Component with Cabinet Selection Logic:**
```jsx
const RadioUnitsForm = ({ sessionId }) => {
  const [relations, setRelations] = useState({});
  const [selectedCabinet, setSelectedCabinet] = useState('');
  const [cabinetDcOptions, setCabinetDcOptions] = useState([]);
  const [radioUnits, setRadioUnits] = useState([]);

  useEffect(() => {
    // Load initial relations (cabinet numbers + external DC PDU ratings)
    fetch(`/api/radio-units/relations/${sessionId}`)
      .then(res => res.json())
      .then(data => setRelations(data));
  }, [sessionId]);

  const handleCabinetChange = async (cabinetNumber) => {
    setSelectedCabinet(cabinetNumber);
    
    if (cabinetNumber) {
      // Load cabinet-specific DC options
      const response = await fetch(`/api/radio-units/cabinet-dc-options/${sessionId}/${cabinetNumber}`);
      const data = await response.json();
      setCabinetDcOptions(data.dc_options || []);
    } else {
      setCabinetDcOptions([]);
    }
  };

  return (
    <form>
      {/* Cabinet Selection */}
      <select 
        value={selectedCabinet} 
        onChange={(e) => handleCabinetChange(e.target.value)}
      >
        <option value="">Select Cabinet...</option>
        {relations.cabinet_numbers?.map(cabinet => (
          <option key={cabinet.value} value={cabinet.cabinet_number}>
            {cabinet.display_text}
          </option>
        ))}
      </select>

      {/* DC CB/Fuse Selection - Filtered by Cabinet */}
      <select name="dc_cb_fuse" disabled={!selectedCabinet}>
        <option value="">Select DC CB/Fuse...</option>
        {cabinetDcOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.display_text}
          </option>
        ))}
      </select>

      {/* External DC PDU Ratings Display */}
      <div>
        <h3>Available External DC PDU Ratings:</h3>
        {relations.external_dc_pdu_ratings?.map(pdu => (
          <div key={pdu.pdu_id}>
            <h4>PDU #{pdu.pdu_number} ({pdu.dc_distribution_model})</h4>
            <ul>
              {pdu.ratings.map(rating => (
                <li key={rating.value}>
                  {rating.display_text}
                  {rating.is_main && <strong> (Main Feed)</strong>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Nokia Port Connectivity */}
      {radioUnit.nokia_port_connectivity?.map((conn, index) => (
        <div key={index}>
          <select value={conn.sector}>
            <option value="">Select Sector...</option>
            {[1,2,3,4,5].map(num => (
              <option key={num} value={num}>Sector {num}</option>
            ))}
          </select>
          
          <select value={conn.antenna}>
            <option value="">Select Antenna...</option>
            {[...Array(15)].map((_, i) => (
              <option key={i+1} value={i+1}>Antenna {i+1}</option>
            ))}
          </select>
          
          <input 
            type="number" 
            value={conn.jumper_length}
            placeholder="Jumper Length (m)"
          />
        </div>
      ))}
    </form>
  );
};
```

---

## 🚀 **6. Testing Sequence in Postman**

### **Step 1: Setup Data**
1. Create outdoor cabinets with BLVD/LLVD/PDU data
2. Create external DC distribution with PDUs and ratings

### **Step 2: Test Enhanced Relations**
```
GET /api/radio-units/relations/your-session-id
```

### **Step 3: Test Cabinet-Specific Options**
```
GET /api/radio-units/cabinet-dc-options/your-session-id/1
GET /api/radio-units/cabinet-dc-options/your-session-id/2
```

### **Step 4: Create Radio Units**
```
POST /api/radio-units/your-session-id
```

---

## 🎯 **7. Key Features Implemented**

✅ **Cabinet Numbers from Outdoor Cabinets**  
✅ **External DC PDU Ratings (ALL data)**  
✅ **Cabinet-Specific DC Options**  
✅ **Nokia Port Connectivity Array**  
✅ **Cascading Frontend Logic**  
✅ **Performance Optimized**  

## 📈 **Enhanced Performance Benefits**

1. **Two-Step Loading:** Initial relations + cabinet-specific options
2. **Reduced Data Transfer:** Only load cabinet options when needed
3. **Complete PDU Data:** All External DC PDU ratings available
4. **Smart Filtering:** Frontend can easily filter by cabinet selection
5. **Senior Architecture:** Proper separation with optimal API design

This enhanced architecture provides **complete cabinet relation handling** exactly as you requested! 🎯 