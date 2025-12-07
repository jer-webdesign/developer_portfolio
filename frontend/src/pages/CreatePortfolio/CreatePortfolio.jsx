import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../utils/axios';
import './CreatePortfolio.css';

const CreatePortfolio = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('home');
  const [hasChanges, setHasChanges] = useState(false);

  // Form states
  const [homeData, setHomeData] = useState({
    headline: '',
    subheadlines: [''],
    bio: '',
    githubUrl: '',
    linkedinUrl: ''
  });

  const [aboutData, setAboutData] = useState({
    title: '',
    content: '',
    cards: [{ category: '', content: '' }]
  });

  const [skillsData, setSkillsData] = useState([
    { category: '', items: [''] }
  ]);

  const [contactData, setContactData] = useState({
    publicEmail: '',
    phone: '',
    location: ''
  });

  const [projects, setProjects] = useState([
    { title: '', description: '', technologies: [], githubUrl: '', liveUrl: '', imageUrl: '' }
  ]);
  
  const [posts, setPosts] = useState([
    { title: '', excerpt: '', content: '', tags: [], imageUrl: '' }
  ]);

  // Load existing portfolio data
  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/my-portfolio');
      const { user: userData, projects: userProjects, posts: userPosts } = response.data.data;
      // Load Home data
      if (userData.profile) {
        setHomeData({
          headline: userData.profile.headline || '',
          subheadlines: userData.profile.subheadlines?.length > 0 ? userData.profile.subheadlines : [''],
          bio: userData.profile.bio || '',
          githubUrl: userData.profile.githubUrl || '',
          linkedinUrl: userData.profile.linkedinUrl || ''
        });

        // Load About data
        setAboutData({
          title: userData.profile.aboutTitle || '',
          content: userData.profile.aboutContent || '',
          cards: userData.profile.aboutCards?.length > 0 ? userData.profile.aboutCards : [{ category: '', content: '' }]
        });

        // Load Contact data
        setContactData({
          publicEmail: userData.profile.publicEmail || '',
          phone: userData.profile.phone || '',
          location: userData.profile.location || ''
        });
      }

      // Load Skills data
      if (userData.skills?.length > 0) {
        setSkillsData(userData.skills.map(skill => ({
          category: skill.category,
          items: skill.items?.length > 0 ? skill.items : ['']
        })));
      }

      // Load Projects and Posts      
      // Transform projects from backend format to form format
      const transformedProjects = userProjects?.map(p => ({
        _id: p._id,
        title: p.title || '',
        description: p.description || '',
        technologies: p.technologies || [],
        githubUrl: p.links?.github || '',
        liveUrl: p.links?.live || '',
        imageUrl: p.images?.[0]?.url || ''
      })) || [];
      
      setProjects(transformedProjects.length > 0 ? transformedProjects : [{ 
        title: '', 
        description: '', 
        technologies: [], 
        githubUrl: '', 
        liveUrl: '',
        imageUrl: ''
      }]);
      
      // Transform posts from backend format to form format
      const transformedPosts = userPosts?.map(p => ({
        _id: p._id,
        slug: p.slug,
        title: p.title || '',
        excerpt: p.excerpt || '',
        content: p.content || '',
        tags: p.tags || [],
        imageUrl: p.featuredImage?.url || '',
        publishedAt: p.publishedAt
      })) || [];
      
      setPosts(transformedPosts.length > 0 ? transformedPosts : [{ 
        title: '', 
        excerpt: '', 
        content: '', 
        tags: [], 
        imageUrl: '' 
      }]);

      setMessage({ type: 'success', text: 'Portfolio data loaded successfully!' });
    } catch (error) {      setMessage({ type: 'error', text: 'Failed to load portfolio data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Check if user is authenticated
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setMessage({ type: 'error', text: 'You must be logged in to save your portfolio. Please log in and try again.' });
        setSaving(false);
        return;
      }

      // Save profile and skills
      const filteredSkills = skillsData
        .filter(skill => skill.category.trim())
        .map(skill => ({
          category: skill.category,
          items: skill.items.filter(item => item && item.trim())
        }))
        .filter(skill => skill.items.length > 0);

      const portfolioPayload = {
        profile: {
          headline: homeData.headline || '',
          subheadlines: homeData.subheadlines.filter(s => s && s.trim()),
          bio: homeData.bio || '',
          githubUrl: homeData.githubUrl || '',
          linkedinUrl: homeData.linkedinUrl || '',
          aboutTitle: aboutData.title || '',
          aboutContent: aboutData.content || '',
          aboutCards: aboutData.cards
            .filter(c => (c.category && c.category.trim()) || (c.content && c.content.trim()))
            .map(c => ({ category: c.category, content: c.content })),
          publicEmail: contactData.publicEmail || '',
          phone: contactData.phone || '',
          location: contactData.location || ''
        },
        skills: filteredSkills,
        social: {
          github: homeData.githubUrl || '',
          linkedin: homeData.linkedinUrl || '',
          twitter: '',
          website: ''
        }
      };      
      await axiosInstance.put('/api/my-portfolio', portfolioPayload);

      // Save projects (create or update)
      const validProjects = projects.filter(p => p.title && p.title.trim() && p.description && p.description.trim());      
      for (const project of validProjects) {
        // Transform project data to match backend schema
        const projectData = {
          title: project.title,
          description: project.description,
          technologies: project.technologies || [],
          links: {
            github: project.githubUrl || '',
            live: project.liveUrl || ''
          },
          images: project.imageUrl ? [{
            url: project.imageUrl,
            alt: project.title,
            isPrimary: true
          }] : [],
          status: 'completed', // Set status to completed so it shows up
          featured: true // Make it featured by default
        };
        try {
          if (project._id) {
            // Update existing project
            const response = await axiosInstance.put(`/api/my-projects/${project._id}`, projectData);
          } else {
            // Create new project
            const response = await axiosInstance.post('/api/my-projects', projectData);
          }
        } catch (error) {
          throw error; // Re-throw to be caught by outer catch
        }
      }

      // Save blog posts (create or update)
      const validPosts = posts.filter(p => p.title && p.title.trim() && p.content && p.content.trim());
      for (const post of validPosts) {
        // Generate slug from title
        const slug = post.slug || post.title.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        // Transform post data to match backend schema
        const postData = {
          title: post.title,
          slug: slug,
          excerpt: post.excerpt || post.content.substring(0, 150) + '...', // Use excerpt or first 150 chars
          content: post.content,
          tags: post.tags || [],
          featuredImage: post.imageUrl ? {
            url: post.imageUrl,
            alt: post.title,
            caption: ''
          } : {
            url: 'https://via.placeholder.com/800x400?text=Blog+Post',
            alt: post.title,
            caption: ''
          },
          status: 'published', // Set status to published so it shows up
          publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : new Date().toISOString(),
          categories: ['tech'] // Default category
        };

        if (post._id) {
          // Update existing post
          await axiosInstance.put(`/api/my-posts/${post._id}`, postData);
        } else {
          // Create new post
          await axiosInstance.post('/api/my-posts', postData);
        }
      }

      setMessage({ type: 'success', text: 'Portfolio saved successfully! Refreshing...' });
      setHasChanges(false);

      // Auto hard refresh after 1 second
      setTimeout(() => {
        window.location.reload(true);
      }, 1000);
    } catch (error) {      const errorMessage = error.response?.data?.error || error.message || 'Failed to save portfolio';
      setMessage({ type: 'error', text: errorMessage });
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges && !window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
      return;
    }
    loadPortfolioData();
    setHasChanges(false);
    setMessage({ type: 'info', text: 'Changes cancelled' });
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete all your portfolio data? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    try {
      await axiosInstance.put('/api/my-portfolio', {
        profile: {
          headline: '',
          subheadlines: [],
          bio: '',
          githubUrl: '',
          linkedinUrl: '',
          aboutTitle: '',
          aboutContent: '',
          aboutCards: [],
          publicEmail: '',
          phone: '',
          location: ''
        },
        skills: []
      });

      setMessage({ type: 'success', text: 'Portfolio deleted successfully! Refreshing...' });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {      setMessage({ type: 'error', text: 'Failed to delete portfolio' });
      setSaving(false);
    }
  };

  // Home Section Handlers
  const addSubheadline = () => {
    setHomeData({ ...homeData, subheadlines: [...homeData.subheadlines, ''] });
    setHasChanges(true);
  };

  const removeSubheadline = (index) => {
    setHomeData({
      ...homeData,
      subheadlines: homeData.subheadlines.filter((_, i) => i !== index)
    });
    setHasChanges(true);
  };

  const updateSubheadline = (index, value) => {
    const updated = [...homeData.subheadlines];
    updated[index] = value;
    setHomeData({ ...homeData, subheadlines: updated });
    setHasChanges(true);
  };

  // About Section Handlers
  const addAboutCard = () => {
    setAboutData({
      ...aboutData,
      cards: [...aboutData.cards, { category: '', content: '' }]
    });
    setHasChanges(true);
  };

  const removeAboutCard = (index) => {
    setAboutData({
      ...aboutData,
      cards: aboutData.cards.filter((_, i) => i !== index)
    });
    setHasChanges(true);
  };

  const updateAboutCard = (index, field, value) => {
    const updated = [...aboutData.cards];
    updated[index][field] = value;
    setAboutData({ ...aboutData, cards: updated });
    setHasChanges(true);
  };

  // Skills Section Handlers
  const addSkillCategory = () => {
    setSkillsData([...skillsData, { category: '', items: [''] }]);
    setHasChanges(true);
  };

  const removeSkillCategory = (index) => {
    setSkillsData(skillsData.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const updateSkillCategory = (index, value) => {
    const updated = [...skillsData];
    updated[index].category = value;
    setSkillsData(updated);
    setHasChanges(true);
  };

  const addSkillItem = (categoryIndex) => {
    const updated = [...skillsData];
    updated[categoryIndex].items.push('');
    setSkillsData(updated);
    setHasChanges(true);
  };

  const removeSkillItem = (categoryIndex, itemIndex) => {
    const updated = [...skillsData];
    updated[categoryIndex].items = updated[categoryIndex].items.filter((_, i) => i !== itemIndex);
    setSkillsData(updated);
    setHasChanges(true);
  };

  const updateSkillItem = (categoryIndex, itemIndex, value) => {
    const updated = [...skillsData];
    updated[categoryIndex].items[itemIndex] = value;
    setSkillsData(updated);
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="create-portfolio-loading">
        <div className="spinner"></div>
        <p>Loading your portfolio...</p>
      </div>
    );
  }

  return (
    <div className="create-portfolio">
      <div className="create-portfolio-header">
        <h1>Create & Manage Your Portfolio</h1>
        <p>Customize every section of your developer portfolio</p>
      </div>

      {message.text && (
        <div className={`portfolio-message portfolio-message-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="portfolio-tabs">
        <button
          className={`portfolio-tab ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          🏠 Home
        </button>
        <button
          className={`portfolio-tab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          👤 About
        </button>
        <button
          className={`portfolio-tab ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          💡 Skills
        </button>
        <button
          className={`portfolio-tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          � Projects
        </button>
        <button
          className={`portfolio-tab ${activeTab === 'blog' ? 'active' : ''}`}
          onClick={() => setActiveTab('blog')}
        >
          📝 Blog
        </button>
        <button
          className={`portfolio-tab ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          � Contact
        </button>
      </div>

      {/* Tab Content */}
      <div className="portfolio-content">
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="portfolio-section">
            <h2>Home Section</h2>
            <p className="section-description">Your landing page - make a strong first impression!</p>

            <div className="form-group">
              <label>Headline *</label>
              <input
                type="text"
                placeholder="e.g., JOHN DOE"
                value={homeData.headline}
                onChange={(e) => {
                  setHomeData({ ...homeData, headline: e.target.value });
                  setHasChanges(true);
                }}
                className="form-input"
              />
              <small>Your name or brand - displayed prominently</small>
            </div>

            <div className="form-group">
              <label>Typing Animation Texts *</label>
              {homeData.subheadlines.map((subheadline, index) => (
                <div key={index} className="array-input-group">
                  <input
                    type="text"
                    placeholder={`e.g., Full Stack Developer`}
                    value={subheadline}
                    onChange={(e) => updateSubheadline(index, e.target.value)}
                    className="form-input"
                  />
                  {homeData.subheadlines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSubheadline(index)}
                      className="btn-remove"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addSubheadline} className="btn-add">
                + Add Another Title
              </button>
              <small>Titles that rotate in the typing animation</small>
            </div>

            <div className="form-group">
              <label>Bio/Introduction *</label>
              <textarea
                placeholder="Tell visitors about yourself..."
                value={homeData.bio}
                onChange={(e) => {
                  setHomeData({ ...homeData, bio: e.target.value });
                  setHasChanges(true);
                }}
                className="form-textarea"
                rows="5"
              />
              <small>A brief introduction about yourself</small>
            </div>

            <div className="form-group">
              <label>GitHub URL</label>
              <input
                type="url"
                placeholder="https://github.com/yourusername"
                value={homeData.githubUrl}
                onChange={(e) => {
                  setHomeData({ ...homeData, githubUrl: e.target.value });
                  setHasChanges(true);
                }}
                className="form-input"
              />
              <small>Your GitHub profile link</small>
            </div>

            <div className="form-group">
              <label>LinkedIn URL</label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/yourusername"
                value={homeData.linkedinUrl}
                onChange={(e) => {
                  setHomeData({ ...homeData, linkedinUrl: e.target.value });
                  setHasChanges(true);
                }}
                className="form-input"
              />
              <small>Your LinkedIn profile link</small>
            </div>
          </div>
        )}

        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <div className="portfolio-section">
            <h2>About Section</h2>
            <p className="section-description">Share your story and what makes you unique</p>

            <div className="form-group">
              <label>Section Title</label>
              <input
                type="text"
                placeholder="e.g., About Me"
                value={aboutData.title}
                onChange={(e) => {
                  setAboutData({ ...aboutData, title: e.target.value });
                  setHasChanges(true);
                }}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>About Content *</label>
              <textarea
                placeholder="Your detailed story, background, experience..."
                value={aboutData.content}
                onChange={(e) => {
                  setAboutData({ ...aboutData, content: e.target.value });
                  setHasChanges(true);
                }}
                className="form-textarea"
                rows="6"
              />
              <small>Your complete story and background</small>
            </div>

            <div className="form-group">
              <label>Feature Cards</label>
              <small>Highlight your expertise, values, or focus areas</small>
              {aboutData.cards.map((card, index) => (
                <div key={index} className="card-input-group">
                  <div className="card-header">
                    <h4>Card {index + 1}</h4>
                    {aboutData.cards.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAboutCard(index)}
                        className="btn-remove-card"
                      >
                        Delete Card
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Card Title (e.g., Frontend Expertise)"
                    value={card.category}
                    onChange={(e) => updateAboutCard(index, 'category', e.target.value)}
                    className="form-input"
                  />
                  <textarea
                    placeholder="Card description..."
                    value={card.content}
                    onChange={(e) => updateAboutCard(index, 'content', e.target.value)}
                    className="form-textarea"
                    rows="3"
                  />
                </div>
              ))}
              <button type="button" onClick={addAboutCard} className="btn-add">
                + Add Feature Card
              </button>
            </div>
          </div>
        )}

        {/* SKILLS TAB */}
        {activeTab === 'skills' && (
          <div className="portfolio-section">
            <h2>Skills Section</h2>
            <p className="section-description">Showcase your technical expertise and tools</p>

            {skillsData.map((skillCategory, catIndex) => (
              <div key={catIndex} className="skill-category-group">
                <div className="card-header">
                  <h4>Skill Category {catIndex + 1}</h4>
                  {skillsData.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSkillCategory(catIndex)}
                      className="btn-remove-card"
                    >
                      Delete Category
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., 🔥 PROGRAMMING LANGUAGES"
                    value={skillCategory.category}
                    onChange={(e) => updateSkillCategory(catIndex, e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Skills</label>
                  {skillCategory.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="array-input-group">
                      <input
                        type="text"
                        placeholder="e.g., JavaScript"
                        value={item}
                        onChange={(e) => updateSkillItem(catIndex, itemIndex, e.target.value)}
                        className="form-input"
                      />
                      {skillCategory.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSkillItem(catIndex, itemIndex)}
                          className="btn-remove"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addSkillItem(catIndex)}
                    className="btn-add-small"
                  >
                    + Add Skill
                  </button>
                </div>
              </div>
            ))}

            <button type="button" onClick={addSkillCategory} className="btn-add">
              + Add Skill Category
            </button>
          </div>
        )}

        {/* CONTACT TAB */}
        {activeTab === 'contact' && (
          <div className="portfolio-section">
            <h2>Contact Information</h2>
            <p className="section-description">How people can reach you</p>

            <div className="form-group">
              <label>Public Email</label>
              <input
                type="email"
                placeholder="contact@example.com"
                value={contactData.publicEmail}
                onChange={(e) => {
                  setContactData({ ...contactData, publicEmail: e.target.value });
                  setHasChanges(true);
                }}
                className="form-input"
              />
              <small>Display email (can be different from your login email)</small>
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={contactData.phone}
                onChange={(e) => {
                  setContactData({ ...contactData, phone: e.target.value });
                  setHasChanges(true);
                }}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                placeholder="City, State/Country"
                value={contactData.location}
                onChange={(e) => {
                  setContactData({ ...contactData, location: e.target.value });
                  setHasChanges(true);
                }}
                className="form-input"
              />
            </div>
          </div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === 'projects' && (
          <div className="portfolio-section">
            <h2>Projects</h2>
            <p className="section-description">Add and manage your project portfolio</p>
            
            <div className="projects-manager">
              {projects.map((project, index) => (
                <div key={index} className="card">
                  <div className="card-header">
                    <h3>Project {index + 1}</h3>
                    {projects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newProjects = projects.filter((_, i) => i !== index);
                          setProjects(newProjects);
                          setHasChanges(true);
                        }}
                        className="btn-remove-card"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="card-body">
                    <div className="form-group">
                      <label>Project Title *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., E-commerce Platform"
                        value={project.title || ''}
                        onChange={(e) => {
                          const newProjects = [...projects];
                          newProjects[index].title = e.target.value;
                          setProjects(newProjects);
                          setHasChanges(true);
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Description *</label>
                      <textarea
                        className="form-textarea"
                        placeholder="Describe your project, its purpose, and key features..."
                        value={project.description || ''}
                        onChange={(e) => {
                          const newProjects = [...projects];
                          newProjects[index].description = e.target.value;
                          setProjects(newProjects);
                          setHasChanges(true);
                        }}
                        rows="4"
                      />
                    </div>

                    <div className="form-group">
                      <label>Technologies (comma-separated)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., React, Node.js, MongoDB, AWS"
                        value={project.technologies?.join(', ') || ''}
                        onChange={(e) => {
                          const newProjects = [...projects];
                          newProjects[index].technologies = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                          setProjects(newProjects);
                          setHasChanges(true);
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label>GitHub URL</label>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="https://github.com/username/project"
                        value={project.githubUrl || ''}
                        onChange={(e) => {
                          const newProjects = [...projects];
                          newProjects[index].githubUrl = e.target.value;
                          setProjects(newProjects);
                          setHasChanges(true);
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Live Demo URL</label>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="https://your-project-demo.com"
                        value={project.liveUrl || ''}
                        onChange={(e) => {
                          const newProjects = [...projects];
                          newProjects[index].liveUrl = e.target.value;
                          setProjects(newProjects);
                          setHasChanges(true);
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Image URL</label>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="https://example.com/project-screenshot.jpg"
                        value={project.imageUrl || ''}
                        onChange={(e) => {
                          const newProjects = [...projects];
                          newProjects[index].imageUrl = e.target.value;
                          setProjects(newProjects);
                          setHasChanges(true);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  setProjects([...projects, { 
                    title: '', 
                    description: '', 
                    technologies: [], 
                    githubUrl: '', 
                    liveUrl: '',
                    imageUrl: ''
                  }]);
                  setHasChanges(true);
                }}
                className="btn btn-add-card"
              >
                + Add Project
              </button>
            </div>
          </div>
        )}

        {/* BLOG TAB */}
        {activeTab === 'blog' && (
          <div className="portfolio-section">
            <h2>Blog Posts</h2>
            <p className="section-description">Create and manage your blog content</p>
            
            <div className="blog-manager">
              {posts.map((post, index) => (
                <div key={index} className="card">
                  <div className="card-header">
                    <h3>Blog Post {index + 1}</h3>
                    {posts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newPosts = posts.filter((_, i) => i !== index);
                          setPosts(newPosts);
                          setHasChanges(true);
                        }}
                        className="btn-remove-card"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="card-body">
                    <div className="form-group">
                      <label>Post Title *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., Getting Started with React Hooks"
                        value={post.title || ''}
                        onChange={(e) => {
                          const newPosts = [...posts];
                          newPosts[index].title = e.target.value;
                          setPosts(newPosts);
                          setHasChanges(true);
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Excerpt (Brief Summary)</label>
                      <textarea
                        className="form-textarea"
                        placeholder="Write a brief summary of your blog post..."
                        value={post.excerpt || ''}
                        onChange={(e) => {
                          const newPosts = [...posts];
                          newPosts[index].excerpt = e.target.value;
                          setPosts(newPosts);
                          setHasChanges(true);
                        }}
                        rows="2"
                      />
                    </div>

                    <div className="form-group">
                      <label>Content *</label>
                      <textarea
                        className="form-textarea"
                        placeholder="Write your blog post content here..."
                        value={post.content || ''}
                        onChange={(e) => {
                          const newPosts = [...posts];
                          newPosts[index].content = e.target.value;
                          setPosts(newPosts);
                          setHasChanges(true);
                        }}
                        rows="8"
                      />
                    </div>

                    <div className="form-group">
                      <label>Tags (comma-separated)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., react, javascript, web development"
                        value={post.tags?.join(', ') || ''}
                        onChange={(e) => {
                          const newPosts = [...posts];
                          newPosts[index].tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                          setPosts(newPosts);
                          setHasChanges(true);
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Featured Image URL</label>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="https://example.com/blog-image.jpg"
                        value={post.imageUrl || ''}
                        onChange={(e) => {
                          const newPosts = [...posts];
                          newPosts[index].imageUrl = e.target.value;
                          setPosts(newPosts);
                          setHasChanges(true);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  setPosts([...posts, { 
                    title: '', 
                    excerpt: '',
                    content: '', 
                    tags: [],
                    imageUrl: ''
                  }]);
                  setHasChanges(true);
                }}
                className="btn btn-add-card"
              >
                + Add Blog Post
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="portfolio-actions">
        <button
          onClick={handleCancel}
          className="btn btn-cancel"
          disabled={saving}
        >
          Cancel
        </button>
        {isAdmin && (
          <button
            onClick={handleDelete}
            className="btn btn-delete"
            disabled={saving}
          >
            Delete All
          </button>
        )}
        <button
          onClick={handleSave}
          className="btn btn-save"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save & Refresh'}
        </button>
      </div>

      <div className="portfolio-note">
        <p>💡 <strong>Note:</strong> After saving, your portfolio will automatically refresh to show the updated content.</p>
      </div>
    </div>
  );
};

export default CreatePortfolio;
