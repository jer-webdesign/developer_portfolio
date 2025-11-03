# Role-Based Access Control (RBAC) Implementation

## Overview
This document provides comprehensive documentation for the Role-Based Access Control (RBAC) system implemented in the Developer Portfolio platform. The system enforces granular permissions based on user roles, ensuring secure access to resources and administrative functions.

## System Architecture

### RBAC Design Principles
- **Principle of Least Privilege**: Users receive minimum necessary permissions
- **Role-Based Security**: Permissions assigned through roles, not individual users
- **Separation of Duties**: Clear distinction between user and administrative functions
- **Defense in Depth**: Multiple layers of security checks (frontend and backend)

### Role Hierarchy

```
┌─────────────────┐
│  Admin Role     │  ← Full system access
│  (admin)        │
├─────────────────┤
│  User Role      │  ← Standard access
│  (user)         │
└─────────────────┘
```

## Role Definitions

### Administrator Role (`admin`)

**Assignment Criteria:**
- Configurable email addresses in `backend/config/adminConfig.js`
- Default admin: `jeremy.g.olanda@gmail.com`
- Additional admins can be added to the `ADMIN_EMAILS` array
- Automatically assigned during registration or OAuth login
- Cannot be self-assigned by regular users
- Admin management available through API endpoints

**Multi-Admin Support:**
```javascript
// Configuration in backend/config/adminConfig.js
const ADMIN_EMAILS = [
  'jeremy.g.olanda@gmail.com',
  'admin2@example.com',
  // Add more admin emails here
];
```

**Full Permissions:**
```
User Management:
 View all registered users with detailed information
 Access complete user profiles and portfolio data
 Modify user roles (promote/demote)
 Delete user accounts with all associated data
 Reset user passwords and account status

Portfolio Management:
 View all user portfolios
 Edit any user's portfolio content
 Delete portfolio projects and blog posts
 Moderate content across the platform
 Manage system-wide settings

System Administration:
 Access admin dashboard with analytics
 View system logs and error reports
 Manage application configuration
 Access debug and maintenance tools
```

### Standard User Role (`user`)

**Assignment Criteria:**
- Default role for all new registrations
- Assigned to any email other than admin email
- Cannot be elevated without admin intervention

**Limited Permissions:**
```
Personal Portfolio:
 Create and edit own portfolio content
 Manage personal projects and blog posts
 Update profile information and settings
 Upload and manage personal media

Content Access:
 View public portfolios from other users
 Use contact forms and communication features
 Access help and documentation

Restrictions:
 Cannot access other users' private data
 Cannot delete any content (safety measure)
 Cannot view admin dashboard
 Cannot modify user roles or permissions
 Cannot access system administration features
```

## Technical Implementation

### Backend Implementation

#### 1. User Model Enhancement (`backend/models/User.js`)
```javascript
const userSchema = new mongoose.Schema({
  // ... other fields
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  // ... other fields
});
```

#### 2. Role Assignment Logic (`backend/routes/auth.js`)
```javascript
const { getRoleForEmail } = require('../config/adminConfig');

// Registration endpoint
router.post('/register', async (req, res) => {
  const { email, username, password } = req.body;
  
  const user = new User({
    email,
    username,
    passwordHash: await argon2.hash(password),
    role: getRoleForEmail(email) // Dynamic admin role assignment
  });
  
  await user.save();
});
```

#### 3. Multi-Admin Configuration (`backend/config/adminConfig.js`)
```javascript
const ADMIN_EMAILS = [
  'jeremy.g.olanda@gmail.com',
  'admin2@example.com',
  // Add more admin emails here
];

const isAdminEmail = (email) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

const getRoleForEmail = (email) => {
  return isAdminEmail(email) ? 'admin' : 'user';
};

module.exports = {
  ADMIN_EMAILS,
  isAdminEmail,
  getRoleForEmail,
  addAdminEmail,
  removeAdminEmail,
  getAdminEmails
};
```

#### 4. Google OAuth Role Assignment (`backend/config/passport.js`)
```javascript
const { getRoleForEmail } = require('./adminConfig');

passport.use(new GoogleStrategy({
  // ... config
}, async (accessToken, refreshToken, profile, done) => {
  let user = await User.findOne({ googleId: profile.id });
  
  if (!user) {
    user = new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      username: profile.displayName,
      role: getRoleForEmail(profile.emails[0].value), // Dynamic admin role assignment
      authProvider: 'google'
    });
    await user.save();
  }
  
  return done(null, user);
}));
```

