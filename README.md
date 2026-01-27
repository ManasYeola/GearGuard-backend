# GearGuard API - The Ultimate Maintenance Tracker

A comprehensive maintenance management system backend built with Node.js, Express, and MongoDB.

## 🚀 Features

### Core Modules
1. **Teams** - Manage maintenance teams and their members
2. **Equipment** - Track all company assets with ownership and maintenance details
3. **Maintenance Requests** - Handle corrective and preventive maintenance workflows
4. **Users** - Manage technicians, managers, and administrators

### Smart Features
- **Auto-fill Logic**: Equipment selection automatically populates category and maintenance team
- **Smart Buttons**: Equipment forms show maintenance request counts
- **Scrap Logic**: Moving requests to "Scrap" stage automatically flags equipment
- **Kanban View**: Group requests by stage (New → In Progress → Repaired → Scrap)
- **Calendar View**: Schedule and view preventive maintenance
- **Statistics & Reports**: Track requests by team, category, and status

## 📦 Installation

```bash
# Install dependencies
npm install

# Configure environment variables
# Edit .env file with your MongoDB URI

# Start development server
npm run dev

# Start production server
npm start
```

## 🔧 Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gearguard
NODE_ENV=development
```

## 📡 API Endpoints

### Teams
- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get single team
- `POST /api/teams` - Create team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `POST /api/teams/:id/members` - Add member to team
- `DELETE /api/teams/:id/members` - Remove member from team

### Equipment
- `GET /api/equipment` - Get all equipment (filter by department, category, status)
- `GET /api/equipment/grouped` - Group equipment by department or employee
- `GET /api/equipment/:id` - Get single equipment
- `GET /api/equipment/:id/maintenance-requests` - Get maintenance requests for equipment (Smart Button)
- `POST /api/equipment` - Create equipment
- `PUT /api/equipment/:id` - Update equipment
- `DELETE /api/equipment/:id` - Delete equipment

### Maintenance Requests
- `GET /api/maintenance-requests` - Get all requests (filter by stage, type, team)
- `GET /api/maintenance-requests/kanban` - Get Kanban view grouped by stage
- `GET /api/maintenance-requests/calendar` - Get calendar view (preventive maintenance)
- `GET /api/maintenance-requests/statistics` - Get statistics and reports
- `GET /api/maintenance-requests/:id` - Get single request
- `POST /api/maintenance-requests` - Create request (auto-fills from equipment)
- `PUT /api/maintenance-requests/:id` - Update request
- `PATCH /api/maintenance-requests/:id/stage` - Update stage (triggers scrap logic)
- `DELETE /api/maintenance-requests/:id` - Delete request

### Users
- `GET /api/users` - Get all users (filter by role, team)
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🗄️ Data Models

### Team
```javascript
{
  name: String,
  description: String,
  members: [ObjectId],
  specialization: Enum,
  isActive: Boolean
}
```

### Equipment
```javascript
{
  name: String,
  serialNumber: String,
  category: Enum,
  purchaseDate: Date,
  warrantyExpiry: Date,
  location: String,
  ownershipType: Enum,
  department: String,
  assignedEmployee: Object,
  maintenanceTeam: ObjectId,
  defaultTechnician: ObjectId,
  status: Enum
}
```

### Maintenance Request
```javascript
{
  requestNumber: String (auto-generated),
  subject: String,
  description: String,
  requestType: Enum (Corrective/Preventive),
  equipment: ObjectId,
  equipmentCategory: String (auto-filled),
  maintenanceTeam: ObjectId (auto-filled),
  assignedTo: ObjectId,
  requestDate: Date,
  scheduledDate: Date,
  completedDate: Date,
  duration: Number,
  stage: Enum (New/In Progress/Repaired/Scrap),
  priority: Enum,
  isOverdue: Boolean
}
```

## 🔄 Workflow

### Corrective Maintenance (Breakdown)
1. User creates request and selects equipment
2. System auto-fills category and maintenance team
3. Request starts at "New" stage
4. Technician assigns themselves
5. Stage moves to "In Progress"
6. Technician records duration
7. Stage moves to "Repaired"

### Preventive Maintenance (Scheduled)
1. Manager creates request with type "Preventive"
2. Sets scheduled date
3. Appears in calendar view
4. Executed on scheduled date

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Middleware**: CORS, dotenv
- **Dev Tools**: Nodemon

## 📝 License

ISC
