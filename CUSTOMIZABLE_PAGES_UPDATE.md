# User-Customizable Portfolio Pages Update 🎨

## Overview
Updated Home, About, and Contact pages to be fully customizable based on the logged-in user's profile data, transforming them from static content to dynamic user-specific pages.

---

## What Was Updated

### 1. **Home Page** (`Home.jsx`)
**Already Dynamic** - No changes needed!
- Uses `hero.headline` for main title
- Uses `hero.subheadline` for typing animation
- Uses `profile.bio` for description
- Uses `profile.github`, `profile.linkedin`, `profile.email` for links

**User Can Customize:**
- Hero headline (e.g., "JOHN DOE")
- Typing effect subheadlines (array of titles)
- Bio/description text
- Social links (GitHub, LinkedIn)

---

### 2. **About Page** (`About.jsx`)
**Now Fully Customizable!**

#### Before:
- Hardcoded "Secure Development" and "Knowledge Sharing" cards
- Static content that every user would see

#### After:
- Dynamic feature cards from `about.cards` array
- Users can add custom cards with their own categories and content
- Falls back to default cards if user hasn't customized

**User Can Customize:**
- About section title (e.g., "About Me", "My Story")
- Main bio content
- **Custom feature cards** - unlimited cards with:
  - Category title (e.g., "Expertise", "Passion", "Focus Area")
  - Card content/description

**Example Custom Cards:**
```javascript
{
  "aboutCards": [
    {
      "category": "Frontend Expertise",
      "content": "5+ years building responsive React applications with modern design principles"
    },
    {
      "category": "Backend Development",
      "content": "Experienced in Node.js, Express, MongoDB, and RESTful API design"
    },
    {
      "category": "Cloud Architecture",
      "content": "AWS certified developer with expertise in serverless and microservices"
    }
  ]
}
```

---

### 3. **Contact Page** (`Contact.jsx`)
**Now Fully Customizable!**

#### Before:
- Hardcoded email: `jeremy.g.olanda@gmail.com`
- Hardcoded phone: `+1 (403) 987-6543`
- Hardcoded location: `Calgary, Alberta, Canada`

#### After:
- Dynamic contact information from user's profile
- Each user can set their own contact details
- Click-to-copy functionality uses user's actual information

**User Can Customize:**
- **Public email** (can be different from login email)
- **Phone number**
- **Location** (city, state, country)

**Features:**
- Click to copy email and phone
- Only shows fields that are filled in
- Conditional rendering (no empty fields)

---

## Database Schema Updates

### User Model - New Fields Added

```javascript
profile: {
  // ... existing fields ...
  
  // About Page Customization
  aboutTitle: String,           // "About Me" or custom title
  aboutContent: String,         // Main bio text
  aboutCards: [{               // Custom feature cards
    category: String,          // Card title
    content: String            // Card description
  }],
  
  // Contact Page Customization
  phone: String,                // Public phone number
  publicEmail: String           // Public contact email
  
  // Home Page (already existed)
  // headline, subheadlines, bio, location, website, githubUrl, linkedinUrl
}
```

---

## New API Endpoints

### GET `/contact-info`
Returns user's contact information

**Authentication:** Optional (JWT if logged in)

**Response:**
```json
{
  "success": true,
  "data": {
    "email": "john@example.com",
    "phone": "+1 (555) 123-4567",
    "location": "San Francisco, CA"
  }
}
```

**Behavior:**
- **Logged-in user**: Returns their contact info from profile
- **Not logged in**: Returns default/demo contact info

---

### GET `/about` (Updated)
Now includes custom about cards

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "About Me",
    "content": "Full bio text here...",
    "cards": [
      {
        "category": "My Expertise",
        "content": "Description of expertise..."
      }
    ]
  }
}
```

---

## How Users Customize Their Pages

### Via API (Update Portfolio)

```javascript
// PUT /api/my-portfolio
{
  "profile": {
    // Home Page
    "headline": "JANE DOE",
    "subheadlines": ["Full Stack Developer", "React Expert", "Cloud Architect"],
    "bio": "Passionate developer with 8 years of experience...",
    
    // About Page
    "aboutTitle": "My Journey",
    "aboutContent": "I started coding when I was 12...",
    "aboutCards": [
      {
        "category": "Specialization",
        "content": "React, TypeScript, Node.js, AWS"
      },
      {
        "category": "Philosophy",
        "content": "Clean code, test-driven development, continuous learning"
      }
    ],
    
    // Contact Page
    "publicEmail": "contact@janedoe.com",
    "phone": "+1 (555) 987-6543",
    "location": "Austin, Texas"
  }
}
```

---

## Page Customization Summary

| Page | What's Customizable | How to Update |
|------|---------------------|---------------|
| **Home** | • Headline<br>• Subheadlines (typing effect)<br>• Bio<br>• Social links | Update `profile.headline`, `profile.subheadlines`, `profile.bio` |
| **About** | • Section title<br>• Main content<br>• Feature cards (category + content) | Update `profile.aboutTitle`, `profile.aboutContent`, `profile.aboutCards` |
| **Contact** | • Email address<br>• Phone number<br>• Location | Update `profile.publicEmail`, `profile.phone`, `profile.location` |
| **Skills** | • Skill categories<br>• Skills list | Update `skills` array |
| **Projects** | • Project entries | Use `/api/my-projects` endpoints |
| **Blog** | • Blog posts | Use `/api/my-posts` endpoints |

---

## Data Flow

```
User logs in → JWT token stored
   ↓
