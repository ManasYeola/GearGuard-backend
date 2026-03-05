# GearGuard Role-Based Access Control Matrix

## 🎭 User Roles Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        GEARGUARD ROLES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  👑 ADMIN          Full system access                          │
│  👔 MANAGER        Team & request management                   │
│  🔧 TECHNICIAN     Execute maintenance tasks                   │
│  👤 USER           Create & track requests                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Access Control Matrix

| Feature / Action | User | Technician | Manager | Admin |
|-----------------|:----:|:----------:|:-------:|:-----:|
| **EQUIPMENT MODULE** |
| View Equipment List | ❌ | ✅ | ✅ | ✅ |
| View Equipment Details | ❌ | ✅ | ✅ | ✅ |
| Add New Equipment | ❌ | ❌ | ✅ | ✅ |
| Edit Equipment | ❌ | ❌ | ✅ | ✅ |
| Delete Equipment | ❌ | ❌ | ❌ | ✅ |
| Upload Attachments | ❌ | ❌ | ✅ | ✅ |
| **MAINTENANCE REQUESTS** |
| Create Request | ✅ | ✅ | ✅ | ✅ |
| View Own Requests | ✅ | ✅ | ✅ | ✅ |
| View All Requests | ❌ | ❌ | ✅ | ✅ |
| View Assigned Requests | ❌ | ✅ | ✅ | ✅ |
| Assign Technician | ❌ | ❌ | ✅ | ✅ |
| Update Status | ❌ | ✅ | ✅ | ✅ |
| Mark as Repaired | ❌ | ✅ | ✅ | ✅ |
| Mark as Scrap | ❌ | ❌ | ✅ | ✅ |
| Delete Request | ❌ | ❌ | ❌ | ✅ |
| **TEAMS MODULE** |
| View Teams | ❌ | ❌ | ✅ | ✅ |
| View Team Members | ❌ | ❌ | ✅ | ✅ |
| Create Team | ❌ | ❌ | ✅ | ✅ |
| Edit Team | ❌ | ❌ | ✅ | ✅ |
| Delete Team | ❌ | ❌ | ❌ | ✅ |
| Assign Users to Team | ❌ | ❌ | ✅ | ✅ |
| **CALENDAR MODULE** |
| View Calendar | ❌ | ✅ | ✅ | ✅ |
| View Scheduled Maintenance | ❌ | ✅ | ✅ | ✅ |
| Schedule New Maintenance | ❌ | ❌ | ✅ | ✅ |
| Edit Schedule | ❌ | ❌ | ✅ | ✅ |
| Delete Schedule | ❌ | ❌ | ❌ | ✅ |
| **KANBAN BOARD** |
| View Kanban Board | ❌ | ✅ | ✅ | ✅ |
| Move Own Cards | ❌ | ✅ | ✅ | ✅ |
| Move Any Cards | ❌ | ❌ | ✅ | ✅ |
| Create Cards | ❌ | ✅ | ✅ | ✅ |
| Delete Cards | ❌ | ❌ | ✅ | ✅ |
| **USER MANAGEMENT** |
| View All Users | ❌ | ❌ | ✅ | ✅ |
| View Own Profile | ✅ | ✅ | ✅ | ✅ |
| Edit Own Profile | ✅ | ✅ | ✅ | ✅ |
| Edit User Roles | ❌ | ❌ | ❌ | ✅ |
| Deactivate Users | ❌ | ❌ | ❌ | ✅ |
| Delete Users | ❌ | ❌ | ❌ | ✅ |
| **DASHBOARD** |
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| View Personal Stats | ✅ | ✅ | ✅ | ✅ |
| View Team Stats | ❌ | ❌ | ✅ | ✅ |
| View System Analytics | ❌ | ❌ | ✅ | ✅ |

---

## 🔄 Typical Workflows by Role

### 👤 **USER (Regular Employee)**
```
1. Login → Dashboard
2. Notice equipment issue
3. Create maintenance request
4. Track request status
5. Receive notification when repaired
```

