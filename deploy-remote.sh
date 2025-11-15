#!/bin/bash

# Laapak Report System - Remote Server Deployment Script
# Run this script on the remote server after pulling latest code from GitHub

set -e  # Exit on error

echo "=========================================="
echo "Laapak Report System - Remote Deployment"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the project directory (assuming script is run from project root)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo -e "${YELLOW}Step 1: Pulling latest code from GitHub...${NC}"
git pull origin main || git pull origin master
echo -e "${GREEN}✓ Code updated${NC}"

echo -e "${YELLOW}Step 2: Installing/updating dependencies...${NC}"
npm install --production
echo -e "${GREEN}✓ Dependencies installed${NC}"

echo -e "${YELLOW}Step 3: Checking environment variables...${NC}"
if [ ! -f .env ]; then
    echo -e "${RED}✗ .env file not found!${NC}"
    echo "Please create .env file with production configuration"
    exit 1
fi

# Check required env vars
REQUIRED_VARS=("DB_HOST" "DB_USER" "DB_PASSWORD" "DB_NAME" "JWT_SECRET")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" .env; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}✗ Missing required environment variables: ${MISSING_VARS[*]}${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment variables configured${NC}"

echo -e "${YELLOW}Step 4: Testing database connection...${NC}"
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
"

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Database connection failed. Please check your .env configuration.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Database connection verified${NC}"

echo -e "${YELLOW}Step 5: Checking if PM2 is installed...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠ PM2 not found. Installing PM2...${NC}"
    npm install -g pm2
fi
echo -e "${GREEN}✓ PM2 available${NC}"

echo -e "${YELLOW}Step 6: Restarting application with PM2...${NC}"

# Check if app is already running
if pm2 list | grep -q "laapak-reports"; then
    echo "Restarting existing PM2 process..."
    pm2 restart laapak-reports --update-env
else
    echo "Starting new PM2 process..."
    pm2 start backend/server.js --name laapak-reports --env production
fi

# Save PM2 configuration
pm2 save

echo -e "${GREEN}✓ Application restarted${NC}"

echo -e "${YELLOW}Step 7: Checking application status...${NC}"
sleep 2
pm2 status laapak-reports

echo -e "${YELLOW}Step 8: Testing API endpoint...${NC}"
sleep 3

# Try to get the port from .env or use default
PORT=$(grep "^PORT=" .env 2>/dev/null | cut -d '=' -f2 || echo "3001")
API_URL="http://localhost:${PORT}"

if curl -f -s "${API_URL}/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API health check passed${NC}"
else
    echo -e "${YELLOW}⚠ API health check failed (server may still be starting)${NC}"
    echo "Check logs with: pm2 logs laapak-reports"
fi

echo ""
echo -e "${GREEN}=========================================="
echo -e "✓ Deployment completed successfully!"
echo -e "==========================================${NC}"
echo ""
echo "Next steps:"
echo "  - Check logs: pm2 logs laapak-reports"
echo "  - Monitor: pm2 monit"
echo "  - View status: pm2 status"
echo ""
echo "If you encounter issues:"
echo "  - Check .env file configuration"
echo "  - Verify database is accessible"
echo "  - Check PM2 logs: pm2 logs laapak-reports --lines 50"
echo ""

