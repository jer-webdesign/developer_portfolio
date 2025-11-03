# Developer Portfolio - Full-Stack Authentication Platform

A comprehensive full-stack developer portfolio platform with secure authentication, role-based access control, and multi-user portfolio management capabilities.

##  **Project Overview**

This project implements a **modern, secure web application** featuring:
-  **JWT-based Authentication** with refresh tokens and Google OAuth integration
-  **Role-Based Access Control (RBAC)** with user and admin roles
-  **Multi-User Portfolio Platform** allowing users to create and manage portfolios
-  **SSL/TLS Encryption** with comprehensive security headers
-  **RESTful API Design** with protected routes and middleware
-  **Modern React Frontend** with Vite, context-based state management
-  **MongoDB Integration** with Mongoose ODM and data validation
-  **Email Services** for password reset and notifications
-  **Rate Limiting & Security** with Helmet.js, CORS, and CSRF protection

---

##  **Platform Features**

### **Authentication & Security**
- **JWT Authentication**: Secure token-based authentication with access and refresh tokens
- **Google OAuth 2.0**: Single sign-on integration with Google accounts
- **Password Security**: Argon2 hashing with strong validation requirements
- **Account Protection**: Rate limiting, account lockout, and password reset functionality
- **Session Management**: Secure token management with blacklisting capabilities

### **Role-Based Access Control**
- **User Roles**: Standard users and administrators with different permissions
- **Multi-Admin Support**: Configurable multiple administrators for enhanced management
- **Protected Routes**: Frontend and backend route protection based on user roles
- **Enhanced Access Control**: Educational access denied modals demonstrating RBAC concepts
- **Admin Dashboard**: Comprehensive user management and portfolio oversight
- **Permission Levels**: Granular access control for different application features
- **User Experience**: Clear role transparency and informative access control messaging
- **Runtime Admin Management**: Add/remove administrators without code changes

### **Multi-User Portfolio Platform**
- **Individual Portfolios**: Each user can create and manage their own portfolio
- **Portfolio Editor**: Rich interface for updating profile, projects, and skills
- **Public Portfolio Views**: Shareable portfolio URLs for each user
- **Content Management**: Dynamic content updates with real-time validation

### **Core Portfolio Sections**
- **Home**: Professional introduction with animated hero section
- **About**: Comprehensive developer bio and personal branding
- **Skills**: Technologies and technical expertise showcase with categories
- **Projects**: Project descriptions with GitHub repositories and live demos
- **Blog**: Technical articles and knowledge sharing platform
- **Contact**: Professional contact form with email integration

### **Technical Implementation**
- **MongoDB Database**: Robust data persistence with Mongoose ODM
- **Email Services**: Nodemailer integration for notifications and password reset
- **File Upload**: Secure file handling for profile images and documents
- **Responsive Design**: Mobile-first design with CSS Grid and Flexbox
- **Error Handling**: Comprehensive error management and user feedback
- **API Documentation**: Well-documented RESTful API endpoints

---

##  **Quick Start**

