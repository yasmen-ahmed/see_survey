const AcConnectionInfo = require('./AcConnectionInfo');
const AcConnectionImages = require('./AcConnectionImages');
const AcPanel = require('./AcPanel');
const AcPanelImages = require('./AcPanelImages');
const PowerMeter = require('./PowerMeter');
const PowerMeterImages = require('./PowerMeterImages');

// AC Connection Info associations
AcConnectionInfo.hasMany(AcConnectionImages, {
  foreignKey: 'session_id',
  sourceKey: 'session_id',
  as: 'images'
});

AcConnectionImages.belongsTo(AcConnectionInfo, {
  foreignKey: 'session_id',
  targetKey: 'session_id',
  onDelete: 'CASCADE'
});

// AC Panel associations
AcPanel.hasMany(AcPanelImages, {
  foreignKey: 'session_id',
  sourceKey: 'session_id',
  as: 'images'
});

AcPanelImages.belongsTo(AcPanel, {
  foreignKey: 'session_id',
  targetKey: 'session_id',
  onDelete: 'CASCADE'
});

// Power Meter associations
PowerMeter.hasMany(PowerMeterImages, {
  foreignKey: 'session_id',
  sourceKey: 'session_id',
  as: 'images'
});

PowerMeterImages.belongsTo(PowerMeter, {
  foreignKey: 'session_id',
  targetKey: 'session_id',
  onDelete: 'CASCADE'
});

module.exports = {
  AcConnectionInfo,
  AcConnectionImages,
  AcPanel,
  AcPanelImages,
  PowerMeter,
  PowerMeterImages
}; 