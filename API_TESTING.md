# Gas Station RFID API - Testing Guide

Complete guide to test all API endpoints using curl or Postman.

## Prerequisites

- Backend server running at `http://localhost:3000`
- PostgreSQL database running
- Database migrated and seeded

## Base URL

```
http://localhost:3000/api/v1
```

---

## 1. Authentication

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "user": {
      "id": 1,
      "username": "admin",
      "fullName": "System Administrator",
      "role": "ADMIN"
    }
  }
}
```

**Save the token for subsequent requests!**

```bash
export TOKEN="your-access-token-here"
```

### Get Current User Info

```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Logout

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

---

## 2. Gas Stations

### Get All Stations

```bash
curl http://localhost:3000/api/v1/stations \
  -H "Authorization: Bearer $TOKEN"
```

**With pagination and filtering:**
```bash
curl "http://localhost:3000/api/v1/stations?page=1&limit=10&status=ACTIVE" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Single Station

```bash
curl http://localhost:3000/api/v1/stations/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Create Station (Admin Only)

```bash
curl -X POST http://localhost:3000/api/v1/stations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Shell Centar",
    "location": "Centar, Skopje"
  }'
```

### Update Station (Admin Only)

```bash
curl -X PUT http://localhost:3000/api/v1/stations/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "MAINTENANCE"
  }'
```

### Delete Station (Admin Only)

```bash
curl -X DELETE http://localhost:3000/api/v1/stations/3 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 3. Pumps

### Get Pumps for a Station

```bash
curl http://localhost:3000/api/v1/stations/1/pumps \
  -H "Authorization: Bearer $TOKEN"
```

### Get Single Pump

```bash
curl http://localhost:3000/api/v1/pumps/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Create Pump (Admin Only)

```bash
curl -X POST http://localhost:3000/api/v1/stations/1/pumps \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pumpNumber": 4,
    "mainRfidTag": "MAIN-TAG-005",
    "expectedChildTags": [
      {
        "tagId": "CHILD-005-A",
        "description": "Top seal"
      },
      {
        "tagId": "CHILD-005-B",
        "description": "Bottom seal"
      }
    ]
  }'
```

### Update Pump Status (Admin Only)

```bash
curl -X PUT http://localhost:3000/api/v1/pumps/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "LOCKED"
  }'
```

### Delete Pump (Admin Only)

```bash
curl -X DELETE http://localhost:3000/api/v1/pumps/4 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4. RFID Verification

### Verify RFID Tags (THE MAIN FEATURE!)

**Successful verification:**
```bash
curl -X POST http://localhost:3000/api/v1/pumps/1/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mainTagScanned": "MAIN-TAG-001",
    "scannedChildTags": ["CHILD-001-A", "CHILD-001-B", "CHILD-001-C"]
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": 1,
    "result": "success",
    "message": "All RFID tags verified successfully. Pump is secure.",
    "details": {
      "expectedCount": 3,
      "scannedCount": 3,
      "missingTags": [],
      "unexpectedTags": []
    },
    "pumpStatus": "LOCKED",
    "timestamp": "2025-11-09T12:00:00.000Z"
  }
}
```

**Failed verification (missing tag):**
```bash
curl -X POST http://localhost:3000/api/v1/pumps/1/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mainTagScanned": "MAIN-TAG-001",
    "scannedChildTags": ["CHILD-001-A", "CHILD-001-B"]
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": 2,
    "result": "failed",
    "message": "ALERT: 1 tag(s) missing or broken. Pump may have been tampered with!",
    "details": {
      "expectedCount": 3,
      "scannedCount": 2,
      "missingTags": ["CHILD-001-C"],
      "unexpectedTags": []
    },
    "pumpStatus": "BROKEN",
    "timestamp": "2025-11-09T12:05:00.000Z"
  }
}
```

**Failed verification (unexpected tag):**
```bash
curl -X POST http://localhost:3000/api/v1/pumps/1/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mainTagScanned": "MAIN-TAG-001",
    "scannedChildTags": ["CHILD-001-A", "CHILD-001-B", "CHILD-001-C", "UNKNOWN-TAG-X"]
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": 3,
    "result": "failed",
    "message": "ALERT: 1 unexpected tag(s) detected. Pump may have been tampered with!",
    "details": {
      "expectedCount": 3,
      "scannedCount": 4,
      "missingTags": [],
      "unexpectedTags": ["UNKNOWN-TAG-X"]
    },
    "pumpStatus": "BROKEN",
    "timestamp": "2025-11-09T12:10:00.000Z"
  }
}
```

### Get Verification History for a Pump

```bash
curl "http://localhost:3000/api/v1/pumps/1/verifications?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

