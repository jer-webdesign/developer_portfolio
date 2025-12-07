# Threat Model - Developer Portfolio Platform

## 1. Critical Assets Identification

### 1.1 User Data Assets
- **Personal Information**: Names, email addresses, phone numbers, locations
- **Authentication Credentials**: Passwords (hashed with Argon2), JWT tokens, refresh tokens
- **Profile Data**: Bios, professional information, social media links (encrypted with AES-256-GCM)
- **User-Generated Content**: Projects, blog posts, portfolio information
- **OAuth Data**: Google OAuth tokens and profile information

### 1.2 Session & Authentication Assets
- **JWT Access Tokens**: Short-lived tokens (1 hour) for API authentication
- **JWT Refresh Tokens**: Long-lived tokens (7 days) stored in HTTP-only cookies
- **Session Data**: Active user sessions, token blacklist
- **OAuth Sessions**: Google OAuth authentication state and tokens

### 1.3 Database Assets
- **MongoDB Database**: User records, projects, blog posts, token blacklist
- **Connection Strings**: Database credentials and connection information
- **Encryption Keys**: AES-256-GCM encryption keys for sensitive profile data

### 1.4 Infrastructure Assets
- **SSL/TLS Certificates**: Server certificates for HTTPS encryption
- **API Endpoints**: RESTful API with authentication and authorization
- **Environment Variables**: API keys, secrets, database credentials
- **Third-Party Services**: Email service credentials, Google OAuth credentials

### 1.5 Application Code
- **Source Code**: Frontend React application and backend Node.js/Express server
- **Dependencies**: npm packages and third-party libraries
- **Configuration Files**: Server configurations, security headers, CORS settings

---

## 2. Threat Identification & STRIDE Analysis

### 2.1 Spoofing Threats

#### T1: JWT Token Theft
- **Description**: Attacker intercepts or steals JWT tokens to impersonate legitimate users
- **Attack Vectors**:
  - XSS attacks to steal tokens from localStorage or session storage
  - Man-in-the-middle attacks if HTTPS is not properly configured
  - Token exposure in browser console or network logs
- **STRIDE Category**: Spoofing
- **Impact**: HIGH - Attacker gains full user account access
- **Likelihood**: MEDIUM - Requires XSS vulnerability or network compromise
- **Risk Level**: **HIGH**
- **Current Mitigations**:
  - JWT tokens stored in HTTP-only cookies (refresh tokens)
  - Access tokens stored in memory (AuthContext)
  - HTTPS enforcement with SSL/TLS certificates
  - Token expiration (1 hour for access, 7 days for refresh)
  - Token blacklisting on logout

#### T2: Credential Stuffing Attacks
- **Description**: Attackers use leaked credentials from other breaches to attempt login
- **Attack Vectors**:
  - Automated login attempts with known email/password combinations
  - Brute force attacks on login endpoint
- **STRIDE Category**: Spoofing
- **Impact**: HIGH - Unauthorized account access
- **Likelihood**: MEDIUM - Common attack, but rate limiting provides protection
- **Risk Level**: **MEDIUM**
- **Current Mitigations**:
  - Rate limiting on authentication endpoints (5 requests per 15 minutes)
  - Account lockout after 5 failed login attempts
  - Strong password requirements (8+ chars, uppercase, lowercase, number, special char)
  - Argon2 password hashing with high computational cost

#### T3: OAuth Authentication Bypass
- **Description**: Exploiting Google OAuth implementation flaws to bypass authentication
- **Attack Vectors**:
  - OAuth redirect manipulation
  - State parameter manipulation
  - Token replay attacks
- **STRIDE Category**: Spoofing
- **Impact**: HIGH - Unauthorized account creation or access
- **Likelihood**: LOW - Passport.js provides robust OAuth implementation
- **Risk Level**: **MEDIUM**
- **Current Mitigations**:
  - Passport.js Google OAuth strategy implementation
  - State parameter validation
  - Secure callback URL configuration

### 2.2 Tampering Threats

#### T4: SQL/NoSQL Injection
- **Description**: Injecting malicious queries to manipulate database operations
- **Attack Vectors**:
  - User input fields (login, registration, profile updates)
  - Query parameter manipulation
  - JSON payload injection
- **STRIDE Category**: Tampering
- **Impact**: CRITICAL - Database breach, data manipulation, data loss
- **Likelihood**: MEDIUM - Common attack vector if inputs not sanitized
- **Risk Level**: **HIGH**
- **Current Mitigations**:
  - Mongoose ODM with parameterized queries
  - Input validation using express-validator
  - Sanitization with validator library
  - Schema validation at model level

