# Fix PM2 Environment Variables Issue

## Problem
PM2 is not loading the `.env` file, causing the server to crash with:
```
Error: Missing required environment variable: DB_HOST
```

## Solution 1: Use PM2 Ecosystem File (Recommended)

1. **SSH into the server:**
   ```bash
   ssh deploy@82.112.253.29
   ```

2. **Navigate to project directory:**
   ```bash
   cd /home/deploy/laapak-projects/reports
   ```

3. **Verify .env file exists:**
   ```bash
   ls -la .env
   cat .env | grep DB_HOST
   ```

4. **Stop the current PM2 process:**
   ```bash
   pm2 stop laapak-reports
   pm2 delete laapak-reports
   ```

5. **Start using ecosystem file:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   ```

## Solution 2: Use dotenv-cli (Alternative)

1. **Install dotenv-cli:**
   ```bash
   npm install -g dotenv-cli
   ```

2. **Stop current process:**
   ```bash
   pm2 stop laapak-reports
   pm2 delete laapak-reports
   ```

3. **Start with dotenv-cli:**
   ```bash
   pm2 start "dotenv -e .env -- node backend/server.js" --name laapak-reports
   pm2 save
   ```

## Solution 3: Specify env vars directly in PM2 (Quick Fix)

1. **Stop current process:**
   ```bash
   pm2 stop laapak-reports
   pm2 delete laapak-reports
   ```

2. **Start with explicit env vars:**
   ```bash
   pm2 start backend/server.js --name laapak-reports \
     --env production \
     --update-env \
     -- DB_HOST=localhost \
     -- DB_USER=laapak \
     -- DB_PASSWORD=your_password \
     -- DB_NAME=laapak_report_system \
     -- DB_PORT=3306 \
     -- JWT_SECRET=your_jwt_secret \
     -- PORT=3001
   ```

   **OR** create a script that loads .env first:
   ```bash
   # Create start script
   cat > start-server.sh << 'EOF'
   #!/bin/bash
   cd /home/deploy/laapak-projects/reports
   export $(cat .env | xargs)
   node backend/server.js
   EOF
   
   chmod +x start-server.sh
   pm2 start start-server.sh --name laapak-reports
   ```

## Solution 4: Fix dotenv loading order

The issue might be that `dotenv.config()` is called after the db.js file tries to access env vars. 

**Check `backend/server.js`** - it should load dotenv FIRST:
```javascript
// This should be at the very top
require('dotenv').config();
```

Then all other requires come after.

## Verify Fix

After applying any solution:

1. **Check PM2 status:**
   ```bash
   pm2 status
   ```

2. **Check logs:**
   ```bash
   pm2 logs laapak-reports --lines 50
   ```

3. **Test API:**
   ```bash
   curl http://localhost:3001/api/health
   ```

4. **Verify env vars are loaded:**
   ```bash
   pm2 env laapak-reports
   ```

## Recommended: Use Ecosystem File

The `ecosystem.config.js` file has been created. Use it:

```bash
cd /home/deploy/laapak-projects/reports
pm2 stop laapak-reports
pm2 delete laapak-reports
pm2 start ecosystem.config.js
pm2 save
```

**Note:** PM2 ecosystem files don't automatically load .env files. You need to either:
- Use `dotenv-cli` 
- Or manually specify env vars in the ecosystem file
- Or use a startup script that loads .env first

## Quick Fix Script

Run this on the server:

```bash
cd /home/deploy/laapak-projects/reports

# Verify .env exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    exit 1
fi

# Stop PM2
pm2 stop laapak-reports 2>/dev/null
pm2 delete laapak-reports 2>/dev/null

# Create startup script that loads .env
cat > start-server.sh << 'EOF'
#!/bin/bash
cd /home/deploy/laapak-projects/reports
source <(cat .env | sed 's/^/export /')
exec node backend/server.js
EOF

chmod +x start-server.sh

# Start with PM2
pm2 start start-server.sh --name laapak-reports
pm2 save

# Check status
sleep 2
pm2 status
pm2 logs laapak-reports --lines 20
```

