# 📸 Survey Images Management System

## 🏗️ Architecture Overview

The Survey Images Management System is designed as a **universal, scalable solution** for handling images across all survey forms. It uses a single table approach with smart categorization and file organization.

### 🎯 Key Design Principles

- **Single Source of Truth**: One table (`survey_images`) for all image storage
- **Flexible Association**: Images can link to any table via `table_name` + `record_index`
- **Organized Storage**: Files organized in folders by table type
- **Scalable**: Supports unlimited image categories and table types
- **Performance**: Optimized indexes for fast queries
- **Safety**: Soft delete + file cleanup mechanisms

## 📊 Database Schema

```sql
Table: survey_images
├── id (Primary Key)
├── session_id (Links to survey session)
├── table_name (Which form: 'antenna_structure', 'new_radio_units', etc.)
├── record_id (Database ID of the specific record)
├── record_index (Index for tables like antenna_index, fpfh_index)
├── image_category (Type of photo: 'structure_general_photo', etc.)
├── original_filename (User's original filename)
├── stored_filename (Unique server filename)
├── file_path (Full server file path)
├── file_url (Public URL to access image)
├── file_size (Size in bytes)
├── mime_type (image/jpeg, image/png, etc.)
├── image_width, image_height (Optional dimensions)
├── description (Optional user description)
├── metadata (JSON for additional data)
├── is_active (Soft delete flag)
└── created_at, updated_at (Timestamps)
```

## 🗂️ File Organization

```
uploads/
├── antenna_structure/     # Antenna Structure Form images
├── mw_antenna/           # MW Antenna images
├── external_dc_pdus/     # External DC PDUs images
├── radio_antennas/       # Radio Antennas images
├── radio_units/          # Radio Units images
├── new_antennas/         # New Antennas images
├── new_radio_units/      # New Radio Units images
├── new_fpfhs/           # New FPFHs images
└── general_survey/       # General survey images
```

## 🔗 Image Association Patterns

### Pattern 1: Session-Level Images
For general photos not tied to specific equipment:
```json
{
  "session_id": "12345",
  "table_name": "general_survey",
  "record_id": null,
  "record_index": null,
  "image_category": "structure_general_photo"
}
```

### Pattern 2: Table-Level Images  
For images tied to a specific form but not indexed records:
```json
{
  "session_id": "12345", 
  "table_name": "antenna_structure",
  "record_id": 15,
  "record_index": null,
  "image_category": "building_photo"
}
```

### Pattern 3: Indexed Records Images
For tables with multiple items (antennas, radio units, FPFHs):
```json
{
  "session_id": "12345",
  "table_name": "new_radio_units", 
  "record_id": 25,
  "record_index": 2,
  "image_category": "radio_unit_1_photo"
}
```

## 🌐 API Endpoints

### Upload Endpoints

#### Upload Single Image
```
POST /api/images/upload/single
Content-Type: multipart/form-data

Fields:
- image: (file) Image file
- session_id: (string) Survey session ID
- table_name: (string) Table name (antenna_structure, new_radio_units, etc.)
- record_id: (number, optional) Database record ID
- record_index: (number, optional) Record index (antenna_index, fpfh_index, etc.)
- image_category: (string) Photo category
- description: (string, optional) Description
```

#### Upload Multiple Images
```
POST /api/images/upload/multiple  
Content-Type: multipart/form-data

Fields:
- images: (files) Multiple image files
- session_id: (string) Survey session ID
- table_name: (string) Table name
- record_id: (number, optional) Database record ID
- record_index: (number, optional) Record index
- image_category: (string) Photo category (same for all)
- description: (string, optional) Description (same for all)
```

### Retrieval Endpoints

#### Get All Session Images
```
GET /api/images/session/:session_id

Response:
{
  "session_id": "12345",
  "total_images": 15,
  "tables": {
    "new_radio_units": {
      "radio_unit_1_photo": [image1, image2],
      "antenna_1_photo": [image3]
    },
    "antenna_structure": {
      "structure_general_photo": [image4, image5]
    }
  },
  "images": [array of all images]
}
```

#### Get Images for Specific Table
```
GET /api/images/session/:session_id/table/:table_name?record_index=1

Response:
{
  "session_id": "12345",
  "table_name": "new_radio_units",
  "record_index": 1,
  "images": [array of images],
  "total_images": 5
}
```

