const express = require('express');
const router = express.Router();
const NewMWService = require('../services/NewMWService');
const { uploadMWImages } = require('../middleware/upload');

// Helper to prepend host to image URLs so frontend can load them without relying on env vars
const attachAbsoluteUrls = (data, req) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const mapImage = (img) => {
    if (!img) return img;
    // Convert Sequelize instance to plain object if needed
    const plain = typeof img.toJSON === 'function' ? img.toJSON() : img;
    if (plain.file_url && !plain.file_url.startsWith('http')) {
      plain.url = `${baseUrl}${plain.file_url.startsWith('/') ? '' : '/'}${plain.file_url}`;
    }
    return plain;
  };

  return data.map(item => {
    if (item.images && Array.isArray(item.images)) {
      item.images = item.images.map(mapImage);
    }
    return item;
  });
};

// GET all MWs and images
router.get('/:sessionId', async (req, res) => {
  try {
    let data = await NewMWService.getMWsWithImages(req.params.sessionId);
    data = attachAbsoluteUrls(data, req);
    res.json({
      success: true,
      count: Array.isArray(data) ? data.length : 0,
      data
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update MWs and images
router.put('/:sessionId', uploadMWImages, async (req, res) => {
  try {
    console.log('PUT /api/new-mw/:sessionId - Request received');
    console.log('Session ID:', req.params.sessionId);
    console.log('Body keys:', Object.keys(req.body));
    console.log('Files:', req.files ? Object.keys(req.files) : 'No files');
    
    let data = await NewMWService.saveMWsWithImages(req.params.sessionId, req.body, req.files);
    data = attachAbsoluteUrls(data, req);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error in PUT /api/new-mw/:sessionId:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;