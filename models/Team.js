const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Team = sequelize.define('Team', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Team name is required'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  specialization: {
    type: DataTypes.ENUM('Mechanics', 'Electricians', 'IT Support', 'HVAC', 'Plumbing', 'General'),
    defaultValue: 'General'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'Teams',
  timestamps: true,
  hooks: {
    beforeSave: (team) => {
      if (team.name) {
        team.name = team.name.trim();
      }
      if (team.description) {
        team.description = team.description.trim();
      }
    }
  }
});

module.exports = Team;
