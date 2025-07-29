const express = require('express');
const router = express.Router();
const RadioUnitsCatalog = require('../models/RadioUnitsCatalog');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadRadioUnitsCatalogFromExcel = require('../scripts/uploadRadioUnitsCatalogFromExcel');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'excel');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'radio-units-catalog-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Check file extension
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// GET /api/radio-units-catalog
// Get all radio units catalog items with optional filtering
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      hardware_type, 
      power_connector_type,
      limit = 50, 
      offset = 0 
    } = req.query;

    let whereClause = {};
    
    // Add search filter
    if (search) {
      whereClause = {
        [require('sequelize').Op.or]: [
          { item_code: { [require('sequelize').Op.like]: `%${search}%` } },
          { item_name: { [require('sequelize').Op.like]: `%${search}%` } },
          { item_description: { [require('sequelize').Op.like]: `%${search}%` } }
        ]
      };
    }

    // Add hardware type filter
    if (hardware_type) {
      whereClause.hardware_type = hardware_type;
    }

    // Add power connector type filter
    if (power_connector_type) {
      whereClause.power_connector_type = power_connector_type;
    }

    const { count, rows } = await RadioUnitsCatalog.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['item_code', 'ASC']]
    });

    res.json({
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset),
      items: rows
    });
  } catch (error) {
    console.error('Error fetching radio units catalog:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/radio-units-catalog/:item_code
// Get a specific radio unit catalog item by item code
router.get('/:item_code', async (req, res) => {
  try {
    const { item_code } = req.params;

    const item = await RadioUnitsCatalog.findOne({
      where: { item_code }
    });

    if (!item) {
      return res.status(404).json({ error: 'Radio unit catalog item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error fetching radio unit catalog item:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/radio-units-catalog
// Create a new radio unit catalog item
router.post('/', async (req, res) => {
  try {
    const itemData = req.body;

    // Validate required fields
    if (!itemData.item_code || !itemData.item_name) {
      return res.status(400).json({ 
        error: 'item_code and item_name are required' 
      });
    }

    // Check if item already exists
    const existingItem = await RadioUnitsCatalog.findOne({
      where: { item_code: itemData.item_code }
    });

    if (existingItem) {
      return res.status(409).json({ 
        error: 'Radio unit catalog item with this item_code already exists' 
      });
    }

    const newItem = await RadioUnitsCatalog.create(itemData);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating radio unit catalog item:', error);
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/radio-units-catalog/:item_code
// Update a radio unit catalog item
router.put('/:item_code', async (req, res) => {
  try {
    const { item_code } = req.params;
    const updateData = req.body;

    const item = await RadioUnitsCatalog.findOne({
      where: { item_code }
    });

    if (!item) {
      return res.status(404).json({ error: 'Radio unit catalog item not found' });
    }

    await item.update(updateData);
    res.json(item);
  } catch (error) {
    console.error('Error updating radio unit catalog item:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/radio-units-catalog/:item_code
// Delete a radio unit catalog item
router.delete('/:item_code', async (req, res) => {
  try {
    const { item_code } = req.params;

    const item = await RadioUnitsCatalog.findOne({
      where: { item_code }
    });

    if (!item) {
      return res.status(404).json({ error: 'Radio unit catalog item not found' });
    }

    await item.destroy();
    res.json({ message: 'Radio unit catalog item deleted successfully' });
  } catch (error) {
    console.error('Error deleting radio unit catalog item:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/radio-units-catalog/bulk-import
// Bulk import radio units catalog items from CSV/JSON
router.post('/bulk-import', async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'items must be an array' });
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const itemData of items) {
      try {
        // Validate required fields
        if (!itemData.item_code || !itemData.item_name) {
          results.push({
            item_code: itemData.item_code || 'unknown',
            status: 'error',
            error: 'item_code and item_name are required'
          });
          errorCount++;
          continue;
        }

        // Check if item already exists
        const existingItem = await RadioUnitsCatalog.findOne({
          where: { item_code: itemData.item_code }
        });

        if (existingItem) {
          // Update existing item
          await existingItem.update(itemData);
          results.push({
            item_code: itemData.item_code,
            status: 'updated',
            id: existingItem.id
          });
        } else {
          // Create new item
          const newItem = await RadioUnitsCatalog.create(itemData);
          results.push({
            item_code: itemData.item_code,
            status: 'created',
            id: newItem.id
          });
        }
        successCount++;
      } catch (error) {
        results.push({
          item_code: itemData.item_code || 'unknown',
          status: 'error',
          error: error.message
        });
        errorCount++;
      }
    }

    res.json({
      message: `Bulk import completed. ${successCount} successful, ${errorCount} errors.`,
      total: items.length,
      successful: successCount,
      errors: errorCount,
      results
    });
  } catch (error) {
    console.error('Error in bulk import:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/radio-units-catalog/upload-excel
// Upload and import radio units catalog items from an Excel file
router.post('/upload-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const filePath = req.file.path;
    const result = await uploadRadioUnitsCatalogFromExcel(filePath);

    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    res.json(result);
  } catch (error) {
    console.error('Error uploading Excel file:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/radio-units-catalog/filters/options
// Get filter options for the catalog
router.get('/filters/options', async (req, res) => {
  try {
    const [hardwareTypes, powerConnectorTypes] = await Promise.all([
      RadioUnitsCatalog.findAll({
        attributes: [[require('sequelize').fn('DISTINCT', require('sequelize').col('hardware_type')), 'hardware_type']],
        where: { hardware_type: { [require('sequelize').Op.ne]: null } }
      }),
      RadioUnitsCatalog.findAll({
        attributes: [[require('sequelize').fn('DISTINCT', require('sequelize').col('power_connector_type')), 'power_connector_type']],
        where: { power_connector_type: { [require('sequelize').Op.ne]: null } }
      })
    ]);

    res.json({
      hardware_types: hardwareTypes.map(item => item.hardware_type),
      power_connector_types: powerConnectorTypes.map(item => item.power_connector_type)
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 