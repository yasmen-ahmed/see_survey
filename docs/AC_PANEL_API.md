# AC Panel API Documentation

## Overview
The AC Panel API manages AC panel configurations including dynamic CB/Fuse tables for survey sessions. It features advanced table management with automatic column generation and smart defaults starting with 1 column instead of 10.

## Architecture

### Model Layer (`AcPanel`)
- **Dynamic Table Structure**: JSON-based storage for flexible CB/Fuse data
- **Validation**: Comprehensive validation for all configuration fields
- **Relationships**: Proper foreign key constraints with cascade operations
- **Indexing**: Unique index on session_id for performance

### Service Layer (`AcPanelService`)
- **Dynamic Table Management**: Add/remove CB entries programmatically
- **Smart Defaults**: Starts with 1 entry instead of 10 for better UX
- **Data Transformation**: Handles conversion between API and database formats
- **Advanced Validation**: Business logic validation with detailed error handling

### Route Layer (`acPanelRoutes`)
- **Main Endpoints**: GET/PUT for primary data operations
- **Table Management**: POST/DELETE for dynamic CB/Fuse entry management
- **Consistent Response Format**: Standard success/error response structure
- **Health Check**: Module monitoring with feature listing

## API Endpoints

### Main Data Endpoints

#### GET/PUT `/api/ac-panel/:session_id`

##### GET Request
Retrieves AC panel info for a session. Returns defaults with 1 CB entry if no data exists.

**Response Format:**
```json
{
  "success": true,
  "data": {
    "session_id": "20231201_site123_001",
    "power_cable_config": {
      "length": 25.5,
      "cross_section": 16.0
    },
    "main_cb_config": {
      "rating": 63.0,
      "type": "three_phase"
    },
    "has_free_cbs": true,
    "cb_fuse_data": [
      {
        "id": 1,
        "rating": 16,
        "connected_module": "Lighting Circuit"
      },
      {
        "id": 2,
        "rating": 20,
        "connected_module": "Power Outlets"
      }
    ],
    "free_cb_spaces": 3,
    "metadata": {
      "created_at": "2023-12-01T10:00:00Z",
      "updated_at": "2023-12-01T11:00:00Z",
      "total_cb_entries": 2
    }
  }
}
```

##### PUT Request
Creates or updates AC panel info for a session.

**Request Body Examples:**

1. **Complete AC Panel Configuration:**
```json
{
  "power_cable_config": {
    "length": 30.0,
    "cross_section": 25.0
  },
  "main_cb_config": {
    "rating": 100.0,
    "type": "single_phase"
  },
  "has_free_cbs": true,
  "cb_fuse_data": [
    {
      "id": 1,
      "rating": 16,
      "connected_module": "Lighting"
    },
    {
      "id": 2,
      "rating": 20,
      "connected_module": "Outlets"
    }
  ],
  "free_cb_spaces": 2
}
```

2. **Partial Update (only cable config):**
```json
{
  "power_cable_config": {
    "length": 15.0,
    "cross_section": 10.0
  }
}
```

### Dynamic Table Management Endpoints

#### POST `/api/ac-panel/:session_id/cb-entry`
Adds a new CB/Fuse entry to the table dynamically.

**Response:**
```json
{
  "success": true,
  "data": {
    // ... complete AC panel data with new entry added
    "cb_fuse_data": [
      // ... existing entries
      {
        "id": 3,
        "rating": null,
        "connected_module": ""
      }
    ],
    "metadata": {
      "total_cb_entries": 3
    }
  },
  "message": "New CB/Fuse entry added successfully"
}
```

#### DELETE `/api/ac-panel/:session_id/cb-entry/:entry_id`
Removes a specific CB/Fuse entry by ID.

**Parameters:**
- `session_id`: Session identifier
- `entry_id`: Numeric ID of the CB entry to remove

**Response:**
```json
{
  "success": true,
  "data": {
    // ... complete AC panel data with entry removed
    "metadata": {
      "total_cb_entries": 1
    }
  },
  "message": "CB/Fuse entry removed successfully"
}
```

## Field Specifications

### AC Panel Configuration

| Field | Type | Unit | Validation | Description |
|-------|------|------|------------|-------------|
| `power_cable_config.length` | Number | meters (m) | Positive | Cable length from power meter to AC panel |
| `power_cable_config.cross_section` | Number | mm² | Positive | Cable cross section |
| `main_cb_config.rating` | Number | Amperes (Amp) | Positive | AC panel main CB rating |
| `main_cb_config.type` | Enum | - | `three_phase`\|`single_phase` | Main CB type |
| `has_free_cbs` | Boolean | - | true\|false | Does AC panel have free CBs? |
| `free_cb_spaces` | Integer | - | 1-5 | Number of free spaces for new CBs |

### CB/Fuse Table Data

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `id` | Integer | Unique per session | Auto-generated entry identifier |
| `rating` | Number | Positive or null | CB/Fuse rating in Amperes |
| `connected_module` | String | Any text | Name of connected module/load |

## Smart Default Behavior

### Initial Load (No Data)
```json
{
  "cb_fuse_data": [
    {
      "id": 1,
      "rating": null,
      "connected_module": ""
    }
  ],
  "metadata": {
    "total_cb_entries": 1
  }
}
```

