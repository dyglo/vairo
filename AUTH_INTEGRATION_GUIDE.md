# Authentication Integration Guide

Complete guide for implementing secure password hashing and authentication in Vairo.

## Overview

This guide covers the complete authentication flow from client registration through password verification on the backend.

### Architecture

```
Client App
  ├─ Registration Screen
  │  ├─ Input: email, password
  │  ├─ Validate: utils/authentication.ts (isValidEmail, validatePassword)
  │  ├─ Call: POST /auth/register (HTTPS only)
  │  └─ Store: token, userId, expiresAt
  │
  ├─ Login Screen
  │  ├─ Input: email, password
  │  ├─ Validate: utils/authentication.ts
  │  ├─ Call: POST /auth/login (HTTPS only)
  │  └─ Store: token, userId, expiresAt
  │
  └─ AppContext
     ├─ State: currentUser, token, isLoggedIn
     ├─ Methods: handleRegister, handleLogin, handleLogout
     └─ Hooks: useAuth() for components

Backend Server
  ├─ POST /auth/register
  │  ├─ Validate email/password
  │  ├─ Hash: await hashPassword(password)
  │  ├─ Store: db.users.create({ email, passwordHash })
  │  └─ Return: { userId, email }
  │
  ├─ POST /auth/login
  │  ├─ Find user by email
  │  ├─ Verify: await verifyPassword(password, user.passwordHash)
  │  ├─ Generate: JWT token (7-day expiration)
  │  └─ Return: { userId, email, token, expiresAt }
  │
  └─ POST /auth/verify
     ├─ Extract: Bearer token
     ├─ Validate: JWT signature & expiration
     └─ Return: { userId } or error
```

## File Structure

```
utils/
├─ passwordHash.ts           ← Password hashing utilities
│  ├─ hashPassword()          - Hash password with Argon2i
│  ├─ verifyPassword()        - Verify password against hash
│  ├─ validatePasswordStrength() - Check password requirements
│  └─ shouldRehash()          - Check if hash needs updating
│
├─ authentication.ts          ← Client-side auth functions
│  ├─ register()              - POST /auth/register
│  ├─ login()                 - POST /auth/login
│  ├─ verifyToken()           - POST /auth/verify
│  ├─ isValidEmail()          - Email format validation
│  └─ validatePassword()      - Password requirement check
│
├─ BACKEND_AUTH_EXAMPLE.ts   ← Server implementation examples
│  ├─ registerHandler()       - Backend registration logic
│  └─ loginHandler()          - Backend login logic
│
└─ envValidator.ts           ← Environment variables
   └─ JWT_SECRET              - For token generation

context/
└─ AppContext.tsx            ← App state & auth state (TODO)
   ├─ state.currentUser       - { userId, email, token }
   ├─ state.isLoggedIn       - boolean
   ├─ handleRegister()        - Call auth.register()
   ├─ handleLogin()           - Call auth.login()
   ├─ handleLogout()          - Clear auth state
   └─ useAuth()               - Hook for accessing auth

app/
├─ auth/                     ← Auth screens (TODO)
│  ├─ _layout.tsx            - Auth stack layout
│  ├─ register.tsx           - Registration screen
│  └─ login.tsx              - Login screen
│
└─ (tabs)/                   ← App screens
   ├─ profile.tsx            - Show currentUser from useAuth()
   └─ ...
```

## Implementation Status

### ✅ Completed

- [x] Argon2 installation (`npm install argon2`)
- [x] `utils/passwordHash.ts` - Password hashing functions
- [x] `utils/authentication.ts` - Client auth functions
- [x] `utils/BACKEND_AUTH_EXAMPLE.ts` - Server examples
- [x] Environment variables (JWT_SECRET in .env)
- [x] TypeScript compilation (0 errors)

### ⏳ TODO: Client-Side Integration

1. **Create Auth Context** (in `context/AppContext.tsx`)
   - Add auth state (currentUser, token, isLoggedIn)
   - Add auth methods (handleRegister, handleLogin, handleLogout)
   - Export useAuth hook
   - Implement token persistence

