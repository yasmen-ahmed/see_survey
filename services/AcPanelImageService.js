const BaseImageService = require('./BaseImageService');
const AcPanelImages = require('../models/AcPanelImages');

class AcPanelImageService extends BaseImageService {
  constructor() {
    super(AcPanelImages, 'ac_panel_images');
  }

  // Add any AC Panel specific image handling methods here
  async getImagesForAcPanel(session_id) {
    return this.getImagesBySessionId(session_id);
  }

  async uploadAcPanelImage(file, session_id, table_id, category) {
    return this.processUploadedFile(file, session_id, table_id, category);
  }
}

module.exports = new AcPanelImageService(); 