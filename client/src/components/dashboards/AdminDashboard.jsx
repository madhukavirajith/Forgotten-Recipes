// client/src/components/dashboards/AdminDashboard.jsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import './AdminDashboard.css';
import Chat from '../Chat';   // ✅ Add the global Chat component

// Icons (install react-icons if not already)
import { 
  FaUsers, FaUserCheck, FaComments, FaBlog, FaChartLine, 
  FaTrash, FaEdit, FaSearch, FaFilter, FaTimes, FaSpinner,
  FaCheckCircle, FaExclamationTriangle, FaInfoCircle,
  FaEnvelope, FaUserTag, FaClock, FaEye, FaBan
} from 'react-icons/fa';

const API_BASE = process.env.REACT_APP_API_URL || '';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVisitors: 0,
    systemRoles: { admin: 1, headchef: 1, dietician: 1 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);

  const [blog, setBlog] = useState({ title: '', content: '', image: '' });
  const [blogSubmitting, setBlogSubmitting] = useState(false);

  const token = localStorage.getItem('token');
  const authHeader = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ---------- Data fetching ----------
  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/users`, authHeader);
      setUsers(res.data || []);
    } catch (err) {
      setError('Error loading users: ' + (err.response?.data?.msg || err.message));
    }
  }, [authHeader]);

  const fetchFeedbacks = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/feedback`, authHeader);
      setFeedbacks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error loading feedbacks:', err.response?.data || err.message);
      setFeedbacks([]);
    }
  }, [authHeader]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/stats`, authHeader);
      setStats(res.data || { totalUsers: 0, totalVisitors: 0, systemRoles: { admin: 0, headchef: 0, dietician: 0 } });
    } catch (err) {
      console.error('Error loading stats:', err.response?.data || err.message);
    }
  }, [authHeader]);

  useEffect(() => {
    if (!token) {
      setError('No authentication token found. Please log in.');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        await Promise.all([fetchUsers(), fetchFeedbacks(), fetchStats()]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, fetchUsers, fetchFeedbacks, fetchStats]);

  // ---------- User actions ----------
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user? This action cannot be undone.')) return;
    try {
      await axios.delete(`${API_BASE}/api/admin/users/${userId}`, authHeader);
      await fetchUsers();
      showNotification('User deleted successfully', 'success');
    } catch (err) {
      showNotification('Failed to delete user', 'error');
    }
  };

  // ---------- Feedback actions ----------
  const handleFeedbackStatus = async (id, status) => {
    try {
      await axios.patch(`${API_BASE}/api/feedback/${id}/status`, { status }, authHeader);
      setFeedbacks((prev) => prev.map((f) => (f._id === id ? { ...f, status } : f)));
      showNotification(`Feedback marked as ${status}`, 'success');
    } catch (err) {
      showNotification('Could not update status', 'error');
    }
  };

  const handleDeleteFeedback = async (id) => {
    if (!window.confirm('Delete this feedback?')) return;
    try {
      await axios.delete(`${API_BASE}/api/feedback/${id}`, authHeader);
      setFeedbacks((prev) => prev.filter((f) => f._id !== id));
      showNotification('Feedback deleted', 'success');
    } catch (err) {
      showNotification('Could not delete feedback', 'error');
    }
  };

  // ---------- Blog actions ----------
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showNotification('Image must be less than 5MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setBlog((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleBlogSubmit = async (e) => {
    e.preventDefault();
    if (!blog.title.trim() || !blog.content.trim()) {
      showNotification('Please enter both title and content', 'error');
      return;
    }
    setBlogSubmitting(true);
    try {
      await axios.post(`${API_BASE}/api/blogs`, blog, authHeader);
      showNotification('Blog posted successfully!', 'success');
      setBlog({ title: '', content: '', image: '' });
    } catch (err) {
      showNotification('Failed to post blog', 'error');
    } finally {
      setBlogSubmitting(false);
    }
  };

  // Filter users by name/email/role
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter feedbacks by message/user/status
  const filteredFeedbacks = feedbacks.filter(fb =>
    fb.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fb.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fb.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fb.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statsCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: <FaUsers />, color: '#3b82f6' },
    { title: 'Total Visitors', value: stats.totalVisitors, icon: <FaUserCheck />, color: '#10b981' },
    { title: 'Feedbacks', value: feedbacks.length, icon: <FaComments />, color: '#f59e0b' },
    { title: 'Blogs', value: '—', icon: <FaBlog />, color: '#8b5cf6' }
  ];

  const roleColors = {
    admin: '#ef4444',
    headchef: '#f59e0b',
    dietician: '#10b981',
    visitor: '#6b7280'
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-skeleton">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-state">
          <FaExclamationTriangle />
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Toast Notification */}
      {notification && (
        <div className={`toast-notification ${notification.type}`}>
          {notification.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <span className="title-icon">👑</span>
          Admin Dashboard
        </h1>
        <p className="dashboard-subtitle">Manage users, feedback, blog posts, and site analytics</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {statsCards.map((stat, idx) => (
          <div key={idx} className="stat-card" style={{ borderLeftColor: stat.color }}>
            <div className="stat-icon" style={{ color: stat.color }}>{stat.icon}</div>
            <div className="stat-info">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-title">{stat.title}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <FaUsers /> Users
        </button>
        <button className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => setActiveTab('feedback')}>
          <FaComments /> Feedback
        </button>
        <button className={`tab-btn ${activeTab === 'blog' ? 'active' : ''}`} onClick={() => setActiveTab('blog')}>
          <FaBlog /> Post Blog
        </button>
        <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          <FaChartLine /> Analytics
        </button>
      </div>

      {/* Search Bar (visible on Users and Feedback tabs) */}
      {(activeTab === 'users' || activeTab === 'feedback') && (
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <FaTimes />
            </button>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="users-tab">
          {filteredUsers.length === 0 ? (
            <div className="empty-state">
              <FaUsers />
              <p>No users found</p>
            </div>
          ) : (
            <div className="users-grid">
              {filteredUsers.map(user => (
                <div key={user._id} className="user-card">
                  <div className="user-avatar" style={{ background: roleColors[user.role] || '#6b7280' }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <h4>{user.name}</h4>
                    <p className="user-email">{user.email}</p>
                    <span className="user-role" style={{ background: roleColors[user.role] + '20', color: roleColors[user.role] }}>
                      {user.role}
                    </span>
                  </div>
                  <div className="user-actions">
                    <button onClick={() => handleDeleteUser(user._id)} className="delete-btn" title="Delete user">
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <div className="feedback-tab">
          {filteredFeedbacks.length === 0 ? (
            <div className="empty-state">
              <FaComments />
              <p>No feedback found</p>
            </div>
          ) : (
            <div className="feedback-list">
              {filteredFeedbacks.map(fb => (
                <div key={fb._id} className="feedback-card">
                  <div className="feedback-header">
                    <div className="feedback-meta">
                      <span className="feedback-type">{fb.type}</span>
                      <span className={`feedback-status status-${fb.status}`}>{fb.status}</span>
                    </div>
                    <div className="feedback-actions">
                      <select
                        value={fb.status}
                        onChange={(e) => handleFeedbackStatus(fb._id, e.target.value)}
                        className="status-select"
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="closed">Closed</option>
                      </select>
                      <button onClick={() => handleDeleteFeedback(fb._id)} className="delete-btn" title="Delete feedback">
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="feedback-body">
                    <p className="feedback-message">{fb.message}</p>
                    {fb.recipe && (
                      <a href={`/recipes/${fb.recipe._id}`} target="_blank" rel="noreferrer" className="feedback-recipe">
                        <FaEye /> View related recipe
                      </a>
                    )}
                  </div>
                  <div className="feedback-footer">
                    <span><FaUserTag /> {fb.user?.name || 'Anonymous'}</span>
                    <span><FaClock /> {new Date(fb.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Blog Tab */}
      {activeTab === 'blog' && (
        <div className="blog-tab">
          <div className="blog-form-card">
            <h3>Post a New Blog</h3>
            <form onSubmit={handleBlogSubmit} className="blog-form">
              <div className="form-group">
                <label>Blog Title *</label>
                <input
                  type="text"
                  placeholder="Enter blog title"
                  value={blog.title}
                  onChange={(e) => setBlog({ ...blog, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Blog Content *</label>
                <textarea
                  rows={8}
                  placeholder="Write your blog content here..."
                  value={blog.content}
                  onChange={(e) => setBlog({ ...blog, content: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Featured Image</label>
                <div className="image-upload-area" onClick={() => document.getElementById('blogImage').click()}>
                  <input id="blogImage" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                  {blog.image ? (
                    <div className="image-preview">
                      <img src={blog.image} alt="Preview" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); setBlog({ ...blog, image: '' }); }}>✕</button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <FaInfoCircle /> Click to upload image (max 5MB)
                    </div>
                  )}
                </div>
              </div>
              <button type="submit" className="submit-btn" disabled={blogSubmitting}>
                {blogSubmitting ? <FaSpinner className="spinning" /> : <FaBlog />}
                {blogSubmitting ? 'Posting...' : 'Publish Blog'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="analytics-tab">
          <div className="analytics-grid">
            <div className="analytics-card">
              <h3>User Roles Distribution</h3>
              <div className="role-stats">
                {Object.entries(stats.systemRoles).map(([role, count]) => (
                  <div key={role} className="role-item">
                    <span className="role-name" style={{ color: roleColors[role] }}>{role}</span>
                    <div className="role-bar-bg">
                      <div className="role-bar-fill" style={{ width: `${(count / stats.totalUsers) * 100}%`, background: roleColors[role] }} />
                    </div>
                    <span className="role-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="analytics-card">
              <h3>Feedback Summary</h3>
              <div className="feedback-summary">
                <div className="summary-item">
                  <span>Total</span>
                  <strong>{feedbacks.length}</strong>
                </div>
                <div className="summary-item">
                  <span>Open</span>
                  <strong>{feedbacks.filter(f => f.status === 'open').length}</strong>
                </div>
                <div className="summary-item">
                  <span>In Progress</span>
                  <strong>{feedbacks.filter(f => f.status === 'in-progress').length}</strong>
                </div>
                <div className="summary-item">
                  <span>Closed</span>
                  <strong>{feedbacks.filter(f => f.status === 'closed').length}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Global Chat Widget - always visible */}
      <Chat />
    </div>
  );
};

export default AdminDashboard;