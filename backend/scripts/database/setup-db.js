/**
 * Laapak Report System - Database Setup Script
 * This script will create the database if it doesn't exist and initialize tables
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const { initDatabase } = require('./config/dbInit');

// Database configuration from environment variables
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'laapak_report_system';
const DB_PORT = process.env.DB_PORT || 3306;

async function setupDatabase() {
    try {
        console.log('Starting database setup...');
        
        // Create connection without database name to create the database if needed
        const connection = await mysql.createConnection({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD,
            port: DB_PORT
        });
        
        console.log('Connected to MySQL server');
        
        // Check if database exists
        const [rows] = await connection.execute(
            `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${DB_NAME}'`
        );
        
        if (rows.length === 0) {
            console.log(`Database '${DB_NAME}' not found. Creating...`);
            await connection.execute(`CREATE DATABASE ${DB_NAME}`);
            console.log(`Database '${DB_NAME}' created successfully`);
        } else {
            console.log(`Database '${DB_NAME}' already exists`);
        }
        
        // Close the connection
        await connection.end();
        
        // Initialize database tables and seed data
        console.log('Initializing database tables and seed data...');
        await initDatabase();
        
        console.log('Database setup completed successfully!');
        console.log('\nYou can now start the server with: npm start');
        console.log('Default admin login:');
        console.log('  Username: admin');
        console.log('  Password: admin123');
        console.log('\nDefault client login:');
        console.log('  Phone: 0501234567');
        console.log('  Order Code: LP12345');
        
        process.exit(0);
    } catch (error) {
        console.error('Database setup error:', error);
        process.exit(1);
    }
}

// Run the setup
setupDatabase();