**With filtering:**
```bash
curl "http://localhost:3000/api/v1/pumps/1/verifications?result=FAILED" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Verification Session Details

```bash
curl http://localhost:3000/api/v1/verifications/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## Common Scenarios

### Scenario 1: Daily Security Check

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"controller","password":"controller123"}' \
  | jq -r '.data.accessToken')

# 2. Get all stations
curl http://localhost:3000/api/v1/stations \
  -H "Authorization: Bearer $TOKEN"

# 3. Get pumps for station 1
curl http://localhost:3000/api/v1/stations/1/pumps \
  -H "Authorization: Bearer $TOKEN"

# 4. Verify pump 1
curl -X POST http://localhost:3000/api/v1/pumps/1/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mainTagScanned": "MAIN-TAG-001",
    "scannedChildTags": ["CHILD-001-A", "CHILD-001-B", "CHILD-001-C"]
  }'

# 5. Check verification history
curl http://localhost:3000/api/v1/pumps/1/verifications \
  -H "Authorization: Bearer $TOKEN"
```

### Scenario 2: Setup New Pump

```bash
# 1. Login as admin
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.data.accessToken')

# 2. Create new station
curl -X POST http://localhost:3000/api/v1/stations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "OMV Kisela Voda",
    "location": "Kisela Voda, Skopje"
  }'

# 3. Create pump for station 3
curl -X POST http://localhost:3000/api/v1/stations/3/pumps \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pumpNumber": 1,
    "mainRfidTag": "MAIN-TAG-010",
    "expectedChildTags": [
      {"tagId": "CHILD-010-A", "description": "Top seal"},
      {"tagId": "CHILD-010-B", "description": "Bottom seal"}
    ]
  }'

# 4. Verify the new pump
curl -X POST http://localhost:3000/api/v1/pumps/5/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mainTagScanned": "MAIN-TAG-010",
    "scannedChildTags": ["CHILD-010-A", "CHILD-010-B"]
  }'
```

---

## Error Responses

### Unauthorized (401)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired token"
  }
}
```

### Forbidden (403)
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Admin role required"
  }
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Pump not found"
  }
}
```

### Validation Error (400)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [...]
  }
}
```

### Duplicate Resource (409)
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_RESOURCE",
    "message": "Main RFID tag 'MAIN-TAG-001' is already in use"
  }
}
```

---

## Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "Gas Station RFID API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api/v1"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

---

## Testing Checklist

- [ ] Login with admin credentials
- [ ] Login with controller credentials
- [ ] Get all stations
- [ ] Create new station (admin only)
- [ ] Get station details
- [ ] Get pumps for station
- [ ] Create new pump (admin only)
- [ ] Verify pump with all tags present (SUCCESS)
- [ ] Verify pump with missing tag (FAILED)
- [ ] Verify pump with unexpected tag (FAILED)
- [ ] Check verification history
- [ ] Get verification session details
- [ ] Test unauthorized access (without token)
- [ ] Test forbidden access (operator trying admin endpoint)

---

## Performance Testing

```bash
# Test rate limiting (should fail after 100 requests)
for i in {1..105}; do
  curl http://localhost:3000/health
done
```

---

**Happy Testing! 🚀**
