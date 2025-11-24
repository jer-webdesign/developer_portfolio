import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../Login/Login.css';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(true);
  const [formData, setFormData] = useState({
    profile: {
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
      bio: user?.profile?.bio || '',
      publicEmail: user?.profile?.publicEmail || user?.email || '',
      location: user?.profile?.location || '',
      githubUrl: user?.profile?.githubUrl || '',
      linkedinUrl: user?.profile?.linkedinUrl || ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const stripTags = (s) => {
    if (!s) return '';
    return s.replace(/<[^>]*>/g, '');
  };

  const isValidName = (n) => /^[A-Za-z ]{3,50}$/.test(n);
  const isValidNameUnicode = (n) => /^[A-Za-z\u00C0-\u017F ]{3,50}$/.test(n);
  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const isValidBio = (b) => {
    try {
      return /^[\p{L}\p{N} .,'\-()?!:;]{0,500}$/u.test(b || '');
    } catch (e) {
      return /^[A-Za-z0-9 \.\,\'\-()?!:;]{0,500}$/.test(b || '');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      profile: {
        ...formData.profile,
        [name]: value
      }
    });

    if (name === 'firstName' || name === 'lastName') {
      const val = value || '';
      const hasSpecial = /[^A-Za-z \u00C0-\u017F]/.test(val);
      if (val.length > 0 && hasSpecial) {
        setFieldErrors(prev => ({ ...prev, [name]: 'Name contains invalid characters. Remove symbols like !@#$%^&*()+=<>?:"{}\\|.' }));
      } else if (val.length > 0 && (val.length < 3 || val.length > 50)) {
        setFieldErrors(prev => ({ ...prev, [name]: 'Must be 3–50 alphabetic characters' }));
      } else {
        setFieldErrors(prev => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    }

    if (name === 'publicEmail') {
      const val = value || '';
      if (val.length > 0 && !isValidEmail(val)) {
        setFieldErrors(prev => ({ ...prev, publicEmail: 'Invalid email format' }));
      } else {
        setFieldErrors(prev => {
          const next = { ...prev };
          delete next.publicEmail;
          return next;
        });
      }
    }

    if (name === 'bio') {
      const val = value || '';
      const hasTags = /<[^>]*>/.test(val);
      if (hasTags) {
        setFieldErrors(prev => ({ ...prev, bio: 'Bio must not contain HTML tags' }));
      } else if (val.length > 500) {
        setFieldErrors(prev => ({ ...prev, bio: 'Bio must be 500 characters or fewer' }));
      } else {
        const ok = isValidBio(val);
        if (!ok && val.length > 0) {
          setFieldErrors(prev => ({ ...prev, bio: 'Bio contains invalid characters' }));
        } else {
          setFieldErrors(prev => {
            const next = { ...prev };
            delete next.bio;
            return next;
          });
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    if (Object.keys(fieldErrors).length > 0) {
      setError('Please fix the form errors before saving.');
      setLoading(false);
      return;
    }

    const p = formData.profile || {};
    if (p.firstName && !isValidNameUnicode(p.firstName)) {
      setError('First name must be 3-50 alphabetic characters');
      setLoading(false);
      return;
    }
    if (p.lastName && !isValidNameUnicode(p.lastName)) {
      setError('Last name must be 3-50 alphabetic characters');
      setLoading(false);
      return;
    }
    if (p.bio) {
      if (/<[^>]*>/.test(p.bio)) {
        setError('Bio must not contain HTML tags');
        setLoading(false);
        return;
      }
      if (p.bio.length > 500) {
        setError('Bio must be 500 characters or fewer');
        setLoading(false);
        return;
      }
      if (!isValidBio(p.bio)) {
        setError('Bio contains invalid characters');
        setLoading(false);
        return;
      }
    }
    if (p.publicEmail && !isValidEmail(p.publicEmail)) {
      setError('Public email is not valid');
      setLoading(false);
      return;
    }

    let cleanedBio = p.bio ? stripTags(p.bio) : p.bio;
    if (cleanedBio) {
      try {
        cleanedBio = cleanedBio.replace(/[^\p{L}\p{N} .,'\-()?!:;]+/gu, '');
      } catch (e) {
        cleanedBio = cleanedBio.replace(/[^A-Za-z0-9 \\.\,\\'\\-\\(\\)\\?\\!\\:\;]+/g, '');
      }
      cleanedBio = cleanedBio.trim().slice(0, 500);
    }

    const sanitized = {
      profile: {
        ...p,
        firstName: p.firstName ? stripTags(p.firstName).trim() : p.firstName,
        lastName: p.lastName ? stripTags(p.lastName).trim() : p.lastName,
        bio: cleanedBio,
        publicEmail: p.publicEmail ? stripTags(p.publicEmail).trim() : p.publicEmail
      }
    };

    const result = await updateProfile(sanitized);

    if (result.success) {
      setSuccess('Profile updated successfully!');
      setFormData({ profile: { ...sanitized.profile } });
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.message || 'Failed to update profile');
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h2 className="profile-edit-title">{user?.role === 'admin' ? 'Admin Profile' : 'User Profile'}</h2>
          <div className="profile-welcome" style={{color: 'var(--text-muted)', marginTop: '0.25rem'}}>
            Welcome, <strong>{user?.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName || ''}` : user?.username}</strong>
            {user?.email && <div style={{fontSize: '0.9rem', marginTop: '0.25rem'}}>{user.email}</div>}
          </div>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="auth-alert auth-alert-success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="profile-form-row">
            <div className="auth-form-group">
              <label className="auth-form-label">First Name</label>
              <input
                type="text"
                name="firstName"
                className="auth-form-input"
                value={formData.profile.firstName}
                onChange={handleChange}
                placeholder="John"
              />
              {fieldErrors.firstName && (
                <div className="field-error" style={{color: '#ffb4b4', marginTop: '0.5rem', fontSize: '0.9rem'}}>
                  {fieldErrors.firstName}
                </div>
              )}
            </div>
            <div className="auth-form-group">
              <label className="auth-form-label">Last Name</label>
              <input
                type="text"
                name="lastName"
                className="auth-form-input"
                value={formData.profile.lastName}
                onChange={handleChange}
                placeholder="Doe"
              />
              {fieldErrors.lastName && (
                <div className="field-error" style={{color: '#ffb4b4', marginTop: '0.5rem', fontSize: '0.9rem'}}>
                  {fieldErrors.lastName}
                </div>
              )}
            </div>
          </div>

          <div className="auth-form-group">
            <label className="auth-form-label">Email</label>
            <input
              type="email"
              name="publicEmail"
              className="auth-form-input"
              value={formData.profile.publicEmail}
              onChange={handleChange}
              placeholder="public@example.com"
            />
            {fieldErrors.publicEmail && (
              <div className="field-error" style={{color: '#ffb4b4', marginTop: '0.5rem', fontSize: '0.9rem'}}>
                {fieldErrors.publicEmail}
              </div>
            )}
          </div>

          <div className="auth-form-group">
            <label className="auth-form-label">Bio</label>
            <textarea
              name="bio"
              className="auth-form-input profile-textarea"
              value={formData.profile.bio}
              onChange={handleChange}
              rows="3"
              placeholder="Tell us about yourself..."
            />
            {fieldErrors.bio && (
              <div className="field-error" style={{color: '#ffb4b4', marginTop: '0.5rem', fontSize: '0.9rem'}}>
                {fieldErrors.bio}
              </div>
            )}
          </div>

          <div className="auth-form-group">
            <label className="auth-form-label">Location</label>
            <input
              type="text"
              name="location"
              className="auth-form-input"
              value={formData.profile.location}
              onChange={handleChange}
              placeholder="Calgary, Alberta, Canada"
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-form-label">GitHub URL</label>
            <input
              type="url"
              name="githubUrl"
              className="auth-form-input"
              value={formData.profile.githubUrl}
              onChange={handleChange}
              placeholder="https://github.com/username"
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-form-label">LinkedIn URL</label>
            <input
              type="url"
              name="linkedinUrl"
              className="auth-form-input"
              value={formData.profile.linkedinUrl}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/username"
            />
          </div>

          <div className="profile-actions">
            <button
              type="button"
              className="auth-btn profile-btn-secondary"
              onClick={() => {
                setFormData({
                  profile: {
                    firstName: user?.profile?.firstName || '',
                    lastName: user?.profile?.lastName || '',
                    publicEmail: user?.profile?.publicEmail || user?.email || '',
                    bio: user?.profile?.bio || '',
                    location: user?.profile?.location || '',
                    githubUrl: user?.profile?.githubUrl || '',
                    linkedinUrl: user?.profile?.linkedinUrl || ''
                  }
                });
                setError('');
                setSuccess('');
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="auth-btn auth-btn-primary"
              disabled={loading || Object.keys(fieldErrors).length > 0}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;