### Auto-Expansion Logic
- Starts with **1 column** instead of 10 for better UX
- Automatically adds new entries when user starts typing in the last row
- Removes empty entries when saving (keeps at least 1)
- Maintains unique IDs for frontend tracking

## Frontend Integration Examples

### 1. Load Data and Build Dynamic Table
```javascript
// GET request to load AC panel data
const response = await fetch(`/api/ac-panel/${sessionId}`);
const result = await response.json();

if (result.success) {
  const data = result.data;
  
  // Build dynamic table
  buildCBTable(data.cb_fuse_data);
  
  // Populate other fields
  document.getElementById('cable_length').value = data.power_cable_config?.length || '';
  document.getElementById('main_cb_rating').value = data.main_cb_config?.rating || '';
  document.getElementById('has_free_cbs').checked = data.has_free_cbs === true;
}

function buildCBTable(cbData) {
  const tableBody = document.getElementById('cb-table-body');
  tableBody.innerHTML = '';
  
  cbData.forEach((entry, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>
        <input type="number" 
               value="${entry.rating || ''}" 
               data-id="${entry.id}"
               data-field="rating"
               onchange="updateCBEntry(this)">
      </td>
      <td>
        <input type="text" 
               value="${entry.connected_module || ''}" 
               data-id="${entry.id}"
               data-field="connected_module"
               onchange="updateCBEntry(this)">
      </td>
      <td>
        <button onclick="removeCBEntry(${entry.id})" 
                ${cbData.length === 1 ? 'disabled' : ''}>
          Remove
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}
```

### 2. Add New CB Entry Dynamically
```javascript
async function addNewCBEntry() {
  try {
    const response = await fetch(`/api/ac-panel/${sessionId}/cb-entry`, {
      method: 'POST'
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Rebuild table with new entry
      buildCBTable(result.data.cb_fuse_data);
      showNotification('New CB entry added successfully');
    }
  } catch (error) {
    showError('Failed to add new CB entry');
  }
}
```

### 3. Remove CB Entry
```javascript
async function removeCBEntry(entryId) {
  try {
    const response = await fetch(`/api/ac-panel/${sessionId}/cb-entry/${entryId}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Rebuild table without removed entry
      buildCBTable(result.data.cb_fuse_data);
      showNotification('CB entry removed successfully');
    }
  } catch (error) {
    showError('Failed to remove CB entry');
  }
}
```

### 4. Save Complete Form Data
```javascript
async function saveACPanelData() {
  // Collect CB/Fuse data from table
  const cbData = [];
  document.querySelectorAll('#cb-table-body tr').forEach((row, index) => {
    const ratingInput = row.querySelector('[data-field="rating"]');
    const moduleInput = row.querySelector('[data-field="connected_module"]');
    
    cbData.push({
      id: parseInt(ratingInput.dataset.id),
      rating: parseFloat(ratingInput.value) || null,
      connected_module: moduleInput.value || ''
    });
  });
  
  const formData = {
    power_cable_config: {
      length: parseFloat(document.getElementById('cable_length').value) || null,
      cross_section: parseFloat(document.getElementById('cable_cross_section').value) || null
    },
    main_cb_config: {
      rating: parseFloat(document.getElementById('main_cb_rating').value) || null,
      type: document.getElementById('main_cb_type').value || null
    },
    has_free_cbs: document.getElementById('has_free_cbs').checked,
    cb_fuse_data: cbData,
    free_cb_spaces: parseInt(document.getElementById('free_cb_spaces').value) || null
  };
  
  const response = await fetch(`/api/ac-panel/${sessionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData)
  });
  
  const result = await response.json();
  if (result.success) {
    showNotification('AC panel data saved successfully');
  }
}
```

## Database Schema

```sql
CREATE TABLE ac_panel (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  power_cable_config JSON DEFAULT NULL,
  main_cb_config JSON DEFAULT NULL,
  has_free_cbs BOOLEAN DEFAULT NULL,
  cb_fuse_data JSON DEFAULT ('[]'),
  free_cb_spaces INT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES survey(session_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT check_free_cb_spaces CHECK (free_cb_spaces BETWEEN 1 AND 5)
);
```

## Advanced Features

### 1. Smart Column Management
- **Default**: Starts with 1 entry instead of overwhelming 10 columns
- **Auto-Add**: Detects when user needs more entries
- **Auto-Remove**: Cleans up empty entries on save
- **Minimum Guarantee**: Always maintains at least 1 entry

### 2. Data Persistence
- **Incremental Updates**: Only saves changed data
- **Atomic Operations**: All table changes are transactional
- **Version Tracking**: Maintains created/updated timestamps

### 3. Validation Layers
- **Frontend**: Real-time validation as user types
- **API**: Request validation before processing
- **Database**: Schema-level constraints
- **Business Logic**: Domain-specific rules in service layer

## Performance Considerations

- **JSON Storage**: Efficient for variable-length table data
- **Indexed Lookups**: Fast session-based queries
- **Minimal Payloads**: Only sends changed data
- **Connection Pooling**: Optimized database connections

## Health Check

```http
GET /api/ac-panel/health/check
```

**Response:**
```json
{
  "success": true,
  "module": "ac-panel",
  "status": "healthy",
  "timestamp": "2023-12-01T12:00:00.000Z",
  "features": [
    "dynamic_table_management",
    "cb_fuse_configuration", 
    "auto_column_generation"
  ]
}
``` 