#### 4. Authorization Middleware (`backend/middleware/auth.js`)
```javascript
// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Admin-only middleware
const requireAdmin = [authenticate, authorize('admin')];

module.exports = { authenticate, authorize, requireAdmin };
```

#### 5. Admin Routes (`backend/routes/admin.js`)
```javascript
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');

// Apply admin authentication to all routes
router.use(requireAdmin);

// User management endpoints
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.get('/users/:id/portfolio', getUserPortfolio);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Portfolio management endpoints
router.put('/users/:id/portfolio', updateUserPortfolio);
router.delete('/users/:id/projects/:projectId', deleteUserProject);
router.delete('/users/:id/posts/:postId', deleteUserPost);

module.exports = router;
```

### Frontend Implementation

#### 1. Authentication Context (`frontend/src/contexts/AuthContext.jsx`)
```jsx
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Computed property for admin status
  const isAdmin = user?.role === 'admin';
  
  const contextValue = {
    user,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    // ... other methods
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### 2. Protected Route Component (`frontend/src/components/ProtectedRoute.jsx`)
```jsx
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && !isAdmin) {
    return (
      <div className="access-denied">

## Security Measures

### Role Assignment Security
- **Configurable Admin Emails**: Admin role assignment based on configurable email list
- **Multi-Admin Support**: Multiple administrators can be configured
- **Immutable Role Logic**: Regular users cannot modify their own roles
- **Consistent Assignment**: Same logic applies to both local and OAuth registration
- **Database Validation**: Role field validated at database level with enum constraints

### Multi-Admin Management
- **Runtime Admin Addition**: New admins can be added via API without code changes
- **Safe Admin Removal**: Prevents removing the last admin or self-removal
- **Centralized Configuration**: All admin emails managed in single configuration file
- **Automatic Role Sync**: Database user roles updated when admin list changes

## Multi-Admin Configuration Guide

### Adding Additional Admins

#### Method 1: Configuration File (Recommended for initial setup)
```javascript
// backend/config/adminConfig.js
const ADMIN_EMAILS = [
  'jeremy.g.olanda@gmail.com',
  'admin2@company.com',
  'admin3@company.com'
];
```

#### Method 2: API Endpoint (Runtime management)
```bash
# Add new admin (requires existing admin authentication)
POST https://localhost:3000/api/admin/admins
Content-Type: application/json
Authorization: Bearer <admin_jwt_token>

{
  "email": "newadmin@company.com"
}
```

### Removing Admins
```bash
# Remove admin (requires existing admin authentication)
DELETE https://localhost:3000/api/admin/admins/admin2@company.com
Authorization: Bearer <admin_jwt_token>
```

### Listing Current Admins
```bash
# Get list of all admin emails
GET https://localhost:3000/api/admin/admins
Authorization: Bearer <admin_jwt_token>
```

### Safety Features
- **Self-Protection**: Admins cannot remove themselves
- **Last Admin Protection**: System prevents removal of the last admin
- **Email Validation**: Proper email format validation for new admins
- **Case Insensitive**: Email matching works regardless of case

### Access Control Security
- **JWT Token Validation**: All protected routes require valid JWT tokens
- **Role Verification**: Middleware checks user role before granting access
- **Session Validation**: User account status verified on each request
- **Resource Ownership**: Users can only access their own resources (unless admin)

### Frontend Security
- **Route Guards**: Protected routes check authentication and role status
- **Conditional Rendering**: UI elements shown/hidden based on user permissions
- **API Integration**: Frontend respects backend authorization responses
- **Secure Navigation**: Unauthorized access attempts handled gracefully

## API Endpoint Documentation

### Public Endpoints (No Authentication Required)
```
GET    /                       - Public portfolio data
GET    /projects               - Public projects
GET    /posts                  - Public blog posts
GET    /hero                   - Hero section data
GET    /about                  - About section data
GET    /skill-categories       - Skills data
GET    /contact-info           - Contact information
POST   /auth/register          - User registration
POST   /auth/login             - User login
GET    /auth/google            - Google OAuth initiation
```

### User-Protected Endpoints (Authentication Required)
```
GET    /api/profile            - Get user profile
PUT    /api/profile            - Update user profile
GET    /api/portfolio          - Get user's portfolio data
PUT    /api/portfolio          - Update user's portfolio
POST   /auth/logout            - Secure logout
POST   /auth/refresh           - Refresh access token
```

### Admin-Only Endpoints (Admin Role Required)
```
GET    /api/admin/users                    - List all users
GET    /api/admin/users/:id               - Get specific user details
GET    /api/admin/users/:id/portfolio     - Get user's portfolio
PUT    /api/admin/users/:id/portfolio     - Update user's portfolio
PUT    /api/admin/users/:id/role          - Change user role
DELETE /api/admin/users/:id               - Delete user account
DELETE /api/admin/users/:id/projects/:pid - Delete user's project
DELETE /api/admin/users/:id/posts/:pid    - Delete user's blog post
```

## Testing the RBAC System

### Manual Testing Scenarios

#### 1. Admin User Testing
```bash
# Register/Login as admin user (jeremy.g.olanda@gmail.com)
# Expected: Full access to all features

1. Access admin dashboard → Should succeed
2. View all users → Should display all registered users
3. Modify user roles → Should allow role changes
4. Delete user accounts → Should allow account deletion
5. Edit any portfolio → Should allow editing any user's content
```

#### 2. Standard User Testing
```bash
# Register/Login as any other email
# Expected: Limited access

1. Access admin dashboard → Should show "Access Denied"
2. Access /api/admin/* endpoints → Should return 403 Forbidden
3. Edit own portfolio → Should succeed
4. View others' portfolios → Should only see public content
5. Attempt role modification → Should be prevented
```

#### 3. Unauthenticated User Testing
```bash
# No login token
# Expected: Public access only

1. Access protected routes → Should redirect to login
2. API calls to /api/* → Should return 401 Unauthorized
3. View public content → Should succeed
4. Registration/Login → Should succeed
```

### Automated Testing

#### Backend Tests (`backend/tests/auth.test.js`)
```javascript
describe('RBAC System', () => {
  test('Admin can access admin routes', async () => {
    const adminToken = await getAdminToken();
    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
  
  test('User cannot access admin routes', async () => {
    const userToken = await getUserToken();
    await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });
});
```

## Role Management

### Promoting Users to Admin
Currently, admin role assignment is hard-coded for security. To add new admins:

1. **Database Direct Update**:
   ```javascript
   // MongoDB shell or admin script
   db.users.updateOne(
     { email: "new-admin@example.com" },
     { $set: { role: "admin" } }
   );
   ```

2. **Future Enhancement**: Admin dashboard role management interface
   - Allow existing admins to promote users
   - Audit trail for role changes
   - Confirmation dialogs for security

### Demoting Admin Users
```javascript
// MongoDB shell
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "user" } }
);
```

## Future Enhancements

### Planned RBAC Improvements
- **Granular Permissions**: More detailed permission system
- **Role Hierarchy**: Additional roles (moderator, editor, etc.)
- **Resource-Level Permissions**: Permissions on specific portfolios/projects
- **Time-Based Access**: Temporary role assignments
- **Audit Logging**: Track all role changes and access attempts

### Advanced Security Features
- **Two-Factor Authentication**: Additional security for admin accounts
- **Session Management**: Advanced session control and monitoring
- **IP Whitelisting**: Restrict admin access to specific IP addresses
- **Approval Workflows**: Require approval for sensitive actions

---

## Summary

The RBAC implementation provides:
-  **Secure Role Assignment**: Hard-coded admin logic prevents privilege escalation
-  **Comprehensive Protection**: Both frontend and backend enforce permissions
-  **User Experience**: Smooth access control without security compromises
-  **Scalable Architecture**: Easy to extend with additional roles and permissions
-  **Testing Coverage**: Manual and automated testing scenarios included

The system successfully demonstrates enterprise-level access control while maintaining simplicity and usability for the portfolio platform.

#### 4. Admin Dashboard Implementation (`frontend/src/pages/AdminDashboard/AdminDashboard.jsx`)
```jsx
const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    
    fetchAllUsers();
  }, [isAdmin]);
  
  const fetchAllUsers = async () => {
    try {
      const response = await axiosInstance.get('/api/admin/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isAdmin) {
    return <div>Access denied. Admin privileges required.</div>;
  }
  
  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      {/* User management interface */}
    </div>
  );
};
```

**Enhanced Navbar Implementation with Protected Route Demonstration:**
```javascript
// Updated Navbar Component with Access Control
const Navbar = ({ activeSection, navigateToSection, ... }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);

  // Enhanced admin dashboard click handler
  const handleAdminDashboardClick = () => {
    if (isAdmin) {
      navigateToSection('admin');  // Grant access for admin users
    } else {
      setShowAccessDeniedModal(true);  // Show educational modal for non-admin users
    }
  };

  return (
    <nav>
      {/* Admin Dashboard - Visible to ALL authenticated users */}
      {isAuthenticated && (
        <li
          className={`nav-item${activeSection === 'admin' ? ' active' : ''}`}
          role="menuitem"
          tabIndex={0}
          aria-current={activeSection === 'admin' ? 'page' : undefined}
          data-tooltip="Admin Dashboard"
          onClick={handleAdminDashboardClick}
        >
          <span className="nav-item-icon">🛡️</span>
          <span className="nav-item-text">Admin Dashboard</span>
        </li>
      )}

      {/* Access Denied Modal for Educational UX */}
      {showAccessDeniedModal && (
        <div className="modal-overlay">
          <div className="access-denied-modal">
            <div className="modal-header">
              <h3>🚫 Access Denied</h3>
            </div>
            <div className="modal-content">
              <div className="access-denied-icon">🛡️</div>
              <h4>Admin Access Required</h4>
              <p>
                The Admin Dashboard is a <strong>protected route</strong> that requires administrator privileges. 
                Only users with admin role can access this area.
              </p>
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
            <div className="modal-footer">
              <button onClick={() => setShowAccessDeniedModal(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
```

**Key UI Protection Features:**
- ✅ **Visibility Control**: Admin Dashboard visible only to authenticated users
- ✅ **Access Control**: Role-based permissions enforced on click
- ✅ **Educational Modal**: Professional access denied interface
- ✅ **Role Transparency**: Clear display of current vs required permissions
- ✅ **User Experience**: Informative rather than just blocking access

### 3. App Component (`frontend/src/App.jsx`)
**Changes:**
- Imports AdminDashboard component
- Imports `isAdmin` from AuthContext
- Renders AdminDashboard only for admin users

**Line ~17:**
```javascript
import AdminDashboard from './pages/AdminDashboard/AdminDashboard.jsx';
```

**Line ~25:**
```javascript
const { isAuthenticated, isAdmin } = useAuth();
```

**Lines ~241-243:**
```javascript
{activeSection === 'admin' && isAdmin && (
  <AdminDashboard />
)}
```

### 4. CreatePortfolio Component (`frontend/src/pages/CreatePortfolio/CreatePortfolio.jsx`)
**Changes:**
- Imports `isAdmin` from AuthContext
- Conditionally shows "Delete All" button only for admin

**Line ~7:**
```javascript
const { user, isAdmin } = useAuth();
```

**Lines ~671-679:**
```javascript
{isAdmin && (
  <button
    onClick={handleDelete}
    className="btn btn-delete"
    disabled={saving}
  >
    Delete All
  </button>
)}
```

### 5. Admin Dashboard (`frontend/src/pages/AdminDashboard/`) - NEW COMPONENT

**AdminDashboard.jsx** - Complete admin interface with:
- User statistics (total users, admins, regular users)
- User management table
- Actions: View Portfolio, Change Role, Delete User
- User detail modal showing complete portfolio info
- Protected route (redirects non-admin users)

**AdminDashboard.css** - Complete styling for:
- Responsive dashboard layout
- User statistics cards
- Data table with hover effects
- Role badges (admin/user)
- Action buttons
- Modal for viewing user details
- Mobile-responsive design

## Security Features

### Backend Protection
1. **JWT Authentication Required:** All admin routes require valid JWT token
2. **Role Verification:** `authorize('admin')` middleware checks user.role === 'admin'
3. **Self-Protection:** Admin cannot delete or change their own role
4. **Cascade Delete:** Deleting user also removes all their projects and blog posts

### Frontend Protection
1. **Route Protection:** Admin dashboard checks `isAdmin` and redirects if false
2. **Conditional Rendering:** Admin features only visible to admin users
3. **Enhanced UI Protection:** Admin Dashboard link visible to authenticated users with access control modal

## Testing Checklist

### Admin User (jeremy.g.olanda@gmail.com)
- [ ] Can register with admin role automatically assigned
- [ ] Can login via Google OAuth with admin role
- [ ] Sees "Admin Dashboard" link in navbar when authenticated
- [ ] Can access Admin Dashboard directly (no modal shown)
- [ ] Can view all users in dashboard
- [ ] Can view any user's portfolio details
- [ ] Can delete any user (except themselves)
- [ ] Can change other users' roles
- [ ] Sees "Delete All" button in Create Portfolio page
- [ ] Can delete portfolio content

### Regular User (any other email)
- [ ] Registers with 'user' role automatically
- [ ] Login via Google OAuth gets 'user' role
- [ ] Sees "Admin Dashboard" link in navbar when authenticated
- [ ] Clicking "Admin Dashboard" shows "Access Denied" modal
- [ ] Modal displays current role as "User" and required role as "Admin"
- [ ] Modal explains protected route concept with educational content
- [ ] Cannot access /api/admin/* endpoints (403 Forbidden)
- [ ] Redirected from Admin Dashboard if URL is manually entered
- [ ] Does NOT see "Delete All" button in Create Portfolio
- [ ] Can only edit and save own content
- [ ] Cannot access other users' data

### Unauthenticated User
- [ ] Does NOT see "Admin Dashboard" link in navbar
- [ ] Cannot access any protected routes
- [ ] Redirected to login for authenticated features
- [ ] Login via Google OAuth gets 'user' role
- [ ] Does NOT see "Admin" link in navbar
- [ ] Cannot access /api/admin/* endpoints (403 Forbidden)
- [ ] Redirected from Admin Dashboard if URL is manually entered
- [ ] Does NOT see "Delete All" button in Create Portfolio
- [ ] Can only edit and save own content
- [ ] Cannot access other users' data

## API Endpoints Summary

### Public Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `GET /auth/google` - Google OAuth

### Authenticated User Endpoints
- `GET /api/profile` - Get own profile
- `PUT /api/profile` - Update own profile
- `GET /api/my-portfolio` - Get own portfolio
- `PUT /api/my-portfolio` - Update own portfolio

### Admin-Only Endpoints
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:userId` - Get user by ID
- `GET /api/admin/users/:userId/portfolio` - Get user's portfolio
- `PUT /api/admin/users/:userId/portfolio` - Update user's portfolio
- `DELETE /api/admin/users/:userId` - Delete user
- `PUT /api/admin/users/:userId/role` - Change user role
- `DELETE /api/admin/users/:userId/projects/:projectId` - Delete user's project
- `DELETE /api/admin/users/:userId/posts/:postId` - Delete user's blog post

### Admin Management Endpoints (NEW)
- `GET /api/admin/admins` - Get list of admin emails
- `POST /api/admin/admins` - Add new admin email
- `DELETE /api/admin/admins/:email` - Remove admin email

## File Structure

```
backend/
├── routes/
│   ├── admin.js (UPDATED - Admin management endpoints)
│   ├── auth.js (UPDATED - Multi-admin role assignment)
│   └── ...
├── config/
│   ├── adminConfig.js (NEW - Multi-admin configuration)
│   └── passport.js (UPDATED - Multi-admin Google OAuth)
├── middleware/
│   └── auth.js (EXISTING - authorize middleware)
└── server.js (UPDATED - Register admin routes)

frontend/
├── src/
│   ├── pages/
│   │   ├── AdminDashboard/ (NEW)
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── AdminDashboard.css
│   │   └── CreatePortfolio/
│   │       └── CreatePortfolio.jsx (UPDATED - Hide delete for users)
│   ├── components/
│   │   └── Navbar/
│   │       └── Navbar.jsx (UPDATED - Admin link)
│   ├── contexts/
│   │   └── AuthContext.jsx (EXISTING - isAdmin helper)
│   └── App.jsx (UPDATED - Admin route)
```


