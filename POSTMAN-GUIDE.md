# 🚀 Postman Testing Guide for GearGuard API

## 📥 Step 1: Import the Collection

1. **Open Postman**
2. Click **Import** button (top left)
3. Drag and drop or select: `GearGuard-Postman-Collection.json`
4. Collection will appear in left sidebar

## 🔧 Step 2: Set Up Environment (Optional)

The collection uses variables for IDs. You can either:

### Option A: Use Collection Variables (Recommended)
- Variables are pre-configured in the collection
- Edit them as you get IDs from responses

### Option B: Create an Environment
1. Click **Environments** (left sidebar)
2. Click **+** to create new environment
3. Add these variables:
   - `baseUrl` = `http://localhost:5000`
   - `teamId` = (leave empty for now)
   - `userId` = (leave empty for now)
   - `equipmentId` = (leave empty for now)
   - `requestId` = (leave empty for now)
4. **Save** and select the environment from dropdown

## ✅ Step 3: Verify Server is Running

Make sure your server is running:
```bash
npm run dev
```

Server should be at: `http://localhost:5000`

## 🧪 Step 4: Testing Workflow

### **Phase 1: Seed Sample Data**

Run in terminal:
```bash
npm run seed
```

This creates sample teams, users, equipment, and requests for testing.

---

### **Phase 2: Test Basic CRUD Operations**

#### 1️⃣ **Root - API Info**
- Test that server is responding
- Returns API information

#### 2️⃣ **Get All Teams**
- Folder: Teams → Get All Teams
- Click **Send**
- Copy a `_id` from response
- Set `teamId` variable to this ID

#### 3️⃣ **Get All Users**
- Folder: Users → Get All Users
- Copy a `_id` from response
- Set `userId` variable to this ID

#### 4️⃣ **Get All Equipment**
- Folder: Equipment → Get All Equipment
- Copy a `_id` from response
- Set `equipmentId` variable to this ID

---

### **Phase 3: Test Smart Features**

#### 🎯 **Test Auto-fill Logic**

1. **Create Request (Corrective) - Auto-fill Demo**
   - Folder: Maintenance Requests
   - Make sure `equipmentId` variable is set
   - Click **Send**
   - **Notice**: `equipmentCategory` and `maintenanceTeam` are auto-filled!
   - Copy the `_id` from response
   - Set `requestId` variable to this ID

#### 📊 **Test Smart Button**

2. **Get Equipment Maintenance Requests (Smart Button)**
   - Folder: Equipment
   - Returns all requests for that equipment
   - Shows `openCount` (for badge display)

#### 🗑️ **Test Scrap Logic**

3. **Update Stage to Scrap**
   - Folder: Maintenance Requests
   - This will automatically update equipment status to "Scrapped"
   - After sending, check equipment with "Get Single Equipment"
   - **Notice**: Equipment status is now "Scrapped" with notes!

#### 📋 **Test Kanban View**

4. **Get Kanban View**
   - Returns requests grouped by stage
   - Shows: New, In Progress, Repaired, Scrap columns

#### 📅 **Test Calendar View**

5. **Get Calendar View**
   - Returns only preventive maintenance
   - Shows scheduled dates

---

### **Phase 4: Complete Workflow Test**

#### **Corrective Maintenance Flow:**

1. **Create Request (Corrective)**
   ```json
   {
     "subject": "Printer jam",
     "description": "Paper stuck in tray",
     "requestType": "Corrective",
     "equipment": "{{equipmentId}}",
     "priority": "High"
   }
   ```
   - Save the `requestId` from response

2. **Update Stage to In Progress**
   - Simulates technician starting work

3. **Update Request** (add duration & notes)
   ```json
   {
     "duration": 1.5,
     "notes": "Cleared paper jam and cleaned rollers"
   }
   ```

4. **Update Stage to Repaired**
   - Marks as complete
   - `completedDate` is auto-set

5. **Check Kanban View**
   - Request should now be in "Repaired" column

#### **Preventive Maintenance Flow:**

1. **Create Request (Preventive)**
   ```json
   {
     "subject": "Monthly equipment checkup",
     "requestType": "Preventive",
     "equipment": "{{equipmentId}}",
     "scheduledDate": "2026-03-15",
     "priority": "Medium"
   }
   ```

