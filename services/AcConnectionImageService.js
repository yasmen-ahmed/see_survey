const BaseImageService = require('./BaseImageService');
const AcConnectionImages = require('../models/AcConnectionImages');

class AcConnectionImageService extends BaseImageService {
  constructor() {
    super(AcConnectionImages, 'ac_connection_images');
  }

  // Add any AC Connection specific image handling methods here
  async getImagesForAcConnection(session_id) {
    return this.getImagesBySessionId(session_id);
  }

  async uploadAcConnectionImage(file, session_id, table_id, category) {
    return this.processUploadedFile(file, session_id, table_id, category);
  }
}

module.exports = new AcConnectionImageService(); 