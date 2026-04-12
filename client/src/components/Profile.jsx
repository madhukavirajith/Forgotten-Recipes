// client/src/components/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

// Icons
import { 
  FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaMapMarkerAlt, 
  FaEdit, FaSave, FaTimes, FaCamera, FaSpinner,
  FaCheckCircle, FaExclamationTriangle, FaUserCircle
} from 'react-icons/fa';

const API_BASE = process.env.REACT_APP_API_URL || '';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    address: ''
  });

  const token = localStorage.getItem('token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/users/profile`, authHeader);
      setUser(res.data);
      setFormData({
        name: res.data.name || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        dob: res.data.dob ? new Date(res.data.dob).toISOString().split('T')[0] : '',
        address: res.data.address || ''
      });
    } catch (err) {
      showNotification('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_BASE}/api/users/profile`, formData, authHeader);
      setUser({ ...user, ...formData });
      setEditing(false);
      showNotification('Profile updated successfully!', 'success');
    } catch (err) {
      showNotification(err.response?.data?.msg || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
      address: user?.address || ''
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">
          <FaSpinner className="spinning" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {notification && (
        <div className={`toast-notification ${notification.type}`}>
          {notification.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
          <span>{notification.msg}</span>
        </div>
      )}

      <div className="profile-header">
        <h1 className="profile-title">
          <span className="title-icon">👤</span>
          My Profile
        </h1>
        <p className="profile-subtitle">Manage your personal information</p>
      </div>

      <div className="profile-card">
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            {user?.name?.charAt(0).toUpperCase() || <FaUserCircle />}
          </div>
          <button className="avatar-upload-btn" title="Change avatar (coming soon)">
            <FaCamera />
          </button>
        </div>

        <div className="profile-info">
          <div className="info-row">
            <div className="info-label">
              <FaUser /> Full Name
            </div>
            {editing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="info-input"
              />
            ) : (
              <div className="info-value">{user?.name || '—'}</div>
            )}
          </div>

          <div className="info-row">
            <div className="info-label">
              <FaEnvelope /> Email Address
            </div>
            {editing ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="info-input"
              />
            ) : (
              <div className="info-value">{user?.email || '—'}</div>
            )}
          </div>

          <div className="info-row">
            <div className="info-label">
              <FaPhone /> Phone Number
            </div>
            {editing ? (
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="info-input"
              />
            ) : (
              <div className="info-value">{user?.phone || '—'}</div>
            )}
          </div>

          <div className="info-row">
            <div className="info-label">
              <FaCalendarAlt /> Date of Birth
            </div>
            {editing ? (
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                className="info-input"
              />
            ) : (
              <div className="info-value">
                {user?.dob ? new Date(user.dob).toLocaleDateString() : '—'}
              </div>
            )}
          </div>

          <div className="info-row">
            <div className="info-label">
              <FaMapMarkerAlt /> Address
            </div>
            {editing ? (
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="info-textarea"
                rows="3"
              />
            ) : (
              <div className="info-value">{user?.address || '—'}</div>
            )}
          </div>

          <div className="profile-actions">
            {editing ? (
              <>
                <button className="btn-save" onClick={handleSave} disabled={saving}>
                  {saving ? <FaSpinner className="spinning" /> : <FaSave />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn-cancel" onClick={handleCancel}>
                  <FaTimes /> Cancel
                </button>
              </>
            ) : (
              <button className="btn-edit" onClick={() => setEditing(true)}>
                <FaEdit /> Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Account Stats */}
      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-value">{user?.role || 'Visitor'}</div>
          <div className="stat-label">Account Type</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{new Date(user?.createdAt).getFullYear() || '—'}</div>
          <div className="stat-label">Member Since</div>
        </div>
      </div>
    </div>
  );
};

export default Profile;