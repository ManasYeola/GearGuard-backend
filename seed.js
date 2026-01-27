const mongoose = require('mongoose');
require('dotenv').config();

const Team = require('./models/Team');
const User = require('./models/User');
const Equipment = require('./models/Equipment');
const MaintenanceRequest = require('./models/MaintenanceRequest');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await Team.deleteMany({});
    await User.deleteMany({});
    await Equipment.deleteMany({});
    await MaintenanceRequest.deleteMany({});
    
    console.log('✅ Cleared existing data');
    
    // Create Teams
    const teams = await Team.create([
      {
        name: 'Mechanics Team',
        description: 'Handles mechanical equipment repairs',
        specialization: 'Mechanics'
      },
      {
        name: 'IT Support Team',
        description: 'Manages computer and network equipment',
        specialization: 'IT Support'
      },
      {
        name: 'Electricians Team',
        description: 'Electrical equipment maintenance',
        specialization: 'Electricians'
      }
    ]);
    
    console.log('✅ Created teams');
    
    // Create Users
    const users = await User.create([
      {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Manager',
        team: teams[0]._id
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'Technician',
        team: teams[0]._id
      },
      {
        name: 'Mike Johnson',
        email: 'mike@example.com',
        role: 'Technician',
        team: teams[1]._id
      },
      {
        name: 'Sarah Williams',
        email: 'sarah@example.com',
        role: 'Technician',
        team: teams[2]._id
      }
    ]);
    
    console.log('✅ Created users');
    
    // Update teams with members
    await Team.findByIdAndUpdate(teams[0]._id, {
      members: [users[0]._id, users[1]._id]
    });
    await Team.findByIdAndUpdate(teams[1]._id, {
      members: [users[2]._id]
    });
    await Team.findByIdAndUpdate(teams[2]._id, {
      members: [users[3]._id]
    });
    
    console.log('✅ Updated team members');
    
    // Create Equipment
    const equipment = await Equipment.create([
      {
        name: 'CNC Machine 01',
        serialNumber: 'CNC-001',
        category: 'Machinery',
        purchaseDate: new Date('2023-01-15'),
        warrantyExpiry: new Date('2026-01-15'),
        location: 'Production Floor A',
        ownershipType: 'Department',
        department: 'Production',
        maintenanceTeam: teams[0]._id,
        defaultTechnician: users[1]._id,
        status: 'Active'
      },
      {
        name: 'Laptop - Dell XPS',
        serialNumber: 'DELLXPS-123',
        category: 'Computers',
        purchaseDate: new Date('2024-03-10'),
        warrantyExpiry: new Date('2027-03-10'),
        location: 'Office 2nd Floor',
        ownershipType: 'Employee',
        assignedEmployee: {
          name: 'Alice Brown',
          email: 'alice@example.com'
        },
        maintenanceTeam: teams[1]._id,
        defaultTechnician: users[2]._id,
        status: 'Active'
      },
      {
        name: 'Forklift',
        serialNumber: 'FLT-456',
        category: 'Vehicles',
        purchaseDate: new Date('2022-06-20'),
        warrantyExpiry: new Date('2025-06-20'),
        location: 'Warehouse',
        ownershipType: 'Department',
        department: 'Logistics',
        maintenanceTeam: teams[0]._id,
        defaultTechnician: users[1]._id,
        status: 'Active'
      },
      {
        name: 'Industrial Generator',
        serialNumber: 'GEN-789',
        category: 'Machinery',
        purchaseDate: new Date('2021-09-15'),
        location: 'Power Room',
        ownershipType: 'Department',
        department: 'Facilities',
        maintenanceTeam: teams[2]._id,
        defaultTechnician: users[3]._id,
        status: 'Active'
      }
    ]);
    
    console.log('✅ Created equipment');
    
    // Create Maintenance Requests
    await MaintenanceRequest.create([
      {
        subject: 'Oil leak in CNC Machine',
        description: 'Machine is leaking oil from the hydraulic system',
        requestType: 'Corrective',
        equipment: equipment[0]._id,
        equipmentCategory: equipment[0].category,
        maintenanceTeam: equipment[0].maintenanceTeam,
        assignedTo: users[1]._id,
        stage: 'New',
        priority: 'High',
        createdBy: users[0]._id
      },
      {
        subject: 'Laptop running slow',
        description: 'System performance degraded, needs diagnosis',
        requestType: 'Corrective',
        equipment: equipment[1]._id,
        equipmentCategory: equipment[1].category,
        maintenanceTeam: equipment[1].maintenanceTeam,
        assignedTo: users[2]._id,
        stage: 'In Progress',
        priority: 'Medium',
        createdBy: users[0]._id
      },
      {
        subject: 'Routine forklift maintenance',
        description: 'Scheduled quarterly maintenance check',
        requestType: 'Preventive',
        equipment: equipment[2]._id,
        equipmentCategory: equipment[2].category,
        maintenanceTeam: equipment[2].maintenanceTeam,
        assignedTo: users[1]._id,
        scheduledDate: new Date('2026-02-15'),
        stage: 'New',
        priority: 'Low',
        createdBy: users[0]._id
      },
      {
        subject: 'Generator maintenance completed',
        description: 'Monthly preventive maintenance completed successfully',
        requestType: 'Preventive',
        equipment: equipment[3]._id,
        equipmentCategory: equipment[3].category,
        maintenanceTeam: equipment[3].maintenanceTeam,
        assignedTo: users[3]._id,
        scheduledDate: new Date('2026-01-20'),
        completedDate: new Date('2026-01-20'),
        duration: 2.5,
        stage: 'Repaired',
        priority: 'Medium',
        createdBy: users[0]._id
      }
    ]);
    
    console.log('✅ Created maintenance requests');
    console.log('\n✨ Database seeded successfully!\n');
    
    // Display summary
    console.log('📊 Summary:');
    console.log(`   Teams: ${teams.length}`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Equipment: ${equipment.length}`);
    console.log(`   Maintenance Requests: 4\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

connectDB().then(() => seedData());
