// Admin Routes - Manage all users and their portfolios

const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const Project = require('../models/Project');
const BlogPost = require('../models/BlogPost');
const { authorize } = require('../middleware/auth');
const { 
  addAdminEmail, 
  removeAdminEmail, 
  getAdminEmails, 
  isAdminEmail,
  getRoleForEmail 
} = require('../config/adminConfig');

// Middleware to require admin role
const requireAdmin = [
  passport.authenticate('jwt', { session: false }),
  authorize('admin')
];

// @route   GET /admin/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-security.passwordResetToken -security.passwordResetExpires -security.refreshTokens')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// @route   GET /admin/users/:userId
// @desc    Get specific user details (admin only)
// @access  Private/Admin
router.get('/users/:userId', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-security.passwordResetToken -security.passwordResetExpires -security.refreshTokens');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

// @route   GET /admin/users/:userId/portfolio
// @desc    Get user's complete portfolio (admin only)
// @access  Private/Admin
router.get('/users/:userId/portfolio', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const projects = await Project.find({ userId: req.params.userId }).sort({ order: 1, createdAt: -1 });
    const posts = await BlogPost.find({ userId: req.params.userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      portfolio: {
        user: {
          username: user.username,
          email: user.email,
          role: user.role,
          profile: user.profile,
          skills: user.skills,
          social: user.social
        },
        projects,
        posts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch portfolio',
      error: error.message
    });
  }
});

// @route   PUT /admin/users/:userId/portfolio
// @desc    Update user's portfolio (admin only)
// @access  Private/Admin
router.put('/users/:userId/portfolio', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { profile, skills, social } = req.body;

    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }
    if (skills) {
      user.skills = skills;
    }
    if (social) {
      user.social = { ...user.social, ...social };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Portfolio updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update portfolio',
      error: error.message
    });
  }
});

// @route   DELETE /admin/users/:userId/projects/:projectId
// @desc    Delete user's project (admin only)
// @access  Private/Admin
router.delete('/users/:userId/projects/:projectId', requireAdmin, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.projectId,
      userId: req.params.userId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await project.deleteOne();

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

// @route   DELETE /admin/users/:userId/posts/:postId
// @desc    Delete user's blog post (admin only)
// @access  Private/Admin
router.delete('/users/:userId/posts/:postId', requireAdmin, async (req, res) => {
  try {
    const post = await BlogPost.findOne({
      _id: req.params.postId,
      userId: req.params.userId
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    await post.deleteOne();

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
      error: error.message
    });
  }
});

// @route   DELETE /admin/users/:userId
// @desc    Delete user account (admin only)
// @access  Private/Admin
router.delete('/users/:userId', requireAdmin, async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.user._id.toString() === req.params.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own admin account'
      });
    }

    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete all user's projects and posts
    await Project.deleteMany({ userId: req.params.userId });
    await BlogPost.deleteMany({ userId: req.params.userId });
    await user.deleteOne();

    res.json({
      success: true,
      message: 'User and all associated data deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

// @route   PUT /admin/users/:userId/role
// @desc    Update user role (admin only)
// @access  Private/Admin
router.put('/users/:userId/role', requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "user" or "admin"'
      });
    }

    // Prevent admin from changing their own role
    if (req.user._id.toString() === req.params.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own admin role'
      });
    }

    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update role',
      error: error.message
    });
  }
});

// @route   GET /admin/admins
// @desc    Get list of admin emails (admin only)
// @access  Private/Admin
router.get('/admins', requireAdmin, async (req, res) => {
  try {
    const adminEmails = getAdminEmails();
    
    res.json({
      success: true,
      admins: adminEmails,
      count: adminEmails.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin list',
      error: error.message
    });
  }
});

// @route   POST /admin/admins
// @desc    Add new admin email (admin only)
// @access  Private/Admin
router.post('/admins', requireAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const added = addAdminEmail(email);
    
    if (!added) {
      return res.status(400).json({
        success: false,
        message: 'Email is already an admin or invalid'
      });
    }

    // Update user role in database if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    res.json({
      success: true,
      message: `${email} has been added as admin`,
      admins: getAdminEmails()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add admin',
      error: error.message
    });
  }
});

// @route   DELETE /admin/admins/:email
// @desc    Remove admin email (admin only)
// @access  Private/Admin
router.delete('/admins/:email', requireAdmin, async (req, res) => {
  try {
    const { email } = req.params;
    
    // Prevent removing yourself as admin
    if (email.toLowerCase() === req.user.email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove yourself as admin'
      });
    }

    // Ensure at least one admin remains
    const adminEmails = getAdminEmails();
    if (adminEmails.length <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the last admin'
      });
    }

    const removed = removeAdminEmail(email);
    
    if (!removed) {
      return res.status(400).json({
        success: false,
        message: 'Email is not an admin or invalid'
      });
    }

    // Update user role in database if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user && user.role === 'admin') {
      user.role = 'user';
      await user.save();
    }

    res.json({
      success: true,
      message: `${email} has been removed as admin`,
      admins: getAdminEmails()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove admin',
      error: error.message
    });
  }
});

module.exports = router;
