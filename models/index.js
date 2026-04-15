const User = require('./User');
const Team = require('./Team');
const Equipment = require('./Equipment');
const MaintenanceRequest = require('./MaintenanceRequest');
const Notification = require('./Notification');

// Define associations

// Team has many Users
Team.hasMany(User, {
  foreignKey: 'teamId',
  as: 'members'
});

User.belongsTo(Team, {
  foreignKey: 'teamId',
  as: 'team'
});

// Equipment relationships
Equipment.belongsTo(Team, {
  foreignKey: 'maintenanceTeamId',
  as: 'maintenanceTeam'
});

Equipment.belongsTo(User, {
  foreignKey: 'defaultTechnicianId',
  as: 'defaultTechnician'
});

// MaintenanceRequest relationships
MaintenanceRequest.belongsTo(Equipment, {
  foreignKey: 'equipmentId',
  as: 'equipment'
});

MaintenanceRequest.belongsTo(Team, {
  foreignKey: 'maintenanceTeamId',
  as: 'maintenanceTeam'
});

MaintenanceRequest.belongsTo(User, {
  foreignKey: 'assignedToId',
  as: 'assignedTo'
});

MaintenanceRequest.belongsTo(User, {
  foreignKey: 'createdById',
  as: 'createdBy'
});

// Notification relationships
User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications'
});

Notification.belongsTo(User, {
  foreignKey: 'userId',
  as: 'recipient'
});

module.exports = {
  User,
  Team,
  Equipment,
  MaintenanceRequest,
  Notification
};
