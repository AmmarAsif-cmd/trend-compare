# Security Documentation

## Current Security Measures

### ✅ Authentication & Authorization

**1. Password Security**
- **Bcrypt Hashing**: All passwords hashed with bcrypt (12 rounds)
  - Industry-standard password hashing algorithm
  - Automatically salted
  - Resistant to rainbow table attacks
  - Location: `app/api/user/signup/route.ts:40`

- **Minimum Password Length**: 8 characters required
  - Enforced client-side: `app/signup/page.tsx:61`
  - Should also be validated server-side (TODO)

**2. Session Management**
- **JWT-based Sessions**: NextAuth v5 with JWT strategy
  - Tokens signed with `AUTH_SECRET`
  - HttpOnly cookies (prevents XSS access)
  - Automatic token rotation
  - Location: `lib/auth-user.ts:137`

**3. OAuth Security**
- **Google OAuth 2.0**: Secure third-party authentication
  - PKCE flow (Proof Key for Code Exchange)
  - Access tokens stored securely in database
  - Refresh tokens encrypted in database
  - Location: `lib/auth-user.ts:18-28`

### ✅ Rate Limiting

**1. API Rate Limiting**
- **40 requests per minute** per IP for all API routes
- In-memory rate limiting (single instance)
- Prevents brute force attacks on authentication endpoints
- Location: `middleware.ts:6-71`

**2. Comparison Page Rate Limiting**
- **100 requests per minute** per IP for comparison pages
- More generous for public content pages
- Location: `middleware.ts:72-97`

**3. Anonymous User Daily Limits**
- **1 comparison per day** for non-authenticated users
- IP-based tracking
- Encourages signup for unlimited access
- Location: `lib/anonymous-limits.ts:9`

### ✅ CORS Protection

**CORS Whitelist**
- Only approved origins can make cross-origin requests
- Allowed origins:
  - `https://trendarc.net`
  - `https://www.trendarc.net`
  - `https://dev.trendarc.net`
  - `http://localhost:3000`
- Location: `middleware.ts:12-36`

### ✅ Database Security

**1. SQL Injection Prevention**
- Prisma ORM with parameterized queries
- No raw SQL queries with user input
- Type-safe database operations

**2. Sensitive Data Handling**
- Passwords never returned in API responses
- User creation uses `select` to explicitly exclude password field
- Location: `app/api/user/signup/route.ts:50-57`

**3. Cascading Deletes**
- OAuth accounts deleted when user is deleted
- Sessions automatically cleaned up
- Prevents orphaned sensitive data
- Location: `prisma/schema.prisma:144,155`

### ✅ Input Validation

**1. Email Validation**
- HTML5 email validation on client
- Unique constraint in database
- Duplicate email check before signup
- Location: `app/api/user/signup/route.ts:27-37`

**2. Required Field Validation**
- Email and password required for signup
- Validation on both client and server
- Location: `app/api/user/signup/route.ts:11-16`

### ✅ HTTPS Enforcement

**Production**
- All traffic forced to HTTPS via Vercel
- Secure cookies only sent over HTTPS
- TLS 1.2+ encryption

---

## ⚠️ Security Gaps & Recommendations

### ✅ CRITICAL Priority - IMPLEMENTED

**1. Email Verification** ✅ **IMPLEMENTED**
- ✅ **Status**: Fully implemented and working
- **Features**:
  - Verification email sent on signup with secure token
  - 24-hour expiration on verification tokens
  - Beautiful HTML email templates
  - Email verification required before login
  - Welcome email sent after verification
- **Files**: `lib/email.ts`, `app/api/verify-email/route.ts`, `app/verify-email/page.tsx`

**2. Password Reset Flow** ✅ **IMPLEMENTED**
- ✅ **Status**: Fully implemented and working
- **Features**:
  - Secure token-based password reset
  - 1-hour expiration on reset tokens
  - Email-based verification with reset link
  - One-time use tokens (invalidated after use)
  - Password strength validation on reset
  - Forgot password link on login page
- **Files**: `app/api/forgot-password/route.ts`, `app/api/reset-password/route.ts`, `app/forgot-password/page.tsx`, `app/reset-password/page.tsx`

**3. Server-Side Password Validation** ✅ **IMPLEMENTED**
- ✅ **Status**: Fully implemented
- **Features**:
  - Minimum 8 characters enforced
  - Requires uppercase, lowercase, and numbers
  - Validated on both client and server
  - Clear error messages for users
- **Files**: `app/api/user/signup/route.ts`, `app/signup/page.tsx`

**4. Account Lockout** ✅ **IMPLEMENTED**
- ✅ **Status**: Fully implemented and working
- **Features**:
  - Tracks failed login attempts per user
  - Locks account after 5 failed attempts
  - 30-minute temporary lockout
  - Email notification sent on lockout
  - Automatic unlock after timeout
  - Shows remaining attempts to user
  - Resets counter on successful login
- **Database**: `User.failedLoginAttempts`, `User.accountLockedUntil`
- **Files**: `lib/auth-user.ts`, `prisma/migrations/20251226173601_add_account_lockout/`

### HIGH Priority - Remaining

**5. Security Headers** ✅ **IMPLEMENTED**
- ✅ **Status**: Fully implemented in `next.config.ts`
- **Headers Active**:
  - Strict-Transport-Security (HSTS)
  - X-Content-Type-Options (nosniff)
  - X-Frame-Options (DENY)
  - Referrer-Policy (strict-origin-when-cross-origin)
  - Cross-Origin-Opener-Policy
  - Cross-Origin-Resource-Policy
  - Permissions-Policy (blocks unnecessary features)
  - Content-Security-Policy-Report-Only
