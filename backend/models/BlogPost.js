const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Blog post title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [250, 'Slug cannot exceed 250 characters']
  },
  excerpt: {
    type: String,
    required: [true, 'Blog post excerpt is required'],
    trim: true,
    maxlength: [300, 'Excerpt cannot exceed 300 characters']
  },
  content: {
    type: String,
    required: [true, 'Blog post content is required'],
    trim: true
  },
  featuredImage: {
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      required: true
    },
    caption: {
      type: String
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  categories: [{
    type: String,
    trim: true,
    lowercase: true,
    enum: ['tech', 'programming', 'tutorial', 'career', 'personal', 'review', 'news', 'other']
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: {
    type: Date
  },
  readTime: {
    type: Number, // in minutes
    default: 1
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  meta: {
    description: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters']
    },
    keywords: [{
      type: String,
      trim: true
    }]
  },
  seo: {
    canonicalUrl: String,
    noIndex: {
      type: Boolean,
      default: false
    },
    noFollow: {
      type: Boolean,
      default: false
    }
  },
  comments: [{
    author: {
      name: {
        type: String,
        required: true
      },
      email: {
        type: String,
        required: true
      },
      website: String
    },
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  featured: {
    type: Boolean,
    default: false
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  series: {
    name: String,
    part: Number,
    totalParts: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted publish date
blogPostSchema.virtual('formattedPublishDate').get(function() {
  if (!this.publishedAt) return null;
  return this.publishedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for approved comments count
blogPostSchema.virtual('approvedCommentsCount').get(function() {
  return this.comments.filter(comment => comment.isApproved).length;
});

// Virtual for estimated read time based on content
blogPostSchema.virtual('estimatedReadTime').get(function() {
  if (!this.content) return 1;
  const wordsPerMinute = 200;
  const wordCount = this.content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
});

// Indexes for better query performance
blogPostSchema.index({ userId: 1, createdAt: -1 });
blogPostSchema.index({ userId: 1, status: 1 });
blogPostSchema.index({ userId: 1, featured: 1 });
blogPostSchema.index({ tags: 1 });
blogPostSchema.index({ categories: 1 });
blogPostSchema.index({ publishedAt: -1 });
blogPostSchema.index({ status: 1, publishedAt: -1 });

// Pre-save middleware to generate slug and update readTime
blogPostSchema.pre('save', function(next) {
  // Generate slug from title if not provided
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }

  // Update read time based on content
  if (this.isModified('content')) {
    this.readTime = this.estimatedReadTime;
  }

  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  // Generate meta description from excerpt if not provided
  if (this.isModified('excerpt') && !this.meta.description) {
    this.meta.description = this.excerpt.substring(0, 160);
  }

  next();
});

// Static method to get published posts
blogPostSchema.statics.getPublished = function(userId = null, limit = 10, skip = 0) {
  const query = { status: 'published' };
  if (userId) {
    query.userId = userId;
  }
  return this.find(query)
    .sort({ publishedAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get featured posts
blogPostSchema.statics.getFeatured = function(userId = null, limit = 5) {
  const query = { 
    featured: true, 
    status: 'published' 
  };
  if (userId) {
    query.userId = userId;
  }
  return this.find(query)
    .limit(limit)
    .sort({ publishedAt: -1 });
};

// Static method to find by tag
blogPostSchema.statics.findByTag = function(tag, userId = null) {
  const query = { 
    tags: { $in: [tag.toLowerCase()] },
    status: 'published'
  };
  if (userId) {
    query.userId = userId;
  }
  return this.find(query).sort({ publishedAt: -1 });
};

// Static method to find by category
blogPostSchema.statics.findByCategory = function(category, userId = null) {
  const query = { 
    categories: { $in: [category.toLowerCase()] },
    status: 'published'
  };
  if (userId) {
    query.userId = userId;
  }
  return this.find(query).sort({ publishedAt: -1 });
};

// Instance method to increment views
blogPostSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Instance method to toggle featured status
blogPostSchema.methods.toggleFeatured = function() {
  this.featured = !this.featured;
  return this.save();
};

// Instance method to add approved comment
blogPostSchema.methods.addComment = function(commentData) {
  this.comments.push({
    ...commentData,
    isApproved: false // Comments require approval by default
  });
  return this.save();
};

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

module.exports = BlogPost;