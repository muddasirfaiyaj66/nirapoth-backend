# Nirapoth Backend Authentication System

## Overview

This document describes the secure, scalable backend authentication system implemented for the Nirapoth platform using TypeScript, Express, and Prisma.

## Features Implemented

### ✅ JWT-based Authentication

- Secure user login and registration using JWT (JSON Web Token)
- Tokens stored in HTTP-only cookies for security
- Access tokens (15 minutes) and refresh tokens (7 days)

### ✅ Password Hashing with bcrypt

- Passwords hashed using bcrypt with 12 salt rounds
- Secure password comparison during login
- Password strength validation

### ✅ Zod Validation

- TypeScript-first schema validation
- Comprehensive validation for user registration and login
- Detailed error messages for validation failures

### ✅ Rate Limiting

- Rate limiting with rate-limiter-flexible
- Different limits for different endpoints:
  - General API: 100 requests per 15 minutes
  - Auth endpoints: 5 attempts per 15 minutes
  - Registration: 3 attempts per hour
  - Password reset: 3 attempts per hour

### ✅ MVC Architecture

- Model: Prisma ORM with PostgreSQL
- View: JSON API responses
- Controller: Separate controllers for different functionalities
- Services: JWT service, password utilities

### ✅ Error Handling

- Global error handler for uniform error responses
- Specific error handling for different error types
- Development vs production error responses

### ✅ Secure Cookie Management

- HTTP-only cookies to prevent XSS attacks
- Secure cookies in production
- SameSite strict policy

## API Endpoints

### Authentication Routes

#### POST `/api/auth/register`

Register a new user.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+8801234567890",
  "nidNo": "1234567890",
  "birthCertificateNo": "12345678901234567",
  "role": "CITIZEN"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+8801234567890",
      "role": "CITIZEN",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "jwt_token",
    "refreshToken": "jwt_refresh_token"
  },
  "statusCode": 201
}
```

#### POST `/api/auth/login`

Login with email and password.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+8801234567890",
      "role": "CITIZEN",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "jwt_token",
    "refreshToken": "jwt_refresh_token"
  },
  "statusCode": 200
}
```

#### GET `/api/auth/me`

Get current user information (requires authentication).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+8801234567890",
      "role": "CITIZEN",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "statusCode": 200
}
```

#### POST `/api/auth/refresh`

Refresh access token using refresh token.

**Response:**

```json
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+8801234567890",
      "role": "CITIZEN",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "new_jwt_token",
    "refreshToken": "new_jwt_refresh_token"
  },
  "statusCode": 200
}
```

#### POST `/api/auth/logout`

Logout user and clear cookies.

**Response:**

```json
{
  "success": true,
  "message": "Logout successful",
  "statusCode": 200
}
```

## Profile Management Endpoints

#### PUT `/api/profile/update`

Update user profile information.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "name": "John Doe Updated",
  "phone": "+8801234567891",
  "nidNo": "1234567891",
  "birthCertificateNo": "12345678901234568",
  "profileImage": "https://example.com/profile.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe Updated",
      "email": "john@example.com",
      "phone": "+8801234567891",
      "role": "CITIZEN",
      "nidNo": "1234567891",
      "birthCertificateNo": "12345678901234568",
      "profileImage": "https://example.com/profile.jpg",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "statusCode": 200
}
```

#### PUT `/api/profile/change-password`

Change user password.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password changed successfully",
  "statusCode": 200
}
```

#### PUT `/api/profile/upload-image`

Upload profile image.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "imageUrl": "https://example.com/new-profile.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Profile image updated successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+8801234567890",
      "role": "CITIZEN",
      "nidNo": "1234567890",
      "birthCertificateNo": "12345678901234567",
      "profileImage": "https://example.com/new-profile.jpg",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "statusCode": 200
}
```

## Security Features

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%\*?&)

### JWT Configuration

- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Tokens include issuer and audience claims
- Separate secrets for access and refresh tokens

### Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 attempts per 15 minutes per IP
- **Registration**: 3 attempts per hour per IP
- **Password Reset**: 3 attempts per hour per IP

### CORS Configuration

- Configured for specific origins
- Credentials enabled for cookie support
- Proper headers allowed

### Security Headers

- Helmet.js for security headers
- Content Security Policy
- XSS protection
- Clickjacking protection

## User Roles

The system supports the following user roles:

- `ADMIN`: Full system access
- `POLICE`: Police officer access
- `DRIVER`: Driver access
- `FIRE_SERVICE`: Fire service access
- `CITIZEN`: Regular citizen access (default)

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"],
  "statusCode": 400
}
```

### Common Error Codes

- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate resources)
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/nirapoth_db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server Configuration
PORT=3000
NODE_ENV="development"

# CORS Configuration
CORS_ORIGIN="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Testing

Run the authentication tests:

```bash
# Install axios for testing (if not already installed)
npm install axios

# Run the test script
node test-auth.js
```

## Project Structure

```
src/
├── config/
│   └── env.ts                 # Environment configuration
├── controllers/
│   └── auth.controller.ts     # Authentication controller
├── middlewares/
│   ├── auth.middleware.ts     # Authentication middleware
│   ├── rateLimit.middleware.ts # Rate limiting middleware
│   ├── errorHandler.middleware.ts # Error handling
│   └── security.middleware.ts # Security middleware
├── routes/
│   └── auth.routes.ts         # Authentication routes
├── services/
│   └── jwt.service.ts         # JWT service
├── types/
│   └── auth.ts                # TypeScript types
├── utils/
│   ├── password.ts            # Password utilities
│   └── validation.ts          # Zod validation schemas
└── index.ts                   # Main application file
```

## Best Practices Implemented

1. **Security First**: HTTP-only cookies, secure headers, rate limiting
2. **Type Safety**: Full TypeScript coverage with proper types
3. **Validation**: Comprehensive input validation with Zod
4. **Error Handling**: Global error handler with detailed responses
5. **Code Organization**: Clean MVC architecture with separation of concerns
6. **Performance**: Efficient database queries and middleware
7. **Monitoring**: Request logging and response time headers
8. **Scalability**: Modular design for easy extension

## Next Steps

To extend this authentication system, consider:

1. **Password Reset Flow**: Email-based password reset
2. **Email Verification**: Email verification for new accounts
3. **Two-Factor Authentication**: TOTP or SMS-based 2FA
4. **OAuth Integration**: Google, Facebook, GitHub login
5. **Session Management**: Redis-based session storage
6. **Audit Logging**: Detailed audit logs for security
7. **Account Lockout**: Account lockout after failed attempts
8. **Password History**: Prevent password reuse

## Conclusion

This authentication system provides a solid foundation for secure user management in the Nirapoth platform. It follows industry best practices for security, validation, and error handling while maintaining a clean, maintainable codebase.
