# Gallery Feature Documentation

## Overview

The Gallery feature provides a comprehensive view of all images uploaded during a survey session, organized by sections and categories. It displays images in a grid layout with detailed information and interactive features.

## Features

- **Organized by Sections**: Images are grouped by survey sections (General Site, Antenna Structure, Radio Units, etc.)
- **Category Grouping**: Within each section, images are further organized by categories
- **Image Preview**: Click to view images in a modal with full details
- **Download Functionality**: Download individual images
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Graceful handling of missing images and API errors

## Backend API

### Endpoints

#### 1. Get All Images for Session
```
GET /api/gallery/:sessionId
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session_id": "session_123",
    "sections": {
      "general_site": {
        "section_name": "General Site Photos",
        "images": {
          "site_entrance": [
            {
              "id": 1,
              "category": "site_entrance",
              "original_filename": "entrance.jpg",
              "stored_filename": "site_entrance_123.jpg",
              "file_url": "http://localhost:3000/uploads/site_images/site_entrance_123.jpg",
              "file_size": 1024000,
              "mime_type": "image/jpeg",
              "description": "Main site entrance",
              "created_at": "2024-01-15T10:30:00Z",
              "upload_date": "2024-01-15T10:30:00Z"
            }
          ]
        }
      }
    }
  }
}
```

#### 2. Get Images for Specific Section
```
GET /api/gallery/:sessionId/:section
```

**Parameters:**
- `sessionId`: The survey session ID
- `section`: Section key (e.g., `general_site`, `antenna_structure`, `radio_units`)

**Response:**
```json
{
  "success": true,
  "data": {
    "session_id": "session_123",
    "section": "general_site",
    "images": [
      {
        "id": 1,
        "image_category": "site_entrance",
        "original_filename": "entrance.jpg",
        "stored_filename": "site_entrance_123.jpg",
        "file_url": "http://localhost:3000/uploads/site_images/site_entrance_123.jpg",
        "file_size": 1024000,
        "mime_type": "image/jpeg",
        "description": "Main site entrance",
        "created_at": "2024-01-15T10:30:00Z",
        "upload_date": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

### Supported Sections

1. **General Site Photos** (`general_site`)
   - Categories: site_entrance, site_id_picture, site_map_snapshot, site_environment, building_stairs_lift, roof_entrance, base_station_shelter, site_name_shelter, crane_access_street, crane_location

2. **Antenna Structure** (`antenna_structure`)
   - Categories: Various antenna structure image categories

3. **Antennas** (`antennas`)
   - Categories: Various antenna image categories

4. **Radio Units** (`radio_units`)
   - Categories: Various radio unit image categories

5. **DC Power System** (`dc_power_system`)
   - Categories: Various DC power system image categories

6. **Outdoor General Layout** (`outdoor_general_layout`)
   - Categories: Various outdoor layout image categories

7. **Outdoor Cabinets** (`outdoor_cabinets`)
   - Categories: Various outdoor cabinet image categories

8. **AC Connection** (`ac_connection`)
   - Categories: Various AC connection image categories

9. **AC Panel** (`ac_panel`)
   - Categories: Various AC panel image categories

10. **Power Meter** (`power_meter`)
    - Categories: Various power meter image categories

11. **MW Antennas** (`mw_antennas`)
    - Categories: Various MW antenna image categories

12. **Transmission MW** (`transmission_mw`)
    - Categories: Various transmission MW image categories

13. **RAN Equipment** (`ran_equipment`)
    - Categories: Various RAN equipment image categories

14. **External DC Distribution** (`external_dc_distribution`)
    - Categories: Various external DC distribution image categories

15. **New Antennas** (`new_antennas`)
    - Categories: Various new antenna image categories

16. **New Radio Units** (`new_radio_units`)
    - Categories: Various new radio unit image categories

17. **New FPFHs** (`new_fpfhs`)
    - Categories: Various new FPFH image categories

18. **New GPS** (`new_gps`)
    - Categories: Various new GPS image categories

19. **New MW** (`new_mw`)
    - Categories: Various new MW image categories

## Frontend Component

### Gallery Component (`src/Components/Gallery/Gallery.jsx`)

#### Features:
- **Responsive Grid Layout**: Adapts to different screen sizes
- **Image Cards**: Each image displayed in a card with metadata
- **Modal Preview**: Full-size image view with details
- **Download Functionality**: Direct download of images
- **Error Handling**: Fallback images for broken links
- **Loading States**: Spinner during data fetching

#### Props:
- Uses `useParams()` to get `sessionId` and `siteId` from URL

#### State Management:
```javascript
const [galleryData, setGalleryData] = useState({});
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [selectedImage, setSelectedImage] = useState(null);
const [showModal, setShowModal] = useState(false);
```

#### Key Functions:
- `fetchGalleryData()`: Fetches all images for the session
- `handleImageClick()`: Opens image in modal
- `downloadImage()`: Downloads image file
- `formatFileSize()`: Converts bytes to human-readable format
- `formatCategoryName()`: Formats category names for display

## Usage

### 1. Accessing the Gallery

The gallery is accessible via the URL pattern:
```
/sites/{sessionId}/{siteId}/gallery
```

### 2. Navigation

The gallery can be accessed from the slider navigation in the survey forms, where there's a "Gallery" option that links to:
```javascript
{
  label: "Gallery", 
  icon: <BookImage size={20} />, 
  path: `/sites/${sessionId}/${siteId}/gallery`,
  section: "gallery"
}
```

### 3. Image Interaction

- **Click on image**: Opens modal with full-size view and details
- **View button**: Same as clicking the image
- **Download button**: Downloads the original image file
- **Close modal**: Click X button or outside the modal

## File Structure

```
see_survey_backend/
├── routes/
│   └── galleryRoutes.js          # Gallery API endpoints
├── scripts/
│   └── testGalleryAPI.js         # API testing script