#### T5: Cross-Site Scripting (XSS)
- **Description**: Injecting malicious JavaScript into web pages viewed by other users
- **Attack Vectors**:
  - Stored XSS in profile bio, project descriptions, blog posts
  - Reflected XSS in URL parameters or form inputs
  - DOM-based XSS through client-side JavaScript
- **STRIDE Category**: Tampering
- **Impact**: HIGH - Token theft, session hijacking, malicious actions as user
- **Likelihood**: MEDIUM - Requires user-generated content display without sanitization
- **Risk Level**: **HIGH**
- **Current Mitigations**:
  - Input sanitization with validator.escape()
  - Content Security Policy (CSP) headers
  - React's built-in XSS protection (automatic escaping)
  - Stripping HTML tags from bio fields server-side

#### T6: CSRF (Cross-Site Request Forgery)
- **Description**: Forcing authenticated users to execute unwanted actions
- **Attack Vectors**:
  - Malicious links or forms that trigger authenticated requests
  - State-changing operations without CSRF protection
- **STRIDE Category**: Tampering
- **Impact**: MEDIUM - Unauthorized actions performed as authenticated user
- **Likelihood**: LOW - Modern SameSite cookie attributes provide protection
- **Risk Level**: **MEDIUM**
- **Current Mitigations**:
  - SameSite cookie attribute on refresh tokens
  - Origin and Referer header validation
  - CSRF middleware available but may need implementation

### 2.3 Repudiation Threats

#### T7: Insufficient Audit Logging
- **Description**: Lack of comprehensive logging prevents accountability and forensic analysis
- **Attack Vectors**:
  - Attackers perform malicious actions without detection
  - Security incidents cannot be properly investigated
- **STRIDE Category**: Repudiation
- **Impact**: MEDIUM - Difficulty in incident response and forensics
- **Likelihood**: HIGH - Common oversight in applications
- **Risk Level**: **MEDIUM**
- **Current Mitigations**:
  - Basic console logging for errors
  - LastLogin tracking in user model
  - Failed login attempt tracking
- **Gaps**: No centralized logging, no audit trail for sensitive operations

### 2.4 Information Disclosure Threats

#### T8: Sensitive Data Exposure in API Responses
- **Description**: Exposing sensitive information in API responses
- **Attack Vectors**:
  - Password hashes in user objects
  - Internal system information in error messages
  - Debug information in production
- **STRIDE Category**: Information Disclosure
- **Impact**: HIGH - Credential exposure, system information leakage
- **Likelihood**: LOW - Mongoose select: false on passwordHash
- **Risk Level**: **MEDIUM**
- **Current Mitigations**:
  - passwordHash excluded from queries (select: false)
  - Sensitive fields removed before API responses
  - Generic error messages for authentication failures

#### T9: Insecure Data Storage
- **Description**: Sensitive profile data stored without proper encryption
- **Attack Vectors**:
  - Database compromise exposing plaintext sensitive data
  - Backup exposure
  - Insider threats
- **STRIDE Category**: Information Disclosure
- **Impact**: HIGH - Privacy breach, data exposure
- **Likelihood**: MEDIUM - Depends on database security
- **Risk Level**: **MEDIUM**
- **Current Mitigations**:
  - AES-256-GCM encryption for bio and publicEmail fields
  - Encryption key stored in environment variables
  - Argon2 for password hashing (not reversible)

#### T10: Information Leakage via Error Messages
- **Description**: Detailed error messages revealing system architecture or vulnerabilities
- **Attack Vectors**:
  - Stack traces in production
  - Database error messages
  - Validation error details
- **STRIDE Category**: Information Disclosure
- **Impact**: MEDIUM - Assists attackers in reconnaissance
- **Likelihood**: MEDIUM - Common in development environments not secured for production
- **Risk Level**: **MEDIUM**
- **Current Mitigations**:
  - Generic error messages for users
  - Detailed errors only logged server-side
  - Environment-specific error handling

### 2.5 Denial of Service Threats

#### T11: API Rate Limiting Bypass
- **Description**: Overwhelming the API with requests to cause service degradation
- **Attack Vectors**:
  - Distributed attacks from multiple IPs
  - Resource exhaustion through expensive operations
  - Database query flooding
- **STRIDE Category**: Denial of Service
- **Impact**: MEDIUM - Service unavailability, poor user experience
- **Likelihood**: MEDIUM - Requires sustained attack
- **Risk Level**: **MEDIUM**
- **Current Mitigations**:
  - express-rate-limit middleware on API routes
  - Different limits for auth, registration, password reset
  - MongoDB connection pooling

