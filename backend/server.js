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
const { ensureTables } = require('./scripts/database/ensure-db-tables');

// Import routes and middleware
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const healthRoutes = require('./routes/health');
const clientsRoutes = require('./routes/clients');
const reportsRoutes = require('./routes/reports');
const invoicesRoutes = require('./routes/invoices');
const goalsRoutes = require('./routes/goals');
const financialRoutes = require('./routes/financial');
const moneyRoutes = require('./routes/money-management');
const recordsRoutes = require('./routes/records');
const apiKeysRoutes = require('./routes/api-keys');
const apiKeysEnhancedRoutes = require('./routes/api-keys-enhanced');
const apiKeyManagementRoutes = require('./routes/api-key-management');
const { auth, adminAuth, clientAuth } = require('./middleware/auth');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// CORS Middleware - Handle both domains
app.use((req, res, next) => {
    // Allow all domains
    const allowedOrigins = [
        'https://laapak.com',
        'https://www.laapak.com',
        'https://slategrey-cod-346409.hostingersite.com',
        'https://reports.laapak.com',
        'https://www.reports.laapak.com',
        'http://82.112.253.29',
        'http://localhost:3001',
        'http://localhost:3000'
    ];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Authorization, x-auth-token');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Additional CORS middleware for fallback
app.use(cors({
    origin: [
        'https://laapak.com',
        'https://www.laapak.com',
        'https://slategrey-cod-346409.hostingersite.com',
        'https://reports.laapak.com',
        'https://www.reports.laapak.com',
        'http://82.112.253.29',
        'http://localhost:3001',
        'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'x-api-key']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static frontend files - MUST be before route handlers
app.use('/styles', express.static(path.join(__dirname, '../frontend/styles')));
app.use('/scripts', express.static(path.join(__dirname, '../frontend/scripts')));
app.use('/assets', express.static(path.join(__dirname, '../frontend/public/assets')));
app.use('/pages', express.static(path.join(__dirname, '../frontend/public/pages')));
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Root route - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/pages/index.html'));
});

// Map top-level HTML routes to their actual locations in subdirectories
const pageRoutes = {
    // Admin pages
    '/admin.html': '../frontend/public/pages/admin/admin.html',
    '/clients.html': '../frontend/public/pages/admin/clients.html',
    
    // Client pages
    '/client-dashboard.html': '../frontend/public/pages/client/client-dashboard.html',
    '/client-login.html': '../frontend/public/pages/client/client-login.html',
    '/client-login-test.html': '../frontend/public/pages/client/client-login-test.html',
    
    // Reports pages
    '/reports.html': '../frontend/public/pages/reports/reports.html',
    '/report.html': '../frontend/public/pages/reports/report.html',
    '/create-report.html': '../frontend/public/pages/reports/create-report.html',
    
    // Invoice pages
    '/invoices.html': '../frontend/public/pages/invoices/invoices.html',
    '/create-invoice.html': '../frontend/public/pages/invoices/create-invoice.html',
    '/edit-invoice.html': '../frontend/public/pages/invoices/edit-invoice.html',
    '/view-invoice.html': '../frontend/public/pages/invoices/view-invoice.html',
    
    // Financial pages
    '/financial-dashboard.html': '../frontend/public/pages/financial/financial-dashboard.html',
    '/financial-add-expense.html': '../frontend/public/pages/financial/financial-add-expense.html',
    '/financial-profit-management.html': '../frontend/public/pages/financial/financial-profit-management.html',
    
    // Money management pages
    '/money-management.html': '../frontend/public/pages/money-management/money-management.html',
    '/expected-money.html': '../frontend/public/pages/money-management/expected-money.html',
    
    // Other pages
    '/offline.html': '../frontend/public/pages/offline.html'
};

// Register all page routes
Object.keys(pageRoutes).forEach(route => {
    app.get(route, (req, res) => {
        res.sendFile(path.join(__dirname, pageRoutes[route]));
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/money', moneyRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/external', apiKeysRoutes);
app.use('/api/v2/external', apiKeysEnhancedRoutes);
app.use('/api/admin', apiKeyManagementRoutes);

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

// Fallback route for SPA/multi-page routing - must be last
app.get('*', (req, res) => {
    // Only redirect if it's not an API route
    if (!req.path.startsWith('/api')) {
        res.redirect('/');
    } else {
        res.status(404).json({ error: 'API endpoint not found' });
    }
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
        
        // Ensure all required tables exist (reports, report_technical_tests)
        try {
            console.log('Ensuring all required tables exist...');
            // Pass false to prevent closing the database connection
            await ensureTables(false);
            console.log('All required tables verified successfully.');
        } catch (tableError) {
            console.error('Error ensuring required tables:', tableError);
            console.log('Continuing with server startup despite table initialization error.');
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
