# Laapak Report System - API Key Setup Guide

## Quick Start for API Access

### Option 1: Use Existing Admin Account

If you have admin credentials, use them to get a token:

```bash
# Get admin token
curl -X POST http://localhost:3000/api/auth/admin \
  -H "Content-Type: application/json" \
  -d '{"username": "your_admin_username", "password": "your_admin_password"}'
```

### Option 2: Create New Admin Account

If you don't have admin credentials, you can create one by accessing the database directly or using the admin creation endpoint (if you have superadmin access).

### Option 3: Use Client Account

If you have a client account:

```bash
# Get client token
curl -X POST http://localhost:3000/api/clients/auth \
  -H "Content-Type: application/json" \
  -d '{"phone": "1234567890", "orderCode": "ORD123456"}'
```

## Step-by-Step Setup

### 1. Check if Server is Running

```bash
# Test server connection
curl http://localhost:3000/api/health
```

### 2. Get Authentication Token

Choose one of the methods above to get a token.

### 3. Use Token for API Calls

```bash
# Example: Get all reports
curl -X GET http://localhost:3000/api/reports \
  -H "x-auth-token: YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

## JavaScript Integration

```javascript
// Simple API client
class LaapakAPI {
    constructor(baseUrl = 'http://localhost:3000/api') {
        this.baseUrl = baseUrl;
        this.token = null;
    }

    async login(username, password) {
        const response = await fetch(`${this.baseUrl}/auth/admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        this.token = data.token;
        return data;
    }

    async getReports() {
        const response = await fetch(`${this.baseUrl}/reports`, {
            headers: {
                'x-auth-token': this.token,
                'Content-Type': 'application/json'
            }
        });
        
        return await response.json();
    }
}

// Usage
const api = new LaapakAPI();
await api.login('your_username', 'your_password');
const reports = await api.getReports();
console.log(reports);
```

## Python Integration

```python
import requests

class LaapakAPI:
    def __init__(self, base_url='http://localhost:3000/api'):
        self.base_url = base_url
        self.token = None

    def login(self, username, password):
        response = requests.post(f"{self.base_url}/auth/admin", 
                               json={"username": username, "password": password})
        response.raise_for_status()
        data = response.json()
        self.token = data['token']
        return data

    def get_reports(self):
        headers = {'x-auth-token': self.token}
        response = requests.get(f"{self.base_url}/reports", headers=headers)
        response.raise_for_status()
        return response.json()

# Usage
api = LaapakAPI()
api.login('your_username', 'your_password')
reports = api.get_reports()
print(reports)
```

## Troubleshooting

### Common Issues

1. **"Unauthorized" Error**
   - Make sure you're including the `x-auth-token` header
   - Check if your token has expired
   - Verify you're using the correct authentication endpoint

2. **"Connection Refused" Error**
   - Make sure the server is running on port 3000
   - Check if the API URL is correct
   - Verify network connectivity

3. **"Invalid Credentials" Error**
   - Check your username and password
   - Make sure the admin account exists
   - Verify the account is active

### Test Your Setup

Run the test script to verify everything is working:

```bash
node test-api-access.js
```

## Environment Variables

Make sure these environment variables are set:

```bash
# Required
JWT_SECRET=your-secret-key-here
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=laapak_report_system

# Optional
PORT=3000
NODE_ENV=development
```

## Security Notes

- Never commit tokens to version control
- Use environment variables for sensitive data
- Implement token refresh mechanism
- Use HTTPS in production
- Set strong JWT secrets

## Support

If you're still having issues:

1. Check the server logs for detailed error messages
2. Verify your database connection
3. Ensure all environment variables are set
4. Test with the provided test script
5. Contact the system administrator

This should get you up and running with API access to the Laapak Report System!
