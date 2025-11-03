const express = require('express');
const router = express.Router();
const { authenticate, authorize, authorizeOwnerOrAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Project = require('../models/Project');
const BlogPost = require('../models/BlogPost');

// ==================== USER ROUTES ====================

// @route   GET /api/profile
// @desc    Get current user profile
// @access  Private (User)
router.get('/profile', authenticate, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// @route   PUT /api/profile
// @desc    Update user profile
// @access  Private (User)
router.put('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    // Prevent updating sensitive fields
    delete updates.passwordHash;
    delete updates.role;
    delete updates.security;
    delete updates.authProvider;
    delete updates.googleId;
    delete updates.email;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// @route   GET /api/dashboard
// @desc    Get user dashboard data
// @access  Private (User)
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    const [projects, blogPosts] = await Promise.all([
      Project.find({ userId }).countDocuments(),
      BlogPost.find({ userId }).countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        user: req.user,
        stats: {
          totalProjects: projects,
          totalBlogPosts: blogPosts
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard',
      error: error.message
    });
  }
});

// ==================== PROJECT ROUTES ====================

// @route   GET /api/projects
// @desc    Get user's projects
// @access  Private (User)
router.get('/projects', authenticate, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user._id })
      .sort({ displayOrder: 1 });

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load projects',
      error: error.message
    });
  }
});

// @route   POST /api/projects
// @desc    Create new project
// @access  Private (User)
router.post('/projects', authenticate, async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      userId: req.user._id
    };

    const project = await Project.create(projectData);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error.message
    });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (Owner or Admin)
router.put('/projects/:id', authenticate, authorizeOwnerOrAdmin(async (req) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new Error('Project not found');
  return project.userId;
}), async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: error.message
    });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private (Owner or Admin)
router.delete('/projects/:id', authenticate, authorizeOwnerOrAdmin(async (req) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new Error('Project not found');
  return project.userId;
}), async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: error.message
    });
  }
});

// ==================== BLOG ROUTES ====================

// @route   GET /api/blog
// @desc    Get user's blog posts
// @access  Private (User)
router.get('/blog', authenticate, async (req, res) => {
  try {
    const posts = await BlogPost.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load blog posts',
      error: error.message
    });
  }
});

// @route   POST /api/blog
// @desc    Create blog post
// @access  Private (User)
router.post('/blog', authenticate, async (req, res) => {
  try {
    const postData = {
      ...req.body,
      userId: req.user._id
    };

    const post = await BlogPost.create(postData);

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create blog post',
      error: error.message
    });
  }
});

// ==================== ADMIN ROUTES ====================

// @route   GET /api/admin/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/admin/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, isActive } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter['security.isActive'] = isActive === 'true';

    const users = await User.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      users: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load users',
      error: error.message
    });
  }
});

// @route   PATCH /api/admin/users/:id/role
// @desc    Update user role (Admin only)
// @access  Private (Admin)
router.patch('/admin/users/:id/role', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (Admin only)
// @access  Private (Admin)
router.delete('/admin/users/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user's projects and blog posts
    await Promise.all([
      Project.deleteMany({ userId: req.params.id }),
      BlogPost.deleteMany({ userId: req.params.id })
    ]);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

module.exports = router;