2. **Get Calendar View**
   - Request should appear in calendar

3. **Get Calendar View (Date Range)**
   - Filter by date range

---

## 📊 Step 5: Test Advanced Features

### **Grouping & Filtering**

1. **Get Grouped Equipment (by Department)**
   - Shows equipment counts per department

2. **Get Grouped Equipment (by Employee)**
   - Shows equipment assigned to each employee

3. **Get Equipment by Department**
   - Filter: `?department=Production`

4. **Get Equipment by Category**
   - Filter: `?category=Machinery`

5. **Get Requests by Stage**
   - Filter: `?stage=New`

6. **Get Users by Role**
   - Filter: `?role=Technician`

### **Statistics & Reports**

7. **Get Statistics**
   - Returns:
     - Requests by stage
     - Requests by team
     - Requests by category
     - Overdue count

---

## 🔄 Step 6: Update Collection Variables

As you test, update variables with actual IDs:

1. Click **GearGuard API** collection
2. Go to **Variables** tab
3. Update values:
   - `teamId` - from Get All Teams
   - `userId` - from Get All Users
   - `equipmentId` - from Get All Equipment
   - `requestId` - from Get All Requests

---

## 🎯 Testing Checklist

- [ ] Server is running (`npm run dev`)
- [ ] MongoDB is connected (check terminal logs)
- [ ] Sample data seeded (`npm run seed`)
- [ ] Collection imported to Postman
- [ ] Variables configured
- [ ] Root endpoint tested
- [ ] All CRUD operations work
- [ ] Auto-fill logic tested
- [ ] Smart button tested
- [ ] Scrap logic tested
- [ ] Kanban view tested
- [ ] Calendar view tested
- [ ] Statistics endpoint tested
- [ ] Grouping & filtering tested

---

## 🐛 Troubleshooting

### Problem: Connection Error
**Solution**: Make sure server is running at `http://localhost:5000`

### Problem: MongoDB Connection Error
**Solution**: 
1. Install MongoDB or use MongoDB Atlas
2. Update `.env` file with correct `MONGODB_URI`
3. Restart server

### Problem: "Equipment not found" or "Team not found"
**Solution**: 
1. Run `npm run seed` to create sample data
2. Update collection variables with actual IDs from GET requests

### Problem: Auto-fill not working
**Solution**: 
- Make sure `equipmentId` variable is set correctly
- Equipment must have `maintenanceTeam` assigned

### Problem: 404 errors
**Solution**: Check that the route path is correct and server is running

---

## 📚 Quick Reference

### Request Flow Order:
1. Create Team → Get team ID
2. Create User (assign to team) → Get user ID  
3. Create Equipment (assign team & technician) → Get equipment ID
4. Create Maintenance Request (select equipment) → Auto-fill happens!
5. Update stages: New → In Progress → Repaired
6. Test smart button on equipment
7. Test scrap logic by moving to Scrap stage

### Important Variables:
- `{{baseUrl}}` - http://localhost:5000
- `{{teamId}}` - Team ObjectId
- `{{userId}}` - User ObjectId
- `{{equipmentId}}` - Equipment ObjectId
- `{{requestId}}` - Request ObjectId

---

## 💡 Pro Tips

1. **Use the Console**: Check responses in Postman console (bottom)
2. **Save Responses**: Save responses as examples for documentation
3. **Use Pre-request Scripts**: Auto-set variables from previous responses
4. **Test Scripts**: Add assertions to validate responses
5. **Use Folders**: Organize requests by workflow

---

## 🎬 Recommended Testing Sequence

```
1. Root - API Info ✅
2. Get All Teams → Save teamId
3. Get All Users → Save userId  
4. Create Equipment → Save equipmentId
5. Create Request (watch auto-fill!) → Save requestId
6. Get Equipment Maintenance Requests (smart button)
7. Update Stage to In Progress
8. Update Stage to Repaired
9. Get Kanban View
10. Get Statistics
11. Create Preventive Request
12. Get Calendar View
13. Update Stage to Scrap (watch equipment status change!)
```

---

**Happy Testing! 🚀**

If you encounter any issues, check the terminal logs for detailed error messages.
