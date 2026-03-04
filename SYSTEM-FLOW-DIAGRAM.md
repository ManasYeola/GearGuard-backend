# GearGuard System Flow & Architecture
**Based on Excalidraw Design**

---

## 📊 DATABASE SCHEMA & RELATIONSHIPS

```
┌─────────────────┐
│     TEAMS       │
├─────────────────┤
│ id (PK)         │
│ name            │
│ specialization  │
│ description     │
│ isActive        │
└────────┬────────┘
         │
         │ hasMany
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌─────────────────────┐
│     USERS       │  │    EQUIPMENT        │
├─────────────────┤  ├─────────────────────┤
│ id (PK)         │  │ id (PK)             │
│ name            │  │ name                │
│ email           │  │ serialNumber        │
│ password        │  │ category            │
│ role            │  │ purchaseDate        │
│ teamId (FK)     │◄─┤ maintenanceTeamId   │
│ avatar          │  │ defaultTechnicianId │◄─┐
│ isActive        │  │ ownershipType       │  │
└────────┬────────┘  │ department          │  │
         │           │ assignedEmployeeName│  │
         │           │ location            │  │
         │           │ status              │  │
         │           │ warrantyExpiry      │  │
         │           └──────────┬──────────┘  │
         │                      │              │
         │                      │ hasMany      │
         │                      │              │
         │                      ▼              │
         │           ┌─────────────────────┐  │
         │           │ MAINTENANCE         │  │
         │           │ REQUESTS            │  │
         │           ├─────────────────────┤  │
         │           │ id (PK)             │  │
         │           │ requestNumber       │  │
         │           │ subject             │  │
         │           │ description         │  │
         │           │ requestType         │  │
         │           │ equipmentId (FK)    │──┘
         │           │ maintenanceTeamId   │
         ├──────────►│ assignedToId (FK)   │
         └──────────►│ createdById (FK)    │
                     │ stage               │
                     │ priority            │
                     │ scheduledDate       │
                     │ completedDate       │
                     │ duration            │
                     │ isOverdue           │
                     └─────────────────────┘
```

---

## 🔄 WORKFLOW 1: BREAKDOWN (Corrective Maintenance)

```
┌─────────────────┐
│   1. CREATE     │
│   REQUEST       │
│                 │
│  Any User Can   │
│  Create Request │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│   2. SELECT EQUIPMENT       │
│                             │
│  User selects equipment     │
│  from dropdown              │
└────────┬────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│   3. AUTO-FILL LOGIC            │
│   ✨ SMART FEATURE ✨           │
│                                  │
│  System automatically fills:     │
│  • equipmentCategory             │
│  • maintenanceTeamId             │
│  • defaultTechnicianId (if set) │
│                                  │
│  FROM: Equipment record          │
└────────┬─────────────────────────┘
         │
         ▼
┌─────────────────┐
│   4. STAGE:     │
│      NEW        │
│                 │
│  Request created│
│  Status: NEW    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   5. ASSIGN     │
│   TECHNICIAN    │
│                 │
│  Manager/Tech   │
│  assigns self   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   6. STAGE:     │
│   IN PROGRESS   │
│                 │
│  Work started   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   7. COMPLETE   │
│   WORK          │
│                 │
│  Record:        │
│  • duration     │
│  • completedDate│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   8. STAGE:     │
│    REPAIRED     │
│                 │
│  Work finished! │
└─────────────────┘
```

---

## 🗓️ WORKFLOW 2: ROUTINE CHECKUP (Preventive Maintenance)

```
┌─────────────────┐
│   1. CREATE     │
│   PREVENTIVE    │
│   REQUEST       │
│                 │
│  Type: Preventive│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   2. SET        │
│   SCHEDULED     │
│   DATE          │
│                 │
│  scheduledDate  │
│  = future date  │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│   3. APPEARS IN     │
│   CALENDAR VIEW     │
│                     │
│  Visible to team on │
│  scheduled date     │
└────────┬────────────┘
         │
         ▼
┌─────────────────┐
│   4. EXECUTE    │
│   ON DATE       │
│                 │
│  Technician     │
│  performs work  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   5. COMPLETE   │
│   & RECORD      │
└─────────────────┘
```

