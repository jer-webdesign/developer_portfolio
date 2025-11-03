import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../Login/Login.css';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(true); // Start in editing mode
  const [formData, setFormData] = useState({
    profile: {
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
      bio: user?.profile?.bio || '',
      location: user?.profile?.location || '',
      githubUrl: user?.profile?.githubUrl || '',
      linkedinUrl: user?.profile?.linkedinUrl || ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      profile: {
        ...formData.profile,
        [name]: value
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const result = await updateProfile(formData);
    
    if (result.success) {
      setSuccess('Profile updated successfully!');
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
        <h2 className="profile-edit-title">{user?.role === 'admin' ? 'Admin Profile' : 'User Profile'}</h2>
        
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
              </div>
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
                disabled={loading}
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