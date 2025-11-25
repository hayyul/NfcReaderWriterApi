# Super Admin Features - Implementation Guide

## Overview

This document describes the newly implemented super admin features for the Gas Station RFID Control System API. These features provide comprehensive monitoring, audit logging, and analytics capabilities for system administrators.

## Database Changes

### 1. New User Role: SUPER_ADMIN

Added a new role to the `UserRole` enum:
- `SUPER_ADMIN` - Highest level admin with full system access
- `ADMIN` - Standard admin role
- `OPERATOR` - Regular operator
- `VIEWER` - Read-only access

### 2. Audit Logs Table

A new `audit_logs` table tracks all system modifications:

**Fields:**
- `id` - Unique identifier
- `userId` - User who performed the action
- `action` - Type of action (CREATE, UPDATE, DELETE)
- `entityType` - Type of entity modified (STATION, PUMP, USER, VERIFICATION, EXPECTED_TAG)
- `entityId` - ID of the modified entity
- `oldValues` - JSON snapshot of values before modification
- `newValues` - JSON snapshot of values after modification
- `ipAddress` - IP address of the user
- `createdAt` - Timestamp of the action

**Indexes:**
- `userId` - Fast lookup by user
- `(entityType, entityId)` - Fast lookup by entity
- `createdAt DESC` - Fast lookup by time
- `action` - Fast lookup by action type

### 3. Tracking Fields

Added to `gas_stations` and `pumps` tables:
- `lastModifiedBy` - Foreign key to user who last modified the entity
- `lastVerificationAt` - Timestamp of last verification

## API Endpoints

### 1. Dashboard Analytics

**Endpoint:** `GET /api/v1/admin/analytics`

**Authorization:** Admin or Super Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "totalStations": 5,
    "totalPumps": 25,
    "activeStations": 4,
    "verificationsTodayCount": 45,
    "verificationsWeekCount": 312,
    "failedVerificationsWeek": 12,
    "successRate": 96.15
  }
}
```

### 2. Audit Logs

**Endpoint:** `GET /api/v1/admin/audit-logs`

**Authorization:** Admin or Super Admin

**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Results per page (default: 50, max: 100)
- `action` (string) - Filter by action: CREATE, UPDATE, DELETE
- `entityType` (string) - Filter by entity: STATION, PUMP, USER, VERIFICATION
- `userId` (number) - Filter by user ID
- `startDate` (ISO date) - Filter from date
- `endDate` (ISO date) - Filter to date

**Example Request:**
```bash
GET /api/v1/admin/audit-logs?action=UPDATE&entityType=STATION&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "userId": 1,
      "userName": "John Admin",
      "action": "UPDATE",
      "entityType": "STATION",
      "entityId": 5,
      "oldValues": { "status": "ACTIVE" },
      "newValues": { "status": "MAINTENANCE" },
      "ipAddress": "192.168.1.100",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

### 3. All Verifications

**Endpoint:** `GET /api/v1/admin/verifications/all`

**Authorization:** Admin or Super Admin

**Description:** Returns all verifications across all stations (unlike the pump-specific endpoint)

**Query Parameters:**
- `page` (number) - Page number
- `limit` (number) - Results per page
- `result` (string) - Filter by result: SUCCESS, FAILED, ERROR
- `stationId` (number) - Filter by station ID
- `startDate` (ISO date) - Filter from date
- `endDate` (ISO date) - Filter to date

**Example Request:**
```bash
GET /api/v1/admin/verifications/all?result=FAILED&stationId=2&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "sessionId": 789,
      "pumpId": 15,
      "pumpNumber": 3,
      "stationId": 2,
      "stationName": "Downtown Station",
      "userId": 5,
      "userName": "Jane Operator",
      "result": "FAILED",
      "message": "ALERT: 2 tag(s) missing. Pump may have been tampered with!",
      "details": {
        "totalScanned": 6,
        "missingTagsCount": 2,
        "unexpectedTagsCount": 0
      },
      "pumpStatus": "BROKEN",
      "timestamp": "2025-01-15T14:22:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 12,
    "totalPages": 1
  }
}
```

