# API Documentation

## Authentication Endpoints (Planned)

### POST /api/v1/auth/register

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "User Name",
  "phone": "+8801XXXXXXXXX",
  "userType": "DRIVER" | "ADMIN" | "INSURANCE_AGENT"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "userType": "DRIVER"
    },
    "token": "jwt-token"
  }
}
```

### POST /api/v1/auth/login

Authenticate user credentials.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name"
    },
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

## Vehicle Management Endpoints (Planned)

### GET /api/v1/vehicles

Get all vehicles for authenticated user.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "vehicles": [
      {
        "id": "vehicle-id",
        "registrationNumber": "DHK-1234",
        "make": "Toyota",
        "model": "Corolla",
        "year": 2020,
        "engineNumber": "ENGINE123",
        "chassisNumber": "CHASSIS123",
        "ownershipType": "PERSONAL",
        "status": "ACTIVE"
      }
    ]
  }
}
```

### POST /api/v1/vehicles

Register a new vehicle.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Request Body:**

```json
{
  "registrationNumber": "DHK-1234",
  "make": "Toyota",
  "model": "Corolla",
  "year": 2020,
  "engineNumber": "ENGINE123",
  "chassisNumber": "CHASSIS123",
  "ownershipType": "PERSONAL",
  "documents": ["registration-doc-url", "insurance-doc-url"]
}
```

## Driver Management Endpoints (Planned)

### GET /api/v1/drivers/license/:licenseNumber

Get driver license information.

**Response:**

```json
{
  "success": true,
  "data": {
    "license": {
      "number": "DHK-12345678",
      "class": "PROFESSIONAL",
      "issueDate": "2023-01-15",
      "expiryDate": "2028-01-15",
      "status": "ACTIVE",
      "restrictions": []
    }
  }
}
```

## Insurance Endpoints (Planned)

### GET /api/v1/insurance/policies

Get insurance policies for user.

### POST /api/v1/insurance/claims

Submit an insurance claim.

## Emergency Endpoints (Planned)

### POST /api/v1/emergency/report

Report an emergency incident.

**Request Body:**

```json
{
  "type": "ACCIDENT" | "BREAKDOWN" | "MEDICAL" | "FIRE",
  "location": {
    "latitude": 23.8103,
    "longitude": 90.4125,
    "address": "Gulshan 1, Dhaka"
  },
  "description": "Description of the emergency",
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "vehicleId": "vehicle-id"
}
```

### GET /api/v1/emergency/nearby-services

Get nearby emergency services.

**Query Parameters:**

- `lat`: Latitude
- `lng`: Longitude
- `type`: Service type (hospital, police, fire, mechanic)
- `radius`: Search radius in kilometers

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details if available"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Request validation failed
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `INTERNAL_ERROR`: Server error
- `RATE_LIMITED`: Too many requests
