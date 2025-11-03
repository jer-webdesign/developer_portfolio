# Developer Portfolio - Authentication & Authorization System

## Project Overview

This document provides comprehensive documentation for the secure authentication and authorization system implemented in the Developer Portfolio platform. The system features JWT-based authentication, Google OAuth integration, role-based access control, and comprehensive security measures designed for a multi-user portfolio platform.

## Current Implementation Status

 **Authentication System**
- JWT-based authentication with access and refresh tokens
- Local registration and login with secure password hashing
- Google OAuth 2.0 integration for single sign-on
- Password reset functionality with email verification
- Account lockout protection against brute force attacks

 **Authorization & RBAC**
- Role-based access control with user and admin roles
- Protected routes on both frontend and backend
- Middleware-based permission checking
- Admin dashboard for user management

 **Security Features**
- Argon2 password hashing with configurable parameters
- Token blacklisting for secure logout
- Rate limiting on sensitive endpoints
- CSRF protection and input validation
- Comprehensive security headers via Helmet.js

 **Multi-User Platform**
- Individual user portfolios with unique URLs
- Portfolio editor for authenticated users
- User profile management
- Admin oversight of all user accounts

## Quick Start

### Prerequisites

- Node.js (v14.0.0 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git
- OpenSSL (for SSL certificate generation)

### Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd developer-portfolio
   ```

2. **Install Dependencies**
   ```bash
   # Backend dependencies
   cd backend
   npm install
   
   # Frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the backend directory:
   ```env
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/dev_portfolio
   
   # JWT Configuration
   JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
   JWT_REFRESH_SECRET=your-super-secure-refresh-secret-minimum-32-characters
   JWT_EXPIRE=15m
   JWT_REFRESH_EXPIRE=7d
   
   # Session Configuration
   SESSION_SECRET=your-super-secure-session-secret-minimum-32-characters
   
   # Google OAuth 2.0 Configuration
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=https://localhost:3000/auth/google/callback
   
   # Application Settings
   NODE_ENV=development
   PORT=3000
   FRONTEND_URL=https://localhost:5173
   
   # Email Configuration (for password reset)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-gmail-app-password
   EMAIL_FROM=noreply@yourportfolio.com
   
   # Security Settings
   ARGON2_MEMORY_COST=65536
   ARGON2_TIME_COST=3
   ARGON2_PARALLELISM=1
   MAX_LOGIN_ATTEMPTS=5
   LOCKOUT_DURATION_MINUTES=15
   PASSWORD_RESET_EXPIRY_HOURS=1
   ```

4. **SSL Certificate Setup**
   ```bash
   # Navigate to backend directory
   cd backend
   
   # Windows PowerShell - Run the SSL setup script
   .\ssl_setup.ps1
   
   # Or manually create certificates
   openssl req -x509 -newkey rsa:4096 -keyout ssl/server.key -out ssl/server.cert -days 365 -nodes -config ssl/localhost.conf
   ```

5. **Database Setup**
   ```bash
   # Start MongoDB (if running locally)
   mongod
   
   # The application will automatically connect and create collections
   ```

6. **Start the Application**
   ```bash
   # Start the backend server
   cd backend
   npm run dev  # For development with auto-reload
   # OR
   npm start    # For production mode
   
   # In a new terminal, start the frontend
   cd frontend
   npm run dev
   ```

### Access Points
- **Frontend Application**: https://localhost:5173
- **Backend API**: https://localhost:3000
- **Health Check**: https://localhost:3000/health
- **Google OAuth**: https://localhost:3000/auth/google

**Note**: You'll need to accept the browser security warning for self-signed certificates in development.
   npm run dev
   ```

6. **Verify Installation**
   - Server should be running at: `https://localhost:3000`
   - Check server logs for successful MongoDB connection
   - Test API endpoints using the provided test script

### Troubleshooting

**Common Issues:**

1. **SSL Certificate Errors**
   - Ensure certificates are generated in the `backend/ssl/` directory
   - Both `server.key` and `server.cert` files must be present

2. **MongoDB Connection Issues**
   - Verify MongoDB is running locally or Atlas connection string is correct
   - Check network connectivity and firewall settings

3. **Environment Variable Issues**
   - Ensure `.env` file is in the `backend` directory
   - Verify all required variables are set with valid values

4. **Port Already in Use**
   - Change the PORT in `.env` file
   - Kill any existing processes using the port

## Authentication Architecture

### System Overview

The authentication system is built on a modern, secure foundation with the following components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │    │   (Express)     │    │   (MongoDB)     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • AuthContext   │◄──►│ • JWT Tokens    │◄──►│ • User Model    │
│ • Protected     │    │ • Passport.js   │    │ • Token         │
│   Routes        │    │ • Rate Limiting │    │   Blacklist     │
│ • Login/Logout  │    │ • Validation    │    │ • Session Data  │
│ • User Profile  │    │ • RBAC Middleware│   │ • OAuth Profiles│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Authentication Methods

#### 1. Local Authentication

**Registration Flow:**
1. User submits registration form with validation
2. Email uniqueness verified against database
3. Password strength validated (8+ chars, mixed case, numbers, symbols)
4. Password hashed using Argon2id with secure parameters
5. User account created with default 'user' role
6. JWT tokens generated and returned
7. Optional email verification sent

**Login Flow:**
1. User submits email and password
2. Rate limiting checks applied (5 attempts per 15 minutes)
3. User account retrieved and account lockout status checked
4. Password verified using Argon2 hash comparison
5. JWT access token (15m) and refresh token (7d) generated
6. User context updated, redirect to dashboard

**Security Features:**
- **Argon2id Hashing**: Memory-hard password hashing
- **Account Lockout**: 15-minute lockout after 5 failed attempts
- **Rate Limiting**: IP-based request throttling
- **Input Validation**: Comprehensive server-side validation

#### 2. Google OAuth 2.0 Integration

**OAuth Flow:**
1. User clicks "Login with Google" button
2. Redirected to Google OAuth consent screen
3. User authorizes application access
4. Google returns authorization code
5. Backend exchanges code for access token and user profile
6. User account created/updated with Google profile data
7. JWT tokens generated and user logged in

**Configuration Requirements:**
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://localhost:3000/auth/google/callback
```

### Token Management System

#### JWT Implementation
- **Access Tokens**: Short-lived (15 minutes) for API access
- **Refresh Tokens**: Long-lived (7 days) for token renewal
- **Token Structure**: Standard JWT with user ID, role, and expiration
- **Signing Algorithm**: HMAC SHA-256 with secure secret keys

#### Token Security
- **Blacklisting**: Logout adds tokens to blacklist in database
- **Automatic Refresh**: Frontend automatically refreshes expired tokens
- **Secure Storage**: Tokens stored in httpOnly cookies (production) or localStorage (development)
- **CSRF Protection**: Additional CSRF tokens for sensitive operations

#### Token Flow
```
Login → Generate Tokens → Store in Client → API Requests (with token)
  ↓
Token Expires → Use Refresh Token → Generate New Access Token
  ↓
Logout → Add to Blacklist → Clear Client Storage
```
4. **Token Generation**: JWT access and refresh tokens
5. **Secure Storage**: Refresh tokens in HTTP-only cookies

### Single Sign-On (SSO) - Google OAuth 2.0

#### Implementation Features
- **OAuth 2.0 Flow**: Standard authorization code flow
- **User Data Mapping**: Automatic profile creation from Google data
- **Account Linking**: Prevention of duplicate accounts
- **Fallback Handling**: Graceful error handling for OAuth failures

#### Configuration Required
1. Set up Google Cloud Project
2. Enable Google+ API
3. Configure OAuth consent screen
4. Create OAuth 2.0 credentials
5. Update environment variables

**See `GOOGLE_OAUTH_SETUP.md` for detailed setup instructions.**

### Password Reset System

#### Secure Reset Flow
1. **Request**: User provides email address
2. **Token Generation**: Cryptographically secure reset token
3. **Email Delivery**: Secure token sent via email
4. **Validation**: Token verification with expiry check
5. **Password Update**: New password hashed and stored

#### Security Features
- **Token Expiry**: 1-hour expiration for reset tokens
- **Single Use**: Tokens invalidated after use
- **Rate Limiting**: Maximum 3 reset requests per hour
- **Secure Storage**: Tokens hashed before database storage

## Role-Based Access Control (RBAC)

### User Roles

#### User Role (`user`)
- **Default Role**: Assigned to all new registrations
- **Permissions**:
  - Access and modify own profile
  - Create, read, update, delete own projects
  - Create, read, update, delete own blog posts
  - View public content from other users

#### Admin Role (`admin`)
- **Elevated Permissions**:
  - All user permissions
  - View all users in the system
  - Modify user roles
  - Delete user accounts
  - Access system administration features
  - Moderate content across all users

## Role-Based Access Control (RBAC)

### Role Hierarchy

The system implements a two-tier role system designed for simplicity and security:

#### Standard User Role (`user`)
- **Default Assignment**: All new registrations receive 'user' role
- **Core Permissions**:
  - Create and manage personal portfolio
  - Update profile information and settings
  - Create, edit, and delete own projects
  - Write, edit, and delete own blog posts
  - View public portfolios and content
  - Access contact forms and communication features
  - Use password reset and account management features

#### Administrator Role (`admin`)
- **Elevated Permissions**: All user permissions plus:
  - View and manage all user accounts
  - Access admin dashboard with system overview
  - Modify user roles and permissions
  - Delete user accounts and associated data
  - View system-wide analytics and reports
  - Moderate content across all user portfolios
  - Access debug and system maintenance features

### Route Protection Implementation

#### Frontend Route Guards

The system implements comprehensive route protection with user-friendly access control demonstrations:

**Navbar Access Control:**
```jsx
// Admin Dashboard Link Visibility
{isAuthenticated && (
  <li
    className={`nav-item${activeSection === 'admin' ? ' active' : ''}`}
    onClick={handleAdminDashboardClick}
  >
    <span className="nav-item-icon">🛡️</span>
    <span className="nav-item-text">Admin Dashboard</span>
  </li>
)}

// Access Control Handler
const handleAdminDashboardClick = () => {
  if (isAdmin) {
    navigateToSection('admin');  // Grant access
  } else {
    setShowAccessDeniedModal(true);  // Show educational modal
  }
};
```

**Access Denied Modal for Educational UX:**
```jsx
// Professional Access Denied Modal
{showAccessDeniedModal && (
  <div className="modal-overlay">
    <div className="access-denied-modal">
      <h3>🚫 Access Denied</h3>
      <h4>Admin Access Required</h4>
      <p>The Admin Dashboard is a <strong>protected route</strong> that requires administrator privileges.</p>
      
      <div className="access-denied-info">
        <h5>Protected Features Include:</h5>
        <ul>
          <li>✨ User Management</li>
          <li>✨ System Administration</li>
          <li>✨ Content Moderation</li>
          <li>✨ Analytics & Reports</li>
        </ul>
      </div>
      
      <div className="access-denied-suggestion">
        <p><strong>Your Current Role:</strong> {user?.role || 'User'}</p>
        <p><strong>Required Role:</strong> Admin</p>
        <p>Contact the system administrator if you need admin access.</p>
      </div>
    </div>
  </div>
)}
```

**Route Protection Logic:**
```jsx
// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <AccessDenied />;
  
  return children;
};

