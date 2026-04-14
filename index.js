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
<<<<<<< HEAD
=======

// Import auth middleware
const { protect } = require('./middleware/auth');
>>>>>>> a32c162 (Changes applied)

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MySQL
connectDB();

<<<<<<< HEAD
// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
=======
// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, mobile apps, server-to-server)
    if (!origin) return callback(null, true);

    const isLocalhost =
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:');

    const isAllowedProduction =
      process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL;

    if (isLocalhost || isAllowedProduction) {
      return callback(null, true);
    }

    return callback(new Error(`CORS: origin "${origin}" not allowed`));
  },
>>>>>>> a32c162 (Changes applied)
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
      users: '/api/users (protected)'
=======
      auth: '/api/auth',
      teams: '/api/teams',
      equipment: '/api/equipment',
      maintenanceRequests: '/api/maintenance-requests',
      users: '/api/users',
      dashboard: '/api/dashboard'
>>>>>>> a32c162 (Changes applied)
    }
  });
});

<<<<<<< HEAD
// Public routes
app.use('/api/auth', authRoutes);

// Protected routes - require JWT token
app.use('/api/teams', authenticateToken, teamRoutes);
app.use('/api/equipment', authenticateToken, equipmentRoutes);
app.use('/api/maintenance-requests', authenticateToken, maintenanceRequestRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
=======
// Auth routes — public (login/register do NOT need a token)
app.use('/api/auth', authRoutes);
>>>>>>> a32c162 (Changes applied)

// ── Protected Routes (JWT required) ──────────────────────────────────────────
app.use('/api/teams',                protect, teamRoutes);
app.use('/api/equipment',            protect, equipmentRoutes);
app.use('/api/maintenance-requests', protect, maintenanceRequestRoutes);
app.use('/api/users',                protect, userRoutes);
app.use('/api/dashboard',            dashboardRoutes); // protect applied inside router

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
app.listen(PORT, () => {
  console.log(`\n🚀 GearGuard API running on port ${PORT}`);
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🔒 JWT Auth: enabled`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