---

## 🗑️ SCRAP WORKFLOW

```
┌─────────────────┐
│  REQUEST IN     │
│  ANY STAGE      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  MOVE TO SCRAP STAGE    │
│  (Drag & Drop or Edit)  │
└────────┬────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  ⚡ AUTOMATIC SCRAP LOGIC ⚡     │
│                                  │
│  1. Update Equipment:            │
│     • status = "Scrapped"        │
│                                  │
│  2. Log in Equipment.notes:      │
│     "Scrapped on [DATE]          │
│      due to request [REQ-NUM]"   │
│                                  │
│  3. Equipment marked unusable    │
└──────────────────────────────────┘
```

---

## 🎨 KANBAN BOARD FLOW

```
┌───────────┐  ┌──────────────┐  ┌───────────┐  ┌──────────┐
│    NEW    │  │ IN PROGRESS  │  │ REPAIRED  │  │  SCRAP   │
├───────────┤  ├──────────────┤  ├───────────┤  ├──────────┤
│           │  │              │  │           │  │          │
│  ┌─────┐  │  │   ┌─────┐   │  │  ┌─────┐  │  │ ┌─────┐  │
│  │Card │  │  │   │Card │   │  │  │Card │  │  │ │Card │  │
│  │ REQ │──┼──┼──►│ REQ │───┼──┼─►│ REQ │  │  │ │ REQ │  │
│  │ 001 │  │  │   │ 002 │   │  │  │ 003 │  │  │ │ 004 │  │
│  └─────┘  │  │   └─────┘   │  │  └─────┘  │  │ └─────┘  │
│           │  │              │  │           │  │          │
│  ┌─────┐  │  │   ┌─────┐   │  │           │  │          │
│  │Card │  │  │   │Card │   │  │           │  │          │
│  │ REQ │  │  │   │ REQ │   │  │           │  │          │
│  │ 005 │  │  │   │ 006 │   │  │           │  │          │
│  └─────┘  │  │   └─────┘   │  │           │  │          │
│           │  │              │  │           │  │          │
└───────────┘  └──────────────┘  └───────────┘  └──────────┘
      │               │                │              │
      │               │                │              │
      └───────────────┴────────────────┴──────────────┘
                     DRAG & DROP
```

---

## 📱 UI VIEWS & NAVIGATION

```
┌─────────────────────────────────────────┐
│         LOGIN / SIGNUP PAGE             │
│                                         │
│  • Authentication                       │
│  • Password hashing                     │
│  • User registration                    │
└────────────────┬────────────────────────┘
                 │
                 ▼ (After Login)
┌─────────────────────────────────────────┐
│           MAIN DASHBOARD                │
│                                         │
│  Navigation to:                         │
│  ├─► Equipment Page                     │
│  ├─► Requests Page                      │
│  ├─► Kanban Board                       │
│  ├─► Calendar View                      │
│  └─► Teams Page                         │
└─────────────────────────────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  EQUIPMENT      │  │   REQUESTS      │  │   KANBAN        │
│  PAGE           │  │   PAGE          │  │   BOARD         │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ • List view     │  │ • List view     │  │ • 4 columns     │
│ • Search/Filter │  │ • Create new    │  │ • Drag & drop   │
│ • Group by:     │  │ • Filter by:    │  │ • Visual cards  │
│   - Department  │  │   - Status      │  │ • Technician    │
│   - Employee    │  │   - Priority    │  │   avatars       │
│ • Smart Button: │  │   - Type        │  │ • Overdue       │
│   Maintenance   │  │ • Auto-fill     │  │   indicators    │
│   Count Badge   │  │   on create     │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐
│   CALENDAR      │  │    TEAMS        │
│   VIEW          │  │    PAGE         │
├─────────────────┤  ├─────────────────┤
│ • Monthly view  │  │ • List teams    │
│ • Preventive    │  │ • Members       │
│   maintenance   │  │ • Specialization│
│ • Scheduled     │  │ • Create/Edit   │
│   dates visible │  │                 │
└─────────────────┘  └─────────────────┘
```

