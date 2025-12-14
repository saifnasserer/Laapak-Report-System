# 🔑 How to Create Third-Party API Keys

## 📋 **Overview**

This guide shows you how to create API keys for third-party integrations with the Laapak Report System. There are multiple methods depending on your needs and technical setup.

## 🚀 **Method 1: Using Admin API Routes (Recommended)**

### **Step 1: Authenticate as Admin**

```bash
# Login to get admin token
curl -X POST "https://reports.laapak.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_admin_username",
    "password": "your_admin_password"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "isAdmin": true
  }
}
```

### **Step 2: Create API Key**

```bash
# Create new API key
curl -X POST "https://reports.laapak.com/api/admin/api-keys" \
  -H "Content-Type: application/json" \
  -H "x-auth-token: YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "key_name": "Third Party Integration Key",
    "client_id": null,
    "permissions": {
      "reports": {
        "read": true,
        "write": false,
        "delete": false
      },
      "invoices": {
        "read": true,
        "write": false,
        "delete": false
      },
      "clients": {
        "read": true,
        "write": false,
        "delete": false
      },
      "financial": {
        "read": false,
        "write": false,
        "delete": false
      }
    },
    "rate_limit": 1000,
    "expires_at": "2024-12-31T23:59:59Z",
    "ip_whitelist": "",
    "description": "API key for third-party integration"
  }'
```

**Response:**
```json
{
  "success": true,
  "apiKey": {
    "id": 1,
    "key_name": "Third Party Integration Key",
    "api_key": "ak_live_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "client_id": null,
    "permissions": {
      "reports": {"read": true, "write": false, "delete": false},
      "invoices": {"read": true, "write": false, "delete": false},
      "clients": {"read": true, "write": false, "delete": false},
      "financial": {"read": false, "write": false, "delete": false}
    },
    "rate_limit": 1000,
    "expires_at": "2024-12-31T23:59:59Z",
    "created_at": "2024-01-20T15:30:00Z"
  },
  "message": "API key created successfully. Store the key securely as it will not be shown again."
}
```

## 🛠️ **Method 2: Using Scripts (Automated)**

### **Option A: Simple Script**

```bash
# Run the simple script
cd /media/saif/brain/Laapak-Softwares/Laapak-Report-System
node scripts/create-api-key-simple.js
```

### **Option B: Full Script with Authentication**

```bash
# Set environment variables
export ADMIN_USERNAME="your_admin_username"
export ADMIN_PASSWORD="your_admin_password"
export API_BASE_URL="https://reports.laapak.com"

# Run the full script
node scripts/create-api-key.js
```

## 🎯 **Method 3: Direct Database (Advanced)**

### **Step 1: Connect to Database**

```bash
# Connect to MySQL
mysql -u laapak -plaapaksql laapak_report_system
```

### **Step 2: Create API Key Record**

```sql
-- Insert new API key
INSERT INTO api_keys (
    key_name,
    api_key,
    key_prefix,
    client_id,
    permissions,
    rate_limit,
    expires_at,
    ip_whitelist,
    description,
    created_by,
    is_active,
    created_at,
    updated_at
) VALUES (
    'Third Party Integration Key',
    SHA2('ak_live_your_generated_key_here', 256),
    'ak_live_',
    NULL,
    '{"reports":{"read":true,"write":false,"delete":false},"invoices":{"read":true,"write":false,"delete":false},"clients":{"read":true,"write":false,"delete":false},"financial":{"read":false,"write":false,"delete":false}}',
    1000,
    '2024-12-31 23:59:59',
    '',
    'API key for third-party integration',
    1,
    TRUE,
    NOW(),
    NOW()
);
```

## 🔧 **API Key Configuration Options**

### **Permission Levels**

```javascript
// Full Access
{
  "reports": {"read": true, "write": true, "delete": true},
  "invoices": {"read": true, "write": true, "delete": true},
  "clients": {"read": true, "write": true, "delete": true},
  "financial": {"read": true, "write": true, "delete": true}
}

// Read-Only Access
{
  "reports": {"read": true, "write": false, "delete": false},
  "invoices": {"read": true, "write": false, "delete": false},
  "clients": {"read": true, "write": false, "delete": false},
  "financial": {"read": false, "write": false, "delete": false}
}

// Reports Only
{
  "reports": {"read": true, "write": false, "delete": false},
  "invoices": {"read": false, "write": false, "delete": false},
  "clients": {"read": false, "write": false, "delete": false},
  "financial": {"read": false, "write": false, "delete": false}
}
```

### **Rate Limiting Options**

```javascript
// Different rate limits for different use cases
{
  "low_volume": 100,      // 100 requests/hour
  "standard": 1000,       // 1000 requests/hour
  "high_volume": 5000,    // 5000 requests/hour
  "unlimited": 100000     // 100,000 requests/hour
}
```

### **IP Whitelisting**

```javascript
// No restrictions
"ip_whitelist": ""

// Single IP
"ip_whitelist": "192.168.1.100"

// Multiple IPs
"ip_whitelist": "192.168.1.100,10.0.0.50,203.0.113.1"

// IP Range (if supported)
"ip_whitelist": "192.168.1.0/24"
```

## 🎯 **Common API Key Types**

### **1. System Integration Key**
```javascript
{
  "key_name": "System Integration Key",
  "client_id": null,
  "permissions": {
    "reports": {"read": true, "write": true, "delete": false},
    "invoices": {"read": true, "write": true, "delete": false},
    "clients": {"read": true, "write": true, "delete": false},
    "financial": {"read": true, "write": false, "delete": false}
  },
  "rate_limit": 5000,
  "expires_at": "2024-12-31T23:59:59Z",
  "ip_whitelist": "192.168.1.0/24",
  "description": "Full system integration access"
}
```