### 4. Station Activity Logs

**Endpoint:** `GET /api/v1/admin/stations/:id/logs`

**Authorization:** Admin or Super Admin

**Description:** Returns modification history and activity for a specific station

**Response:**
```json
{
  "success": true,
  "data": {
    "stationId": 1,
    "stationName": "Main Station",
    "lastModifiedAt": "2025-01-15T10:30:00.000Z",
    "lastModifiedBy": "John Admin",
    "lastVerificationAt": "2025-01-15T16:45:00.000Z",
    "logs": [
      {
        "id": 45,
        "action": "UPDATE",
        "oldValues": { "status": "ACTIVE", "location": "Main St" },
        "newValues": { "status": "MAINTENANCE", "location": "Main St" },
        "modifiedBy": "John Admin",
        "modifiedAt": "2025-01-15T10:30:00.000Z",
        "ipAddress": "192.168.1.100"
      }
    ]
  }
}
```

## Automatic Audit Logging

All modifications to stations, pumps, and other entities are automatically logged with:
- User who made the change
- Before and after values
- IP address
- Timestamp

This happens automatically in the following operations:
- Create station
- Update station
- Delete station
- Create pump
- Update pump
- Delete pump

## Verification Tracking

The system now automatically tracks:
- `lastVerificationAt` on pumps - Updated every time a verification is performed
- `lastVerificationAt` on stations - Updated when any pump in the station is verified

This allows admins to quickly identify:
- Pumps that haven't been verified recently
- Stations with outdated verification status
- Compliance with verification schedules

## Usage Examples

### 1. Monitor System Health

```bash
# Get overall analytics
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/admin/analytics
```

### 2. Investigate Failed Verifications

```bash
# Get all failed verifications from last week
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/admin/verifications/all?result=FAILED&startDate=2025-01-08"
```

### 3. Track User Actions

```bash
# Get all actions by specific user
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/admin/audit-logs?userId=5"
```

### 4. Review Station Changes

```bash
# Get modification history for station
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/admin/stations/1/logs
```

### 5. Search Audit Logs

```bash
# Find all deletions in the last month
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/admin/audit-logs?action=DELETE&startDate=2024-12-15"
```

## Authorization

All admin endpoints require:
1. Valid JWT token in Authorization header
2. User role must be either `ADMIN` or `SUPER_ADMIN`

Example header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Migration

The database migration has been applied automatically. If you need to re-run it:

```bash
npx prisma migrate dev
```

Or to generate the Prisma client after changes:

```bash
npx prisma generate
```

## Security Considerations

1. **IP Address Logging** - All audit logs capture IP addresses for forensic analysis
2. **Rate Limiting** - Admin endpoints are subject to rate limiting (configured in server)
3. **HTTPS Required** - All admin endpoints should only be accessed over HTTPS in production
4. **Token Expiration** - JWT tokens should have appropriate expiration times
5. **Role Validation** - Middleware validates user roles on every request

## Error Handling

All admin endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Admin role required"
  }
}
```

Common error codes:
- `INSUFFICIENT_PERMISSIONS` - User lacks required role
- `INVALID_TOKEN` - JWT token is invalid or expired
- `VALIDATION_ERROR` - Request parameters are invalid
- `INTERNAL_ERROR` - Server error occurred

## Performance Notes

- Audit logs are written asynchronously and don't block API responses
- Analytics queries use indexes for fast performance
- Pagination limits prevent large result sets
- Database queries run in parallel where possible

## Testing

Test the endpoints using curl or your API client:

```bash
# Login as admin
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"yourpassword"}' \
  | jq -r '.data.token')

# Test analytics endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/admin/analytics

# Test audit logs
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/admin/audit-logs?limit=10"
```

## Future Enhancements

Potential future additions:
- Export audit logs to CSV/Excel
- Real-time notifications for failed verifications
- Dashboard visualizations
- Custom report generation
- Scheduled verification reminders
- Compliance reporting

## Support

For issues or questions about admin features:
1. Check the API documentation at `/api/v1`
2. Review audit logs for troubleshooting
3. Contact system administrator