---

## 🔌 API ENDPOINTS FLOW

### Equipment Flow
```
GET /api/equipment
  ↓
Returns all equipment
  ↓
Filter by: department, category, status

GET /api/equipment/:id
  ↓
Returns single equipment + relations
  ↓
Includes: maintenanceTeam, defaultTechnician

GET /api/equipment/:id/maintenance-requests
  ↓
SMART BUTTON ENDPOINT
  ↓
Returns: requests + openCount badge
```

### Maintenance Request Flow
```
POST /api/maintenance-requests
  ↓
Body: { equipment: 1, subject: "...", ... }
  ↓
AUTO-FILL LOGIC TRIGGERS
  ↓
Fetches equipment record
  ↓
Populates: category, teamId, technicianId
  ↓
Creates request with auto-filled data
  ↓
Returns: Complete request object

PATCH /api/maintenance-requests/:id/stage
  ↓
Body: { stage: "Scrap" }
  ↓
If stage === "Scrap"
  ↓
SCRAP LOGIC TRIGGERS
  ↓
Updates equipment.status = "Scrapped"
  ↓
Adds note to equipment
  ↓
Returns: Updated request
```

### Kanban Flow
```
GET /api/maintenance-requests/kanban
  ↓
Fetches all requests
  ↓
Groups by stage: New, In Progress, Repaired, Scrap
  ↓
Returns object:
{
  "New": [...],
  "In Progress": [...],
  "Repaired": [...],
  "Scrap": [...]
}
```

### Calendar Flow
```
GET /api/maintenance-requests/calendar?startDate=X&endDate=Y
  ↓
Filters: requestType = "Preventive"
  ↓
Filters: scheduledDate between dates
  ↓
Returns: Array of scheduled maintenance
```

---

## 🎯 SMART FEATURES IMPLEMENTATION

### 1. Auto-Fill Logic
```javascript
// Backend: maintenanceRequestController.js
createRequest() {
  // 1. User selects equipment ID
  const equipment = await Equipment.findByPk(equipmentId);
  
  // 2. Auto-populate from equipment
  request.equipmentCategory = equipment.category;
  request.maintenanceTeamId = equipment.maintenanceTeamId;
  request.assignedToId = equipment.defaultTechnicianId;
  
  // 3. Create request with pre-filled data
  await MaintenanceRequest.create(request);
}
```

### 2. Scrap Logic
```javascript
// Backend: maintenanceRequestController.js
updateStage() {
  if (stage === 'Scrap') {
    // 1. Find related equipment
    const equipment = await Equipment.findByPk(request.equipmentId);
    
    // 2. Update equipment status
    equipment.status = 'Scrapped';
    
    // 3. Add timestamped note
    equipment.notes += `\nScrapped on ${new Date()} 
                        due to request ${request.requestNumber}`;
    
    // 4. Save equipment
    await equipment.save();
  }
}
```

### 3. Smart Button Badge
```javascript
// Backend: equipmentController.js
getEquipmentMaintenanceRequests() {
  // 1. Get all requests for equipment
  const requests = await MaintenanceRequest.findAll({
    where: { equipmentId: id }
  });
  
  // 2. Count open requests
  const openCount = await MaintenanceRequest.count({
    where: {
      equipmentId: id,
      stage: { [Op.notIn]: ['Repaired', 'Scrap'] }
    }
  });
  
  // 3. Return requests + badge count
  return { requests, openCount };
}
```

