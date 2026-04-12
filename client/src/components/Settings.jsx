// client/src/components/Settings.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Settings.css';

// Icons
import { 
  FaBell, FaLock, FaPalette, FaLanguage, FaGlobe, 
  FaEnvelope, FaMoon, FaSun, FaSave, FaSpinner,
  FaCheckCircle, FaExclamationTriangle, FaTrash,
  FaSignOutAlt, FaUserSecret
} from 'react-icons/fa';

const API_BASE = process.env.REACT_APP_API_URL || '';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    darkMode: false,
    language: 'en',
    publicProfile: true
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const token = localStorage.getItem('token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/users/preferences`, authHeader);
      setPreferences(res.data);
    } catch (err) {
      console.error('Error fetching preferences:', err);
    }
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences({ ...preferences, [key]: value });
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_BASE}/api/users/preferences`, preferences, authHeader);
      showNotification('Preferences saved successfully!', 'success');
    } catch (err) {
      showNotification('Failed to save preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('New passwords do not match', 'error');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showNotification('Password must be at least 6 characters', 'error');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/api/users/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, authHeader);
      showNotification('Password changed successfully!', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showNotification(err.response?.data?.msg || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm('Are you sure? This action cannot be undone.')) return;
    setLoading(true);
    try {
      await axios.delete(`${API_BASE}/api/users/account`, authHeader);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    } catch (err) {
      showNotification('Failed to delete account', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container">
      {notification && (
        <div className={`toast-notification ${notification.type}`}>
          {notification.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
          <span>{notification.msg}</span>
        </div>
      )}

      <div className="settings-header">
        <h1 className="settings-title">
          <span className="title-icon">⚙️</span>
          Settings
        </h1>
        <p className="settings-subtitle">Customize your experience</p>
      </div>

      <div className="settings-grid">
        {/* Preferences Section */}
        <div className="settings-card">
          <h2><FaBell /> Notifications</h2>
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Email Notifications</div>
              <div className="setting-desc">Receive recipe updates and feedback replies</div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-card">
          <h2><FaPalette /> Appearance</h2>
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Dark Mode</div>
              <div className="setting-desc">Use dark theme across the site</div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.darkMode}
                onChange={(e) => handlePreferenceChange('darkMode', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-card">
          <h2><FaLanguage /> Language & Region</h2>
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Language</div>
              <div className="setting-desc">Choose your preferred language</div>
            </div>
            <select
              value={preferences.language}
              onChange={(e) => handlePreferenceChange('language', e.target.value)}
              className="settings-select"
            >
              <option value="en">English</option>
              <option value="si">සිංහල</option>
              <option value="ta">தமிழ்</option>
            </select>
          </div>
        </div>

        <div className="settings-card">
          <h2><FaUserSecret /> Privacy</h2>
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Public Profile</div>
              <div className="setting-desc">Allow others to see your profile</div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.publicProfile}
                onChange={(e) => handlePreferenceChange('publicProfile', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Save Preferences */}
        <div className="settings-card full-width">
          <button className="save-preferences-btn" onClick={savePreferences} disabled={saving}>
            {saving ? <FaSpinner className="spinning" /> : <FaSave />}
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        {/* Change Password Section */}
        <div className="settings-card">
          <h2><FaLock /> Change Password</h2>
          <div className="password-form">
            <input
              type="password"
              name="currentPassword"
              placeholder="Current Password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              className="password-input"
            />
            <input
              type="password"
              name="newPassword"
              placeholder="New Password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              className="password-input"
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm New Password"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              className="password-input"
            />
            <button className="change-password-btn" onClick={changePassword} disabled={loading}>
              {loading ? <FaSpinner className="spinning" /> : <FaLock />}
              Update Password
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="settings-card danger-zone">
          <h2><FaTrash /> Danger Zone</h2>
          <p className="danger-warning">Once you delete your account, there is no going back.</p>
          <button className="delete-account-btn" onClick={deleteAccount} disabled={loading}>
            <FaTrash /> Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;