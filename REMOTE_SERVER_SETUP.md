# Remote Server Setup & Deployment Guide

## Quick Deployment Steps

### 1. SSH into Remote Server

```bash
ssh user@your-server-ip
# Or if you have SSH config:
ssh vps
```

### 2. Navigate to Project Directory

```bash
cd /path/to/Laapak-Report-System
# Common locations:
# - /var/www/Laapak-Report-System
# - /home/user/Laapak-Report-System
# - ~/Laapak-Report-System
```

### 3. Pull Latest Code from GitHub

```bash
git pull origin main
# Or if using master branch:
git pull origin master
```

### 4. Run Deployment Script

```bash
chmod +x deploy-remote.sh
./deploy-remote.sh
```

## Manual Deployment Steps (if script doesn't work)

### Step 1: Update Code

```bash
cd /path/to/Laapak-Report-System
git pull origin main
```

### Step 2: Install Dependencies

```bash
npm install --production
```

### Step 3: Verify Environment Variables

```bash
# Check .env file exists
cat .env

# Verify required variables are set:
# - DB_HOST
# - DB_USER
# - DB_PASSWORD
# - DB_NAME
# - DB_PORT
# - JWT_SECRET
# - PORT (should be 3001)
# - NODE_ENV=production
```

### Step 4: Test Database Connection

```bash
node -e "require('dotenv').config(); const { testConnection } = require('./backend/config/db'); testConnection().then(r => { console.log(r ? '✅ Connected' : '❌ Failed'); process.exit(r ? 0 : 1); });"
```

### Step 5: Restart Application with PM2

```bash
# If already running:
pm2 restart laapak-reports --update-env

# If not running:
pm2 start backend/server.js --name laapak-reports --env production
pm2 save
```

### Step 6: Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs laapak-reports --lines 50

# Test API
curl http://localhost:3001/api/health
```

## Production Environment Variables (.env)

Make sure your `.env` file on the remote server has:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration (Production)
DB_HOST=localhost
DB_USER=laapak
DB_PASSWORD=your_production_password
DB_NAME=laapak_report_system
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_strong_production_secret_key_here

# Optional
API_BASE_URL=https://reports.laapak.com
```

## Important Configuration Checks

### 1. Verify Port Configuration

The code automatically uses:
- **Development**: `http://localhost:3001` (when hostname is localhost)
- **Production**: `https://reports.laapak.com` (when hostname is reports.laapak.com)

**No changes needed** - it auto-detects!

### 2. Check CORS Configuration

Verify `backend/server.js` includes your production domain:
- `https://reports.laapak.com`
- `https://www.reports.laapak.com`

### 3. Database Setup

Ensure MySQL is running and database exists:

```bash
# Check MySQL status
sudo systemctl status mysql

# Connect to MySQL
mysql -u laapak -p

# Verify database exists
SHOW DATABASES;
USE laapak_report_system;
SHOW TABLES;
```

### 4. Service Worker Cache

The service worker cache version is `v3-port3001`. Users will automatically get the new version when they visit the site.

## Troubleshooting

### Issue: Application won't start

```bash
# Check PM2 logs
pm2 logs laapak-reports --lines 100

# Check for errors
pm2 logs laapak-reports --err

# Restart with fresh environment
pm2 delete laapak-reports
pm2 start backend/server.js --name laapak-reports --env production
```

### Issue: Database connection fails

```bash
# Test database connection manually
mysql -h [DB_HOST] -u [DB_USER] -p [DB_NAME]

# Check .env file
cat .env | grep DB_

# Verify MySQL is running
sudo systemctl status mysql
```

### Issue: Port already in use

```bash
# Check what's using port 3001
sudo lsof -i :3001
# Or
sudo netstat -tulpn | grep 3001

# Kill the process if needed
sudo kill -9 [PID]
```

### Issue: API calls still using wrong port

1. Clear browser cache
2. Unregister service worker in browser DevTools
3. Hard refresh (Ctrl+Shift+R)
4. Check browser console - should show `https://reports.laapak.com/api/...`

## PM2 Management Commands

```bash
# View status
pm2 status

# View logs
pm2 logs laapak-reports

# Restart
pm2 restart laapak-reports

# Stop
pm2 stop laapak-reports

# Delete
pm2 delete laapak-reports

# Monitor
pm2 monit

# Save current process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
pm2 save
```

## Post-Deployment Verification

1. **Test API Health**:
   ```bash
   curl https://reports.laapak.com/api/health
   ```

2. **Test Frontend**:
   - Visit `https://reports.laapak.com`
   - Open browser DevTools → Console
   - Verify API calls go to `https://reports.laapak.com/api/...`
   - Test login functionality

3. **Check Server Logs**:
   ```bash
   pm2 logs laapak-reports --lines 50
   ```

4. **Verify Database**:
   - Check logs for "✅ Database connected successfully"
   - Test creating/reading data through the UI

## Quick Deployment Command

For future updates, you can use this one-liner:

```bash
cd /path/to/Laapak-Report-System && git pull && npm install --production && pm2 restart laapak-reports --update-env
```

Or use the deployment script:

```bash
./deploy-remote.sh
```

---

**✅ After deployment, verify everything works and check the logs!**