#### Get Images Grouped by Category
```
GET /api/images/session/:session_id/table/:table_name/grouped?record_index=1

Response:
{
  "session_id": "12345",
  "table_name": "new_radio_units", 
  "record_index": 1,
  "images_by_category": {
    "radio_unit_1_photo": [image1, image2],
    "antenna_1_photo": [image3]
  },
  "total_categories": 2
}
```

### Management Endpoints

#### Get Specific Image
```
GET /api/images/:image_id
```

#### Update Image Metadata
```
PUT /api/images/:image_id
Content-Type: application/json

{
  "description": "Updated description",
  "metadata": {"location": "Tower A", "angle": "North"}
}
```

#### Delete Image (Soft Delete)
```
DELETE /api/images/:image_id
```

#### Search Images with Filters
```
GET /api/images/search?session_id=12345&table_name=new_radio_units&image_category=radio_unit_1_photo
```

## 📋 Image Categories

Based on your photos list, here are the predefined categories:

### Structure Photos
- `structure_general_photo`
- `structure_legs_photo`  
- `building_photo`
- `north_direction_view`

### Equipment Photos  
- `antenna_1_photo`, `antenna_1_mechanical_tilt_photo`, `antenna_1_ret_photo`
- `antenna_1_label`, `antenna_1_port_photo`, `antenna_1_free_ports_photo`
- `radio_unit_1_photo`
- `fpfh_1_photo` 
- `pdu_1_photo`

### Infrastructure
- `cables_route_photo_from_tower_top_1_2`
- `cables_route_photo_from_tower_top_2_2`
- `mw_antenna_1_photo`
- `existing_pdu_power_cables_photos`

### Panoramic Views
- `rf_panorama_photos_1_12` through `rf_panorama_photos_12_12`

### Feeder Photos
- `existing_feeder_photo_1_2`, `existing_feeder_photo_2_2`
- `existing_feeder_connector_photos_1_2`, `existing_feeder_connector_photos_2_2`

### General
- `general_photo`
- `custom_photo`

## 🧪 Testing Examples

### Example 1: Upload Radio Unit Photo
```bash
curl -X POST http://localhost:3000/api/images/upload/single \
  -F "image=@radio_unit_photo.jpg" \
  -F "session_id=12345" \
  -F "table_name=new_radio_units" \
  -F "record_index=1" \
  -F "image_category=radio_unit_1_photo" \
  -F "description=Radio unit installation photo"
```

### Example 2: Upload Multiple Antenna Structure Photos
```bash
curl -X POST http://localhost:3000/api/images/upload/multiple \
  -F "images=@structure1.jpg" \
  -F "images=@structure2.jpg" \
  -F "session_id=12345" \
  -F "table_name=antenna_structure" \
  -F "image_category=structure_general_photo"
```

### Example 3: Get All FPFH Photos for Session
```bash
curl "http://localhost:3000/api/images/session/12345/table/new_fpfhs/grouped"
```

## ⚡ Benefits of This Design

### 1. **Universal Storage**
- Single table handles all survey forms
- No need for separate image tables per form
- Consistent API across all forms

### 2. **Flexible Associations**
- Can link images to any table/record
- Supports both indexed (antenna_index) and non-indexed records
- Session-level images for general photos

### 3. **Scalable Architecture**
- Easy to add new table types
- Easy to add new image categories
- Optimized database indexes for performance

### 4. **Organized File Management**
- Files organized by table type in separate folders
- Unique filenames prevent conflicts
- Direct URL access to images

### 5. **Rich Metadata Support**
- Flexible JSON metadata field
- File size and dimension tracking
- Soft delete with audit trail

### 6. **Production Ready**
- Error handling and validation
- File size and type restrictions
- Automatic cleanup on failures

## 🔧 Technical Implementation

### File Handling
- **Storage**: Memory-based upload with custom file saving
- **Validation**: File type, size, and format validation
- **Security**: Unique filename generation to prevent conflicts
- **Cleanup**: Automatic file cleanup on database failures

### Database Optimization
- **Indexes**: Optimized for common query patterns
- **Constraints**: Proper foreign key relationships
- **Performance**: Efficient queries with proper WHERE clauses

### API Design
- **RESTful**: Standard HTTP methods and status codes
- **Consistent**: Uniform response format across endpoints  
- **Flexible**: Multiple ways to query and filter data
- **Error Handling**: Comprehensive error messages

This system provides a robust, scalable foundation for managing images across all survey forms! 🎉 