2. **Create Auth UI Screens**
   - `app/auth/_layout.tsx` - Auth stack
   - `app/auth/register.tsx` - Registration form
   - `app/auth/login.tsx` - Login form

3. **Protect Routes**
   - Check isLoggedIn in app views
   - Redirect to login if not authenticated
   - Validate token expiration

### ⏳ TODO: Backend Routes

1. **POST /auth/register** (registerHandler)
   - Validate email & password
   - Check user doesn't exist
   - Hash password with argon2
   - Create user in database
   - Return { userId, email }

2. **POST /auth/login** (loginHandler)
   - Validate email & password
   - Find user in database
   - Verify password with argon2
   - Generate JWT token
   - Return { userId, email, token, expiresAt }

3. **POST /auth/verify** (verifyHandler)
   - Validate JWT token
   - Check expiration
   - Return { userId } or error

---

## Quick Start: Using Authentication

### 1. Registration

```typescript
import { register, validatePassword } from '@/utils/authentication';

// Validate password before API call
const validation = validatePassword(password);
if (!validation.isValid) {
  // Show validation.errors to user
  return;
}

// Call registration
try {
  const response = await register({ email, password });
  if (response.success) {
    // Store token (see Token Persistence below)
    const { userId, email } = response.data!;
    console.log('Registered:', userId, email);
  } else {
    console.error(response.error?.code, response.error?.message);
  }
} catch (error) {
  console.error('Registration failed', error);
}
```

### 2. Login

```typescript
import { login } from '@/utils/authentication';

try {
  const response = await login({ email, password });
  if (response.success) {
    const { userId, email, token, expiresAt } = response.data!;
    
    // Store token and user info (see Token Persistence below)
    await storeAuthToken(token, userId, email, expiresAt);
    
    // Update app context
    updateAppState({ isLoggedIn: true, currentUser: { userId, email, token } });
  } else {
    console.error(response.error?.code, response.error?.message);
  }
} catch (error) {
  console.error('Login failed', error);
}
```

### 3. Token Persistence

Store tokens securely for app reopening:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save token
async function storeAuthToken(token: string, userId: string, email: string, expiresAt: number) {
  await AsyncStorage.setItem('auth_token', token);
  await AsyncStorage.setItem('auth_userId', userId);
  await AsyncStorage.setItem('auth_email', email);
  await AsyncStorage.setItem('auth_expiresAt', expiresAt.toString());
}

// Load token on app start
async function loadAuthToken() {
  const token = await AsyncStorage.getItem('auth_token');
  const userId = await AsyncStorage.getItem('auth_userId');
  const expiresAt = parseInt(await AsyncStorage.getItem('auth_expiresAt') || '0');
  
  if (!token) return null;
  
  // Check if token expired
  if (expiresAt < Date.now() / 1000) {
    // Token expired, clear storage
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_userId');
    await AsyncStorage.removeItem('auth_email');
    await AsyncStorage.removeItem('auth_expiresAt');
    return null;
  }
  
  return { token, userId, expiresAt };
}

// Clear token on logout
async function clearAuthToken() {
  await AsyncStorage.removeItem('auth_token');
  await AsyncStorage.removeItem('auth_userId');
  await AsyncStorage.removeItem('auth_email');
  await AsyncStorage.removeItem('auth_expiresAt');
}
```

### 4. AppContext Integration (TODO)

```typescript
import { useEffect, useState } from 'react';
import { loadAuthToken, storeAuthToken, clearAuthToken } from '@/utils/tokenStorage';
import { register, login, verifyToken } from '@/utils/authentication';

interface AuthState {
  currentUser: { userId: string; email: string; token: string } | null;
  isLoggedIn: boolean;
  isLoading: boolean;
}

// In AppContext.tsx mutations:
const handleRegister = async (email: string, password: string) => {
  const response = await register({ email, password });
  
  if (response.success) {
    const { userId, email: userEmail } = response.data!;
    // Store token (from backend response)
    // Update state
    setAuthState({ currentUser: { userId, email: userEmail, token: response.data!.token }, isLoggedIn: true, isLoading: false });
  }
};

