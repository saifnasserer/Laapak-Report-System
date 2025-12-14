#!/bin/bash

# MySQL Database Setup Script for Laapak Report System
# This script will:
# 1. Start MySQL service
# 2. Create database and user
# 3. Import the SQL dump file

set -e  # Exit on error

echo "=========================================="
echo "MySQL Database Setup for Laapak Report System"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Database configuration from .env
DB_HOST="localhost"
DB_USER="laapak"
DB_PASSWORD="laapaksql"
DB_NAME="laapak_report_system"
DB_PORT="3306"
SQL_FILE="laapak_report_system.sql"

echo -e "${YELLOW}Step 1: Starting MySQL service...${NC}"
sudo systemctl start mysql
sudo systemctl enable mysql
echo -e "${GREEN}✓ MySQL service started${NC}"

# Wait a moment for MySQL to be ready
sleep 2

echo -e "${YELLOW}Step 2: Checking MySQL connection...${NC}"
if ! sudo mysql -e "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}✗ Cannot connect to MySQL. Please check MySQL installation.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ MySQL connection successful${NC}"

echo -e "${YELLOW}Step 3: Creating database '${DB_NAME}'...${NC}"
sudo mysql -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || {
    echo -e "${RED}✗ Failed to create database${NC}"
    exit 1
}
echo -e "${GREEN}✓ Database created${NC}"

echo -e "${YELLOW}Step 4: Creating user '${DB_USER}'...${NC}"
sudo mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';" || {
    echo -e "${YELLOW}⚠ User might already exist, continuing...${NC}"
}

echo -e "${YELLOW}Step 5: Granting privileges...${NC}"
sudo mysql -e "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
echo -e "${GREEN}✓ User privileges granted${NC}"

echo -e "${YELLOW}Step 6: Importing SQL file '${SQL_FILE}'...${NC}"
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}✗ SQL file not found: ${SQL_FILE}${NC}"
    exit 1
fi

sudo mysql -u root "${DB_NAME}" < "${SQL_FILE}" || {
    echo -e "${RED}✗ Failed to import SQL file${NC}"
    exit 1
}
echo -e "${GREEN}✓ SQL file imported successfully${NC}"

echo -e "${YELLOW}Step 7: Verifying database setup...${NC}"
TABLE_COUNT=$(sudo mysql -u root -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '${DB_NAME}';" -s -N 2>/dev/null || echo "0")
echo -e "${GREEN}✓ Database contains ${TABLE_COUNT} tables${NC}"

echo ""
echo -e "${GREEN}=========================================="
echo -e "✓ Database setup completed successfully!"
echo -e "==========================================${NC}"
echo ""
echo "Database Configuration:"
echo "  Host: ${DB_HOST}"
echo "  Port: ${DB_PORT}"
echo "  Database: ${DB_NAME}"
echo "  User: ${DB_USER}"
echo ""
echo "You can now start your application server!"

