import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';

// Import pages
import Home from './pages/Home/Home.jsx';
import About from './pages/About/About.jsx';
import Skills from './pages/Skills/Skills.jsx';
import Projects from './pages/Projects/Projects.jsx';
import Blog from './pages/Blog/Blog.jsx';
import Contact from './pages/Contact/Contact.jsx';
import Login from './pages/Login/Login.jsx';
import Register from './pages/Register/Register.jsx';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword.jsx';
import Profile from './pages/Profile/Profile.jsx';
import CreatePortfolio from './pages/CreatePortfolio/CreatePortfolio.jsx';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard.jsx';

// Import components
import Navbar from './components/Navbar/Navbar.jsx';
import Header from './components/Header/Header.jsx';
import Footer from './components/Footer/Footer.jsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const App = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [posts, setPosts] = useState([]);
  const [hero, setHero] = useState(null);
  const [about, setAbout] = useState(null);
  const [skillCategories, setSkillCategories] = useState([]);
  const [contactInfo, setContactInfo] = useState(null);
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [formStatus, setFormStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Handle Google OAuth redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (window.location.pathname === '/auth/success' && token) {
      localStorage.setItem('accessToken', token);
      // Redirect to home and reload to fetch user data
      window.location.href = '/';
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const [profileRes, projectsRes, postsRes, heroRes, aboutRes, skillCategoriesRes, contactInfoRes] = await Promise.all([
        fetch(`${API_BASE_URL}/profile`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/projects`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/posts`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/hero`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/about`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/skill-categories`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/contact-info`, { headers }).then(r => r.json())
      ]);
      
      console.log('Projects response:', projectsRes);
      console.log('Projects data:', projectsRes.data);
      
      setProfile(profileRes.data);
      setProjects(projectsRes.data);
      setPosts(postsRes.data);
      setHero(heroRes.data);
      setAbout(aboutRes.data);
      setSkillCategories(skillCategoriesRes.data);
      setContactInfo(contactInfoRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setProfile({
        name: "Jeremy Olanda",
        bio: "Software Engineer with expertise in development, testing, deployment, and backend support. Currently advancing technical capabilities in modern web technologies at Southern Alberta Institute of Technology (SAIT). Proven track record of delivering scalable, cost-effective solutions while leading cross-functional development teams and optimizing enterprise-grade systems for global organizations.",
        skills: ["C/C++", "Java", "Python", "JavaScript", "React", "Node.js", "PostgreSQL", "MongoDB", "Docker", "AWS"],
        github: "https://github.com/jeremyolanda",
        linkedin: "https://linkedin.com/in/jeremyolanda"
      });
  setProjects([]);
  setPosts([]);
  setHero(null);
  setAbout(null);
  setSkillCategories([]);
  setContactInfo({ email: 'jeremy.g.olanda@gmail.com', phone: '+1 (403) 987-6543', location: 'Calgary, Alberta, Canada' });
  setLoading(false);
    }
  };

  const handleContactSubmit = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      setFormStatus('error');
      return;
    }
    
    setFormStatus('sending');
    
    try {
      const response = await fetch(`${API_BASE_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });
      
      if (response.ok) {
        setFormStatus('success');
        setContactForm({ name: '', email: '', message: '' });
        setTimeout(() => setFormStatus(null), 5000);
      } else {
        setFormStatus('error');
      }
    } catch (error) {
      setFormStatus('error');
    }
  };

  const navigateToSection = (section) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
    setShowRegisterModal(false);
    setShowForgotPasswordModal(false);
  };

  const handleRegisterClick = () => {
    setShowRegisterModal(true);
    setShowLoginModal(false);
    setShowForgotPasswordModal(false);
  };

  const handleForgotPasswordClick = () => {
    setShowForgotPasswordModal(true);
    setShowLoginModal(false);
    setShowRegisterModal(false);
  };

  const closeAuthModals = () => {
    setShowLoginModal(false);
    setShowRegisterModal(false);
    setShowForgotPasswordModal(false);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show notification
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.textContent = `Copied: ${text}`;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const showContactModal = () => {
    document.getElementById('contactModal').style.display = 'flex';
  };

  const closeModal = () => {
    document.getElementById('contactModal').style.display = 'none';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'var(--bg-gradient)'}}>
        <div className="text-primary text-2xl pulse">Loading Portfolio...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{background: 'var(--bg-dark)'}}>
      {/* Loading Screen */}
      {loading && (
        <div className="loading" id="loading">
          <div className="loading-spinner"></div>
        </div>
      )}

      {/* Background Animation */}
      <div className="bg-animation">
        <div className="particles" id="particles"></div>
      </div>
      

      {/* Header */}
      <Header />

      {/* Navigation */}
      <Navbar
        activeSection={activeSection}
        navigateToSection={navigateToSection}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onLoginClick={handleLoginClick}
        onRegisterClick={handleRegisterClick}
      />

      {/* Page Sections */}
      {activeSection === 'home' && (
        <Home 
          profile={profile} 
          hero={hero}
          navigateToSection={navigateToSection} 
          showContactModal={showContactModal} 
        />
      )}
      {activeSection === 'about' && (
        <About 
          profile={profile}
          about={about}
        />
      )}
      {activeSection === 'skills' && (
        <Skills 
          profile={profile}
          skillCategories={skillCategories}
        />
      )}
      {activeSection === 'projects' && (
        <Projects projects={projects} />
      )}
      {activeSection === 'blog' && (
        <Blog posts={posts} />
      )}
      {activeSection === 'contact' && (
        <Contact 
          contactForm={contactForm} 
          setContactForm={setContactForm} 
          formStatus={formStatus} 
          handleContactSubmit={handleContactSubmit}
          copyToClipboard={copyToClipboard}
          contactInfo={contactInfo}
        />
      )}
      {activeSection === 'profile' && isAuthenticated && (
        <Profile />
      )}
      {activeSection === 'create-portfolio' && isAuthenticated && (
        <CreatePortfolio />
      )}
      {activeSection === 'admin' && isAdmin && (
        <AdminDashboard />
      )}

      {/* Authentication Modals */}
      {showLoginModal && (
        <Login 
          onClose={closeAuthModals}
          onSwitchToRegister={handleRegisterClick}
          onSwitchToForgotPassword={handleForgotPasswordClick}
        />
      )}
      {showRegisterModal && (
        <Register
          onClose={closeAuthModals}
          onSwitchToLogin={handleLoginClick}
        />
      )}
      {showForgotPasswordModal && (
        <ForgotPassword
          onClose={closeAuthModals}
          onSwitchToLogin={handleLoginClick}
        />
      )}

      {/* Contact Modal */}
      <div className="modal" id="contactModal" style={{display: 'none'}}>
        <div className="modal-content">
          <button className="modal-close" onClick={() => document.getElementById('contactModal').style.display = 'none'}>
            &times;
          </button>
          <h3 style={{marginBottom: '2rem', color: 'var(--primary)'}}>
            🚀 Let's Build Something Amazing
          </h3>
          <p style={{color: 'var(--text-muted)', marginBottom: '2rem'}}>
            Whether you're looking for a senior developer to lead your next project, 
            or need expertise in full-stack development, I'm here to help bring your vision to life.
          </p>
          <div className="cta-buttons">
            <button className="btn btn-primary" onClick={() => copyToClipboard('anonymous@gmail.com')}>
              � Copy Email
            </button>
            <button className="btn btn-secondary" onClick={() => copyToClipboard('+1 (403) 987-6543')}>
              📱 Copy Phone
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default App;