User's data loaded from database
   ↓
Pages rendered with user's custom content
   ↓
Home: Shows user's headline, bio, links
About: Shows user's custom cards
Contact: Shows user's contact info
```

**For non-logged-in visitors:**
```
No authentication → Default data shown
   ↓
Demo portfolio displayed
   ↓
Static content from developer.json
```

---

## Frontend Changes Summary

### Files Modified:

1. **`frontend/src/pages/About/About.jsx`**
   - Removed hardcoded feature cards
   - Added dynamic rendering from `about.cards`
   - Fallback to default cards if none provided

2. **`frontend/src/pages/Contact/Contact.jsx`**
   - Removed hardcoded contact info
   - Now receives `contactInfo` prop
   - Dynamic rendering with conditional display

3. **`frontend/src/App.jsx`**
   - Added `contactInfo` state
   - Fetch contact info from `/contact-info` endpoint
   - Pass `contactInfo` to Contact component

### Files Modified (Backend):

1. **`backend/models/User.js`**
   - Added `aboutCards` array to profile
   - Added `phone` field
   - Added `publicEmail` field

2. **`backend/routes/portfolio.js`**
   - Updated `/about` to include cards
   - Added `/contact-info` endpoint

---

## User Experience

### For Portfolio Owners:
1. **Register** an account
2. **Login** to get authenticated
3. **Update profile** via `/api/my-portfolio`:
   - Set custom headline and bio (Home page)
   - Add personalized feature cards (About page)
   - Set contact details (Contact page)
4. **View portfolio** - See your customizations live
5. **Share** portfolio URL with potential employers/clients

### For Visitors:
- View customized portfolios
- See unique content for each developer
- Contact developers using their provided information

---

## Example: Complete User Profile

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    
    // Home Page
    "headline": "JOHN DOE",
    "subheadlines": [
      "Full Stack Developer",
      "React Specialist",
      "Node.js Expert"
    ],
    "bio": "Experienced developer passionate about building scalable applications",
    "githubUrl": "https://github.com/johndoe",
    "linkedinUrl": "https://linkedin.com/in/johndoe",
    
    // About Page
    "aboutTitle": "About Me",
    "aboutContent": "I'm a full stack developer with 5 years of experience...",
    "aboutCards": [
      {
        "category": "Frontend Development",
        "content": "Expert in React, Vue, and modern JavaScript frameworks"
      },
      {
        "category": "Backend Systems",
        "content": "Proficient in Node.js, Express, MongoDB, PostgreSQL"
      },
      {
        "category": "DevOps",
        "content": "Experience with Docker, AWS, CI/CD pipelines"
      }
    ],
    
    // Contact Page
    "publicEmail": "contact@johndoe.dev",
    "phone": "+1 (555) 123-4567",
    "location": "Seattle, Washington"
  },
  
  // Skills Page
  "skills": [
    {
      "category": "🔥 LANGUAGES",
      "items": ["JavaScript", "TypeScript", "Python"]
    },
    {
      "category": "🌐 FRONTEND",
      "items": ["React", "Vue", "Next.js"]
    }
  ]
}
```

---

## Benefits

### For Users:
 **Complete Control** - Customize every section  
 **Personal Branding** - Unique content that represents them  
 **Easy Updates** - Change content via API anytime  
 **Professional Presentation** - Beautiful, responsive pages  

### For the Platform:
 **Scalability** - Supports unlimited users with unique content  
 **Flexibility** - Users can add as many feature cards as needed  
 **Data-Driven** - All content from database, not hardcoded  
 **Maintainability** - Easy to add new customizable fields  

---

## Testing Customization

### 1. Test Default Content (Not Logged In)
```bash
GET https://localhost:3000/profile
GET https://localhost:3000/about
GET https://localhost:3000/contact-info
```
Should return default/demo data

### 2. Test Custom Content (Logged In)
```bash
# Login first
POST https://localhost:3000/auth/login
{ "email": "test@example.com", "password": "password" }

# Update profile with custom content
PUT https://localhost:3000/api/my-portfolio
{
  "profile": {
    "headline": "YOUR NAME",
    "aboutCards": [
      { "category": "Expertise", "content": "Your skills" }
    ],
    "phone": "+1 555-1234",
    "publicEmail": "you@example.com"
  }
}

# View updated content
GET https://localhost:3000/profile  (with JWT token)
GET https://localhost:3000/about    (with JWT token)
GET https://localhost:3000/contact-info  (with JWT token)
```

---

## Summary

**All three pages are now fully customizable:**

| Page | Status | User Control |
|------|--------|--------------|
| Home | ✅ Complete | Headline, subheadlines, bio, links |
| About | ✅ Complete | Title, content, unlimited custom cards |
| Contact | ✅ Complete | Email, phone, location |
| Skills | ✅ Complete | Categories and skill items |
| Projects | ✅ Complete | CRUD via API |
| Blog | ✅ Complete | CRUD via API |