### Prerequisites
- Node.js (v14.0.0 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

### Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd developer-portfolio
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create environment file
   cp .env.example .env
   # Edit .env with your configuration
   
   # Generate SSL certificates
   openssl req -x509 -newkey rsa:4096 -keyout ssl/server.key -out ssl/server.cert -days 365 -nodes
   
   # Start the backend server
   npm run start
   # For development with auto-reload
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Start the development server
   npm run dev
   ```

4. **Environment Configuration**
   
   Configure your `.env` file in the backend directory:
   ```env
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/dev_portfolio
   
   # JWT Configuration
   JWT_SECRET=your-strong-jwt-secret-here
   JWT_REFRESH_SECRET=your-strong-refresh-secret-here
   JWT_EXPIRE=15m
   JWT_REFRESH_EXPIRE=7d
   
   # Google OAuth 2.0
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=https://localhost:3000/auth/google/callback
   
   # Application Settings
   NODE_ENV=development
   PORT=3000
   FRONTEND_URL=https://localhost:5173
   
   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-specific-password
   ```

### Access the Application
- **Frontend**: https://localhost:5173
- **Backend API**: https://localhost:3000
- **Health Check**: https://localhost:3000/health
---

##  **API Documentation**

### **Authentication Endpoints**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh access token
- `GET /auth/google` - Google OAuth initiation
- `GET /auth/google/callback` - Google OAuth callback
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Password reset confirmation

### **Protected User Endpoints**
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `GET /api/portfolio` - Get user's portfolio data
- `PUT /api/portfolio` - Update user's portfolio

### **Public Portfolio Endpoints**
- `GET /profile` - Get public profile data
- `GET /projects` - Get public projects
- `GET /posts` - Get blog posts
- `GET /hero` - Get hero section data
- `GET /about` - Get about section data
- `GET /skill-categories` - Get skills data
- `GET /contact-info` - Get contact information

### **Admin Endpoints**
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/users/:id` - Get specific user (admin only)
- `PUT /api/admin/users/:id/role` - Update user role (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)

---

##  **Technology Stack**

### **Backend**
- **Runtime**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens, Passport.js, Google OAuth 2.0
- **Security**: Helmet.js, CORS, Rate Limiting, Argon2 password hashing
- **Email**: Nodemailer with SMTP configuration
- **Validation**: Express-validator, custom validation middleware
- **Testing**: Jest with Supertest for API testing

### **Frontend**
- **Framework**: React 18 with functional components and hooks
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Pure CSS with CSS Grid and Flexbox
- **HTTP Client**: Axios with interceptors for token management
- **State Management**: React Context API for authentication state
- **Icons**: Lucide React for consistent iconography
- **Routing**: Custom routing with protected route components

### **DevOps & Security**
- **SSL/TLS**: Self-signed certificates for HTTPS development
- **Process Management**: Nodemon for development auto-reload
- **Code Quality**: ESLint for code linting and standards
- **Environment**: dotenv for environment variable management
- **Logging**: Custom error handling and request logging
# Backend:  https://localhost:3000
# Frontend: https://localhost:5173
```

**Note**: Accept browser security warnings for self-signed certificates.

---

##  **Project Structure**

```
developer-portfolio/
├── backend/                    # Express.js Server
│   ├── config/                # Configuration files
│   │   ├── database.js        # MongoDB connection
│   │   └── passport.js        # Passport.js configuration
│   ├── middleware/            # Custom middleware
│   │   ├── auth.js           # Authentication middleware
│   │   ├── csrf.js           # CSRF protection
│   │   └── rateLimiter.js    # Rate limiting middleware
│   ├── models/               # Mongoose models
│   │   ├── User.js           # User model with auth
│   │   ├── Project.js        # Project model
│   │   ├── BlogPost.js       # Blog post model
│   │   └── TokenBlacklist.js # Token blacklist model
│   ├── routes/               # API routes
│   │   ├── auth.js           # Authentication routes
│   │   ├── protected.js      # Protected user routes
│   │   ├── userPortfolio.js  # User portfolio management
│   │   ├── admin.js          # Admin-only routes
│   │   └── portfolio.js      # Public portfolio routes
│   ├── services/             # Business logic
│   │   └── emailService.js   # Email service
│   ├── ssl/                  # SSL certificates
│   ├── tests/                # Test suites
│   ├── utils/                # Utility functions
│   ├── server.js             # Main server file
│   └── package.json          # Backend dependencies
│
└── frontend/                  # React Application
    ├── src/
    │   ├── components/        # Reusable components
    │   │   ├── Navbar/       # Navigation component
    │   │   ├── Header/       # Header component
    │   │   └── Footer/       # Footer component
    │   ├── pages/            # Page components
    │   │   ├── Home/         # Landing page
    │   │   ├── About/        # About page
    │   │   ├── Skills/       # Skills showcase
    │   │   ├── Projects/     # Projects portfolio
    │   │   ├── Blog/         # Blog platform
    │   │   ├── Contact/      # Contact form
    │   │   ├── Login/        # Login page
    │   │   ├── Register/     # Registration page
    │   │   ├── Profile/      # User profile management
    │   │   ├── CreatePortfolio/ # Portfolio creation
    │   │   ├── AdminDashboard/   # Admin dashboard
    │   │   └── ForgotPassword/   # Password reset
    │   ├── contexts/         # React contexts
    │   │   └── AuthContext.jsx # Authentication context
    │   ├── utils/            # Utility functions
    │   │   └── axios.js      # Axios configuration
    │   ├── App.jsx           # Main application
    │   └── main.jsx          # React entry point
    ├── package.json          # Frontend dependencies
    └── vite.config.js        # Vite configuration
```

---

##  **Security Implementation**

### **Authentication Security**
- **Password Hashing**: Argon2 with configurable parameters
- **JWT Tokens**: Secure access and refresh token implementation
- **Token Blacklisting**: Invalidated tokens tracked in database
- **Account Lockout**: Protection against brute force attacks
- **Rate Limiting**: Request throttling on sensitive endpoints
- **Google OAuth**: Secure third-party authentication integration

### **API Security**
- **CORS Configuration**: Controlled cross-origin resource sharing
- **Helmet.js**: Comprehensive security headers
- **Input Validation**: Express-validator for request validation
- **CSRF Protection**: Cross-site request forgery prevention
- **SQL Injection Prevention**: Mongoose ODM with parameterized queries

---

##  **API Routes & Caching**

| Route | Method | Cache Strategy | Security Focus |
|-------|--------|---------------|----------------|
| `/` | GET | 10min + SWR | Public API discovery |
| `/profile` | GET | 15min | Static profile data |
| `/projects` | GET | 5min + SWR | Dynamic project list |
| `/projects/:id` | GET | 10min | Individual projects |
| `/posts` | GET | 5min + SWR | Blog post listings |
| `/posts/:id` | GET | 5min | Individual posts |
| `/contact` | POST | No cache | Sensitive user data |

**SWR** = Stale-While-Revalidate for optimal performance

---

##  **Documentation**

- **[SSL Setup Guide](backend/SSL_SETUP_README.md)** - Certificate generation steps
- **[Routes Design & Cache Control](backend/ROUTES_DESIGN_CACHE_CONTROL.md)** - Detailed caching strategies
- **[Frontend Guide](frontend/README.md)** - React application setup

---

##  **Portfolio Requirements Compliance**

### ** All Core Requirements Met:**
- **Profile Bio**: Comprehensive developer bio showcasing expertise and experience
- **Technologies Listed**: Extensive skills showcase including modern web technologies
- **Project Descriptions**: Detailed project portfolio with technical descriptions
- **GitHub & Demo Links**: All projects include repository and live demo links
- **Blog Section**: Technical articles, tutorials, and knowledge sharing content
- **Contact Form**: Professional contact system for collaboration opportunities

### ** Additional Features:**
- **Personal Branding**: Consistent professional presentation throughout
- **Responsive Design**: Mobile-friendly interface with smooth navigation
- **Security Implementation**: HTTPS, SSL certificates, and security headers
- **Performance Optimization**: Strategic caching and optimized loading  

---

##  **Technology Stack**

### **Backend**
- **Runtime**: Node.js + Express
- **Security**: Helmet.js, SSL/TLS
- **Protocol**: HTTPS only
- **Port**: 3000
- **API Routes**: Profile, Projects, Blog, Contact

### **Frontend**
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Pure CSS with CSS Variables
- **Icons**: Lucide React
- **Port**: 5173 (HTTPS)
- **Sections**: Home, About, Skills, Projects, Blog, Contact

---

##  **Security Features**

### **SSL/TLS Configuration**
- **Certificate Type**: Self-signed (development)
- **Encryption**: RSA 4096-bit
- **Subject Alternative Names**: localhost, 127.0.0.1, ::1
- **HTTPS Enforcement**: Strict Transport Security headers

### **Role-Based Access Control**
- **User Roles**: Standard users and administrators
- **Multi-Admin Support**: Configurable multiple administrators
- **Route Protection**: Frontend and backend route guards
- **Permission Checks**: Middleware-based authorization
- **Admin Features**: User management and portfolio oversight
- **Admin Management**: Runtime addition/removal of admin users

---

##  **Authentication Flow**

### **Registration Process**
1. User submits registration form with validation
2. Password hashed using Argon2
3. User account created with 'user' role
4. JWT tokens generated for immediate login
5. Welcome email sent (optional)

### **Login Process**
1. User credentials validated
2. JWT access token (15m) and refresh token (7d) generated
3. Tokens stored securely (httpOnly cookies or localStorage)
4. User context updated in frontend
5. Redirect to dashboard or intended page

### **Google OAuth Flow**
1. User initiates Google OAuth login
2. Redirected to Google consent screen
3. Google returns authorization code
4. Backend exchanges code for user profile
5. User account created/updated automatically
6. JWT tokens generated and returned

### **Token Management**
1. Access tokens expire after 15 minutes
2. Refresh tokens used to generate new access tokens
3. Logout adds tokens to blacklist
4. Automatic token refresh on API calls

---

##  **User Roles & Permissions**

### **Standard Users**
-  Create and manage personal portfolio
-  Update profile information
-  View public portfolios
-  Access contact forms
-  Cannot access admin features
-  Cannot manage other users

### **Administrators**
-  All user permissions
-  View all registered users
-  Manage user accounts
-  Change user roles
-  Delete user accounts
-  Access admin dashboard
-  System-wide portfolio management

---

##  **Testing & Quality Assurance**

### **Backend Testing**
- **Authentication Tests**: Login, registration, token validation
- **Authorization Tests**: Role-based access control
- **API Endpoint Tests**: All routes with various scenarios
- **Security Tests**: Rate limiting, validation, CSRF protection
- **Integration Tests**: Database operations and email services

### **Test Coverage**
- Run tests: `npm test`
- Watch mode: `npm run test:watch`
- Test files located in `backend/tests/`

---

##  **Troubleshooting**

### **Common Issues**
1. **MongoDB Connection**: Ensure MongoDB is running
2. **SSL Certificates**: Run ssl_setup.ps1 to regenerate
3. **Google OAuth**: Check callback URLs match configuration
4. **CORS Errors**: Verify FRONTEND_URL in backend .env
5. **Token Issues**: Clear localStorage and retry login

### **Development Tips**

- Use `npm run dev` for auto-reload during development
- Check browser console for detailed error messages
- Use MongoDB Compass for database inspection
- Test API endpoints with Postman or similar tools

##  **Attributions**

### **Core Technologies**
- Node.js Foundation. (n.d.). Node.js - JavaScript runtime. https://nodejs.org/
- Express.js. (n.d.). Express - Node.js web application framework. https://expressjs.com/
- React. (n.d.). React – A JavaScript library for building user interfaces. https://react.dev/
- MongoDB Inc. (n.d.). MongoDB - The developer data platform. https://www.mongodb.com/
- Mongoose ODM. (n.d.). Mongoose - MongoDB object modeling for Node.js. https://mongoosejs.com/

### **Authentication & Security**
- Auth0. (n.d.). jsonwebtoken - JWT implementation for Node.js. https://github.com/auth0/node-jsonwebtoken
- Passport.js. (n.d.). Passport - Simple, unobtrusive authentication for Node.js. https://www.passportjs.org/
- Google Developers. (n.d.). Google OAuth 2.0. https://developers.google.com/identity/protocols/oauth2
- Argon2 Team. (n.d.). Argon2 - Password hashing library. https://github.com/ranisalt/node-argon2
- Helmet. (n.d.). Helmet.js - Express.js security middleware. https://helmetjs.github.io/

### **Frontend Development**
- Vite. (n.d.). Vite - Next generation frontend tooling. https://vitejs.dev/
- Axios. (n.d.). Axios - Promise-based HTTP client. https://axios-http.com/
- Lucide. (n.d.). Lucide React - Beautiful & consistent icon toolkit. https://lucide.dev/

### **Development & Testing**
- Jest. (n.d.). Jest - JavaScript testing framework. https://jestjs.io/
- ESLint. (n.d.). ESLint - Pluggable JavaScript linter. https://eslint.org/
- Nodemon. (n.d.). Nodemon - Monitor for changes in Node.js applications. https://nodemon.io/
- Supertest. (n.d.). Supertest - HTTP assertion library. https://github.com/ladjs/supertest

### **Email & Utilities**
- Nodemailer. (n.d.). Nodemailer - Send emails from Node.js. https://nodemailer.com/
- Express Validator. (n.d.). Express-validator - Middleware for validation. https://express-validator.github.io/
- Validator.js. (n.d.). Validator.js - String validation library. https://github.com/validatorjs/validator.js

### **Documentation & Resources**
- Mozilla Developer Network. (n.d.). HTTP headers. https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers
- Mozilla Developer Network. (n.d.). Web security. https://developer.mozilla.org/en-US/docs/Web/Security
- OWASP Foundation. (n.d.). OWASP Top 10. https://owasp.org/www-project-top-ten/
- JSON Web Tokens. (n.d.). JWT.io - JSON Web Token introduction. https://jwt.io/

### **Educational Institution**
- Southern Alberta Institute of Technology. (2025). CPRG-312-A Web Security Fundamentals [Course materials].

---

