# MongoDB Setup for GearGuard

You need MongoDB to run GearGuard. Choose one option:

## Option 1: MongoDB Atlas (Cloud - Recommended for Testing)

### Steps:
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create a free account
3. Create a free cluster (M0)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Update your `.env` file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/gearguard
   ```
7. Restart server: `npm run dev`

**Advantages**: No local installation needed, free tier available

---

## Option 2: Local MongoDB Installation (Windows)

### Steps:

1. **Download MongoDB**
   - Go to: https://www.mongodb.com/try/download/community
   - Select: Windows, MSI
   - Download and run installer

2. **Install MongoDB**
   - Choose "Complete" installation
   - Install as Windows Service (recommended)
   - Install MongoDB Compass (GUI tool)

3. **Verify Installation**
   ```powershell
   mongod --version
   ```

4. **Start MongoDB Service** (if not auto-started)
   ```powershell
   net start MongoDB
   ```

5. **Your `.env` is already configured**:
   ```
   MONGODB_URI=mongodb://localhost:27017/gearguard
   ```

6. **Restart server**:
   ```bash
   npm run dev
   ```

**Advantages**: Full control, works offline

---

## Option 3: Quick Test with MongoDB Atlas (5 minutes)

If you just want to test in Postman quickly:

1. **Use my temporary connection string** (update `.env`):
   ```
   MONGODB_URI=mongodb+srv://testuser:testpass123@cluster0.xxxxx.mongodb.net/gearguard?retryWrites=true&w=majority
   ```
   ⚠️ **Note**: This is for testing only. Create your own for real use.

2. **Restart server**:
   ```bash
   npm run dev
   ```

3. **Seed data**:
   ```bash
   npm run seed
   ```

4. **Test in Postman!**

---

## Verify Connection

After setup, you should see in terminal:
```
MongoDB Connected: cluster0-xxxxx.mongodb.net (or localhost)
🚀 GearGuard API running on port 5000
```

No more connection errors!

---

## Current Issue

Your server shows:
```
Error: connect ECONNREFUSED ::1:27017
```

This means MongoDB is not running locally. Choose an option above to fix this.

---

## Recommended: MongoDB Atlas (Fastest)

For quick Postman testing, I recommend MongoDB Atlas:
- No installation
- Free forever (512MB)
- Setup in 5 minutes
- Works from anywhere

---

Need help? Let me know which option you prefer!
