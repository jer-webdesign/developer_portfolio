const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Project = require('../models/Project');
const BlogPost = require('../models/BlogPost');

// Load developer data as fallback for non-authenticated users
const dataPath = path.join(__dirname, '../public/data/developer.json');
let defaultData = {};

try {
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  defaultData = JSON.parse(rawData);
} catch (error) {
  console.error('Error loading developer.json:', error);
}

// Expose raw developer.json for client-side static fetches
router.get('/developer.json', (req, res) => {
  try {
    return res.json(defaultData);
  } catch (err) {
    console.error('Error serving developer.json:', err);
    return res.status(500).json({ success: false, message: 'Failed to load developer data' });
  }
});

// Middleware to check if user is authenticated (optional authentication)
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.accessToken;
  
  if (!token) {
    return next(); // No token, proceed without user
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // Use decoded.userId instead of decoded.id
  } catch (error) {
    // Invalid token, proceed without user
  }
  
  next();
};

// GET /profile - Get profile data
router.get('/profile', optionalAuth, async (req, res) => {
  try {
    console.log('GET /profile - userId:', req.userId); // Debug log
    
    if (req.userId) {
      // Return logged-in user's profile (whether admin or regular user)
      const user = await User.findById(req.userId).select('-passwordHash -security');
      if (user) {
        console.log('Returning profile for logged-in user:', user.username); // Debug log
        // If user profile is empty or incomplete, fall back to default data
        const userProfile = user.profile || {};
        if (!userProfile.bio || !userProfile.headline) {
          console.log('User profile is empty, falling back to default data'); // Debug log
          return res.json({ success: true, data: defaultData.profile || {} });
        }
        return res.json({ success: true, data: userProfile });
      }
    }
    
    // Not logged in - return admin user's profile as default
    const adminUser = await User.findOne({ role: 'admin' }).select('-passwordHash -security');
    if (adminUser && adminUser.profile && adminUser.profile.bio) {
      console.log('Returning admin profile as default for non-logged-in user'); // Debug log
      return res.json({ success: true, data: adminUser.profile });
    }
    
    console.log('Returning default profile from JSON'); // Debug log
    // Return default profile if no admin found or admin profile is empty
    res.json({ success: true, data: defaultData.profile || {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /projects - Get projects
router.get('/projects', optionalAuth, async (req, res) => {
  try {
    console.log('GET /projects - userId:', req.userId); // Debug log
    
    if (req.userId) {
      // Return logged-in user's projects (whether admin or regular user)
      const projects = await Project.find({ userId: req.userId, status: 'completed' })
        .sort({ featured: -1, createdAt: -1 });
      console.log('Found projects for logged-in user:', projects.length); // Debug log
      
      // If user has no projects, fall back to default data
      if (projects.length === 0) {
        console.log('User has no projects, falling back to default data'); // Debug log
        return res.json({ success: true, data: defaultData.projects || [] });
      }
      
      return res.json({ success: true, data: projects });
    }
    
    // Not logged in - return admin user's projects as default
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      const projects = await Project.find({ userId: adminUser._id, status: 'completed' })
        .sort({ featured: -1, createdAt: -1 });
      console.log('Found admin projects as default:', projects.length); // Debug log
      
      // If admin has no projects, fall back to default data
      if (projects.length === 0) {
        console.log('Admin has no projects, falling back to default data'); // Debug log
        return res.json({ success: true, data: defaultData.projects || [] });
      }
      
      return res.json({ success: true, data: projects });
    }
    
    // Return default projects from JSON if no admin found
    console.log('Returning default projects from JSON'); // Debug log
    res.json({ success: true, data: defaultData.projects || [] });
  } catch (error) {
    console.error('Error fetching projects:', error); // Debug log
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /posts - Get blog posts
router.get('/posts', optionalAuth, async (req, res) => {
  try {
    if (req.userId) {
      // Return logged-in user's posts (whether admin or regular user)
      const posts = await BlogPost.find({ userId: req.userId, status: 'published' })
        .sort({ publishedAt: -1 });
      
      // If user has no posts, fall back to default data
      if (posts.length === 0) {
        console.log('User has no posts, falling back to default data'); // Debug log
        return res.json({ success: true, data: defaultData.posts || [] });
      }
      
      return res.json({ success: true, data: posts });
    }
    
    // Not logged in - return admin user's posts as default
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      const posts = await BlogPost.find({ userId: adminUser._id, status: 'published' })
        .sort({ publishedAt: -1 });
      
      // If admin has no posts, fall back to default data
      if (posts.length === 0) {
        console.log('Admin has no posts, falling back to default data'); // Debug log
        return res.json({ success: true, data: defaultData.posts || [] });
      }
      
      return res.json({ success: true, data: posts });
    }
    
    // Return default posts from JSON if no admin found
    res.json({ success: true, data: defaultData.posts || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /hero - Get hero section data
router.get('/hero', optionalAuth, async (req, res) => {
  try {
    console.log('GET /hero - userId:', req.userId); // Debug log
    
    if (req.userId) {
      // Return logged-in user's hero data (whether admin or regular user)
      const user = await User.findById(req.userId).select('profile.headline profile.subheadlines');
      if (user && user.profile && user.profile.headline) {
        console.log('Returning hero data for logged-in user:', { headline: user.profile.headline, subheadlines: user.profile.subheadlines }); // Debug log
        return res.json({ 
          success: true, 
          data: {
            headline: user.profile.headline,
            subheadline: user.profile.subheadlines
          }
        });
      }
      
      // If user has no hero data, fall back to default
      console.log('User has no hero data, falling back to default data'); // Debug log
      return res.json({ success: true, data: defaultData.hero || {} });
    }
    
    // Not logged in - return admin user's hero data as default
    const adminUser = await User.findOne({ role: 'admin' }).select('profile.headline profile.subheadlines');
    if (adminUser && adminUser.profile && adminUser.profile.headline) {
      console.log('Returning admin hero data as default'); // Debug log
      return res.json({ 
        success: true, 
        data: {
          headline: adminUser.profile.headline,
          subheadline: adminUser.profile.subheadlines
        }
      });
    }
    
    console.log('Returning default hero from JSON'); // Debug log
    res.json({ success: true, data: defaultData.hero || {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /about - Get about section data
router.get('/about', optionalAuth, async (req, res) => {
  try {
    if (req.userId) {
      // Return logged-in user's about data (whether admin or regular user)
      const user = await User.findById(req.userId).select('profile.aboutTitle profile.aboutContent profile.aboutCards');
      if (user && user.profile && user.profile.aboutContent) {
        return res.json({ 
          success: true, 
          data: {
            title: user.profile.aboutTitle,
            content: user.profile.aboutContent,
            cards: user.profile.aboutCards || []
          }
        });
      }
      
      // If user has no about data, fall back to default
      console.log('User has no about data, falling back to default data'); // Debug log
      return res.json({ success: true, data: defaultData.about || {} });
    }
    
    // Not logged in - return admin user's about data as default
    const adminUser = await User.findOne({ role: 'admin' }).select('profile.aboutTitle profile.aboutContent profile.aboutCards');
    if (adminUser && adminUser.profile && adminUser.profile.aboutContent) {
      return res.json({ 
        success: true, 
        data: {
          title: adminUser.profile.aboutTitle,
          content: adminUser.profile.aboutContent,
          cards: adminUser.profile.aboutCards || []
        }
      });
    }
    
    res.json({ success: true, data: defaultData.about || {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /skill-categories - Get skill categories
router.get('/skill-categories', optionalAuth, async (req, res) => {
  try {
    if (req.userId) {
      // Return logged-in user's skills (whether admin or regular user)
      const user = await User.findById(req.userId).select('skills');
      if (user && user.skills && user.skills.length > 0) {
        const skillCategories = user.skills.map(skill => ({
          category: skill.category,
          skills: skill.items
        }));
        return res.json({ success: true, data: skillCategories });
      }
      
      // If user has no skills, fall back to default data
      console.log('User has no skills data, falling back to default data'); // Debug log
      return res.json({ success: true, data: defaultData.skillCategories || [] });
    }
    
    // Not logged in - return admin user's skills as default
    const adminUser = await User.findOne({ role: 'admin' }).select('skills');
    if (adminUser && adminUser.skills && adminUser.skills.length > 0) {
      const skillCategories = adminUser.skills.map(skill => ({
        category: skill.category,
        skills: skill.items
      }));
      return res.json({ success: true, data: skillCategories });
    }
    
    res.json({ success: true, data: defaultData.skillCategories || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /contact-info - Get contact information
router.get('/contact-info', optionalAuth, async (req, res) => {
  try {
    if (req.userId) {
      // Return logged-in user's contact info (whether admin or regular user)
      const user = await User.findById(req.userId).select('profile.publicEmail profile.phone profile.location');
      if (user && user.profile && (user.profile.publicEmail || user.profile.phone || user.profile.location)) {
        return res.json({ 
          success: true, 
          data: {
            email: user.profile.publicEmail,
            phone: user.profile.phone,
            location: user.profile.location
          }
        });
      }
      
      // If user has no contact info, fall back to default data
      console.log('User has no contact info, falling back to default data'); // Debug log
      return res.json({ 
        success: true, 
        data: {
          email: defaultData.profile?.email || '',
          phone: '+1 (403) 987-6543',
          location: defaultData.profile?.location || 'Calgary, Alberta, Canada'
        }
      });
    }
    
    // Not logged in - return admin user's contact info as default
    const adminUser = await User.findOne({ role: 'admin' }).select('profile.publicEmail profile.phone profile.location');
    if (adminUser && adminUser.profile && (adminUser.profile.publicEmail || adminUser.profile.phone || adminUser.profile.location)) {
      return res.json({ 
        success: true, 
        data: {
          email: adminUser.profile.publicEmail,
          phone: adminUser.profile.phone,
          location: adminUser.profile.location
        }
      });
    }
    
    // Return default contact info from JSON
    res.json({ 
      success: true, 
      data: {
        email: defaultData.profile?.email || '',
        phone: '+1 (403) 987-6543',
        location: defaultData.profile?.location || 'Calgary, Alberta, Canada'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
