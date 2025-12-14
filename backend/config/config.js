/**
 * Laapak Report System - Configuration
 * Contains application-wide configuration settings
 */

// Load environment variables
require('dotenv').config();

// Configuration object
const config = {
    // Server configuration
    port: process.env.PORT || 3001,
    
    // API configuration
    api: {
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
        version: 'v1'
    },
    
    // JWT configuration
    jwtSecret: process.env.JWT_SECRET || 'laapak-secret-key-change-in-production',
    jwtExpiration: '24h',
    
    // Database configuration
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        name: process.env.DB_NAME || 'laapak_report_system',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        dialect: 'mysql'
    },
    
    // Email configuration (for password reset)
    email: {
        host: process.env.EMAIL_HOST || 'smtp.example.com',
        port: process.env.EMAIL_PORT || 587,
        user: process.env.EMAIL_USER || 'no-reply@example.com',
        password: process.env.EMAIL_PASSWORD || '',
        from: process.env.EMAIL_FROM || 'Laapak Reports <no-reply@example.com>'
    }
};

module.exports = config;
