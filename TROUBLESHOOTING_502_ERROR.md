# Troubleshooting 502 Bad Gateway Error

## Understanding the Error

A **502 Bad Gateway** error means:
- The frontend is trying to reach the backend API
- But it's hitting a proxy server (like nginx) that can't connect to the backend
- OR the backend server is not running/accessible

The error shows HTML instead of JSON because the proxy returns an HTML error page.

## Common Causes

### 1. Backend Server Not Running
**Solution:** Start the backend server
```bash
cd /path/to/Laapak-Report-System
npm start
# OR
node backend/server.js
```

### 2. Wrong API URL
**Check:** Open browser console and look for the API URL being used
- Should be: `http://localhost:3001/api/auth/admin` (for localhost)
- Should be: `https://reports.laapak.com/api/auth/admin` (for production)

**Solution:** Verify the frontend is using the correct URL:
```javascript
// Check in browser console:
console.log('API URL:', window.config?.api?.baseUrl);
```

### 3. Proxy/nginx Configuration Issue
If you're using nginx as a reverse proxy:
- Check nginx configuration
- Verify backend is accessible from nginx
- Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`

### 4. Port Mismatch
**Check:** Server should be on port 3001
```bash
# Check if server is listening
netstat -tlnp | grep 3001
# OR
ss -tlnp | grep 3001
```

### 5. CORS Issues
**Check:** Backend CORS configuration in `backend/server.js`
- Should include your frontend origin
- Check browser console for CORS errors

## Quick Diagnostic Steps

### Step 1: Check if Backend is Running
```bash
curl http://localhost:3001/api/health
```
**Expected:** `{"status":"ok","message":"System is healthy",...}`

### Step 2: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to login
4. Check the failed request:
   - **Request URL**: What URL is it trying to hit?
   - **Status Code**: Should be 200, not 502
   - **Response**: Should be JSON, not HTML

### Step 3: Check Server Logs
```bash
# If using PM2
pm2 logs laapak-reports

# If running directly
# Check terminal where server is running
```

### Step 4: Test API Directly
```bash
# Test admin login endpoint
curl -X POST http://localhost:3001/api/auth/admin \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

## Solutions

### Solution 1: Fix API URL in Frontend
If the frontend is using the wrong URL:

1. **Check `frontend/public/scripts/core/config.js`**:
```javascript
baseUrl: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
    ? 'http://localhost:3001' 
    : 'https://reports.laapak.com',
```

2. **Check `frontend/public/scripts/core/login.js`**:
   - Should use `ADMIN_LOGIN_URL` which is built from `API_URL`
   - Verify `API_URL` is correct

### Solution 2: Start Backend Server
```bash
cd /media/saif/brain/Projects/Laapak-Softwares/Laapak-Report-System
npm start
```

### Solution 3: Fix nginx Configuration (if using proxy)
```nginx
location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### Solution 4: Check Environment Variables
```bash
# Check .env file
cat .env | grep PORT
# Should show: PORT=3001
```

## Improved Error Handling

The code has been updated to:
1. Detect HTML responses (proxy errors)
2. Provide helpful error messages in Arabic
3. Guide users to check server status

## Testing After Fix

1. **Test health endpoint:**
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **Test admin login:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/admin \
     -H "Content-Type: application/json" \
     -d '{"username":"your_username","password":"your_password"}'
   ```

3. **Test in browser:**
   - Open browser console
   - Try to login
   - Check for any errors
   - Verify API calls go to correct URL

## Still Having Issues?

1. Check server logs for errors
2. Verify database connection
3. Check firewall settings
4. Verify JWT_SECRET is set in .env
5. Check if port 3001 is available

