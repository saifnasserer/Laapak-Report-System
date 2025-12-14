# API Endpoint Recommendation for Client Reports

## Current Situation

**Problem:** 
- When using JWT authentication, clients are fetching all reports (72 reports) instead of just their own
- The endpoint `/api/reports` returns all reports and requires client-side filtering
- This is inefficient and exposes unnecessary data

## Recommended Endpoint

### Option 1: `/api/reports/me` (Recommended)

**Endpoint:** `GET /api/reports/me`

**Authentication:** JWT Token (x-auth-token header)

**Description:**
- Automatically identifies the client from the JWT token
- Returns only reports belonging to the authenticated client
- No need to pass client_id in the URL

**Query Parameters:**
- `status`: Filter by status (`active`, `completed`, `cancelled`, etc.)
- `startDate`: Filter from date (`2024-01-01`)
- `endDate`: Filter to date (`2024-01-31`)
- `deviceModel`: Filter by device model
- `limit`: Number of results (default: 50, max: 100)
- `offset`: Pagination offset (default: 0)
- `sortBy`: Sort field (`created_at`, `inspection_date`, `status`)
- `sortOrder`: Sort direction (`ASC`, `DESC`)

**Example Request:**
```http
GET /api/reports/me?limit=1&sortBy=created_at&sortOrder=DESC
x-auth-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response:**
```json
{
  "success": true,
  "reports": [
    {
      "id": "RPT123456",
      "device_model": "iPhone 15 Pro",
      "serial_number": "ABC123456789",
      "inspection_date": "2024-01-15T10:00:00Z",
      "hardware_status": "[{\"component\": \"screen\", \"status\": \"good\"}]",
      "external_images": "[\"image1.jpg\", \"image2.jpg\"]",
      "notes": "Screen has minor scratches",
      "status": "active",
      "billing_enabled": true,
      "amount": "500.00",
      "invoice_created": true,
      "invoice_id": "INV123456",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 1,
    "offset": 0,
    "hasMore": false
  }
}
```

**Backend Implementation Notes:**
1. Extract client_id from JWT token payload
2. Query reports where `client_id` matches the authenticated client
3. Apply query parameters (filters, pagination, sorting)
4. Return only the client's reports

---

### Option 2: `/api/clients/me/reports` (Alternative)

**Endpoint:** `GET /api/clients/me/reports`

**Same functionality as Option 1, but follows RESTful pattern of `/clients/{id}/reports`**

---

### Option 3: Enhance `/api/clients/{client_id}/reports` (If modifying existing endpoint)

**Current:** `/api/clients/{client_id}/reports` (might require admin permissions)

**Enhancement:** 
- If JWT token belongs to a client (not admin), automatically filter by the authenticated client's ID
- Ignore the `{client_id}` parameter if the authenticated user is a client
- Only allow admins to query other clients' reports

**Example:**
```javascript
// Backend logic
if (user.role === 'client') {
  // Use authenticated client's ID, ignore URL parameter
  clientId = user.clientId;
} else if (user.role === 'admin') {
  // Admin can query any client
  clientId = req.params.clientId;
}
```

---

## Why `/api/reports/me` is Recommended

1. **Security:** Client can only access their own reports (enforced by backend)
2. **Simplicity:** No need to pass client_id in URL
3. **Standard Pattern:** `/me` endpoints are common in REST APIs
4. **Efficiency:** Backend filters at database level, not client-side
5. **Clear Intent:** The endpoint name clearly indicates "my reports"

---

## Implementation in Flutter App

Once the endpoint is added, update the API service:

```dart
/// Get authenticated client's reports (JWT only)
Future<Map<String, dynamic>> getMyReports({
  String? status,
  String? startDate,
  String? endDate,
  String? deviceModel,
  int? limit,
  int? offset,
  String? sortBy,
  String? sortOrder,
}) async {
  assert(jwtToken != null, 'JWT token is required for this operation');
  
  final queryParams = <String, String>{};
  if (status != null) queryParams['status'] = status;
  if (startDate != null) queryParams['startDate'] = startDate;
  if (endDate != null) queryParams['endDate'] = endDate;
  if (deviceModel != null) queryParams['deviceModel'] = deviceModel;
  if (limit != null) queryParams['limit'] = limit.toString();
  if (offset != null) queryParams['offset'] = offset.toString();
  if (sortBy != null) queryParams['sortBy'] = sortBy;
  if (sortOrder != null) queryParams['sortOrder'] = sortOrder;
  
  return await _makeRequest(
    '/reports/me',
    'GET',
    queryParams: queryParams,
  );
}
```

---

## Summary

**Add this endpoint to your API:**
- **Path:** `GET /api/reports/me`
- **Auth:** JWT Token (x-auth-token)
- **Behavior:** Returns only reports for the authenticated client
- **Benefits:** 
  - More secure (client can't access other clients' data)
  - More efficient (server-side filtering)
  - Simpler (no client_id needed)
  - Better performance (only fetches relevant data)

