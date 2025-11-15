# Remote Server Commands - 82.112.253.29

## Quick Setup Commands

### 1. SSH into Server

```bash
ssh deploy@82.112.253.29
```

### 2. Navigate to Project Directory

```bash
# Try these common locations:
cd /var/www/Laapak-Report-System
# OR
cd /home/deploy/Laapak-Report-System
# OR
cd ~/Laapak-Report-System

# If not sure, find it:
find / -name "Laapak-Report-System" -type d 2>/dev/null | head -5
```

### 3. Run Setup Script

```bash
# Make script executable
chmod +x setup-remote-server.sh

# Run setup
./setup-remote-server.sh
```

## Manual Setup (If Script Doesn't Work)

### Step 1: Update Code

```bash
cd /path/to/Laapak-Report-System
git pull origin main
```

### Step 2: Install Dependencies

```bash
npm install --production
```

### Step 3: Configure Environment

```bash
# Check if .env exists
ls -la .env

# If not, create it:
nano .env
```

Add this content (adjust values as needed):

```env
PORT=3001
NODE_ENV=production
DB_HOST=localhost
DB_USER=laapak
DB_PASSWORD=laapaksql
DB_NAME=laapak_report_system
DB_PORT=3306
JWT_SECRET=your_strong_production_secret_here
API_BASE_URL=https://reports.laapak.com
```

### Step 4: Test Database

```bash
# Test MySQL connection
mysql -u laapak -p laapak_report_system

# If database doesn't exist, create it:
mysql -u root -p << EOF
CREATE DATABASE IF NOT EXISTS laapak_report_system;
GRANT ALL PRIVILEGES ON laapak_report_system.* TO 'laapak'@'localhost';
FLUSH PRIVILEGES;
EOF

# Test connection from Node
node -e "require('dotenv').config(); const { testConnection } = require('./backend/config/db'); testConnection().then(r => console.log(r ? 'OK' : 'FAIL'));"
```

### Step 5: Setup PM2

```bash
# Install PM2 if not installed
npm install -g pm2

# Stop existing process (if any)
pm2 stop laapak-reports 2>/dev/null || true
pm2 delete laapak-reports 2>/dev/null || true

# Start application
pm2 start backend/server.js --name laapak-reports --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs
pm2 save
```

### Step 6: Verify

```bash
# Check status
pm2 status

# Check logs
pm2 logs laapak-reports --lines 50

# Test API
curl http://localhost:3001/api/health
```

## Quick Update Commands (For Future Updates)

### Option 1: Use Deployment Script

```bash
cd /path/to/Laapak-Report-System
./deploy-remote.sh
```

### Option 2: Manual Update

```bash
cd /path/to/Laapak-Report-System
git pull origin main
npm install --production
pm2 restart laapak-reports --update-env
pm2 logs laapak-reports --lines 30
```

## Troubleshooting Commands

### Check Application Status

```bash
pm2 status
pm2 logs laapak-reports --lines 100
pm2 monit
```

### Check Database

```bash
# Check MySQL status
sudo systemctl status mysql

# Connect to database
mysql -u laapak -p laapak_report_system

# Check tables
mysql -u laapak -p -e "USE laapak_report_system; SHOW TABLES;"
```

### Check Port Usage

```bash
# Check if port 3001 is in use
sudo lsof -i :3001
sudo netstat -tulpn | grep 3001
```

### Restart Services

```bash
# Restart application
pm2 restart laapak-reports

# Restart MySQL (if needed)
sudo systemctl restart mysql

# Restart Nginx (if using reverse proxy)
sudo systemctl restart nginx
```

### Check Environment

```bash
# Verify .env file
cat .env

# Test environment loading
node -e "require('dotenv').config(); console.log('PORT:', process.env.PORT); console.log('DB_HOST:', process.env.DB_HOST);"
```

## Verification Checklist

After setup, verify:

1. ✅ PM2 process is running: `pm2 status`
2. ✅ API responds: `curl http://localhost:3001/api/health`
3. ✅ Database connected: Check PM2 logs for "✅ Database connected"
4. ✅ Site accessible: Visit `https://reports.laapak.com`
5. ✅ API uses production URL: Check browser console - should see `https://reports.laapak.com/api/...`

## Common Issues & Solutions

### Issue: "Cannot find module"
```bash
cd /path/to/Laapak-Report-System
rm -rf node_modules
npm install --production
```

### Issue: "Port already in use"
```bash
# Find what's using port 3001
sudo lsof -i :3001
# Kill the process
sudo kill -9 [PID]
# Restart PM2
pm2 restart laapak-reports
```

### Issue: "Database connection failed"
```bash
# Check MySQL is running
sudo systemctl status mysql
# Check credentials in .env
cat .env | grep DB_
# Test connection manually
mysql -u laapak -p laapak_report_system
```

### Issue: "PM2 process keeps crashing"
```bash
# Check logs for errors
pm2 logs laapak-reports --err --lines 100
# Check .env file
cat .env
# Restart with fresh environment
pm2 delete laapak-reports
pm2 start backend/server.js --name laapak-reports --env production
```

---

**Run these commands on the remote server to complete setup!**

