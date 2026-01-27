# GearGuard API

> Complete backend for maintenance management system - Track equipment, teams, and maintenance workflows.

## 🎯 Overview

RESTful API for managing company assets and maintenance operations with smart automation features.

**Tech Stack**: Node.js • Express • MongoDB • Mongoose

## ✨ Key Features

- **Auto-fill Logic** - Equipment selection populates category & team automatically
- **Smart Buttons** - Equipment shows related maintenance request counts
- **Kanban Board** - Drag-drop workflow (New → In Progress → Repaired → Scrap)
- **Calendar View** - Schedule preventive maintenance
- **Scrap Logic** - Auto-flags equipment when marked as scrap

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your MongoDB URI

# Seed sample data (optional)
npm run seed

# Start server
npm run dev
```

**Server runs at**: `http://localhost:5000`

## 📡 API Endpoints

```
/api/teams                          # Team management
/api/users                          # User management
/api/equipment                      # Equipment tracking
  ├─ /grouped?groupBy=department    # Group by dept/employee
  └─ /:id/maintenance-requests      # Smart button data
/api/maintenance-requests           # CRUD operations
  ├─ /kanban                        # Kanban view
  ├─ /calendar                      # Calendar view
  └─ /statistics                    # Dashboard reports
```

**Full documentation**: See [POSTMAN-GUIDE.md](POSTMAN-GUIDE.md) or import `GearGuard-Postman-Collection.json`

## 🗄️ Core Models

- **Team** - Maintenance teams with specializations
- **User** - Technicians, managers, admins
- **Equipment** - Assets with ownership (department/employee)
- **Maintenance Request** - Work orders with lifecycle tracking

## 🔄 Workflow

**Corrective** (Emergency): Create → Auto-assign team → In Progress → Repaired  
**Preventive** (Scheduled): Schedule → Calendar view → Execute → Complete

## 📚 Documentation

- [QUICKSTART.md](QUICKSTART.md) - Detailed setup & workflows
- [POSTMAN-GUIDE.md](POSTMAN-GUIDE.md) - API testing guide
- [MONGODB-SETUP.md](MONGODB-SETUP.md) - Database setup
- [PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md) - Code structure

## 📝 License

ISC