const handleLogin = async (email: string, password: string) => {
  const response = await login({ email, password });
  
  if (response.success) {
    const { userId, email: userEmail, token, expiresAt } = response.data!;
    await storeAuthToken(token, userId, userEmail, expiresAt);
    setAuthState({ 
      currentUser: { userId, email: userEmail, token }, 
      isLoggedIn: true,
      isLoading: false
    });
  }
};

const handleLogout = async () => {
  await clearAuthToken();
  setAuthState({ currentUser: null, isLoggedIn: false, isLoading: false });
};

// On app startup
useEffect(() => {
  const loadAuth = async () => {
    const authData = await loadAuthToken();
    
    if (authData) {
      // Verify token is still valid
      const response = await verifyToken(authData.token);
      
      if (response.success) {
        setAuthState({
          currentUser: {
            userId: authData.userId,
            email: await AsyncStorage.getItem('auth_email'),
            token: authData.token,
          },
          isLoggedIn: true,
          isLoading: false,
        });
      } else {
        // Token invalid, clear and logout
        await clearAuthToken();
        setAuthState({ currentUser: null, isLoggedIn: false, isLoading: false });
      }
    } else {
      setAuthState({ currentUser: null, isLoggedIn: false, isLoading: false });
    }
  };
  
  loadAuth();
}, []);
```

---

## Password Hashing Detail

### Client Side (utils/passwordHash.ts)

**When to use:** BACKEND ONLY - for hashing passwords before storing in database.

```typescript
import { hashPassword, verifyPassword } from '@/utils/passwordHash';

// Hash password (backend)
const plainPassword = 'User123!@#';
const hash = await hashPassword(plainPassword);
// hash = "$argon2i$v=19$m=65536,t=3,p=4$sG2n..."

// Verify password (backend)
const isCorrect = await verifyPassword('User123!@#', hash);
// isCorrect = true

const isWrong = await verifyPassword('WrongPassword', hash);
// isWrong = false
```

### Algorithm Details

**Argon2i** (chosen for side-channel resistance):
- Memory: 64 MB (65536 KB)
- Time Cost: 3 iterations
- Parallelism: 4 threads
- Salt: Generated automatically (random per password)

**Why Argon2i:**
- OWASP recommended for password hashing
- Resistant to GPU/ASIC attacks
- Resistant to side-channel attacks
- Slow by design (good for passwords, bad for attackers)

**Why NOT use bcrypt/scrypt:**
- bcrypt max password length: 72 characters (argon2 supports any length)
- bcrypt slower development (harder to tune)
- Argon2 parameters easier to increase as hardware improves

---

## Error Handling

### Error Codes

```typescript
enum AuthError {
  INVALID_EMAIL = 'INVALID_EMAIL',               // Email doesn't match pattern
  INVALID_PASSWORD = 'INVALID_PASSWORD',         // Password too weak
  USER_EXISTS = 'USER_EXISTS',                   // Email already registered
  USER_NOT_FOUND = 'USER_NOT_FOUND',             // Email not in system
  WRONG_PASSWORD = 'WRONG_PASSWORD',             // Incorrect password
  WEAK_PASSWORD = 'WEAK_PASSWORD',               // Password doesn't meet requirements
  NETWORK_ERROR = 'NETWORK_ERROR',               // No internet connection
  SERVER_ERROR = 'SERVER_ERROR',                 // 500 error
  INVALID_SESSION = 'INVALID_SESSION',           // Token invalid/missing
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',               // Token past expiration
}
```

### Response Format

All auth functions return `AuthResponse<T>`:

```typescript
interface AuthResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: AuthError | string;
    message: string;
  };
}

// Example success response
{
  "success": true,
  "data": {
    "userId": "user_123",
    "email": "user@example.com",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": 1708454400
  }
}

// Example error response
{
  "success": false,
  "error": {
    "code": "WEAK_PASSWORD",
    "message": "Password must contain uppercase letter, number, and special character"
  }
}
```

### Handling Errors

```typescript
const response = await register({ email, password });

