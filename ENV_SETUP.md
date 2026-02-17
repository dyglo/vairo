# Environment Variables Setup Guide

## Overview

This project uses environment variables to securely manage sensitive configuration data such as API keys, database URIs, and JWT secrets. Environment variables are loaded from a `.env` file that should **never be committed to version control**.

## Files

- **`.env`** - Local environment variables (⚠️ **DO NOT COMMIT** - already in .gitignore)
- **`.env.example`** - Template showing what environment variables are required (safe to commit)
- **`utils/envValidator.ts`** - Validation utility that checks required variables at app startup
- **`utils/supabaseClient.ts`** - Supabase client initialization with environment variables

## Setup Instructions

### 1. Create Local `.env` File

Copy the `.env.example` file to create your `.env` file:

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` and fill in the actual values:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key

# JWT Configuration
JWT_SECRET=your-secure-jwt-secret-key

# API Configuration
API_BASE_URL=http://localhost:3000
API_TIMEOUT=30000

# App Configuration
NODE_ENV=development
```

### 3. Get Your Credentials

#### Supabase

1. Go to [https://supabase.com](https://supabase.com)
2. Log in to your project
3. Navigate to **Settings → API**
4. Copy:
   - `Project URL` → `EXPO_PUBLIC_SUPABASE_URL`
   - `Anon Key` (public) → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**⚠️ Important:** Use the **Anon Key** (public), never the **Service Role Key** (secret).

#### JWT Secret

Generate a secure random string (minimum 32 characters):

```bash
# On macOS/Linux
openssl rand -base64 32

# Or use an online generator
# https://generate-random.org/?type=base64&length=32
```

## Environment Variables Reference

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | URL | ✅ Yes | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | String | ✅ Yes | Public Supabase anonymous key |
| `JWT_SECRET` | String | ✅ Yes | Secret key for JWT token signing |
| `API_BASE_URL` | URL | ✅ Yes | Base URL for API requests |
| `API_TIMEOUT` | Number | No | Request timeout in milliseconds (default: 30000) |
| `NODE_ENV` | String | No | Environment: `development`, `staging`, or `production` |

### Public vs. Secret Variables

**Public Variables** (start with `EXPO_PUBLIC_`):
- Exposed in client-side code
- Should NOT contain sensitive secrets
- Used for non-sensitive configuration like URLs

**Secret Variables** (no prefix):
- Should NEVER be exposed to the client
- Only accessible on the server/backend
- Examples: `JWT_SECRET`

## Usage in Code

### Validate Environment Variables

```typescript
import { envValidator } from '@/utils/envValidator';

// Validate all required variables (called automatically in AppProvider)
try {
  envValidator.validate();
} catch (error) {
  console.error('Environment validation failed:', error);
}
```

### Get Environment Variables

```typescript
import { getEnv, envValidator } from '@/utils/envValidator';

// Method 1: Using getEnv helper
const jwtSecret = getEnv('jwtSecret');

// Method 2: Using envValidator singleton
const supabaseUrl = envValidator.get('supabaseUrl');

// Method 3: Get all variables
const allEnv = envValidator.getAll();
```

### Initialize Supabase Client

```typescript
import { initSupabase, getSupabaseClient } from '@/utils/supabaseClient';

// Initialize (automatic in app startup)
initSupabase();

// Later, get the client
const supabase = getSupabaseClient();
```

## Security Best Practices

### ✅ DO

- ✅ Keep `.env` in `.gitignore` (already configured)
- ✅ Use `.env.example` as a template for required variables
- ✅ Generate strong, random values for secrets
- ✅ Use different values for different environments (dev, staging, prod)
- ✅ Validate environment variables at app startup
- ✅ Rotate secrets periodically
- ✅ Use HTTPS for all API communications

### ❌ DON'T

- ❌ Commit `.env` to version control
- ❌ Hardcode secrets in source code
- ❌ Share `.env` files via email or chat
- ❌ Use weak or predictable secret values
- ❌ Commit temporary test values
- ❌ Expose secret keys in client-side code
- ❌ Log sensitive information

## Troubleshooting

### "Environment Configuration Error"

If you see this error, some required environment variables are missing or invalid:

1. Check that `.env` file exists in project root
2. Verify all required variables are set (compare with `.env.example`)
3. Ensure values don't contain placeholder text like `your_supabase`
4. Check that values are not empty strings

### Missing Supabase Credentials

Make sure you:
- Use the correct Supabase project
- Copy the **Anon Key** (not the Service Role Key)
- Check for trailing/leading spaces in the values

### JWT Secret Issues

- Ensure secret is at least 32 characters long
- Use a cryptographically secure random value
- Don't use simple, guessable patterns

## Development vs. Production

### Development (`.env`)
- Uses local URLs for APIs
- May use weaker validation
- Can log more information

### Production (`.env.production`)
- Uses production API endpoints
- Strict validation enabled
- Minimal logging
- Secure secret generation

Never use development secrets in production!

## Environment Validation

The `envValidator` automatically validates environment variables at app startup:

```typescript
// In AppProvider (app/_layout.tsx)
useEffect(() => {
  try {
    envValidator.validate();
    console.log('✓ Environment variables validated successfully');
  } catch (error) {
    console.error('✗ Environment validation failed:', error);
  }
}, []);
```

This ensures the app fails fast if required variables are missing.

## References

- [Supabase Documentation](https://supabase.com/docs)
- [12-Factor App - Config](https://12factor.net/config)
- [OWASP - Secrets Management](https://owasp.org/www-project-web-security-testing-guide/)
