#!/bin/bash

# Configuration for Laapak Report System
REMOTE_USER="deploy"
REMOTE_HOST="82.112.253.29"
REMOTE_DB_CONTAINER="mysql-db"
REMOTE_DB_NAME="laapak_report_system"
REMOTE_DB_USER="laapak"
REMOTE_PASS="0000"  # VPS SSH/Sudo Password
REMOTE_DB_PASS="laapaksql" # MySQL Database Password

LOCAL_DB_NAME="laapak_report_system"
LOCAL_DB_USER="laapak"
LOCAL_DB_PASS="laapaksql"

DUMP_FILE="remote_report_dump_$(date +%Y%m%d_%H%M%S).sql"

echo "🚀 Starting database sync from $REMOTE_HOST..."

# 1. Generate dump on remote and stream it to local
echo "📥 Dumping remote database ($REMOTE_DB_NAME)..."
sshpass -p "$REMOTE_PASS" ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_HOST \
    "docker exec $REMOTE_DB_CONTAINER mysqldump -u $REMOTE_DB_USER -p$REMOTE_DB_PASS --no-tablespaces $REMOTE_DB_NAME" > $DUMP_FILE

if [ $? -ne 0 ] || [ ! -s "$DUMP_FILE" ]; then
    echo "❌ Failed to dump remote database or dump is empty."
    exit 1
fi

echo "✅ Remote dump saved to $DUMP_FILE ($(du -h $DUMP_FILE | cut -f1))"

# 2. Prepare local database (drop and recreate)
echo "🔄 Resetting local database ($LOCAL_DB_NAME)..."
mysql -u $LOCAL_DB_USER -p$LOCAL_DB_PASS -h localhost -e "DROP DATABASE IF EXISTS $LOCAL_DB_NAME; CREATE DATABASE $LOCAL_DB_NAME;"

if [ $? -ne 0 ]; then
    echo "❌ Failed to reset local database. Ensure your local MySQL is running and credentials are correct."
    exit 1
fi

# 3. Restore dump
echo "🏗️ Restoring dump to local database..."
mysql -u $LOCAL_DB_USER -p$LOCAL_DB_PASS -h localhost $LOCAL_DB_NAME < $DUMP_FILE

if [ $? -ne 0 ]; then
    echo "❌ Failed to restore database."
    exit 1
fi

# 4. Cleanup
echo "🧹 Cleaning up..."
rm $DUMP_FILE

echo "✨ Database sync complete! Your local $LOCAL_DB_NAME is now updated."
