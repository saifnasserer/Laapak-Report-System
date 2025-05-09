/**
 * Laapak Report System - Backend Server
 * Main entry point for the authentication and API services
 * Updated to use MySQL database
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Database initialization
const { testConnection } = require('./config/db');
const { initDatabase } = require('./config/dbInit');

// Import routes and middleware
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const healthRoutes = require('./routes/health');
const resetPasswordRoutes = require('./routes/reset-password');
const clientsRoutes = require('./routes/clients');
const { auth, adminAuth, clientAuth } = require('./middleware/auth');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static files from the current directory
app.use(express.static('./'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/reset-password', resetPasswordRoutes);
app.use('/api/clients', clientsRoutes);

// Protected routes examples
app.get('/api/protected', auth, (req, res) => {
    res.json({ message: 'This is a protected route for all authenticated users', user: req.user });
});

app.get('/api/admin', adminAuth, (req, res) => {
    res.json({ message: 'This is a protected route for admins only', user: req.user });
});

app.get('/api/client', clientAuth, (req, res) => {
    res.json({ message: 'This is a protected route for clients only', user: req.user });
});

// Initialize database and start server
const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('Failed to connect to database. Please check your database configuration.');
            process.exit(1);
        }
        
        // Initialize database (create tables and seed data)
        const dbInitialized = await initDatabase();
        
        if (!dbInitialized) {
            console.error('Failed to initialize database.');
            process.exit(1);
        }
        
        // Start server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`API available at http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('Server startup error:', error);
        process.exit(1);
    }
};

// Start the server
startServer();
