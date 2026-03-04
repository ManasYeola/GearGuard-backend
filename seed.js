require('dotenv').config();
const { sequelize, connectDB } = require('./config/database');
const { Team, User, Equipment, MaintenanceRequest } = require('./models');

const seedData = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Clear existing data
    await MaintenanceRequest.destroy({ where: {}, truncate: true, cascade: true });
    await Equipment.destroy({ where: {}, truncate: true, cascade: true });
    await User.destroy({ where: {}, truncate: true, cascade: true });
    await Team.destroy({ where: {}, truncate: true, cascade: true });
    
    console.log('✅ Cleared existing data');
    
    // Create Teams
    const teams = await Team.bulkCreate([
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
    const users = await User.bulkCreate([
      {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Manager',
        teamId: teams[0].id
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'Technician',
        teamId: teams[0].id
      },
      {
        name: 'Mike Johnson',
        email: 'mike@example.com',
        role: 'Technician',
        teamId: teams[1].id
      },
      {
        name: 'Sarah Williams',
        email: 'sarah@example.com',
        role: 'Technician',
        teamId: teams[2].id
      }
    ]);
    
    console.log('✅ Created users');
    
    // Create Equipment
    const equipment = await Equipment.bulkCreate([
      {
        name: 'CNC Machine 01',
        serialNumber: 'CNC-001',
        category: 'Machinery',
        purchaseDate: new Date('2023-01-15'),
        warrantyExpiry: new Date('2026-01-15'),
        location: 'Production Floor A',
        ownershipType: 'Department',
        department: 'Production',
        maintenanceTeamId: teams[0].id,
        defaultTechnicianId: users[1].id,
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
        assignedEmployeeName: 'Alice Brown',
        assignedEmployeeEmail: 'alice@example.com',
        maintenanceTeamId: teams[1].id,
        defaultTechnicianId: users[2].id,
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
        maintenanceTeamId: teams[0].id,
        defaultTechnicianId: users[1].id,
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
        maintenanceTeamId: teams[2].id,
        defaultTechnicianId: users[3].id,
        status: 'Active'
      }
    ]);
    
    console.log('✅ Created equipment');
    
    // Create Maintenance Requests
    await MaintenanceRequest.bulkCreate([
      {
        requestNumber: 'REQ-00001',
        subject: 'Oil leak in CNC Machine',
        description: 'Machine is leaking oil from the hydraulic system',
        requestType: 'Corrective',
        equipmentId: equipment[0].id,
        equipmentCategory: equipment[0].category,
        maintenanceTeamId: equipment[0].maintenanceTeamId,
        assignedToId: users[1].id,
        stage: 'New',
        priority: 'High',
        createdById: users[0].id
      },
      {
        requestNumber: 'REQ-00002',
        subject: 'Laptop running slow',
        description: 'System performance degraded, needs diagnosis',
        requestType: 'Corrective',
        equipmentId: equipment[1].id,
        equipmentCategory: equipment[1].category,
        maintenanceTeamId: equipment[1].maintenanceTeamId,
        assignedToId: users[2].id,
        stage: 'In Progress',
        priority: 'Medium',
        createdById: users[0].id
      },
      {
        requestNumber: 'REQ-00003',
        subject: 'Routine forklift maintenance',
        description: 'Scheduled quarterly maintenance check',
        requestType: 'Preventive',
        equipmentId: equipment[2].id,
        equipmentCategory: equipment[2].category,
        maintenanceTeamId: equipment[2].maintenanceTeamId,
        assignedToId: users[1].id,
        scheduledDate: new Date('2026-02-15'),
        stage: 'New',
        priority: 'Low',
        createdById: users[0].id
      },
      {
        requestNumber: 'REQ-00004',
        subject: 'Generator maintenance completed',
        description: 'Monthly preventive maintenance completed successfully',
        requestType: 'Preventive',
        equipmentId: equipment[3].id,
        equipmentCategory: equipment[3].category,
        maintenanceTeamId: equipment[3].maintenanceTeamId,
        assignedToId: users[3].id,
        scheduledDate: new Date('2026-01-20'),
        completedDate: new Date('2026-01-20'),
        duration: 2.5,
        stage: 'Repaired',
        priority: 'Medium',
        createdById: users[0].id
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

seedData();