if (response.success) {
  // Registration successful
  handleSuccess(response.data);
} else {
  // Show error to user
  const { code, message } = response.error!;
  
  switch(code) {
    case 'INVALID_EMAIL':
      // Show "Please enter a valid email" message
      break;
    case 'WEAK_PASSWORD':
      // Show password requirements
      break;
    case 'USER_EXISTS':
      // Show "Email already registered, try Login"
      break;
    default:
      // Show generic error message
      console.error(message);
  }
}
```

---

## Security Best Practices

### ✅ DO:

- [x] Hash passwords with Argon2 on backend
- [x] Verify passwords with Argon2 on backend
- [x] Use HTTPS for all auth requests
- [x] Implement rate limiting (5 attempts per 15 min)
- [x] Store JWT tokens securely (AsyncStorage for Expo)
- [x] Implement token expiration (7-30 days)
- [x] Log authentication events (not passwords)
- [x] Validate email format on client + server
- [x] Enforce strong password requirements
- [x] Return generic error messages (prevent account enumeration)

### ❌ DON'T:

- [ ] Hash passwords on client side
- [ ] Use weak hashing (MD5, SHA1)
- [ ] Send passwords in emails
- [ ] Store plain text passwords
- [ ] Log passwords ever
- [ ] Use passwords in URLs
- [ ] Reveal passwords in error messages
- [ ] Send passwords over HTTP
- [ ] Use same password hash algorithm for all passwords
- [ ] Store passwords in plain text in AsyncStorage

---

## Testing Checklist

- [ ] Test registration with valid email/password
- [ ] Test registration with invalid email (should error)
- [ ] Test registration with weak password (should error)
- [ ] Test registration with existing email (should error)
- [ ] Test login with correct password (should succeed)
- [ ] Test login with wrong password (should error)
- [ ] Test login with non-existent email (should error)
- [ ] Test token persistence across app restart
- [ ] Test token expiration handling
- [ ] Test logout clears all auth data
- [ ] Test API returns consistent response format
- [ ] Test password hash never stored in state/logs
- [ ] Test HTTPS only connections for auth routes
- [ ] Test rate limiting on backend (5 attempts per 15 min)

---

## Environment Variables

Required in `.env` file:

```
# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your_random_secret_here_min_32_characters

# API Configuration
API_BASE_URL=https://api.yourdomain.com
API_TIMEOUT=10000

# App Configuration
NODE_ENV=development
```

Generate a strong JWT_SECRET:

```bash
# Run in terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy the output to your .env file
```

---

## Next Steps

1. **Create `app/auth/_layout.tsx`** - Auth screen stack
2. **Create `app/auth/register.tsx`** - Registration form
3. **Create `app/auth/login.tsx`** - Login form
4. **Update `context/AppContext.tsx`** - Add auth state + methods
5. **Implement backend routes** - POST /auth/register, /auth/login, /auth/verify
6. **Test complete flow** - Register → Login → Access protected resources
7. **Add refresh tokens** - For extended sessions without re-login
8. **Implement password reset** - Email verification + new password
9. **Add multi-factor authentication** - SMS or authenticator app
10. **Set up logging** - Monitor authentication events and failures

---

## Troubleshooting

### "Password does not meet security requirements"

The password must contain:
- At least 8 characters (max 128)
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*)

Example: `MyPassword123!`

### "Invalid email or password"

This generic message appears for:
- Email doesn't exist in database
- Email exists but password is wrong
- User account is disabled/locked

This prevents account enumeration attacks.

### Token keeps expiring

Tokens expire after 7 days. Options:
1. Implement refresh tokens (ask for new token without re-login)
2. Increase expiration time (security vs. convenience tradeoff)
3. Show "Session expired, please login again" message

### Password hash mismatch after upgrade

Use `shouldRehash()` to detect if algorithm parameters changed:

```typescript
if (shouldRehash(storedHash)) {
  // Ask user to change password (will rehash with new parameters)
}
```

---

## Related Documentation

- [ENV_SETUP.md](./ENV_SETUP.md) - Environment variables setup
- [utils/passwordHash.ts](./utils/passwordHash.ts) - Password hashing implementation
- [utils/authentication.ts](./utils/authentication.ts) - Auth client functions
- [utils/BACKEND_AUTH_EXAMPLE.ts](./utils/BACKEND_AUTH_EXAMPLE.ts) - Server implementation

