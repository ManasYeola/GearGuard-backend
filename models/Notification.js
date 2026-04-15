const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM(
      'new-request',
      'assignment',
      'status-change',
      'completed',
      'overdue',
      'performance',
      'rating',
      'system'
    ),
    allowNull: false,
    defaultValue: 'system',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'Notifications',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'isRead'] },
    { fields: ['createdAt'] },
  ],
});

module.exports = Notification;
