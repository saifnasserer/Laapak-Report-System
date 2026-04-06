/**
 * Testing
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
const settingsRoutes = require('./routes/settings');
const webhooksRoutes = require('./routes/webhooks');
const analysisRoutes = require('./routes/analysis');
const shoppingListsRoutes = require('./routes/shoppingLists');
const facebookRoutes = require('./routes/facebook');
const currencyRoutes = require('./routes/currency');
const suppliersRoutes = require('./routes/suppliers');
const uploadRoutes = require('./routes/upload');
const { auth, adminAuth, clientAuth } = require('./middleware/auth');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

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
        'http://82.112.253.29:3000',
        'http://localhost:3001',
        'http://localhost:3000',
        'http://localhost:5173' // Vite dev server
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }

    res.header('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Authorization, x-auth-token');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
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
        'http://82.112.253.29:3000',
        'http://localhost:3001',
        'http://localhost:3000',
        'http://localhost:5173' // Vite dev server

    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'x-api-key']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Root route - API Status
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Laapak API',
        version: '2.0.0',
        documentation: '/api/health'
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
app.use('/api/settings', settingsRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/shopping-lists', shoppingListsRoutes);
app.use('/api/facebook', facebookRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/upload', uploadRoutes);

// ETA (Egyptian Tax Authority) callback endpoint
app.get('/eta/callback', (req, res) => {
    // Log the callback request for monitoring
    console.log('ETA Callback received:', {
        timestamp: new Date().toISOString(),
        method: req.method,
        headers: req.headers,
        query: req.query,
        ip: req.ip
    });

    res.send('OK');
});

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
// Fallback route for non-existent endpoints
app.all('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

const wait = ms => new Promise(r => setTimeout(r, ms));

async function connectWithRetry(connectFn, retries = 10) {
    for (let i = 0; i < retries; i++) {
        try {
            await connectFn();
            console.log("✅ Database connected");
            return;
        } catch (err) {
            console.log(`⏳ DB not ready, retrying (${i + 1}/${retries})`);
            await wait(3000);
        }
    }
    console.error("❌ DB connection failed after retries");
    process.exit(1);
}

// Initialize database and start server
const startServer = async () => {
    try {
        // Test database connection with retry
        await connectWithRetry(async () => {
            const dbConnected = await testConnection();
            if (!dbConnected) throw new Error('Database connection failed');
        });

        // Initialize database (create tables and seed data)
        const dbInitialized = await initDatabase();

        if (!dbInitialized) {
            console.error('Failed to initialize database.');
            process.exit(1);
        }

        // Ensure all required tables exist (reports, report_technical_tests)
        // ensureTables is redundant as initDatabase already handles table creation
        // await ensureTables(false);

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
