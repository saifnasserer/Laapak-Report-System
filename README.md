# Laapak Report System

A professional web-based system for generating and managing laptop inspection reports for Laapak company.

## Project Overview

The Laapak Report System enables technicians to create detailed laptop inspection reports and share them with customers. The system provides transparency about the condition of laptops being sold, with comprehensive technical tests, visual inspections, and notes.

## Features Implemented (Frontend Prototype)

- **Professional Report Interface**: Clean, modern design with Laapak brand colors (dark green, gray, white)
- **Responsive Design**: Works perfectly on mobile devices and desktops
- **PWA Support**: Installation capabilities and offline functionality
- **Admin Dashboard**: For managing and creating reports
- **Multiple Report Sections**: 
  - General information
  - Technical tests with results
  - External physical inspection with image gallery
  - Notes section
  - Help links and actions

## Technical Implementation

- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5 (RTL support)
- **Backend**: Node.js with Express, MySQL database, Sequelize ORM
- **Authentication**: JWT-based authentication for both admin and client users
- **PWA Features**: 
  - Service worker for offline capabilities
  - Manifest file for installation
  - Caching strategies for offline access
  - Responsive design for all devices

## Getting Started

### Frontend Only
1. Clone this repository
2. Open the project folder
3. Start a local web server to preview the site
4. Access the site through your browser

### With Backend Authentication
1. Install Node.js and npm if not already installed
2. Install and set up MySQL database
3. Create a database named `laapak_report_system`
4. Configure database connection in `.env` file
5. Install dependencies: `npm install`
6. Start the server: `npm start`
7. Access the site at `http://localhost:3000`

### Database Setup
1. Install MySQL Server and MySQL Workbench
2. Create a new database:
   ```sql
   CREATE DATABASE laapak_report_system;
   ```
3. The application will automatically create the necessary tables and seed initial data on first run
4. Default admin credentials:
   - Username: `admin`, Password: `admin123`
   - Username: `tech`, Password: `tech123`
   - Username: `viewer`, Password: `viewer123`
5. Default client credentials:
   - Phone: `0501234567`, Order Code: `LP12345`
   - Phone: `0509876543`, Order Code: `LP67890`
   - Phone: `0553219876`, Order Code: `LP54321`

## Future Development Roadmap

- **✅ Backend Integration**: Node.js with Express and MySQL database (implemented)
- **✅ Authentication System**: JWT-based authentication for admin and client users (implemented)
- **CRUD Operations**: Complete data management for reports and users
- **PDF Generation**: Download reports as PDF documents
- **QR Code Integration**: For easy sharing
- **WhatsApp Integration**: Direct messaging to customers

## Project Structure

```
Laapak Report System/
├── css/
│   └── styles.css
├── js/
│   ├── main.js
│   ├── report.js
│   └── admin.js
├── img/
│   ├── icons/
│   └── laapak-logo.svg
├── index.html
├── report.html
├── admin.html
├── offline.html
├── service-worker.js
├── manifest.json
└── README.md
```
