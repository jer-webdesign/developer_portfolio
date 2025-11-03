const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const Project = require('../models/Project');
const BlogPost = require('../models/BlogPost');

// Middleware to ensure user is authenticated
const authenticate = passport.authenticate('jwt', { session: false });

// ==================== USER PORTFOLIO ROUTES ====================

// GET /api/my-portfolio - Get current user's complete portfolio
router.get('/my-portfolio', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash -security');
    const projects = await Project.find({ userId: req.user.id, status: { $in: ['completed', 'in-progress', 'planning'] } })
      .sort({ featured: -1, createdAt: -1 });
    const posts = await BlogPost.find({ userId: req.user.id, status: { $in: ['published', 'draft'] } })
      .sort({ publishedAt: -1 });

    res.json({
      success: true,
      data: {
        user: {
          username: user.username,
          email: user.email,
          profile: user.profile,
          skills: user.skills,
          social: user.social
        },
        projects,
        posts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/my-portfolio - Update current user's portfolio profile
router.put('/my-portfolio', authenticate, async (req, res) => {
  try {
    const { profile, skills, social } = req.body;
    
    console.log('\n=== RECEIVED PORTFOLIO UPDATE ===');
    console.log('User ID:', req.user.id);
    console.log('Profile data:', JSON.stringify(profile, null, 2));
    console.log('Skills data:', JSON.stringify(skills, null, 2));
    console.log('Social data:', JSON.stringify(social, null, 2));
    
    // Find the user first
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Update fields directly - ensure profile object exists
    if (profile) {
      if (!user.profile) {
        user.profile = {};
      }
      Object.keys(profile).forEach(key => {
        user.profile[key] = profile[key];
      });
      user.markModified('profile');
    }
    
    if (skills) {
      user.skills = skills;
    }
    
    if (social) {
      if (!user.social) {
        user.social = {};
      }
      Object.keys(social).forEach(key => {
        user.social[key] = social[key];
      });
      user.markModified('social');
    }

    // Save the user
    await user.save();

    // Return updated user without sensitive fields
    const updatedUser = await User.findById(req.user.id).select('-passwordHash -security');

    res.json({
      success: true,
      message: 'Portfolio updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    console.error('Error stack:', error.stack);
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==================== PROJECT ROUTES ====================

// GET /api/my-projects - Get current user's projects
router.get('/my-projects', authenticate, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user.id })
      .sort({ featured: -1, createdAt: -1 });
    
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/my-projects - Create new project
router.post('/my-projects', authenticate, async (req, res) => {
  try {
    console.log('Creating project for user:', req.user.id);
    console.log('Project data:', JSON.stringify(req.body, null, 2));
    
    const projectData = {
      ...req.body,
      userId: req.user.id
    };

    const project = await Project.create(projectData);
    console.log('Project created:', project._id);
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    console.error('Error creating project:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/my-projects/:id - Update project
router.put('/my-projects/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    Object.assign(project, req.body);
    await project.save();

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/my-projects/:id - Delete project
router.delete('/my-projects/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== BLOG POST ROUTES ====================

// GET /api/my-posts - Get current user's blog posts
router.get('/my-posts', authenticate, async (req, res) => {
  try {
    const posts = await BlogPost.find({ userId: req.user.id })
      .sort({ publishedAt: -1, createdAt: -1 });
    
    res.json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/my-posts - Create new blog post
router.post('/my-posts', authenticate, async (req, res) => {
  try {
    const postData = {
      ...req.body,
      userId: req.user.id
    };

    const post = await BlogPost.create(postData);
    
    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: post
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/my-posts/:id - Update blog post
router.put('/my-posts/:id', authenticate, async (req, res) => {
  try {
    const post = await BlogPost.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    Object.assign(post, req.body);
    await post.save();

    res.json({
      success: true,
      message: 'Blog post updated successfully',
      data: post
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/my-posts/:id - Delete blog post
router.delete('/my-posts/:id', authenticate, async (req, res) => {
  try {
    const post = await BlogPost.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== PUBLIC PORTFOLIO ROUTES ====================

// GET /api/portfolio/:username - Get public portfolio by username
router.get('/portfolio/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-passwordHash -security -email');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }

    const projects = await Project.find({ userId: user._id, status: 'completed' })
      .sort({ featured: -1, createdAt: -1 });
    const posts = await BlogPost.find({ userId: user._id, status: 'published' })
      .sort({ publishedAt: -1 });

    res.json({
      success: true,
      data: {
        user: {
          username: user.username,
          profile: user.profile,
          skills: user.skills,
          social: user.social
        },
        projects,
        posts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