### 🔧 **TECHNICIAN**
```
1. Login → Dashboard
2. View assigned requests on Kanban/Calendar
3. Update request status to "In Progress"
4. View equipment details and safety instructions
5. Complete repair
6. Update request status to "Repaired"
```

### 👔 **MANAGER**
```
1. Login → Dashboard (see team overview)
2. New request arrives
3. Review request details and equipment
4. Assign appropriate technician
5. Monitor progress on Kanban board
6. Schedule preventive maintenance
7. Review team performance analytics
```

### 👑 **ADMIN**
```
1. Full system oversight
2. Manage teams and users
3. Configure equipment catalog
4. Override any settings
5. View system-wide analytics
6. Handle escalations
```

---

## 🎯 Dashboard Views by Role

### User Dashboard
```
┌─────────────────────────────────────────┐
│  Welcome, John (User) 👋                │
│  Create maintenance requests            │
├─────────────────────────────────────────┤
│  Quick Access:                          │
│  ┌─────────┐                           │
│  │ Requests│                           │
│  └─────────┘                           │
├─────────────────────────────────────────┤
│  My Requests:                           │
│  • REQ-123 - In Progress               │
│  • REQ-120 - Repaired ✅               │
└─────────────────────────────────────────┘
```

### Technician Dashboard
```
┌─────────────────────────────────────────┐
│  Welcome, Mike (Technician) 👋          │
│  View assigned tasks and equipment      │
├─────────────────────────────────────────┤
│  Quick Access:                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │Equipment│ │ Requests│ │ Calendar│  │
│  └─────────┘ └─────────┘ └─────────┘  │
│  ┌─────────┐                           │
│  │  Kanban │                           │
│  └─────────┘                           │
├─────────────────────────────────────────┤
│  My Assigned Tasks: 5                   │
│  Scheduled Today: 2                     │
│  Completed This Week: 12                │
└─────────────────────────────────────────┘
```

### Manager Dashboard
```
┌─────────────────────────────────────────┐
│  Welcome, Sarah (Manager) 👋            │
│  Manage team assignments and requests   │
├─────────────────────────────────────────┤
│  Quick Access:                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │Equipment│ │ Requests│ │  Teams  │  │
│  └─────────┘ └─────────┘ └─────────┘  │
│  ┌─────────┐ ┌─────────┐              │
│  │ Calendar│ │  Kanban │              │
│  └─────────┘ └─────────┘              │
├─────────────────────────────────────────┤
│  Team Performance:                      │
│  • Open Requests: 12                    │
│  • Avg Response Time: 2.4h              │
│  • Team Mechanics: 5 active tasks       │
│  📊 Requests vs Completion Graph        │
└─────────────────────────────────────────┘
```

### Admin Dashboard
```
┌─────────────────────────────────────────┐
│  Welcome, Admin (Admin) 👑              │
│  Full system access                     │
├─────────────────────────────────────────┤
│  Quick Access: ALL MODULES              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │Equipment│ │ Requests│ │  Teams  │  │
│  └─────────┘ └─────────┘ └─────────┘  │
│  ┌─────────┐ ┌─────────┐              │
│  │ Calendar│ │  Kanban │              │
│  └─────────┘ └─────────┘              │
├─────────────────────────────────────────┤
│  System Overview:                       │
│  • Total Equipment: 47                  │
│  • Active Requests: 28                  │
│  • Total Teams: 3                       │
│  • System Users: 45                     │
│  📊 Full Analytics Dashboard            │
└─────────────────────────────────────────┘
```

---

## 🔐 Security Implementation

### Backend (Node.js/Express)
```javascript
// middleware/auth.js
const isManager = (req, res, next) => {
  if (req.user.role === 'Manager' || req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied' });
  }
};

// routes/equipmentRoutes.js
router.post('/', isManager, createEquipment);
```

### Frontend (React)
```javascript
// utils/rolePermissions.js
export const hasPermission = (userRole, permission) => {
  return PERMISSIONS[permission].includes(userRole);
};

// In component
{hasPermission(user.role, 'CREATE_EQUIPMENT') && (
  <button>Add Equipment</button>
)}
```

---

**This role-based access control ensures secure, appropriate access for all users while maintaining workflow efficiency! 🚀**