#### T12: Account Enumeration
- **Description**: Discovering valid user accounts through timing or response differences
- **Attack Vectors**:
  - Different responses for "user exists" vs "invalid password"
  - Timing attacks on login endpoint
  - Registration endpoint reveals existing emails
- **STRIDE Category**: Information Disclosure / Denial of Service
- **Impact**: LOW - Facilitates targeted attacks
- **Likelihood**: HIGH - Common vulnerability
- **Risk Level**: **MEDIUM**
- **Current Mitigations**:
  - Generic error messages for failed logins
  - Rate limiting prevents mass enumeration
- **Gaps**: Registration returns specific error if email exists

### 2.6 Elevation of Privilege Threats

#### T13: Insecure Direct Object References (IDOR)
- **Description**: Accessing other users' resources by manipulating object IDs
- **Attack Vectors**:
  - Changing userId in API requests
  - Accessing projects/posts belonging to other users
  - Profile viewing without authorization
- **STRIDE Category**: Elevation of Privilege
- **Impact**: HIGH - Unauthorized data access, privacy breach
- **Likelihood**: MEDIUM - Requires missing authorization checks
- **Risk Level**: **HIGH**
- **Current Mitigations**:
  - authorizeOwnerOrAdmin middleware for resource access
  - User ID from JWT token (req.user._id) used for queries
  - Role-based access control (RBAC)

#### T14: JWT Algorithm Confusion
- **Description**: Exploiting JWT library to bypass signature verification
- **Attack Vectors**:
  - Changing algorithm from RS256 to HS256
  - Using "none" algorithm
  - Key confusion attacks
- **STRIDE Category**: Elevation of Privilege
- **Impact**: CRITICAL - Complete authentication bypass
- **Likelihood**: LOW - jsonwebtoken library with secure defaults
- **Risk Level**: **MEDIUM**
- **Current Mitigations**:
  - Explicit algorithm specification in JWT config
  - Strong secret keys
  - Token verification on every protected route

#### T15: Admin Privilege Escalation
- **Description**: Standard users gaining admin privileges
- **Attack Vectors**:
  - Manipulating role field in profile updates
  - Exploiting admin role assignment logic
  - Session token manipulation
- **STRIDE Category**: Elevation of Privilege
- **Impact**: CRITICAL - Full system compromise
- **Likelihood**: LOW - Role field excluded from user updates
- **Risk Level**: **MEDIUM**
- **Current Mitigations**:
  - Role field removed from allowed updates in PUT /api/profile
  - authorize() middleware checks user role
  - Admin role only assigned via adminConfig

---

## 3. Risk Assessment Summary

### Critical Risks (Immediate Action Required)
None currently - application has good baseline security

### High Risks
1. **T4: SQL/NoSQL Injection** - Continue monitoring and testing
2. **T5: Cross-Site Scripting (XSS)** - Enhanced input sanitization needed
3. **T1: JWT Token Theft** - Consider additional XSS protections
4. **T13: Insecure Direct Object References** - Verify all authorization checks

### Medium Risks
2. **T2: Credential Stuffing** - Consider multi-factor authentication
3. **T3: OAuth Bypass** - Regular security audits of OAuth flow
4. **T6: CSRF** - Implement explicit CSRF tokens for state-changing operations
5. **T7: Insufficient Logging** - Implement comprehensive audit logging
6. **T8-T10: Information Disclosure** - Regular code reviews for data leakage
7. **T11: DoS Attacks** - Consider CDN and advanced rate limiting
8. **T12: Account Enumeration** - Standardize all authentication responses
9. **T14-T15: Privilege Escalation** - Regular authorization testing

### Low Risks
Other identified threats with existing mitigations

---

## 4. Security Testing Recommendations

### 4.1 Manual Testing
- SQL/NoSQL injection attempts in all input fields
- XSS payloads in user-generated content
- CSRF testing with cross-origin requests
- IDOR testing by manipulating resource IDs
- JWT manipulation and replay attacks

### 4.2 Automated Testing
- `npm audit` for dependency vulnerabilities
- OWASP ZAP for dynamic application security testing
- Burp Suite for comprehensive vulnerability scanning
- Static code analysis with ESLint security plugins

### 4.3 Continuous Monitoring
- Dependency vulnerability tracking
- Regular security audits
- Penetration testing
- Log monitoring and alerting

---

