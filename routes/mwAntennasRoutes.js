router.delete('/:sessionId', async (req, res) => {
  try {
    const result = await MWAntennasService.deleteBySessionId(req.params.sessionId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/images/cleanup/all', async (req, res) => {
  try {
    const MWAntennasImageService = require('../services/MWAntennasImageService');
    const result = await MWAntennasImageService.cleanupAllImages();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}); 