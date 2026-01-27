# GearGuard - Project Structure

```
inhouse/
│
├── config/
│   └── database.js              # MongoDB connection configuration
│
├── controllers/
│   ├── equipmentController.js   # Equipment business logic & smart button
│   ├── maintenanceRequestController.js  # Request CRUD, Kanban, Calendar, Stats
│   ├── teamController.js        # Team management & member operations
│   └── userController.js        # User CRUD operations
│
├── models/
│   ├── Equipment.js             # Equipment schema with ownership tracking
│   ├── MaintenanceRequest.js   # Request schema with auto-fill logic
│   ├── Team.js                  # Team schema with member management
│   └── User.js                  # User schema with roles
│
├── routes/
│   ├── equipmentRoutes.js       # Equipment API endpoints
│   ├── maintenanceRequestRoutes.js  # Maintenance request endpoints
│   ├── teamRoutes.js            # Team API endpoints
│   └── userRoutes.js            # User API endpoints
│
├── utils/
│   └── helpers.js               # Utility functions (date, validation, etc.)
│
├── .env                         # Environment variables (PORT, DB URI)
├── .gitignore                   # Git ignore file
├── api-test.http                # REST client test file with all endpoints
├── index.js                     # Main Express server
├── package.json                 # Dependencies and scripts
├── QUICKSTART.md                # Quick start guide
├── README.md                    # Full documentation
└── seed.js                      # Database seeding script

```

## File Descriptions

### Core Application
- **index.js** - Express server setup, middleware, routes, error handling
- **.env** - Environment configuration (port, MongoDB URI, environment)

### Configuration
- **config/database.js** - MongoDB connection with error handling

### Data Models
- **Team.js** - Teams with specialization, members (technicians)
- **User.js** - Users with roles (Admin, Manager, Technician, User)
- **Equipment.js** - Assets with ownership (Dept/Employee), maintenance team
- **MaintenanceRequest.js** - Requests with auto-numbering, stages, auto-fill

### Business Logic (Controllers)
- **teamController.js** - Team CRUD + add/remove members
- **userController.js** - User management with role filtering
- **equipmentController.js** - Equipment CRUD + smart button + grouping
- **maintenanceRequestController.js** - Request lifecycle, Kanban, Calendar, Statistics

### API Routes
- **teamRoutes.js** - `/api/teams/*`
- **userRoutes.js** - `/api/users/*`
- **equipmentRoutes.js** - `/api/equipment/*`
- **maintenanceRequestRoutes.js** - `/api/maintenance-requests/*`

### Utilities
- **helpers.js** - Date formatting, validation, duration calculation
- **seed.js** - Sample data generator for testing
- **api-test.http** - HTTP test file for REST Client extension

### Documentation
- **README.md** - Complete API documentation
- **QUICKSTART.md** - Getting started guide with workflow examples

## Key Features Implemented

### 1. Smart Auto-fill
- Equipment selection → auto-populates category & maintenance team
- Implemented in `maintenanceRequestController.js` → `createRequest()`

### 2. Smart Buttons
- Equipment shows count of related maintenance requests
- Endpoint: `GET /equipment/:id/maintenance-requests`
- Returns open count for badge display

### 3. Scrap Logic
- Moving request to "Scrap" stage → equipment status becomes "Scrapped"
- Implemented in `maintenanceRequestController.js` → `updateStage()`
- Automatically logs scrap reason in equipment notes

### 4. Kanban View
- Groups requests by stage (New, In Progress, Repaired, Scrap)
- Endpoint: `GET /maintenance-requests/kanban`
- Supports team filtering

### 5. Calendar View
- Shows scheduled preventive maintenance
- Endpoint: `GET /maintenance-requests/calendar`
- Supports date range filtering

### 6. Grouping & Filtering
- Equipment by department/employee
- Requests by stage, type, team
- Users by role, team

### 7. Statistics Dashboard
- Requests by stage, team, category
- Overdue request count
- Endpoint: `GET /maintenance-requests/statistics`

## Database Relationships

```
User ←→ Team (many-to-one)
User ←→ Equipment (one-to-many as defaultTechnician)
Team ←→ Equipment (one-to-many as maintenanceTeam)
Equipment ←→ MaintenanceRequest (one-to-many)
Team ←→ MaintenanceRequest (one-to-many)
User ←→ MaintenanceRequest (one-to-many as assignedTo)
```

## API Workflow Examples

### Corrective Maintenance Flow
1. User creates request → selects equipment
2. System auto-fills category & team from equipment
3. Request starts in "New" stage
4. Technician assigns themselves
5. Updates stage to "In Progress"
6. Records duration & notes
7. Updates stage to "Repaired"

### Preventive Maintenance Flow
1. Manager creates request with type "Preventive"
2. Sets scheduled date
3. Request appears in calendar view
4. Technician executes on date
5. Updates stage to "Repaired" with duration

### Smart Button Usage
1. View equipment details
2. Click "Maintenance (X)" button
3. See filtered list of all requests for that equipment
4. Badge shows open request count

## Next Steps

### For Production Deployment:
- [ ] Add authentication (JWT)
- [ ] Implement role-based access control
- [ ] Add input validation middleware
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Add logging (Winston/Morgan)
- [ ] Set up error tracking (Sentry)
- [ ] Add API documentation (Swagger)

### For Frontend Integration:
- [ ] Build React/Vue dashboard
- [ ] Implement drag-drop Kanban
- [ ] Add calendar component
- [ ] Create equipment management UI
- [ ] Build statistics/charts
- [ ] Add notifications system

---

**Total Files Created: 23**
**Total Lines of Code: ~2500+**
**API Endpoints: 40+**
