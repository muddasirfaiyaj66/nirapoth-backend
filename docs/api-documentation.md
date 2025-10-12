# Nirapoth Backend API Documentation

## Authentication System

This document provides comprehensive documentation for the Nirapoth authentication system with email verification and password reset functionality.

## Base URL

```
http://localhost:3000/api
```

## Authentication Endpoints

### 1. User Registration

**POST** `/auth/register`

Register a new user account. An email verification link will be sent to the provided email address.

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "phone": "+1234567890",
  "nidNo": "12345678901234567",
  "birthCertificateNo": "12345678901234567",
  "role": "CITIZEN"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "User registered successfully. Please check your email for verification link.",
  "data": {
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "role": "CITIZEN",
      "isEmailVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "statusCode": 201
}
```

### 2. Email Verification

**GET** `/auth/verify-email?token=<verification_token>`

Verify user email address using the token sent in the verification email.

**Query Parameters:**

- `token` (string, required): Email verification token

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Email verified successfully! Welcome to Nirapoth!",
  "data": {
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "isEmailVerified": true
    }
  },
  "statusCode": 200
}
```

### 3. User Login

**POST** `/auth/login`

Login with email and password. Email must be verified.

**Request Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "CITIZEN",
      "isEmailVerified": true
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  },
  "statusCode": 200
}
```

### 4. Forgot Password

**POST** `/auth/forgot-password`

Send password reset link to user's email.

**Request Body:**

```json
{
  "email": "john.doe@example.com"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "If an account with that email exists, we have sent a password reset link.",
  "statusCode": 200
}
```

### 5. Reset Password

**POST** `/auth/reset-password`

Reset password using the token from the reset email.

**Request Body:**

```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123!"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    }
  },
  "statusCode": 200
}
```

### 6. Refresh Token

**POST** `/auth/refresh`

Refresh access token using refresh token from cookie.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_jwt_access_token",
    "refreshToken": "new_jwt_refresh_token"
  },
  "statusCode": 200
}
```

### 7. Logout

**POST** `/auth/logout`

Logout user and clear cookies.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Logout successful",
  "statusCode": 200
}
```

### 8. Get Current User

**GET** `/auth/me`

Get current authenticated user information.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "CITIZEN",
      "isEmailVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "statusCode": 200
}
```

## Profile Management Endpoints

### 1. Update Profile

**PUT** `/profile/update`

Update user profile information.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890",
  "nidNo": "12345678901234567",
  "birthCertificateNo": "12345678901234567",
  "profileImage": "https://example.com/profile.jpg"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Smith",
      "phone": "+1234567890",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "statusCode": 200
}
```

### 2. Change Password

**PUT** `/profile/change-password`

Change user password.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "currentPassword": "CurrentPass123!",
  "newPassword": "NewSecurePass123!"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Password changed successfully",
  "statusCode": 200
}
```

### 3. Upload Profile Image

**PUT** `/profile/upload-image`

Update user profile image URL.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "profileImage": "https://example.com/new-profile.jpg"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Profile image updated successfully",
  "data": {
    "user": {
      "id": "uuid",
      "profileImage": "https://example.com/new-profile.jpg"
    }
  },
  "statusCode": 200
}
```

## Error Responses

### Validation Error (400 Bad Request)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Email is required",
    "Password must be at least 8 characters long"
  ],
  "statusCode": 400
}
```

### Authentication Error (401 Unauthorized)

```json
{
  "success": false,
  "message": "Access token is required",
  "statusCode": 401
}
```

### Authorization Error (403 Forbidden)

```json
{
  "success": false,
  "message": "Please verify your email address before logging in",
  "statusCode": 403
}
```

### Not Found Error (404 Not Found)

```json
{
  "success": false,
  "message": "User not found",
  "statusCode": 404
}
```

### Server Error (500 Internal Server Error)

```json
{
  "success": false,
  "message": "Internal server error",
  "statusCode": 500
}
```

## Rate Limiting

The API implements rate limiting for security:

- **Registration**: 3 attempts per hour per IP
- **Login**: 5 attempts per 15 minutes per IP
- **Password Reset**: 3 attempts per hour per IP
- **General API**: 100 requests per 15 minutes per IP

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with 12 salt rounds
2. **JWT Tokens**: Secure access and refresh tokens with expiration
3. **HTTP-Only Cookies**: Refresh tokens stored in secure HTTP-only cookies
4. **Email Verification**: Required before login
5. **Password Reset**: Secure token-based password reset
6. **Rate Limiting**: Protection against brute force attacks
7. **Input Validation**: Comprehensive input validation using Zod
8. **CORS Protection**: Configurable CORS settings
9. **Security Headers**: Helmet.js for security headers

## User Roles

- `ADMIN`: Full system access
- `POLICE`: Police officer access
- `DRIVER`: Driver access
- `FIRE_SERVICE`: Fire service access
- `CITIZEN`: General citizen access

## Data Validation Rules

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%\*?&)

### NID Number

- Either 10 or 17 digits
- Must be unique

### Birth Certificate Number

- Exactly 17 digits
- Must be unique

### Phone Number

- 10-20 characters
- Can contain numbers, +, -, spaces, and parentheses

### Name Fields

- 2-50 characters
- Only letters and spaces allowed

## Testing

Use the provided endpoints to test the complete authentication flow:

1. Register a new user
2. Check email for verification link
3. Click verification link
4. Login with verified email
5. Test profile updates
6. Test password change
7. Test forgot/reset password flow
