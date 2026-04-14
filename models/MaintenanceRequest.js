const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MaintenanceRequest = sequelize.define('MaintenanceRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  requestNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Subject is required'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  requestType: {
    type: DataTypes.ENUM('Corrective', 'Preventive'),
    allowNull: false,
    defaultValue: 'Corrective',
    validate: {
      notEmpty: {
        msg: 'Request type is required'
      }
    }
  },
  equipmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Equipment',
      key: 'id'
    },
    validate: {
      notNull: {
        msg: 'Equipment is required'
      }
    }
  },
  equipmentCategory: {
    type: DataTypes.STRING,
    allowNull: true
  },
  maintenanceTeamId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Teams',
      key: 'id'
    }
  },
  assignedToId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  requestDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  scheduledDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  stage: {
    type: DataTypes.ENUM('New', 'In Progress', 'Repaired', 'Scrap'),
    defaultValue: 'New'
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
    defaultValue: 'Medium'
  },
  isOverdue: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  // ── Extended workflow fields ────────────────────────────────────────────────
  completionNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  actualCost: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: { min: 0 }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 5 }
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'MaintenanceRequests',
  timestamps: true,
  indexes: [
    {
      fields: ['stage', 'requestType', 'scheduledDate']
    }
  ],
  hooks: {
    beforeValidate: async (request) => {
      // Generate request number before validation so notNull checks pass.
      if (!request.requestNumber) {
        const count = await MaintenanceRequest.count();
        request.requestNumber = `REQ-${String(count + 1).padStart(5, '0')}`;
      }
    },
    beforeSave: async (request) => {
      // Check if overdue (only for scheduled preventive maintenance)
      if (request.scheduledDate && request.stage !== 'Repaired' && request.stage !== 'Scrap') {
        request.isOverdue = new Date() > request.scheduledDate;
      }
      
      if (request.subject) {
        request.subject = request.subject.trim();
      }
    }
  }
});

module.exports = MaintenanceRequest;
