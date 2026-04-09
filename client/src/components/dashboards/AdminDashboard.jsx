// client/src/components/dashboards/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

// ✅ FIX: Define API_BASE once at the top
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

  const [blog, setBlog] = useState({ title: '', content: '', image: '' });

  const token = localStorage.getItem('token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

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
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  /* ----------------------------- Data fetchers ----------------------------- */
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/users`, authHeader); // ✅
      setUsers(res.data || []);
    } catch (err) {
      setError('Error loading users: ' + (err.response?.data?.msg || err.message));
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/feedback`, authHeader); // ✅
      setFeedbacks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error loading feedbacks:', err.response?.data || err.message);
      setFeedbacks([]);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/stats`, authHeader); // ✅
      setStats(res.data || { totalUsers: 0, totalVisitors: 0, systemRoles: { admin: 0, headchef: 0, dietician: 0 } });
    } catch (err) {
      console.error('Error loading stats:', err.response?.data || err.message);
    }
  };

  /* ----------------------------- User actions ----------------------------- */
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await axios.delete(`${API_BASE}/api/admin/users/${userId}`, authHeader); // ✅
      await fetchUsers();
      alert('User deleted successfully.');
    } catch (err) {
      setError('Delete user error: ' + (err.response?.data?.msg || err.message));
      alert('Failed to delete user.');
    }
  };

  /* ---------------------------- Feedback actions -------------------------- */
  const handleFeedbackStatus = async (id, status) => {
    try {
      await axios.patch(`${API_BASE}/api/feedback/${id}/status`, { status }, authHeader); // ✅
      setFeedbacks((prev) =>
        prev.map((f) => (f._id === id ? { ...f, status } : f))
      );
    } catch (err) {
      alert('Could not update status');
      console.error(err.response?.data || err.message);
    }
  };

  const handleDeleteFeedback = async (id) => {
    if (!window.confirm('Delete this feedback?')) return;
    try {
      await axios.delete(`${API_BASE}/api/feedback/${id}`, authHeader); // ✅
      setFeedbacks((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      alert('Could not delete feedback');
      console.error(err.response?.data || err.message);
    }
  };

  /* ------------------------------- Blog image ----------------------------- */
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setBlog((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleBlogSubmit = async (e) => {
    e.preventDefault();
    if (!blog.title.trim() || !blog.content.trim()) {
      alert('Please enter both a title and content for the blog.');
      return;
    }
    try {
      await axios.post(`${API_BASE}/api/blogs`, blog, authHeader); // ✅
      alert('Blog posted successfully!');
      setBlog({ title: '', content: '', image: '' });
    } catch (err) {
      setError('Blog post error: ' + (err.response?.data?.msg || err.message));
      alert('Failed to post blog.');
    }
  };

  if (error) return <div className="error">{error}</div>;
  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-dashboard">
      <h2>Welcome, Admin</h2>

      {/* 1) User Management */}
      <section>
        <h3>User Management</h3>
        {users.length === 0 ? (
          <p className="empty-msg">No users found</p>
        ) : (
          <ul className="user-list">
            {users.map((user) => (
              <li key={user._id}>
                <strong>{user.name}</strong> ({user.email}) — <em>{user.role}</em>
                <div className="actions">
                  <button onClick={() => handleDeleteUser(user._id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 2) Feedback & Reports (ADMIN) */}
      <section>
        <h3>Feedback & Reports</h3>
        {feedbacks.length === 0 ? (
          <p className="empty-msg">No feedback submitted yet</p>
        ) : (
          <div className="table-wrap" style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Recipe</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((fb) => (
                  <tr key={fb._id}>
                    <td>{new Date(fb.createdAt).toLocaleString()}</td>
                    <td>{fb.user?.name || '—'}</td>
                    <td>{fb.type}</td>
                    <td>
                      {fb.recipe ? (
                        <a href={`/recipes/${fb.recipe._id}`} target="_blank" rel="noreferrer">
                          {fb.recipe.name || fb.recipe._id}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ maxWidth: 420, whiteSpace: 'pre-wrap' }}>{fb.message}</td>
                    <td>
                      <select
                        value={fb.status}
                        onChange={(e) => handleFeedbackStatus(fb._id, e.target.value)}
                      >
                        <option value="open">open</option>
                        <option value="in-progress">in-progress</option>
                        <option value="closed">closed</option>
                      </select>
                    </td>
                    <td>
                      <button onClick={() => handleDeleteFeedback(fb._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 3) Post a Blog */}
      <section>
        <h3>Post a Blog</h3>
        <form onSubmit={handleBlogSubmit} className="blog-form">
          <input
            type="text"
            name="title"
            placeholder="Blog Title"
            value={blog.title}
            onChange={(e) => setBlog({ ...blog, title: e.target.value })}
            required
          />
          <textarea
            name="content"
            placeholder="Blog Content"
            rows="5"
            value={blog.content}
            onChange={(e) => setBlog({ ...blog, content: e.target.value })}
            required
          />
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {blog.image && (
            <img src={blog.image} alt="Preview" style={{ width: 150, marginTop: 10 }} />
          )}
          <button type="submit">Post Blog</button>
        </form>
      </section>

      {/* 4) Site Analytics */}
      <section>
        <h3>Site Analytics</h3>
        <div className="analytics">
          <div className="card">
            <h4>Total Users</h4>
            <p>{stats.totalUsers}</p>
          </div>
          <div className="card">
            <h4>Total Visitors</h4>
            <p>{stats.totalVisitors}</p>
          </div>
          <div className="card">
            <h4>System Roles</h4>
            <p>Admins: {stats.systemRoles.admin}</p>
            <p>Headchefs: {stats.systemRoles.headchef}</p>
            <p>Dieticians: {stats.systemRoles.dietician}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;


