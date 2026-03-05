/**
 * EXAMPLE: Updated Equipment Seed Data
 * This shows how to include the new safety instructions and attachments fields
 */

const equipmentWithNewFields = await Equipment.bulkCreate([
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
    status: 'Active',
    // ⭐ NEW FIELDS
    safetyInstructions: `
      SAFETY INSTRUCTIONS FOR CNC MACHINE:
      1. Always wear safety goggles and hearing protection
      2. Keep hands away from moving parts
      3. Emergency stop button is located on the front panel
      4. Do not operate without proper training
      5. Lock-out/Tag-out procedures must be followed during maintenance
      6. Maximum load capacity: 500kg
      7. Report any unusual vibrations or sounds immediately
    `,
    attachments: JSON.stringify([
      {
        type: 'datasheet',
        name: 'CNC Machine Manual.pdf',
        url: '/uploads/equipment/cnc-001/manual.pdf',
        uploadDate: '2023-01-20'
      },
      {
        type: 'image',
        name: 'Machine Front View.jpg',
        url: '/uploads/equipment/cnc-001/front-view.jpg',
        uploadDate: '2023-01-20'
      },
      {
        type: 'datasheet',
        name: 'Maintenance Schedule.pdf',
        url: '/uploads/equipment/cnc-001/maintenance-schedule.pdf',
        uploadDate: '2023-02-01'
      }
    ])
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
    status: 'Active',
    // ⭐ NEW FIELDS
    safetyInstructions: `
      SAFETY INSTRUCTIONS FOR LAPTOP:
      1. Do not expose to liquids
      2. Use only authorized power adapters
      3. Ensure proper ventilation - do not block air vents
      4. Back up data regularly
      5. Report any unusual heating immediately
      6. Do not attempt to open or repair internally
    `,
    attachments: JSON.stringify([
      {
        type: 'datasheet',
        name: 'Dell XPS User Manual.pdf',
        url: '/uploads/equipment/laptop-123/manual.pdf',
        uploadDate: '2024-03-15'
      },
      {
        type: 'image',
        name: 'Laptop Serial Number.jpg',
        url: '/uploads/equipment/laptop-123/serial.jpg',
        uploadDate: '2024-03-15'
      },
      {
        type: 'datasheet',
        name: 'Warranty Certificate.pdf',
        url: '/uploads/equipment/laptop-123/warranty.pdf',
        uploadDate: '2024-03-15'
      }
    ])
  },
  {
    name: 'Forklift FL-205',
    serialNumber: 'FLT-456',
    category: 'Vehicles',
    purchaseDate: new Date('2022-06-20'),
    warrantyExpiry: new Date('2025-06-20'),
    location: 'Warehouse Section B',
    ownershipType: 'Department',
    department: 'Logistics',
    maintenanceTeamId: teams[0].id,
    defaultTechnicianId: users[1].id,
    status: 'Active',
    // ⭐ NEW FIELDS
    safetyInstructions: `
      CRITICAL SAFETY INSTRUCTIONS - FORKLIFT FL-205:
      ⚠️ ONLY CERTIFIED OPERATORS MAY USE THIS EQUIPMENT
      
      1. Pre-Operation Check:
         - Check tire pressure and condition
         - Inspect hydraulic system for leaks
         - Test brakes and steering
         - Verify horn and lights are functional
      
      2. Operating Procedures:
         - Maximum lift capacity: 2,500 lbs
         - Never exceed rated capacity
         - Keep load low when traveling
         - Travel in reverse when load blocks forward view
         - Sound horn at intersections and blind corners
      
      3. Parking and Shutdown:
         - Park on level surfaces only
         - Lower forks completely to ground
         - Set parking brake
         - Turn off engine and remove key
      
      4. Maintenance Schedule:
         - Daily visual inspection required
         - Weekly oil and fluid level check
         - Monthly comprehensive inspection
         - Annual certification required
      
      5. Emergency Procedures:
         - Emergency shutoff: Red button on dashboard
         - Fire extinguisher location: Mounted on right side
         - Report accidents immediately to supervisor
         - Do not operate if any safety feature is malfunctioning
      
      LAST INSPECTION: Check maintenance log
      NEXT SCHEDULED MAINTENANCE: See calendar
    `,
    attachments: JSON.stringify([
      {
        type: 'datasheet',
        name: 'Forklift Operator Manual.pdf',
        url: '/uploads/equipment/forklift-456/operator-manual.pdf',
        uploadDate: '2022-06-25'
      },
      {
        type: 'image',
        name: 'Forklift Side View.jpg',
        url: '/uploads/equipment/forklift-456/side-view.jpg',
        uploadDate: '2022-06-25'
      },
      {
        type: 'image',
        name: 'Load Capacity Chart.jpg',
        url: '/uploads/equipment/forklift-456/capacity-chart.jpg',
        uploadDate: '2022-06-25'
      },
      {
        type: 'datasheet',
        name: 'Maintenance Log.pdf',
        url: '/uploads/equipment/forklift-456/maintenance-log.pdf',
        uploadDate: '2023-01-10'
      },
      {
        type: 'datasheet',
        name: 'Safety Certification.pdf',
        url: '/uploads/equipment/forklift-456/certification.pdf',
        uploadDate: '2024-06-15'
      }
    ])
  },
  {
    name: 'HVAC System - Zone A',
    serialNumber: 'HVAC-A001',
    category: 'HVAC',
    purchaseDate: new Date('2021-09-01'),
    warrantyExpiry: new Date('2026-09-01'),
    location: 'Building A - Rooftop',
    ownershipType: 'Department',
    department: 'Facilities',
    maintenanceTeamId: teams[2].id,
    defaultTechnicianId: users[3].id,
    status: 'Active',
    // ⭐ NEW FIELDS
    safetyInstructions: `
      SAFETY INSTRUCTIONS - HVAC SYSTEM:
      
      1. Electrical Safety:
         - Disconnect power before maintenance
         - Use lock-out/tag-out procedures
         - Verify power is off with voltage tester
         - High voltage: 480V three-phase
      
      2. Working at Heights:
         - Rooftop access requires fall protection
         - Use safety harness when working near edges
         - Check weather conditions before rooftop work
      
      3. Refrigerant Handling:
         - Certified technician required for refrigerant work
         - Use proper PPE including gloves and goggles
         - Work in well-ventilated area
         - Have refrigerant leak detector available
      
      4. Filter Replacement:
         - Monthly filter inspection required
         - Replace filters when pressure drop exceeds 0.5" WC
         - Dispose of filters according to regulations
      
      5. Emergency Shutdown:
         - Main disconnect switch located at unit
         - Building emergency shutdown in electrical room B
    `,
    attachments: JSON.stringify([
      {
        type: 'datasheet',
        name: 'HVAC Technical Specifications.pdf',
        url: '/uploads/equipment/hvac-a001/specs.pdf',
        uploadDate: '2021-09-05'
      },
      {
        type: 'datasheet',
        name: 'Maintenance Schedule.pdf',
        url: '/uploads/equipment/hvac-a001/schedule.pdf',
        uploadDate: '2021-09-05'
      },
      {
        type: 'image',
        name: 'Unit Photo.jpg',
        url: '/uploads/equipment/hvac-a001/unit-photo.jpg',
        uploadDate: '2021-09-05'
      },
      {
        type: 'datasheet',
        name: 'Electrical Schematic.pdf',
        url: '/uploads/equipment/hvac-a001/electrical-diagram.pdf',
        uploadDate: '2021-09-05'
      }
    ])
  },
  {
    name: 'Server Rack - Production',
    serialNumber: 'SRV-RACK-01',
    category: 'Computers',
    purchaseDate: new Date('2023-05-12'),
    warrantyExpiry: new Date('2028-05-12'),
    location: 'Data Center - Row 3',
    ownershipType: 'Department',
    department: 'IT',
    maintenanceTeamId: teams[1].id,
    defaultTechnicianId: users[2].id,
    status: 'Active',
    // ⭐ NEW FIELDS
    safetyInstructions: `
      DATA CENTER SAFETY - SERVER RACK:
      
      1. Access Control:
         - Authorized personnel only
         - Log all visits in access log
         - Two-person rule for major changes
      
      2. Electrical Safety:
         - Dual power supply - verify which circuit before work
         - UPS backup: 30 minutes runtime
         - Do not overload circuits
      
      3. Cooling Requirements:
         - Maintain aisle temperature 18-27°C
         - Do not block airflow
         - Hot aisle/cold aisle configuration
      
      4. Data Protection:
         - Follow change management procedures
         - Take backups before maintenance
         - Test in staging environment first
      
      5. Fire Safety:
         - FM-200 fire suppression system active
         - Evacuate immediately if alarm sounds
         - Do not bring food or drinks into data center
    `,
    attachments: JSON.stringify([
      {
        type: 'datasheet',
        name: 'Server Rack Documentation.pdf',
        url: '/uploads/equipment/srv-rack-01/documentation.pdf',
        uploadDate: '2023-05-20'
      },
      {
        type: 'image',
        name: 'Rack Layout Diagram.png',
        url: '/uploads/equipment/srv-rack-01/layout.png',
        uploadDate: '2023-05-20'
      },
      {
        type: 'datasheet',
        name: 'Network Configuration.pdf',
        url: '/uploads/equipment/srv-rack-01/network-config.pdf',
        uploadDate: '2023-05-20'
      }
    ])
  }
]);

console.log('✅ Created equipment with safety instructions and attachments');

/*
 * TO USE THIS IN YOUR seed.js:
 * 
 * 1. First, run database migration to add new columns:
 *    - Either use sequelize.sync({ force: true }) (loses data)
 *    - Or manually add columns to MySQL
 * 
 * 2. Update your existing equipment creation code in seed.js
 *    to include safetyInstructions and attachments fields
 * 
 * 3. Run the seed script:
 *    node seed.js
 * 
 * ATTACHMENT FORMAT:
 * - Store as JSON array
 * - Each attachment object has: type, name, url, uploadDate
 * - Types: 'datasheet', 'image', 'manual', 'certificate', etc.
 * - URLs can be relative paths or full URLs
 * 
 * ACCESSING IN CONTROLLER:
 * const equipment = await Equipment.findByPk(id);
 * const attachments = JSON.parse(equipment.attachments || '[]');
 * 
 * DISPLAYING IN FRONTEND:
 * equipment.attachments.map(att => (
 *   <a href={att.url} download>{att.name}</a>
 * ))
 */
