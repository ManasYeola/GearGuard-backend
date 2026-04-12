require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const { authenticateToken } = require('./middleware/jwt');

// Import models to establish associations
require('./models');

// Import routes
const authRoutes = require('./routes/authRoutes');
const teamRoutes = require('./routes/teamRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const maintenanceRequestRoutes = require('./routes/maintenanceRequestRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MySQL
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'GearGuard API - The Ultimate Maintenance Tracker',
    version: '1.0.0',
    auth: 'Required for most endpoints - Use JWT token in Authorization header',
    endpoints: {
      auth: '/api/auth (public)',
      teams: '/api/teams (protected)',
      equipment: '/api/equipment (protected)',
      maintenanceRequests: '/api/maintenance-requests (protected)',
      users: '/api/users (protected)'
    }
  });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes - require JWT token
app.use('/api/teams', authenticateToken, teamRoutes);
app.use('/api/equipment', authenticateToken, equipmentRoutes);
app.use('/api/maintenance-requests', authenticateToken, maintenanceRequestRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 GearGuard API running on port ${PORT}`);
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