see_survey_frontend/
├── src/
│   └── Components/
│       └── Gallery/
│           └── Gallery.jsx       # Main gallery component
```

## API Integration

### Authentication
All gallery endpoints require authentication via JWT token:
```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### Error Handling
The API returns structured error responses:
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

## Testing

### Backend Testing
Run the test script to verify API functionality:
```bash
cd scripts
node testGalleryAPI.js
```

### Frontend Testing
1. Navigate to a survey session
2. Click on the "Gallery" option in the slider
3. Verify images are displayed correctly
4. Test image preview and download functionality

## Styling

The gallery uses Tailwind CSS classes for styling:
- **Grid Layout**: `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- **Cards**: `bg-white border border-gray-200 rounded-lg shadow-sm`
- **Modal**: `fixed inset-0 bg-black bg-opacity-75`
- **Responsive**: Mobile-first design with breakpoints

## Future Enhancements

1. **Image Search**: Search functionality within gallery
2. **Bulk Download**: Download all images from a section
3. **Image Slideshow**: Navigate between images in modal
4. **Image Comments**: Add comments to images
5. **Image Tags**: Tag images for better organization
6. **Export Gallery**: Export gallery as PDF or ZIP
7. **Image Comparison**: Side-by-side image comparison
8. **Image Annotations**: Add annotations to images

## Troubleshooting

### Common Issues

1. **No Images Displayed**
   - Check if session ID is correct
   - Verify images exist in database
   - Check file URLs are accessible

2. **Images Not Loading**
   - Verify upload directory permissions
   - Check file paths in database
   - Ensure static file serving is configured

3. **API Errors**
   - Check authentication token
   - Verify database connection
   - Check server logs for errors

### Debug Steps

1. Check browser console for JavaScript errors
2. Verify API responses in Network tab
3. Test API endpoints directly with Postman/curl
4. Check server logs for backend errors
5. Verify database queries and data

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only access their own survey images
3. **File Access**: Images are served through authenticated routes
4. **Input Validation**: Session IDs are validated before database queries
5. **Error Handling**: Sensitive information is not exposed in error messages 