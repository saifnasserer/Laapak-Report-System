#!/bin/bash

# Laapak Report System - Complete Remote Server Setup
# Run this on the remote server: ssh deploy@82.112.253.29

set -e

echo "=========================================="
echo "Laapak Report System - Remote Setup"
echo "Server: 82.112.253.29"
echo "=========================================="

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Detect project directory
if [ -d "/var/www/Laapak-Report-System" ]; then
    PROJECT_DIR="/var/www/Laapak-Report-System"
elif [ -d "/home/deploy/Laapak-Report-System" ]; then
    PROJECT_DIR="/home/deploy/Laapak-Report-System"
elif [ -d "$HOME/Laapak-Report-System" ]; then
    PROJECT_DIR="$HOME/Laapak-Report-System"
else
    echo -e "${RED}✗ Project directory not found. Please navigate to the project directory first.${NC}"
    echo "Common locations:"
    echo "  - /var/www/Laapak-Report-System"
    echo "  - /home/deploy/Laapak-Report-System"
    echo "  - ~/Laapak-Report-System"
    exit 1
fi

cd "$PROJECT_DIR"
echo -e "${GREEN}✓ Using project directory: $PROJECT_DIR${NC}"

echo ""
echo -e "${YELLOW}Step 1: Pulling latest code from GitHub...${NC}"
git fetch origin
git pull origin main || git pull origin master
echo -e "${GREEN}✓ Code updated${NC}"

echo ""
echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
npm install --production
echo -e "${GREEN}✓ Dependencies installed${NC}"

echo ""
echo -e "${YELLOW}Step 3: Checking .env file...${NC}"
if [ ! -f .env ]; then
    echo -e "${RED}✗ .env file not found!${NC}"
    echo "Creating .env from template..."
    cat > .env << 'EOF'
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_USER=laapak
DB_PASSWORD=laapaksql
DB_NAME=laapak_report_system
DB_PORT=3306

# JWT Configuration
JWT_SECRET=CHANGE_THIS_TO_STRONG_SECRET_IN_PRODUCTION

# API Configuration
API_BASE_URL=https://reports.laapak.com
EOF
    echo -e "${YELLOW}⚠ Created .env file. Please edit it with production values!${NC}"
    echo "Edit with: nano .env"
    read -p "Press Enter after editing .env file..."
fi

# Check required variables
echo ""
echo -e "${YELLOW}Step 4: Verifying environment variables...${NC}"
REQUIRED_VARS=("DB_HOST" "DB_USER" "DB_PASSWORD" "DB_NAME" "JWT_SECRET")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" .env 2>/dev/null; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}✗ Missing variables: ${MISSING_VARS[*]}${NC}"
    echo "Please add them to .env file"
    exit 1
fi

# Check if JWT_SECRET is still default
if grep -q "CHANGE_THIS" .env; then
    echo -e "${YELLOW}⚠ WARNING: JWT_SECRET appears to be default. Change it in production!${NC}"
fi

echo -e "${GREEN}✓ Environment variables configured${NC}"

echo ""
echo -e "${YELLOW}Step 5: Testing database connection...${NC}"
node -e "
require('dotenv').config();
const { testConnection } = require('./backend/config/db');
testConnection().then(result => {
    if (result) {
        console.log('✅ Database connection successful');
        process.exit(0);
    } else {
        console.error('❌ Database connection failed');
        process.exit(1);
    }
}).catch(err => {
    console.error('❌ Database error:', err.message);
    process.exit(1);
});
" || {
    echo -e "${RED}✗ Database connection failed${NC}"
    echo "Please check:"
    echo "  1. MySQL is running: sudo systemctl status mysql"
    echo "  2. Database exists: mysql -u laapak -p -e 'SHOW DATABASES;'"
    echo "  3. .env file has correct credentials"
    exit 1
}

echo ""
echo -e "${YELLOW}Step 6: Checking PM2 installation...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi
echo -e "${GREEN}✓ PM2 available${NC}"

echo ""
echo -e "${YELLOW}Step 7: Setting up PM2 process...${NC}"

# Stop existing process if running
if pm2 list | grep -q "laapak-reports"; then
    echo "Stopping existing process..."
    pm2 stop laapak-reports || true
    pm2 delete laapak-reports || true
fi

# Start with PM2
echo "Starting application..."
pm2 start backend/server.js --name laapak-reports --env production
pm2 save

# Setup PM2 to start on boot
echo "Setting up PM2 startup..."
pm2 startup | tail -1 | bash || {
    echo -e "${YELLOW}⚠ Could not setup PM2 startup automatically${NC}"
    echo "Run manually: pm2 startup"
}

echo -e "${GREEN}✓ PM2 process started${NC}"

echo ""
echo -e "${YELLOW}Step 8: Waiting for server to start...${NC}"
sleep 5

echo ""
echo -e "${YELLOW}Step 9: Testing API endpoint...${NC}"
PORT=$(grep "^PORT=" .env 2>/dev/null | cut -d '=' -f2 | tr -d '"' || echo "3001")
API_URL="http://localhost:${PORT}"

if curl -f -s "${API_URL}/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API health check passed${NC}"
else
    echo -e "${YELLOW}⚠ API health check failed (checking logs...)${NC}"
    pm2 logs laapak-reports --lines 20 --nostream
fi

echo ""
echo -e "${YELLOW}Step 10: Checking application status...${NC}"
pm2 status laapak-reports

echo ""
echo -e "${GREEN}=========================================="
echo -e "✓ Setup completed!"
echo -e "==========================================${NC}"
echo ""
echo "Application Status:"
pm2 list | grep laapak-reports || echo "Check with: pm2 status"
echo ""
echo "Useful commands:"
echo "  - View logs: pm2 logs laapak-reports"
echo "  - Monitor: pm2 monit"
echo "  - Restart: pm2 restart laapak-reports"
echo "  - Status: pm2 status"
echo ""
echo "Next steps:"
echo "  1. Verify site is accessible: https://reports.laapak.com"
echo "  2. Check browser console - API calls should use https://reports.laapak.com"
echo "  3. Test login functionality"
echo ""

