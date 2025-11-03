const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  detailedDescription: {
    type: String,
    trim: true,
    maxlength: [2000, 'Detailed description cannot exceed 2000 characters']
  },
  technologies: [{
    type: String,
    trim: true
  }],
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      required: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  links: {
    github: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https:\/\/github\.com\//.test(v);
        },
        message: 'GitHub URL must start with https://github.com/'
      }
    },
    live: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\//.test(v);
        },
        message: 'Live URL must be a valid URL'
      }
    },
    demo: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\//.test(v);
        },
        message: 'Demo URL must be a valid URL'
      }
    }
  },
  status: {
    type: String,
    enum: ['planning', 'in-progress', 'completed', 'on-hold', 'archived'],
    default: 'planning'
  },
  featured: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  challenges: [{
    challenge: String,
    solution: String
  }],
  learnings: [String],
  category: {
    type: String,
    enum: ['web-app', 'mobile-app', 'desktop-app', 'api', 'library', 'tool', 'game', 'other'],
    default: 'web-app'
  },
  priority: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'public'
  },
  metrics: {
    views: {
      type: Number,
      default: 0
    },
    stars: {
      type: Number,
      default: 0
    },
    forks: {
      type: Number,
      default: 0
    }
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for project duration
projectSchema.virtual('duration').get(function() {
  if (!this.endDate) return null;
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Indexes for better query performance
projectSchema.index({ userId: 1, createdAt: -1 });
projectSchema.index({ userId: 1, featured: 1 });
projectSchema.index({ userId: 1, status: 1 });
projectSchema.index({ userId: 1, category: 1 });
projectSchema.index({ tags: 1 });
projectSchema.index({ technologies: 1 });

// Pre-save middleware to ensure only one primary image
projectSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length > 1) {
      // Set only the first one as primary
      this.images.forEach((img, index) => {
        img.isPrimary = index === 0;
      });
    } else if (primaryImages.length === 0) {
      // Set the first image as primary if none is set
      this.images[0].isPrimary = true;
    }
  }
  next();
});

// Static method to get projects by technology
projectSchema.statics.findByTechnology = function(technology, userId = null) {
  const query = { technologies: { $in: [technology] } };
  if (userId) {
    query.userId = userId;
  }
  return this.find(query);
};

// Static method to get featured projects
projectSchema.statics.getFeatured = function(userId = null, limit = 6) {
  const query = { featured: true, visibility: 'public' };
  if (userId) {
    query.userId = userId;
  }
  return this.find(query).limit(limit).sort({ createdAt: -1 });
};

// Instance method to toggle featured status
projectSchema.methods.toggleFeatured = function() {
  this.featured = !this.featured;
  return this.save();
};

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;