// Admin Dashboard - Manage all users and portfolios
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../utils/axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    // Only fetch if user is admin
    if (!isAdmin) {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }

    fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users from /api/admin/users');
      const response = await axiosInstance.get('/api/admin/users');
      console.log('Response:', response.data);
      if (response.data.success) {
        console.log('Users received:', response.data.users);
        setUsers(response.data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (userId) => {
    try {
      const response = await axiosInstance.get(`/api/admin/users/${userId}/portfolio`);
      if (response.data.success) {
        setSelectedUser(response.data.portfolio);
        setShowUserDetail(true);
      }
    } catch (err) {
      setAlertMessage(err.response?.data?.message || 'Failed to fetch user details');
      setShowAlertModal(true);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    setConfirmAction({
      type: 'deleteUser',
      message: `Are you sure you want to delete user "${username}"? This will permanently delete their account and all associated data.`,
      onConfirm: async () => {
        try {
          const response = await axiosInstance.delete(`/api/admin/users/${userId}`);
          if (response.data.success) {
            setAlertMessage('User deleted successfully');
            setShowAlertModal(true);
            fetchUsers(); // Refresh the list
          }
        } catch (err) {
          setAlertMessage(err.response?.data?.message || 'Failed to delete user');
          setShowAlertModal(true);
        }
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  const handleChangeRole = async (userId, currentRole, username) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    setConfirmAction({
      type: 'changeRole',
      message: `Are you sure you want to change "${username}" role from ${currentRole} to ${newRole}?`,
      onConfirm: async () => {
        try {
          const response = await axiosInstance.put(`/api/admin/users/${userId}/role`, {
            role: newRole
          });
          if (response.data.success) {
            setAlertMessage(`Role updated to ${newRole}`);
            setShowAlertModal(true);
            fetchUsers(); // Refresh the list
          }
        } catch (err) {
          setAlertMessage(err.response?.data?.message || 'Failed to update role');
          setShowAlertModal(true);
        }
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  const closeModal = () => {
    setShowUserDetail(false);
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-state">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-state">{error}</div>
      </div>
    );
  }

  const stats = {
    totalUsers: users?.length || 0,
    admins: users?.filter(u => u.role === 'admin').length || 0,
    regularUsers: users?.filter(u => u.role === 'user').length || 0
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Dashboard</h1>
        <p>Manage all users and their portfolios</p>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <h3>Total Users</h3>
          <div className="stat-value">{stats.totalUsers}</div>
        </div>
        <div className="stat-card">
          <h3>Administrators</h3>
          <div className="stat-value">{stats.admins}</div>
        </div>
        <div className="stat-card">
          <h3>Regular Users</h3>
          <div className="stat-value">{stats.regularUsers}</div>
        </div>
      </div>

      <div className="users-section">
        <h2>All Users</h2>
        {!users || users.length === 0 ? (
          <div className="no-users">No users found</div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-badge ${u.role}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="user-actions">
                        <button
                          className="action-btn view"
                          onClick={() => handleViewUser(u._id)}
                        >
                          View Portfolio
                        </button>
                        <button
                          className="action-btn view"
                          onClick={() => handleChangeRole(u._id, u.role, u.username)}
                          disabled={u._id === user._id}
                        >
                          Change Role
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDeleteUser(u._id, u.username)}
                          disabled={u._id === user._id}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showUserDetail && selectedUser && (
        <div className="user-detail-modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedUser.user.username}'s Portfolio</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>

            <div className="user-info-section">
              <h3>Basic Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Username</label>
                  <div className="value">{selectedUser.user.username}</div>
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <div className="value">{selectedUser.user.email}</div>
                </div>
                <div className="info-item">
                  <label>Role</label>
                  <div className="value">
                    <span className={`role-badge ${selectedUser.user.role}`}>
                      {selectedUser.user.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="user-info-section">
              <h3>Profile Details</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Full Name</label>
                  <div className="value">{selectedUser.user.profile?.fullName || 'Not set'}</div>
                </div>
                <div className="info-item">
                  <label>Title</label>
                  <div className="value">{selectedUser.user.profile?.title || 'Not set'}</div>
                </div>
                <div className="info-item">
                  <label>Location</label>
                  <div className="value">{selectedUser.user.profile?.location || 'Not set'}</div>
                </div>
                <div className="info-item bio-item">
                  <label>Bio</label>
                  <div className="value">{selectedUser.user.profile?.bio || 'Not set'}</div>
                </div>
              </div>
            </div>

            <div className="user-info-section">
              <h3>Portfolio Stats</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Skills</label>
                  <div className="value">{selectedUser.user.skills?.length || 0}</div>
                </div>
                <div className="info-item">
                  <label>Projects</label>
                  <div className="value">{selectedUser.projects?.length || 0}</div>
                </div>
                <div className="info-item">
                  <label>Blog Posts</label>
                  <div className="value">{selectedUser.posts?.length || 0}</div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="action-btn view" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && confirmAction && (
        <div className="confirm-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{confirmAction.type === 'deleteUser' ? 'Delete User' : 'Change Role'}</h3>
            <p>{confirmAction.message}</p>
            <div className="confirm-modal-actions">
              <button 
                className="confirm-btn confirm-ok" 
                onClick={confirmAction.onConfirm}
              >
                {confirmAction.type === 'deleteUser' ? 'Delete' : 'Change Role'}
              </button>
              <button 
                className="confirm-btn confirm-cancel" 
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