### 4. Overdue Detection
```javascript
// Backend: MaintenanceRequest model hooks
beforeSave(request) {
  // Auto-calculate overdue status
  if (request.scheduledDate && 
      request.stage !== 'Repaired' && 
      request.stage !== 'Scrap') {
    request.isOverdue = new Date() > request.scheduledDate;
  }
}
```

---

## 📊 DATA OWNERSHIP TRACKING

### Equipment Ownership Types

```
┌─────────────────────────────────┐
│   EQUIPMENT OWNERSHIP           │
├─────────────────────────────────┤
│                                 │
│  Type 1: DEPARTMENT             │
│  ┌───────────────────────────┐  │
│  │ ownershipType: "Department"│ │
│  │ department: "Production"   │  │
│  │ assignedEmployeeName: null │  │
│  └───────────────────────────┘  │
│                                 │
│  Type 2: EMPLOYEE               │
│  ┌───────────────────────────┐  │
│  │ ownershipType: "Employee"  │  │
│  │ department: null           │  │
│  │ assignedEmployeeName:      │  │
│  │   "John Smith"             │  │
│  │ assignedEmployeeEmail:     │  │
│  │   "john@company.com"       │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

---

## 🔍 TRACKING & GROUPING

### Equipment Grouping API
```
GET /api/equipment/grouped?groupBy=department
  ↓
Returns equipment grouped by department
{
  "Production": [eq1, eq2, ...],
  "Warehouse": [eq3, eq4, ...],
  "IT": [eq5, eq6, ...]
}

GET /api/equipment/grouped?groupBy=employee
  ↓
Returns equipment grouped by assigned employee
{
  "John Smith": [eq1, eq2, ...],
  "Jane Doe": [eq3, eq4, ...],
  "Unassigned": [eq5, eq6, ...]
}
```

---

## 📈 STATISTICS & REPORTING

```
GET /api/maintenance-requests/statistics
  ↓
Returns comprehensive stats:

{
  byStage: [
    { _id: "New", count: 5 },
    { _id: "In Progress", count: 3 },
    { _id: "Repaired", count: 12 },
    { _id: "Scrap", count: 2 }
  ],
  byTeam: [
    { _id: "Mechanics", count: 8 },
    { _id: "Electricians", count: 7 },
    { _id: "IT Support", count: 7 }
  ],
  byCategory: [
    { _id: "Machinery", count: 10 },
    { _id: "Vehicles", count: 5 },
    { _id: "Computers", count: 7 }
  ],
  overdueCount: 3
}
```

---

## ✅ COMPLETE FLOW VERIFICATION CHECKLIST

- ✅ **Database Relationships**: All foreign keys and associations defined
- ✅ **Equipment Tracking**: By department AND by employee
- ✅ **Team Assignment**: Equipment has maintenanceTeam + defaultTechnician
- ✅ **Auto-Fill Logic**: Equipment selection populates team & category
- ✅ **Request Stages**: New → In Progress → Repaired → Scrap
- ✅ **Scrap Logic**: Automatically updates equipment status
- ✅ **Kanban Board**: Drag & drop between stages
- ✅ **Calendar View**: Shows preventive maintenance schedule
- ✅ **Smart Buttons**: Equipment → Maintenance requests with badge
- ✅ **Overdue Tracking**: Auto-calculated based on scheduledDate
- ✅ **Authentication**: Login/Signup with password hashing
- ✅ **API Integration**: Frontend connected to backend

---

## 🚀 YOUR SYSTEM FLOW MATCHES THE EXCALIDRAW DESIGN!

All components are properly connected and working according to the flow diagram. The system implements:
- Complete data relationships
- Both workflow types (Breakdown & Routine Checkup)
- All smart features (Auto-fill, Scrap logic, Smart buttons)
- Kanban board with drag & drop
- Calendar view for scheduling
- Proper equipment tracking by department/employee
- Authentication system

**Status: 100% Aligned with Design** ✅
