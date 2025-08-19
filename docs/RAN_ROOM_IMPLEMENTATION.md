# RAN Room Implementation

This document describes the implementation of the RAN Room functionality based on the requirements from the image.

## Overview

The RAN Room module has been implemented to capture specific information about RAN equipment and installation requirements. The implementation includes:

1. **Database Schema**: New tables for RAN room data and images
2. **Backend API**: Complete CRUD operations with image upload support
3. **Frontend Form**: Updated form with new questions from the image
4. **Services**: Business logic for data management

## Database Changes

### New Tables Created

1. **`ran_room`** - Main table for RAN room data
   - `session_id` (VARCHAR, UNIQUE) - Links to survey session
   - `number_of_cabinets` (INTEGER) - Number of cabinets available
   - `ran_equipment_vendor` (JSON) - Array of selected vendors
   - `free_slots_in_existing_ran_racks` (ENUM) - Yes/No for free slots
   - `type_of_rack_with_free_slots` (JSON) - Array of rack types
   - `more_than_one_location_available` (JSON) - Array of available locations
   - `length_of_transmission_cable` (DECIMAL) - Cable length in meters
   - `ran_equipment_data` (JSON) - Additional BTS table data
   - `created_at`, `updated_at` (DATETIME) - Timestamps

2. **`ran_room_images`** - Table for image uploads
   - `session_id` (VARCHAR) - Links to survey session
   - `image_category` (VARCHAR) - Type of image
   - `original_filename`, `stored_filename` (VARCHAR) - File management
   - `file_path`, `file_url` (TEXT) - File storage paths
   - `file_size`, `mime_type` (VARCHAR) - File metadata
   - `description`, `metadata` (TEXT, JSON) - Additional info
   - `is_active` (BOOLEAN) - Soft delete support
   - `created_at`, `updated_at` (TIMESTAMP) - Timestamps

## API Endpoints

### Main Endpoints

- `GET /api/ran-room/:session_id` - Get RAN room data
- `PUT /api/ran-room/:session_id` - Create/update RAN room data
- `DELETE /api/ran-room/:session_id` - Delete RAN room data

### Supporting Endpoints

- `GET /api/ran-room/:session_id/summary` - Get summary data
- `GET /api/ran-room/:session_id/cabinet-options` - Get cabinet options
- `GET /api/ran-room/options/vendors-models` - Get dropdown options
- `GET /api/ran-room/:session_id/technology-options` - Get technology options
- `GET /api/ran-room/:session_id/image-stats` - Get image statistics
- `DELETE /api/ran-room/images/:imageId` - Delete specific image
- `GET /api/ran-room/health/check` - Health check

## Frontend Changes

### New Form Fields (from image)

1. **RAN equipment vendor** (Checkbox)
   - Options: Nokia, Ericsson, Huawei, ZTE, Other

2. **Free slots in existing RAN racks** (Radio Button)
   - Options: Yes, No

3. **Type of rack with free slots** (Checkbox)
   - Options: Open 19" rack, Closed 19" rack, Other

4. **More than one location available** (Checkbox)
   - Options: Wall mount, In existing rack, New rack, Other

5. **Length of transmission cable** (Number input)
   - Unit: meters
   - Step: 0.1

### BTS Table Integration

The existing BTS table functionality has been preserved and integrated into the new structure:

- BTS count selection
- Dynamic BTS table with auto-fill functionality
- Technology options per BTS
- Cabinet assignment
- Vendor and model information
- Status tracking
- Transmission cable details
- Backhauling destination

## File Structure

```
see_survey_backend/
├── db/migrations/
│   └── create-ran-room-table.sql          # Database migration
├── models/
│   └── RanRomm.js                         # Updated model
├── services/
│   ├── RanRoomService.js                  # Business logic
│   └── RanRoomImageService.js             # Image management
├── routes/
│   └── ranRoomRoutes.js                   # API endpoints
├── scripts/
│   └── run-ran-room-migration.js          # Migration script
└── index.js                               # Updated with new routes

see_survey_frontend/
└── src/Components/forms/Room/
    └── RanFrom.jsx                        # Updated form
```

## Setup Instructions

### 1. Run Database Migration

```bash
cd see_survey_backend
node scripts/run-ran-room-migration.js
```

### 2. Restart Backend Server

```bash
cd see_survey_backend
npm start
```

### 3. Test Frontend

The frontend form will now include the new RAN room questions at the top, followed by the existing BTS table functionality.

## API Usage Examples

### Create/Update RAN Room Data

```javascript
const formData = new FormData();
const payload = {
  ran_equipment_vendor: ['Nokia', 'Ericsson'],
  free_slots_in_existing_ran_racks: 'Yes',
  type_of_rack_with_free_slots: ['Open 19" rack'],
  more_than_one_location_available: ['In existing rack', 'New rack'],
  length_of_transmission_cable: 25.5,
  ran_equipment_data: {
    how_many_base_band_onsite: 2,
    bts_table: [...]
  }
};

formData.append('data', JSON.stringify(payload));
// Add image files if any

await axios.put('/api/ran-room/session123', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

### Get RAN Room Data

```javascript
const response = await axios.get('/api/ran-room/session123');
const data = response.data.data;
```

## Validation Rules

- Session ID is required and must be unique
- Number of cabinets must be between 1 and 10
- Length of transmission cable must be a positive number
- BTS count must be between 0 and 10
- All array fields default to empty arrays
- Image uploads support multiple categories

## Error Handling

The API includes comprehensive error handling for:
- Validation errors (400)
- Not found errors (404)
- Duplicate errors (409)
- Internal server errors (500)

All errors return structured JSON responses with error type and message.

## Future Enhancements

1. **Technology Options Integration**: Connect to Site Information for dynamic technology options
2. **Cabinet Sync**: Real-time sync with outdoor cabinets table
3. **Image Validation**: Add file type and size validation
4. **Bulk Operations**: Support for bulk data operations
5. **Export Functionality**: Add RAN room data to export features 