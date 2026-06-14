// client/src/components/dashboards/AdminDashboard.jsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';

import Chat from '../Chat';   // Add the global Chat component

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

  const [blog, setBlog] = useState({ title: '', content: '', image: '', category: '', tags: '', authorName: '', status: 'Draft' });
  const [blogSubmitting, setBlogSubmitting] = useState(false);
  const [blogs, setBlogs] = useState([]);
  const [editingBlogId, setEditingBlogId] = useState(null);

  const token = sessionStorage.getItem('token');
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

  const fetchBlogs = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/blogs/admin-list`, authHeader);
      setBlogs(res.data.blogs || []);
    } catch (err) {
      console.error('Error loading blogs:', err.response?.data || err.message);
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
        await Promise.all([fetchUsers(), fetchFeedbacks(), fetchStats(), fetchBlogs()]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, fetchUsers, fetchFeedbacks, fetchStats, fetchBlogs]);

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

  const insertFormat = (tagBefore, tagAfter = '') => {
    const textarea = document.getElementById('blogContent');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    const replacement = tagBefore + selectedText + tagAfter;
    const newContent = text.substring(0, start) + replacement + text.substring(end);

    setBlog(prev => ({ ...prev, content: newContent }));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagBefore.length, start + tagBefore.length + selectedText.length);
    }, 0);
  };

  const handleBlogSubmit = async (e) => {
    e.preventDefault();
    if (!blog.title.trim() || !blog.content.trim()) {
      showNotification('Please enter both title and content', 'error');
      return;
    }
    setBlogSubmitting(true);

    const tagsArray = blog.tags
      ? blog.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];

    const blogPayload = {
      title: blog.title,
      content: blog.content,
      image: blog.image,
      category: blog.category || '',
      tags: tagsArray,
      authorName: blog.authorName,
      status: blog.status
    };

    try {
      if (editingBlogId) {
        await axios.put(`${API_BASE}/api/blogs/${editingBlogId}`, blogPayload, authHeader);
        showNotification('Blog updated successfully!', 'success');
        setEditingBlogId(null);
      } else {
        await axios.post(`${API_BASE}/api/blogs`, blogPayload, authHeader);
        showNotification('Blog posted successfully!', 'success');
      }
      setBlog({ title: '', content: '', image: '', category: '', tags: '', authorName: '', status: 'Draft' });
      fetchBlogs();
    } catch (err) {
      showNotification(editingBlogId ? 'Failed to update blog' : 'Failed to post blog', 'error');
    } finally {
      setBlogSubmitting(false);
    }
  };

  const handleEditBlog = (post) => {
    setBlog({ 
      title: post.title, 
      content: post.content, 
      image: post.image || '',
      category: post.category || '',
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''),
      authorName: post.authorName || '',
      status: post.status || 'Draft'
    });
    setEditingBlogId(post._id);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleDeleteBlog = async (blogId) => {
    if (!window.confirm('Delete this blog post? This action cannot be undone.')) return;
    try {
      await axios.delete(`${API_BASE}/api/blogs/${blogId}`, authHeader);
      showNotification('Blog post deleted successfully', 'success');
      fetchBlogs();
      if (editingBlogId === blogId) {
        setBlog({ title: '', content: '', image: '', category: '', tags: '', authorName: '', status: 'Draft' });
        setEditingBlogId(null);
      }
    } catch (err) {
      showNotification('Failed to delete blog post', 'error');
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
    { title: 'Blogs', value: blogs.length, icon: <FaBlog />, color: '#8b5cf6' }
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
        <div className="blog-tab-grid">
          <div className="blog-form-card" style={{ margin: 0 }}>
            <h3>{editingBlogId ? 'Edit Blog Post' : 'Post a New Blog'}</h3>
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
                <label>Category *</label>
                <select
                  value={blog.category}
                  onChange={(e) => setBlog({ ...blog, category: e.target.value })}
                  required
                >
                  <option value="" disabled>Select a Category</option>
                  <option value="Cooking Tips">Cooking Tips</option>
                  <option value="Chef Interviews">Chef Interviews</option>
                  <option value="Restaurant Reviews">Restaurant Reviews</option>
                  <option value="Ingredient Guides">Ingredient Guides</option>
                  <option value="Kitchen Techniques">Kitchen Techniques</option>
                  <option value="Food Trends">Food Trends</option>
                  <option value="Recipe Tutorials">Recipe Tutorials</option>
                  <option value="Kitchen Tools">Kitchen Tools</option>
                  <option value="Health & Nutrition">Health & Nutrition</option>
                  <option value="Travel & Food">Travel & Food</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g., traditional spices, cooking tips, street food"
                  value={blog.tags}
                  onChange={(e) => setBlog({ ...blog, tags: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Author Name</label>
                <input
                  type="text"
                  placeholder="Enter author name (e.g. Guest Chef, Admin)"
                  value={blog.authorName}
                  onChange={(e) => setBlog({ ...blog, authorName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Status *</label>
                <select
                  value={blog.status}
                  onChange={(e) => setBlog({ ...blog, status: e.target.value })}
                  required
                >
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Blog Content *</label>
                <div className="rte-toolbar" style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem', flexWrap: 'wrap', background: 'var(--bg-secondary)', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                  <button type="button" onClick={() => insertFormat('**', '**')} title="Bold" style={{ padding: '0.2rem 0.6rem', cursor: 'pointer', fontWeight: 'bold', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '3px', color: 'var(--text-primary)' }}>B</button>
                  <button type="button" onClick={() => insertFormat('*', '*')} title="Italic" style={{ padding: '0.2rem 0.6rem', cursor: 'pointer', fontStyle: 'italic', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '3px', color: 'var(--text-primary)' }}>I</button>
                  <button type="button" onClick={() => insertFormat('### ')} title="Heading" style={{ padding: '0.2rem 0.6rem', cursor: 'pointer', fontWeight: 'bold', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '3px', color: 'var(--text-primary)' }}>H</button>
                  <button type="button" onClick={() => insertFormat('- ')} title="Bullet List" style={{ padding: '0.2rem 0.6rem', cursor: 'pointer', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '3px', color: 'var(--text-primary)' }}>• List</button>
                  <button type="button" onClick={() => insertFormat('[', '](url)')} title="Link" style={{ padding: '0.2rem 0.6rem', cursor: 'pointer', textDecoration: 'underline', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '3px', color: 'var(--text-primary)' }}>Link</button>
                </div>
                <textarea
                  id="blogContent"
                  rows={8}
                  placeholder="Write your blog content here... Use the toolbar above for formatting."
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
                      <button type="button" onClick={(e) => { e.stopPropagation(); setBlog({ ...blog, image: '' }); }}><FaTimes /></button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <FaInfoCircle /> Click to upload image (max 5MB)
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="submit-btn" disabled={blogSubmitting} style={{ flex: 1 }}>
                  {blogSubmitting ? <FaSpinner className="spinning" /> : <FaBlog />}
                  {blogSubmitting ? 'Processing...' : editingBlogId ? 'Update Blog' : 'Publish Blog'}
                </button>
                {editingBlogId && (
                  <button
                    type="button"
                    className="action-btn"
                    onClick={() => {
                      setBlog({ title: '', content: '', image: '', category: '', tags: '', authorName: '', status: 'Draft' });
                      setEditingBlogId(null);
                    }}
                    style={{ flex: 0.3 }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="blog-list-card">
            <h3>Manage Existing Blogs</h3>
            {blogs.length === 0 ? (
              <div className="empty-state">
                <FaBlog />
                <p>No blog posts found</p>
              </div>
            ) : (
              <div className="admin-blog-list">
                {blogs.map(b => (
                  <div key={b._id} className="admin-blog-item">
                    <div className="blog-item-details">
                      <h4>{b.title}</h4>
                      <p>Posted on {new Date(b.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="blog-item-actions">
                      <button onClick={() => handleEditBlog(b)} className="action-btn edit" title="Edit Blog" style={{ flex: 'none' }}>
                        <FaEdit /> Edit
                      </button>
                      <button onClick={() => handleDeleteBlog(b._id)} className="action-btn delete" title="Delete Blog" style={{ flex: 'none' }}>
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

      {/* Global Chat Widget - always visible */}
      <Chat />
    </div>
  );
};

export default AdminDashboard;