- **File**: `next.config.ts`

**6. Session Security Enhancements**
- ⚠️ **Partial**: Basic session management only
- **Recommendation**:
  - Add "Logout all devices" functionality
  - Track active sessions per user
  - Show last login time/location
  - Alert on new device login

### MEDIUM Priority

**7. Two-Factor Authentication (2FA)**
- ❌ **Missing**: No 2FA option
- **Recommendation**:
  - TOTP-based 2FA (Google Authenticator, Authy)
  - Backup codes for account recovery
  - Optional but recommended for users

**8. Suspicious Activity Detection**
- ❌ **Missing**: No anomaly detection
- **Recommendation**:
  - Track login locations (IP geolocation)
  - Alert on login from new location
  - Flag suspicious patterns (rapid account creation, etc.)

**9. API Key Security** (if you add API keys)
- ❌ **Not applicable yet**
- **Future**: If you add API functionality:
  - Rate limit per API key
  - Key rotation
  - Scoped permissions

### LOW Priority

**10. Content Security Policy (CSP)**
- ⚠️ **Basic**: Default Next.js CSP
- **Recommendation**:
  - Strict CSP headers
  - Nonce-based script execution
  - Report-only mode first, then enforce

**11. Audit Logging**
- ❌ **Missing**: No security event logging
- **Recommendation**:
  - Log authentication events
  - Log account changes
  - Log failed login attempts
  - Retention policy for compliance

---

## Environment Variables Security

### Required Secrets

**DO NOT commit these to Git:**

```bash
# Authentication
AUTH_SECRET=<random-32-byte-string>          # Generate: openssl rand -base64 32
NEXTAUTH_SECRET=<same-as-auth-secret>         # Backward compatibility

# Google OAuth
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-secret>

# Database
DATABASE_URL=postgresql://...                  # Never expose publicly

# Email (REQUIRED - email verification & password reset)
RESEND_API_KEY=<resend-api-key>               # For transactional emails
EMAIL_FROM="TrendArc <noreply@trendarc.net>"  # Optional, defaults to this
```

### Environment Variable Best Practices

1. **Use Vercel Environment Variables**: Never hardcode
2. **Separate by Environment**: Different secrets for dev/staging/prod
3. **Rotate Regularly**: Change secrets every 90 days
4. **Least Privilege**: Only grant necessary permissions

---

## OAuth Provider Security

### Google OAuth Configuration

**Authorized Redirect URIs:**
```
https://trendarc.net/api/auth/callback/google
http://localhost:3000/api/auth/callback/google (dev only)
```

**Important:**
- Never expose Client Secret in client-side code
- Regularly review OAuth consent screen
- Monitor for suspicious OAuth activity
- Use incremental authorization (request only needed scopes)

---

## Incident Response Plan

### If User Account is Compromised:

1. **Immediate Actions:**
   - Invalidate all active sessions for the user
   - Force password reset
   - Notify user via email
   - Review recent account activity

2. **Investigation:**
   - Check login logs for suspicious IPs
   - Review any data accessed/modified
   - Determine attack vector

3. **Prevention:**
   - Force 2FA for affected users
   - Update security measures
   - Communicate lessons learned

### If Database is Compromised:

1. **Immediate Actions:**
   - Rotate all database credentials
   - Invalidate all user sessions
   - Take affected systems offline
   - Notify affected users

2. **Assessment:**
   - Determine scope of breach
   - Identify compromised data
   - Review compliance requirements (GDPR, etc.)

3. **Recovery:**
   - Restore from secure backup
   - Implement additional safeguards
   - Legal/regulatory reporting if required

---

## Compliance Considerations

### GDPR (if serving EU users)

- ✅ User can delete account (data deletion)
- ✅ Passwords hashed (data protection)
- ⚠️ Need: Privacy policy, cookie consent
- ⚠️ Need: Data export functionality
- ⚠️ Need: Breach notification procedures

### CCPA (if serving California users)

- ⚠️ Need: "Do Not Sell" option
- ⚠️ Need: Data deletion upon request
- ⚠️ Need: Disclosure of data collection

---

## Security Testing Checklist

### Before Production Deployment:

- [ ] Test login with incorrect password (should fail gracefully)
- [ ] Test SQL injection attempts (should be blocked by Prisma)
- [ ] Test XSS attempts in input fields (should be sanitized)
- [ ] Test CSRF attacks (NextAuth should block)
- [ ] Test rate limiting (should return 429 after limits)
- [ ] Verify HTTPS enforcement (no mixed content)
- [ ] Verify secure cookie flags (HttpOnly, Secure, SameSite)
- [ ] Test password reset flow (when implemented)
- [ ] Test email verification flow (when implemented)
- [ ] Run dependency security audit: `npm audit`

### Regular Security Audits:

- [ ] Monthly: Review failed login attempts
- [ ] Monthly: Check for vulnerable dependencies
- [ ] Quarterly: Review user permissions
- [ ] Quarterly: Test disaster recovery
- [ ] Annually: External security audit (if budget allows)

---

## Reporting Security Issues

If you discover a security vulnerability, please:

1. **DO NOT** create a public GitHub issue
2. Email: security@trendarc.net (when set up)
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (optional)

We will respond within 48 hours and work on a fix immediately.

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)
- [Prisma Security Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [Vercel Security](https://vercel.com/docs/security)

---

**Last Updated**: 2025-12-26
**Next Review**: 2026-01-26
