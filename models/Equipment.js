const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Equipment = sequelize.define('Equipment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Equipment name is required'
      }
    }
  },
  serialNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Serial number is required'
      }
    }
  },
  category: {
    type: DataTypes.ENUM('Machinery', 'Vehicles', 'Computers', 'Tools', 'HVAC', 'Other'),
    allowNull: false,
    defaultValue: 'Other',
    validate: {
      notEmpty: {
        msg: 'Category is required'
      }
    }
  },
  purchaseDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Purchase date is required'
      }
    }
  },
  warrantyExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Location is required'
      }
    }
  },
  ownershipType: {
    type: DataTypes.ENUM('Department', 'Employee'),
    allowNull: false
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true
  },
  assignedEmployeeName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  assignedEmployeeEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  maintenanceTeamId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Teams',
      key: 'id'
    },
    validate: {
      notNull: {
        msg: 'Maintenance team is required'
      }
    }
  },
  defaultTechnicianId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('Active', 'Under Maintenance', 'Scrapped', 'Retired'),
    defaultValue: 'Active'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'Equipment',
  timestamps: true,
  indexes: [
    {
      fields: ['name', 'serialNumber', 'category']
    }
  ],
  hooks: {
    beforeSave: (equipment) => {
      if (equipment.name) {
        equipment.name = equipment.name.trim();
      }
      if (equipment.serialNumber) {
        equipment.serialNumber = equipment.serialNumber.trim();
      }
      if (equipment.location) {
        equipment.location = equipment.location.trim();
      }
      if (equipment.department) {
        equipment.department = equipment.department.trim();
      }
    }
  }
});

module.exports = Equipment;