## 5. Threat Model Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        EXTERNAL ACTORS                           │
├─────────────────────────────────────────────────────────────────┤
│  [End User] ←→ [Attacker] ←→ [Admin User] ←→ [OAuth Provider]  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      TRUST BOUNDARY                              │
│                     (HTTPS/TLS Layer)                            │
│  Threats: T1 (Token Theft), T10 (Info Leakage)                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                   FRONTEND APPLICATION                           │
│                    (React + Vite)                                │
├─────────────────────────────────────────────────────────────────┤
│  Components:                                                     │
│  • Authentication UI (Login/Register)                            │
│  • Portfolio Pages (Home, About, Projects, Blog, Contact)       │
│  • Admin Dashboard                                               │
│  • Profile Editor                                                │
│                                                                  │
│  Assets: JWT tokens in memory, User session state               │
│  Threats: T5 (XSS), T6 (CSRF), T1 (Token Theft)                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓ HTTPS API Calls
                         │
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND APPLICATION                            │
│                 (Node.js + Express.js)                           │
├─────────────────────────────────────────────────────────────────┤
│  Components:                                                     │
│  • Authentication Service (JWT + OAuth)                          │
│  • API Routes (Protected + Public)                              │
│  • Middleware (Auth, RBAC, Rate Limiting)                       │
│  • Email Service                                                 │
│  • Encryption Service (AES-256-GCM)                             │
│                                                                  │
│  Assets:                                                         │
│  • JWT Secrets                                                   │
│  • Encryption Keys                                               │
│  • OAuth Credentials                                             │
│  • Session Data                                                  │
│                                                                  │
│  Threats:                                                        │
│  • T2 (Credential Stuffing)                                     │
│  • T3 (OAuth Bypass)                                            │
│  • T4 (NoSQL Injection)                                         │
│  • T6 (CSRF)                                                    │
│  • T7 (Insufficient Logging)                                    │
│  • T8 (Data Exposure)                                           │
│  • T11 (DoS)                                                    │
│  • T12 (Account Enumeration)                                    │
│  • T13 (IDOR)                                                   │
│  • T14 (JWT Algorithm Confusion)                                │
│  • T15 (Privilege Escalation)                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓ Mongoose ODM
                         │
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER                               │
│                      (MongoDB)                                   │
├─────────────────────────────────────────────────────────────────┤
│  Collections:                                                    │
│  • users (credentials, profiles, encrypted data)                 │
│  • projects (user projects)                                      │
│  • blogposts (blog content)                                      │
│  • tokenblacklist (invalidated tokens)                          │
│                                                                  │
│  Assets:                                                         │
│  • User credentials (Argon2 hashed)                             │
│  • Personal information (encrypted sensitive fields)             │
│  • User-generated content                                        │
│  • Session tokens                                                │
│                                                                  │
│  Threats:                                                        │
│  • T4 (NoSQL Injection)                                         │
│  • T9 (Insecure Storage)                                        │
│  • T11 (Query Flooding)                                         │
└─────────────────────────────────────────────────────────────────┘

DATA FLOW DIAGRAM:

1. User Authentication Flow:
   User → [HTTPS] → Frontend → [API Call] → Backend Auth Routes
   → Validate Credentials → Generate JWT → Store Refresh Token (Cookie)
   → Return Access Token → User Authenticated
   
   Threats: T1, T2, T3, T12

2. Profile Update Flow:
   User → Profile Form → [API Call] → Backend Protected Route
   → Validate Input → Sanitize Data → Encrypt Sensitive Fields
   → Store in MongoDB → Return Success
   
   Threats: T4, T5, T8, T13

3. OAuth Flow:
   User → Google OAuth → Callback → Backend Auth
   → Validate OAuth Token → Create/Update User → Generate JWT
   → Redirect with Token
   
   Threats: T3, T1

4. Resource Access Flow:
   User → Request Resource → Verify JWT → Check Authorization
   → Query Database → Return Data
   
   Threats: T13, T14, T15
```

---

## 6. Reflection on STRIDE Framework

The STRIDE framework proved invaluable in systematically identifying threats:

1. **Spoofing**: Helped identify authentication vulnerabilities and token-related threats
2. **Tampering**: Revealed input validation and injection risks
3. **Repudiation**: Highlighted the need for better audit logging
4. **Information Disclosure**: Uncovered data exposure and privacy concerns
5. **Denial of Service**: Identified rate limiting and resource exhaustion risks
6. **Elevation of Privilege**: Revealed authorization and access control gaps

**Unexpected Findings**:
- Some risks initially thought high (like OAuth bypass) were actually lower due to robust library implementations
- Account enumeration, while low impact, had higher likelihood and became medium risk
- The encryption implementation for sensitive fields was more comprehensive than expected, reducing information disclosure risk

**Impact on Risk Management**:
- High-risk threats (XSS, SQL injection, IDOR) will receive priority in testing phase
- Medium-risk threats need monitoring but don't require immediate changes
- The combination of impact and likelihood helped prioritize the security testing roadmap
