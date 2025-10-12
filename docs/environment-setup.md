# Environment Setup Guide

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database Configuration
DATABASE_URL=""

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-jwt-key-here"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server Configuration
PORT=3000
NODE_ENV="development"

# CORS Configuration
CORS_ORIGIN="http://localhost:3000"

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=""
SMTP_PASS=""
FROM_EMAIL="noreply@nirapoth.com"
FROM_NAME="Nirapoth"
BASE_URL="http://localhost:3000"
```

## Email Configuration Examples

### Gmail Configuration

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

**Note:** For Gmail, you need to:

1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password as `SMTP_PASS`

### Outlook Configuration

```bash
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@outlook.com"
SMTP_PASS="your-password"
```

### SendGrid Configuration

```bash
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
```

### Amazon SES Configuration

```bash
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-ses-smtp-username"
SMTP_PASS="your-ses-smtp-password"
```

## Security Notes

1. **JWT Secrets**: Use strong, random secrets for JWT tokens
2. **Database URL**: Keep your database URL secure and never commit it to version control
3. **Email Credentials**: Use environment variables for all sensitive email configuration
4. **Production**: Set `NODE_ENV=production` for production deployments

## Testing Email Configuration

You can test your email configuration by making a request to the registration endpoint. If email sending fails, check:

1. SMTP credentials are correct
2. Firewall/network restrictions
3. Email provider's security settings
4. Check server logs for detailed error messages