// Usage in App.jsx
<ProtectedRoute>
  <Profile />
</ProtectedRoute>

<ProtectedRoute adminOnly={true}>
  <AdminDashboard />
</ProtectedRoute>
```

**Key Protection Features:**
- ✅ **Visibility Control**: Admin Dashboard only visible to authenticated users
- ✅ **Access Control**: Role-based permissions enforced on click
- ✅ **Educational UX**: Clear messaging about protected routes and required permissions
- ✅ **Role Transparency**: Shows current vs required role for access
- ✅ **Professional Design**: Polished modal with comprehensive information

#### Backend Middleware Protection
```javascript
// Authentication Middleware
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  // Token validation and user extraction
};

// Authorization Middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

// Route Usage
router.get('/profile', authenticate, getUserProfile);
router.get('/admin/users', authenticate, authorize('admin'), getAllUsers);
```

### Protected API Endpoints

#### User-Protected Routes
```
GET    /api/profile              - Get user profile
PUT    /api/profile              - Update user profile
GET    /api/portfolio            - Get user's portfolio data
PUT    /api/portfolio            - Update user's portfolio
POST   /api/portfolio/projects   - Create new project
PUT    /api/portfolio/projects/:id - Update own project
DELETE /api/portfolio/projects/:id - Delete own project
POST   /auth/logout              - Secure logout
POST   /auth/refresh             - Refresh access token
```

#### Admin-Only Routes
```
GET    /api/admin/users          - List all registered users
GET    /api/admin/users/:id      - Get specific user details
GET    /api/admin/users/:id/portfolio - View user's portfolio
PUT    /api/admin/users/:id/role - Change user role
DELETE /api/admin/users/:id      - Delete user account
GET    /api/admin/stats          - System statistics
```

### Permission Validation Flow

1. **Request Received**: API endpoint receives request with JWT token
2. **Token Validation**: Middleware validates token signature and expiration
3. **User Extraction**: User information extracted from token payload
4. **Account Status Check**: Verify user account is active and not locked
5. **Role Authorization**: Check if user role meets route requirements
6. **Resource Ownership**: For user resources, verify ownership or admin privilege
7. **Access Granted/Denied**: Allow request or return appropriate error

### Security Considerations

- **Principle of Least Privilege**: Users only get minimum necessary permissions
- **Role Immutability**: Users cannot modify their own roles
- **Admin Account Protection**: Admin accounts have additional security measures
- **Session Validation**: All protected routes validate current session
- **Resource Ownership**: Users can only modify their own content (unless admin)

#### `authorizeOwnerOrAdmin(getResourceUserId)`
- Allows resource owners and admins to access resources
- Dynamically determines resource ownership
- Flexible for different resource types

## JWT Implementation

### Token Strategy

#### Access Tokens
- **Purpose**: API authentication and authorization
- **Expiration**: 15 minutes (short-lived for security)
- **Storage**: Client-side (localStorage or memory)
- **Payload**: User ID, username, email, role
- **Algorithm**: HS256 with strong secret

#### Refresh Tokens
- **Purpose**: Generate new access tokens
- **Expiration**: 7 days (long-lived for convenience)
- **Storage**: HTTP-only cookies (secure, XSS-resistant)
- **Rotation**: Limited to 5 active tokens per user
- **Revocation**: Removed on logout or security events

### Token Security

#### Secure Storage
```javascript
// Refresh token cookie configuration
{
  httpOnly: true,           // Prevents XSS attacks
  secure: true,             // HTTPS only (production)
  sameSite: 'strict',       // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
}
```

#### Token Validation
- **Signature Verification**: Cryptographic signature validation
- **Expiry Checking**: Automatic token expiration handling
- **User Status**: Active account verification
- **Revocation Support**: Database-backed token invalidation

#### Refresh Flow
1. Client detects expired access token
2. Sends refresh request with HTTP-only cookie
3. Server validates refresh token
4. Generates new access token
5. Client continues with new token

## Security Measures

### CSRF Protection

#### Implementation
- **Middleware**: `csurf` package with cookie strategy
- **Token Generation**: Cryptographically secure tokens
- **Cookie Configuration**:
  ```javascript
  {
    httpOnly: true,      // Server-side validation
    secure: true,        // HTTPS only
    sameSite: 'strict'   // Same-site requests only
  }
  ```

#### Client Integration
- CSRF token provided via `XSRF-TOKEN` cookie
- Client includes token in request headers
- Server validates token on state-changing requests

### Rate Limiting

#### API Protection
- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 login attempts per 15 minutes per IP
- **Registration**: 3 attempts per hour per IP
- **Password Reset**: 3 requests per hour per IP

#### Implementation Features
- **Skip Successful Requests**: Only failed attempts count
- **Standard Headers**: Rate limit info in response headers
- **Custom Messages**: User-friendly error messages

### Session Security

#### Cookie Security Attributes
```javascript
{
  httpOnly: true,        // Prevents XSS access
  secure: true,          // HTTPS only
  sameSite: 'strict',    // CSRF protection
  maxAge: 604800000      // 7 days expiration
}
```

#### Session Management
- **Token Rotation**: Regular refresh token rotation
- **Session Timeout**: Configurable token expiration
- **Concurrent Sessions**: Limited active sessions per user
- **Logout**: Complete token invalidation

### Additional Security Headers

#### Helmet Configuration
```javascript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,      // 1 year
    includeSubDomains: true,
    preload: true
  }
})
```

#### CORS Configuration
```javascript
cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
})
```

## 🧪 Testing the System

### Manual Testing

Use the provided PowerShell test script:
```bash
cd backend
powershell -ExecutionPolicy Bypass -File test_auth.ps1
```

### API Endpoints Testing

#### Registration
```bash
curl -k -X POST https://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com", 
    "password": "TestPassword123!"
  }'
```

#### Login
```bash
curl -k -X POST https://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

#### Protected Route
```bash
curl -k -X GET https://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Security Testing

#### Rate Limiting Test
```bash
# Test login rate limiting
for i in {1..10}; do
  curl -k -X POST https://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "wrong@email.com", "password": "wrongpassword"}'
done
```

#### RBAC Testing
```bash
# Test admin route access with user token (should fail)
curl -k -X GET https://localhost:3000/api/admin/users \
  -H "Authorization: Bearer USER_ACCESS_TOKEN"
```

---

## 📚 **Additional Documentation**

For comprehensive lessons learned, challenges faced, and development insights from this authentication system implementation, see:

**📖 [LESSONS_LEARNED.md](LESSONS_LEARNED.md)**

This dedicated document covers:
- Technical challenges and solutions encountered
- Security architecture decisions and trade-offs
- Performance and scalability considerations
- User experience design insights
- Testing strategies and quality assurance approaches
- Future improvements and recommendations
- Key takeaways for future projects

---