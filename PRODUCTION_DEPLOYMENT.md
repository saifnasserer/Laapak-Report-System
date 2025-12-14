# Production Deployment Guide

## ✅ Port Configuration - Already Production Ready!

The current code **automatically detects** the environment and uses the correct URL:

- **Development (localhost)**: Uses `http://localhost:3001`
- **Production (reports.laapak.com)**: Uses `https://reports.laapak.com`

**No changes needed!** The code checks `window.location.hostname` and automatically switches.

## Pre-Deployment Checklist

### 1. Environment Variables (.env)

Ensure your production `.env` file has:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration (Production)
DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
DB_NAME=laapak_report_system
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_strong_production_secret_key_here

# API Configuration (if needed)
API_BASE_URL=https://reports.laapak.com
```

### 2. Backend Server Configuration

✅ **CORS is already configured** in `backend/server.js`:
- Includes `https://reports.laapak.com`
- Includes `https://www.reports.laapak.com`
- Includes other production domains

### 3. Frontend Configuration

✅ **Auto-detection is already working**:
- `config.js` automatically uses production URL when not on localhost
- `api-service.js` falls back to production URL
- `login.js` uses production URL in production

### 4. Database Setup

1. Ensure production MySQL database is running
2. Import the database schema:
   ```bash
   mysql -u [user] -p [database] < laapak_report_system.sql
   ```
3. Verify database connection in `.env`

### 5. Security Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Use strong database passwords
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set `NODE_ENV=production`
- [ ] Review CORS allowed origins
- [ ] Disable debug logging in production

### 6. Service Worker Cache

The service worker cache version is set to `v3-port3001`. When deploying:
- Users will automatically get the new cache version
- Old cached files will be cleared
- No manual intervention needed

### 7. Build/Deploy Steps

1. **Update environment variables**:
   ```bash
   # Copy .env.example to .env and fill in production values
   cp .env.example .env
   # Edit .env with production credentials
   ```

2. **Install dependencies**:
   ```bash
   npm install --production
   ```

3. **Start the server**:
   ```bash
   # Using PM2 (recommended)
   pm2 start backend/server.js --name laapak-reports --env production
   
   # Or using node directly
   NODE_ENV=production node backend/server.js
   ```

4. **Verify server is running**:
   ```bash
   curl https://reports.laapak.com/api/health
   ```

### 8. Testing Production Deployment

1. **Test API endpoints**:
   ```bash
   curl https://reports.laapak.com/api/health
   curl https://reports.laapak.com/api/auth/login
   ```

2. **Test frontend**:
   - Visit `https://reports.laapak.com`
   - Check browser console for API calls
   - Verify API calls go to `https://reports.laapak.com/api/...`
   - Test login functionality

3. **Verify database connection**:
   - Check server logs for "✅ Database connected successfully"
   - Test creating/reading data

## How the Port Detection Works

### Development (localhost)
```javascript
// When hostname is 'localhost' or '127.0.0.1'
baseUrl = 'http://localhost:3001'
```

### Production (reports.laapak.com)
```javascript
// When hostname is NOT localhost
baseUrl = 'https://reports.laapak.com'  // From config.js
// OR
baseUrl = window.location.origin  // Falls back to current domain
```

## Important Notes

1. **No code changes needed** - The port detection is automatic
2. **Production will use HTTPS** - The code uses `https://reports.laapak.com` when not on localhost
3. **CORS is configured** - Production domains are already in the allowed list
4. **Service worker** - Will automatically update cache version on deploy

## Troubleshooting

### If API calls fail in production:

1. Check browser console - should show `https://reports.laapak.com/api/...`
2. Verify server is running on production
3. Check CORS headers in network tab
4. Verify `.env` file has correct production database credentials
5. Check server logs for errors

### If still using localhost:3001 in production:

- Clear browser cache
- Unregister service worker
- Hard refresh (Ctrl+Shift+R)
- Check that `window.location.hostname` is not 'localhost'

## Deployment Commands Summary

```bash
# 1. Set production environment
export NODE_ENV=production

# 2. Install dependencies
npm install --production

# 3. Start with PM2 (recommended)
pm2 start backend/server.js --name laapak-reports --env production

# 4. Save PM2 configuration
pm2 save

# 5. Setup PM2 to start on boot
pm2 startup
```

## Monitoring

- Check PM2 status: `pm2 status`
- View logs: `pm2 logs laapak-reports`
- Monitor: `pm2 monit`

---

**✅ Your code is production-ready! Just update the .env file and deploy.**

