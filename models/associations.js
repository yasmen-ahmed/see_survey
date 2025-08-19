const AcConnectionInfo = require('./AcConnectionInfo');
const AcConnectionImages = require('./AcConnectionImages');
const AcPanel = require('./AcPanel');
const AcPanelImages = require('./AcPanelImages');
const PowerMeter = require('./PowerMeter');
const PowerMeterImages = require('./PowerMeterImages');
const User = require('./User');
const Role = require('./Role');
const Project = require('./Project');
const CT = require('./CT');
const UserRole = require('./UserRole');
const UserProject = require('./UserProject');
const Notification = require('./Notification');
const Survey = require('./Survey');

// User - Role associations (Many-to-Many through UserRole)
User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: 'user_id',
  otherKey: 'role_id',
  as: 'roles'
});

Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: 'role_id',
  otherKey: 'user_id',
  as: 'users'
});

// User - Project associations (Many-to-Many through UserProject)
User.belongsToMany(Project, {
  through: UserProject,
  foreignKey: 'user_id',
  otherKey: 'project_id',
  as: 'assignedProjects'
});

Project.belongsToMany(User, {
  through: UserProject,
  foreignKey: 'project_id',
  otherKey: 'user_id',
  as: 'assignedUsers'
});

// Project - CT association (Many-to-One)
Project.belongsTo(CT, {
  foreignKey: 'ct_id',
  as: 'ct'
});

CT.hasMany(Project, {
  foreignKey: 'ct_id',
  as: 'projects'
});

// UserRole associations
UserRole.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

UserRole.belongsTo(Role, {
  foreignKey: 'role_id',
  as: 'role'
});

UserRole.belongsTo(User, {
  foreignKey: 'assigned_by',
  as: 'assignedBy'
});

// UserProject associations
UserProject.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

UserProject.belongsTo(Project, {
  foreignKey: 'project_id',
  as: 'project'
});

UserProject.belongsTo(User, {
  foreignKey: 'assigned_by',
  as: 'assignedBy'
});

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

// Notification associations
Notification.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

User.hasMany(Notification, {
  foreignKey: 'user_id',
  as: 'notifications'
});

module.exports = {
  AcConnectionInfo,
  AcConnectionImages,
  AcPanel,
  AcPanelImages,
  PowerMeter,
  PowerMeterImages,
  User,
  Role,
  Project,
  CT,
  UserRole,
  UserProject,
  Notification,
  Survey
}; 