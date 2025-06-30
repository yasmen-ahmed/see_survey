const BaseImageService = require('./BaseImageService');
const PowerMeterImages = require('../models/PowerMeterImages');

class PowerMeterImageService extends BaseImageService {
  constructor() {
    super(PowerMeterImages, 'power_meter_images');
  }

  // Add any Power Meter specific image handling methods here
  async getImagesForPowerMeter(session_id) {
    return this.getImagesBySessionId(session_id);
  }

  async uploadPowerMeterImage(file, session_id, table_id, category) {
    return this.processUploadedFile(file, session_id, table_id, category);
  }
}

module.exports = new PowerMeterImageService(); 