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
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MAX_PORT_RETRIES = 10;
const isEmailNotificationsEnabled =
  process.env.EMAIL_NOTIFICATIONS_ENABLED !== 'false' &&
  !!process.env.SMTP_HOST &&
  !!process.env.SMTP_PORT &&
  !!process.env.SMTP_USER &&
  !!process.env.SMTP_PASS &&
  !!process.env.EMAIL_FROM;

// Connect to MySQL
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ── Public Routes ─────────────────────────────────────────────────────────────
// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'GearGuard API - The Ultimate Maintenance Tracker',
    version: '1.0.0',
    auth: 'Required for most endpoints - Use JWT token in Authorization header',
    endpoints: {
<<<<<<< HEAD
      auth: '/api/auth (public)',
      teams: '/api/teams (protected)',
      equipment: '/api/equipment (protected)',
      maintenanceRequests: '/api/maintenance-requests (protected)',
      users: '/api/users (protected)',
      notifications: '/api/notifications (protected)'
=======
      auth: '/api/auth',
      teams: '/api/teams',
      equipment: '/api/equipment',
      maintenanceRequests: '/api/maintenance-requests',
      users: '/api/users',
      dashboard: '/api/dashboard',
      notifications: '/api/notifications'
>>>>>>> ecd870dda7192b8c064908dfab3f0b487fd8d5f2
    }
  });
});

// Lightweight health endpoint used by automated keep-alive jobs.
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString()
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
app.use('/api/notifications', authenticateToken, notificationRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ── Start server ──────────────────────────────────────────────────────────────
const startServer = (port, retriesLeft) => {
  const server = app.listen(port, () => {
    console.log(`\n🚀 GearGuard API running on port ${port}`);
    console.log(`📍 Server: http://localhost:${port}`);
    console.log(`🔒 JWT Auth: enabled`);
    console.log(`📧 Email notifications: ${isEmailNotificationsEnabled ? 'enabled' : 'disabled (configure SMTP in .env)'}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && retriesLeft > 0) {
      const nextPort = Number(port) + 1;
      console.warn(`⚠️ Port ${port} is in use. Retrying on port ${nextPort}...`);
      startServer(nextPort, retriesLeft - 1);
      return;
    }

    throw error;
  });
};

startServer(Number(PORT), MAX_PORT_RETRIES);
