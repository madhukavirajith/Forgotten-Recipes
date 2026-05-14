import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/notifications.css';
import { FaSyncAlt, FaCheckCircle } from 'react-icons/fa';

const API_BASE = process.env.REACT_APP_API_URL || '';
const API_ROOT = API_BASE ? (API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`) : '/api';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_ROOT}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        navigate('/login');
        return;
      }

      if (!res.ok) {
        throw new Error('Unable to load notifications');
      }

      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [navigate, token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    if (!token || !id) return;
    try {
      await fetch(`${API_ROOT}/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === id || notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      setError('Failed to mark notification read');
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    setSaving(true);

    try {
      const res = await fetch(`${API_ROOT}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Unable to mark all read');
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    } catch (err) {
      setError(err.message || 'Failed to mark all notifications read');
    } finally {
      setSaving(false);
    }
  };

  const unreadCount = notifications.filter((notif) => !notif.read).length;

  if (!token) {
    return (
      <div className="notifications-page">
        <div className="notifications-panel">
          <h1>Notifications</h1>
          <p>You need to sign in to view notifications.</p>
          <Link className="notifications-action" to="/login">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-panel">
        <div className="notifications-page-header">
          <div>
            <h1>Notifications</h1>
            <p className="notifications-page-subtitle">
              {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
            </p>
          </div>
          <div className="notifications-page-actions">
            <button
              className="notifications-action"
              onClick={fetchNotifications}
              type="button"
            >
              <FaSyncAlt /> Refresh
            </button>
            <button
              className="notifications-action primary"
              onClick={handleMarkAllRead}
              disabled={saving || unreadCount === 0}
              type="button"
            >
              <FaCheckCircle /> {saving ? 'Saving…' : 'Mark all read'}
            </button>
          </div>
        </div>

        {error && <div className="notifications-error">{error}</div>}

        <div className="notifications-list-page">
          {loading ? (
            <div className="notifications-loading">Loading notifications…</div>
          ) : notifications.length === 0 ? (
            <div className="notifications-empty">No notifications yet.</div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif._id || notif.id}
                className={`notification-card ${notif.read ? 'read' : 'unread'}`}
                onClick={() => handleMarkRead(notif._id || notif.id)}
              >
                <div className="notification-card-header">
                  <span className="notification-card-title">{notif.title || 'Notification'}</span>
                  <span className="notification-card-time">
                    {new Date(notif.createdAt || notif.time || Date.now()).toLocaleString()}
                  </span>
                </div>
                <div className="notification-card-message">{notif.message}</div>
                <div className="notification-card-footer">
                  <span>{notif.type || 'general'}</span>
                  {!notif.read && <span className="notification-card-badge">New</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
