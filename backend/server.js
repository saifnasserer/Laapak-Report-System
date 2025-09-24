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

// Serve the main page first
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, '../frontend/public/pages/index.html');
    console.log('Serving index.html from:', indexPath);
    console.log('File exists:', require('fs').existsSync(indexPath));
    res.sendFile(indexPath);
});

// Serve admin pages
app.get('/admin.html', (req, res) => {
    const adminPath = path.join(__dirname, '../frontend/public/pages/admin/admin.html');
    console.log('Serving admin.html from:', adminPath);
    console.log('File exists:', require('fs').existsSync(adminPath));
    res.sendFile(adminPath);
});

// Serve client pages
app.get('/client-dashboard.html', (req, res) => {
    const clientPath = path.join(__dirname, '../frontend/public/pages/client/client-dashboard.html');
    console.log('Serving client-dashboard.html from:', clientPath);
    console.log('File exists:', require('fs').existsSync(clientPath));
    res.sendFile(clientPath);
});

// Serve reports pages
app.get('/reports.html', (req, res) => {
    const reportsPath = path.join(__dirname, '../frontend/public/pages/reports/reports.html');
    console.log('Serving reports.html from:', reportsPath);
    console.log('File exists:', require('fs').existsSync(reportsPath));
    res.sendFile(reportsPath);
});

app.get('/report.html', (req, res) => {
    const reportPath = path.join(__dirname, '../frontend/public/pages/reports/report.html');
    console.log('Serving report.html from:', reportPath);
    console.log('File exists:', require('fs').existsSync(reportPath));
    res.sendFile(reportPath);
});

app.get('/create-report.html', (req, res) => {
    const createReportPath = path.join(__dirname, '../frontend/public/pages/reports/create-report.html');
    console.log('Serving create-report.html from:', createReportPath);
    console.log('File exists:', require('fs').existsSync(createReportPath));
    res.sendFile(createReportPath);
});

// Serve invoice pages
app.get('/invoices.html', (req, res) => {
    const invoicesPath = path.join(__dirname, '../frontend/public/pages/invoices/invoices.html');
    console.log('Serving invoices.html from:', invoicesPath);
    console.log('File exists:', require('fs').existsSync(invoicesPath));
    res.sendFile(invoicesPath);
});

app.get('/create-invoice.html', (req, res) => {
    const createInvoicePath = path.join(__dirname, '../frontend/public/pages/invoices/create-invoice.html');
    console.log('Serving create-invoice.html from:', createInvoicePath);
    console.log('File exists:', require('fs').existsSync(createInvoicePath));
    res.sendFile(createInvoicePath);
});

app.get('/edit-invoice.html', (req, res) => {
    const editInvoicePath = path.join(__dirname, '../frontend/public/pages/invoices/edit-invoice.html');
    console.log('Serving edit-invoice.html from:', editInvoicePath);
    console.log('File exists:', require('fs').existsSync(editInvoicePath));
    res.sendFile(editInvoicePath);
});

app.get('/view-invoice.html', (req, res) => {
    const viewInvoicePath = path.join(__dirname, '../frontend/public/pages/invoices/view-invoice.html');
    console.log('Serving view-invoice.html from:', viewInvoicePath);
    console.log('File exists:', require('fs').existsSync(viewInvoicePath));
    res.sendFile(viewInvoicePath);
});

// Serve financial pages
app.get('/financial-dashboard.html', (req, res) => {
    const financialDashboardPath = path.join(__dirname, '../frontend/public/pages/financial/financial-dashboard.html');
    console.log('Serving financial-dashboard.html from:', financialDashboardPath);
    console.log('File exists:', require('fs').existsSync(financialDashboardPath));
    res.sendFile(financialDashboardPath);
});

app.get('/financial-add-expense.html', (req, res) => {
    const financialAddExpensePath = path.join(__dirname, '../frontend/public/pages/financial/financial-add-expense.html');
    console.log('Serving financial-add-expense.html from:', financialAddExpensePath);
    console.log('File exists:', require('fs').existsSync(financialAddExpensePath));
    res.sendFile(financialAddExpensePath);
});

app.get('/financial-profit-management.html', (req, res) => {
    const financialProfitPath = path.join(__dirname, '../frontend/public/pages/financial/financial-profit-management.html');
    console.log('Serving financial-profit-management.html from:', financialProfitPath);
    console.log('File exists:', require('fs').existsSync(financialProfitPath));
    res.sendFile(financialProfitPath);
});

// Serve money management pages
app.get('/money-management.html', (req, res) => {
    const moneyManagementPath = path.join(__dirname, '../frontend/public/pages/money-management/money-management.html');
    console.log('Serving money-management.html from:', moneyManagementPath);
    console.log('File exists:', require('fs').existsSync(moneyManagementPath));
    res.sendFile(moneyManagementPath);
});

app.get('/expected-money.html', (req, res) => {
    const expectedMoneyPath = path.join(__dirname, '../frontend/public/pages/money-management/expected-money.html');
    console.log('Serving expected-money.html from:', expectedMoneyPath);
    console.log('File exists:', require('fs').existsSync(expectedMoneyPath));
    res.sendFile(expectedMoneyPath);
});

// Serve admin pages
app.get('/clients.html', (req, res) => {
    const clientsPath = path.join(__dirname, '../frontend/public/pages/admin/clients.html');
    console.log('Serving clients.html from:', clientsPath);
    console.log('File exists:', require('fs').existsSync(clientsPath));
    res.sendFile(clientsPath);
});

// Serve offline page
app.get('/offline.html', (req, res) => {
    const offlinePath = path.join(__dirname, '../frontend/public/pages/offline.html');
    console.log('Serving offline.html from:', offlinePath);
    console.log('File exists:', require('fs').existsSync(offlinePath));
    res.sendFile(offlinePath);
});

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend/public')));

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