### **2. Client Portal Key**
```javascript
{
  "key_name": "Client Portal Key",
  "client_id": 1,
  "permissions": {
    "reports": {"read": true, "write": false, "delete": false},
    "invoices": {"read": true, "write": false, "delete": false},
    "clients": {"read": true, "write": false, "delete": false},
    "financial": {"read": false, "write": false, "delete": false}
  },
  "rate_limit": 1000,
  "expires_at": "2024-12-31T23:59:59Z",
  "ip_whitelist": "",
  "description": "Client-specific access for portal"
}
```

### **3. Read-Only Analytics Key**
```javascript
{
  "key_name": "Analytics Read-Only Key",
  "client_id": null,
  "permissions": {
    "reports": {"read": true, "write": false, "delete": false},
    "invoices": {"read": true, "write": false, "delete": false},
    "clients": {"read": true, "write": false, "delete": false},
    "financial": {"read": true, "write": false, "delete": false}
  },
  "rate_limit": 2000,
  "expires_at": "2024-12-31T23:59:59Z",
  "ip_whitelist": "10.0.0.0/8",
  "description": "Read-only access for analytics"
}
```

## 🧪 **Testing Your API Key**

### **1. Health Check**
```bash
curl -X GET "https://reports.laapak.com/api/v2/external/health" \
  -H "x-api-key: ak_live_your_api_key_here"
```

### **2. Test Client Verification**
```bash
curl -X POST "https://reports.laapak.com/api/v2/external/auth/verify-client" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ak_live_your_api_key_here" \
  -d '{
    "phone": "01128260256",
    "orderCode": "ORD123456"
  }'
```

### **3. Test Data Access**
```bash
curl -X GET "https://reports.laapak.com/api/v2/external/clients/1/reports?limit=5" \
  -H "x-api-key: ak_live_your_api_key_here"
```

## 🔒 **Security Best Practices**

### **1. API Key Security**
- ✅ **Store securely**: Use environment variables or secure vaults
- ✅ **Never expose**: Don't put keys in client-side code
- ✅ **Rotate regularly**: Change keys every 90 days
- ✅ **Monitor usage**: Check for unusual activity

### **2. Access Control**
- ✅ **Principle of least privilege**: Give minimum required permissions
- ✅ **IP whitelisting**: Restrict access to known IPs
- ✅ **Expiration dates**: Set reasonable expiration times
- ✅ **Rate limiting**: Prevent abuse with appropriate limits

### **3. Monitoring**
- ✅ **Usage tracking**: Monitor API key usage patterns
- ✅ **Error monitoring**: Watch for authentication failures
- ✅ **Performance monitoring**: Track response times
- ✅ **Security alerts**: Set up alerts for suspicious activity

## 🚨 **Troubleshooting**

### **Common Issues**

1. **"Invalid API key" error**
   - Check key format: `ak_live_[64-char-hash]`
   - Verify key is active in database
   - Check if key has expired

2. **"Insufficient permissions" error**
   - Review API key permissions
   - Check if trying to access restricted resources
   - Contact admin to update permissions

3. **"Rate limit exceeded" error**
   - Check current usage vs. rate limit
   - Implement exponential backoff
   - Contact admin to increase rate limit

4. **"IP not whitelisted" error**
   - Check IP whitelist configuration
   - Verify your current IP address
   - Contact admin to update whitelist

### **Debug Commands**

```bash
# Check API key status
curl -X GET "https://reports.laapak.com/api/v2/external/health" \
  -H "x-api-key: ak_live_your_api_key_here" \
  -v

# Test specific endpoint
curl -X GET "https://reports.laapak.com/api/v2/external/clients/1/reports" \
  -H "x-api-key: ak_live_your_api_key_here" \
  -v
```

## 📊 **Managing API Keys**

### **List All API Keys**
```bash
curl -X GET "https://reports.laapak.com/api/admin/api-keys" \
  -H "x-auth-token: YOUR_ADMIN_JWT_TOKEN"
```

### **Update API Key**
```bash
curl -X PUT "https://reports.laapak.com/api/admin/api-keys/1" \
  -H "Content-Type: application/json" \
  -H "x-auth-token: YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "rate_limit": 2000,
    "is_active": true
  }'
```

### **Regenerate API Key**
```bash
curl -X POST "https://reports.laapak.com/api/admin/api-keys/1/regenerate" \
  -H "x-auth-token: YOUR_ADMIN_JWT_TOKEN"
```

### **Delete API Key**
```bash
curl -X DELETE "https://reports.laapak.com/api/admin/api-keys/1" \
  -H "x-auth-token: YOUR_ADMIN_JWT_TOKEN"
```

## 📝 **Quick Reference**

### **API Key Format**
```
ak_live_[64-character-hex-string]
```

### **Required Headers**
```http
x-api-key: ak_live_your_api_key_here
Content-Type: application/json
```

### **Base URLs**
- **Development**: `http://localhost:3000/api/v2/external`
- **Production**: `https://reports.laapak.com/api/v2/external`

### **Rate Limits**
- **Default**: 1000 requests/hour
- **Burst**: 100 requests/minute
- **Response**: 429 with retry-after header

This guide provides everything you need to create and manage API keys for third-party integrations with the Laapak Report System.
