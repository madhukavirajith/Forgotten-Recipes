// client/src/components/Navbar.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';


const API_BASE = process.env.REACT_APP_API_URL || '';
const API_ROOT = API_BASE ? (API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`) : '/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || API_BASE || 'http://localhost:5000';

// ===== Utility Functions =====
function decodeJWT(token) {
  try {
    return JSON.parse(atob(token.split('.')[1] || '')) || {};
  } catch {
    return {};
  }
}

function decodeRoleFromJWT(token) {
  const payload = decodeJWT(token);
  return payload.role || payload.userRole || payload?.user?.role || null;
}

function readAuth() {
  const token = sessionStorage.getItem('token') || null;

  const storedRole =
    sessionStorage.getItem('role') ||
    (() => {
      try {
        const u = JSON.parse(sessionStorage.getItem('user') || 'null');
        return u?.role || null;
      } catch {
        return null;
      }
    })() ||
    (token ? decodeRoleFromJWT(token) : null);

  // Normalize role strings
  let role = (storedRole || '').toLowerCase();
  if (role === 'headchef' || role === 'head-chef') role = 'headchef';
  if (role === 'registered-visitor' || role === 'visitor') role = 'visitor';

  return { token, role };
}

// ===== Navigation Links Configuration =====
const NAV_LINKS = [
  { path: '/', label: 'Home', exact: true },
  { path: '/blog', label: 'Blog' },
  { path: '/calendar', label: 'Calendar' },
  { path: '/recipes', label: 'Recipes' },
  { path: '/about', label: 'About' },
  { path: '/stories', label: 'Cultural Stories' },
];

// ===== Main Navbar Component =====
export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const navbarRef = useRef(null);
  
  // State Management
  const [auth, setAuth] = useState(readAuth());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Socket ref to maintain single connection
  const socketRef = useRef(null);
  // Refs to track current auth state
  const currentTokenRef = useRef(null);
  const currentRoleRef = useRef(null);
  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 992 && mobileMenuOpen) {
        setMobileMenuOpen(false);
        document.body.style.overflow = 'unset';
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update auth state when route changes
  useEffect(() => {
    setAuth(readAuth());
    setMobileMenuOpen(false);
    setDropdownOpen(false);
    setShowNotifications(false);
    document.body.style.overflow = 'unset';
  }, [location.pathname]);

  // Listen for storage events (logout from other tabs)
  useEffect(() => {
    const onStorage = () => setAuth(readAuth());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.user-menu')) {
        setDropdownOpen(false);
      }
      if (showNotifications && !event.target.closest('.notifications-menu')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen, showNotifications]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!auth.token) {
        setNotifications([]);
        return;
      }

      try {
        const res = await fetch(`${API_ROOT}/notifications`, {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });
        if (!res.ok) throw new Error('Failed to load notifications');
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };

    fetchNotifications();
  }, [auth.token]);

  // Socket connection management
  useEffect(() => {
    const token = auth.token;
    const role = auth.role;

    if (token && !socketRef.current) {
      // Create socket connection only once
      const tokenPayload = decodeJWT(token);
      const userId = tokenPayload?.id || tokenPayload?._id;

      if (userId) {
        console.log('Creating notification socket for user:', userId);
        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('Notification socket connected');
          socket.emit('join', { userId, userRole: role });
        });

        socket.on('connect_error', (err) => {
          console.error('Notification socket error:', err.message);
        });

        socket.on('disconnect', (reason) => {
          console.log('Notification socket disconnected:', reason);
        });

        socket.on('notification', (note) => {
          console.log('Received notification:', note);
          setNotifications((prev) => {
            const exists = (prev || []).some((n) => (n._id || n.id) === (note._id || note.id));
            if (exists) return prev;
            return [note, ...(prev || [])];
          });
          window.dispatchEvent(new CustomEvent('live-notification', { detail: note }));
        });
      }
    }

    // Cleanup function - only runs on unmount
    return () => {
      // Intentionally empty - cleanup handled by separate effect
    };
  }, []); // Empty dependency array - only run once on mount

  // Handle auth changes
  useEffect(() => {
    const token = auth.token;
    const role = auth.role;

    // Only update if token or role actually changed
    if (currentTokenRef.current !== token || currentRoleRef.current !== role) {
      currentTokenRef.current = token;
      currentRoleRef.current = role;

      if (!token && socketRef.current) {
        // Disconnect when user logs out
        console.log('Disconnecting notification socket due to logout');
        socketRef.current.disconnect();
        socketRef.current = null;
      } else if (token && socketRef.current && socketRef.current.connected) {
        // Update user info if socket is connected
        const tokenPayload = decodeJWT(token);
        const userId = tokenPayload?.id || tokenPayload?._id;
        if (userId) {
          socketRef.current.emit('join', { userId, userRole: role });
        }
      }
    }
  }, [auth.token, auth.role]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        console.log('Cleaning up notification socket on unmount');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // ===== Handlers =====
  const logout = useCallback(() => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('role');
    setAuth({ token: null, role: null });
    setMobileMenuOpen(false);
    setDropdownOpen(false);
    // Socket will be disconnected by the auth change effect
    navigate('/');
  }, [navigate]);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
    document.body.style.overflow = !mobileMenuOpen ? 'hidden' : 'unset';
  }, [mobileMenuOpen]);

  const handleLinkClick = useCallback(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
    setShowNotifications(false);
    document.body.style.overflow = 'unset';
  }, []);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/recipes?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
      handleLinkClick();
    }
  }, [searchQuery, navigate, handleLinkClick]);

  const markNotificationRead = useCallback(async (id) => {
    try {
      await fetch(`${API_ROOT}/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
      });
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === id || notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  }, [auth.token]);

  const markAllRead = useCallback(async () => {
    try {
      await fetch(`${API_ROOT}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
      });
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  }, [auth.token]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ===== Helpers =====
  const isActiveLink = (path, exact = false) => {
    return exact ? location.pathname === path : location.pathname.startsWith(path);
  };

  // Decide dashboard path per role
  const getDashboardPath = () => {
    const roleMap = {
      admin: '/admin',
      headchef: '/headchef',
      dietician: '/dietician',
      visitor: '/visitor',
    };
    return roleMap[auth.role] || null;
  };

  const dashboardPath = getDashboardPath();

  // Get user display name
  const getUserName = () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      return user.name || user.email?.split('@')[0] || 'User';
    } catch {
      return 'User';
    }
  };

  // Get user avatar initial
  const getUserInitial = () => {
    const name = getUserName();
    return name.charAt(0).toUpperCase();
  };

  return (
    <nav ref={navbarRef} className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo Section */}
        <div className="navbar-left" onClick={() => navigate('/')}>
          <div className="logo-wrapper">
            <img src="/logo.jpg" alt="Forgotten Recipes" className="navbar-logo" />
            <div className="logo-glow"></div>
          </div>
          <div className="brand-wrapper">
            <span className="navbar-brand">FORGOTTEN</span>
            <span className="navbar-brand-sub">RECIPES</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <ul className="navbar-links-desktop">
          {NAV_LINKS.map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={`nav-link ${isActiveLink(link.path, link.exact) ? 'active' : ''}`}
              >
                <span className="nav-label">{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Right Section */}
        <div className="navbar-right">
          {/* Search Button */}
          <button 
            className={`search-btn ${searchOpen ? 'active' : ''}`}
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search"
          >
            <i className="fas fa-search"></i>
          </button>

          {/* Notifications (only for logged in users) */}
          {auth.token && (
            <div className="notifications-menu">
              <button 
                className={`notifications-btn ${unreadCount > 0 ? 'has-notifications' : ''}`}
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
              >
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>
              
              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h4>Notifications</h4>
                    <div className="notifications-header-actions">
                      {unreadCount > 0 && (
                        <button className="mark-all-read" onClick={markAllRead}>Mark all read</button>
                      )}
                    </div>
                  </div>
                  <div className="notifications-list">
                    {notifications.length > 0 ? (
                      notifications.slice(0, 5).map((notif) => (
                        <div 
                          key={notif._id || notif.id}
                          className={`notification-item ${!notif.read ? 'unread' : ''}`}
                          onClick={() => markNotificationRead(notif._id || notif.id)}
                        >
                          {notif.title && <div className="notification-title">{notif.title}</div>}
                          <div className="notification-message">{notif.message}</div>
                          <div className="notification-time">
                            {new Date(notif.createdAt || notif.time || null).toLocaleString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-notifications">No notifications</div>
                    )}
                  </div>
                  <div className="notifications-footer">
                    <Link to="/notifications" className="view-all-link" onClick={() => setShowNotifications(false)}>
                      View All Notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Menu / Auth Buttons */}
          {auth.token ? (
            <div className="user-menu">
              <button 
                className={`user-btn ${dropdownOpen ? 'active' : ''}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="User menu"
              >
                <div className="user-avatar">
                  {getUserInitial()}
                </div>
                <span className="user-name">{getUserName()}</span>
              </button>

              {dropdownOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-user-info">
                      <div className="dropdown-avatar">{getUserInitial()}</div>
                      <div>
                        <div className="dropdown-user-name">{getUserName()}</div>
                        <div className="dropdown-user-role">{auth.role || 'Member'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  {dashboardPath && (
                    <>
                      <Link to={dashboardPath} className="dropdown-item" onClick={handleLinkClick}>
                        <i className="fas fa-th-large"></i> Dashboard
                      </Link>
                      <div className="dropdown-divider"></div>
                    </>
                  )}
                  <Link to="/profile" className="dropdown-item" onClick={handleLinkClick}>
                    <i className="fas fa-user-circle"></i> My Profile
                  </Link>
                  <Link to="/notifications" className="dropdown-item" onClick={handleLinkClick}>
                    <i className="fas fa-bell"></i> Notifications {unreadCount > 0 && <span className="mobile-badge">{unreadCount}</span>}
                  </Link>
                  <Link to="/settings" className="dropdown-item" onClick={handleLinkClick}>
                    <i className="fas fa-cog"></i> Settings
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout-item" onClick={logout}>
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-login" onClick={handleLinkClick}>
                Login
              </Link>
              <Link to="/login?register=true" className="btn-register" onClick={handleLinkClick}>
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className={`mobile-menu-btn ${mobileMenuOpen ? 'active' : ''}`} 
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Search Bar (Expandable) */}
      <div className={`search-bar-container ${searchOpen ? 'open' : ''}`}>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search recipes, stories, blogs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus={searchOpen}
            className="search-input"
          />
          <button type="submit" className="search-submit">Search</button>
          <button type="button" className="search-close" onClick={() => setSearchOpen(false)}><FaTimes /></button>
        </form>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={toggleMobileMenu}></div>

      {/* Mobile Navigation Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <div className="mobile-logo">
            <img src="/logo.jpg" alt="Forgotten Recipes" />
            <span>FORGOTTEN RECIPES</span>
          </div>
          <button className="mobile-close" onClick={toggleMobileMenu}><FaTimes /></button>
        </div>

        <div className="mobile-menu-search">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit"><i className="fas fa-search"></i></button>
          </form>
        </div>

        <ul className="mobile-nav-links">
          {NAV_LINKS.map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={`mobile-nav-link ${isActiveLink(link.path, link.exact) ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="mobile-nav-label">{link.label}</span>
              </Link>
            </li>
          ))}
          
          {auth.token && dashboardPath && (
            <li>
              <Link to={dashboardPath} className="mobile-nav-link" onClick={handleLinkClick}>
                Dashboard
              </Link>
            </li>
          )}
          
          {auth.token && (
            <>
              <li>
                <Link to="/profile" className="mobile-nav-link" onClick={handleLinkClick}>
                  <i className="fas fa-user-circle"></i> Profile
                </Link>
              </li>
              <li>
                <Link to="/notifications" className="mobile-nav-link" onClick={handleLinkClick}>
                  <i className="fas fa-bell"></i> Notifications {unreadCount > 0 && <span className="mobile-badge">{unreadCount}</span>}
                </Link>
              </li>
              <li>
                <Link to="/settings" className="mobile-nav-link" onClick={handleLinkClick}>
                  <i className="fas fa-cog"></i> Settings
                </Link>
              </li>
            </>
          )}
        </ul>

        {!auth.token ? (
          <div className="mobile-auth-buttons">
            <Link to="/login" className="mobile-login-btn" onClick={handleLinkClick}>
              Login
            </Link>
            <Link to="/login?register=true" className="mobile-register-btn" onClick={handleLinkClick}>
              Register
            </Link>
          </div>
        ) : (
          <div className="mobile-user-info">
            <div className="mobile-user-avatar">{getUserInitial()}</div>
            <div className="mobile-user-details">
              <div className="mobile-user-name">{getUserName()}</div>
              <div className="mobile-user-role">{auth.role || 'Member'}</div>
            </div>
            <button className="mobile-logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
        )}

        <div className="mobile-menu-footer">
          <p>© 2024 Forgotten Recipes</p>
          <p>Preserving Sri Lanka's culinary heritage</p>
        </div>
      </div>
    </nav>
  );
}