// client/src/components/Navbar.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

// ===== Utility Functions =====
function decodeRoleFromJWT(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''));
    return payload.role || payload.userRole || payload?.user?.role || null;
  } catch {
    return null;
  }
}

function readAuth() {
  const token = localStorage.getItem('token') || null;

  const storedRole =
    localStorage.getItem('role') ||
    (() => {
      try {
        const u = JSON.parse(localStorage.getItem('user') || 'null');
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
  { path: '/', label: 'Home', icon: '🏠', exact: true },
  { path: '/blog', label: 'Blog', icon: '📝' },
  { path: '/calendar', label: 'Calendar', icon: '📅' },
  { path: '/recipes', label: 'Recipes', icon: '🍛' },
  { path: '/about', label: 'About', icon: '📖' },
  { path: '/stories', label: 'Cultural Stories', icon: '📚' },
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
  const [notifications, setNotifications] = useState([
    { id: 1, read: false, message: 'New recipe approved!', time: '5 min ago' },
    { id: 2, read: false, message: 'Comment on your recipe', time: '1 hour ago' },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  // ===== Effects =====
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

  // ===== Handlers =====
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setAuth({ token: null, role: null });
    setMobileMenuOpen(false);
    setDropdownOpen(false);
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

  const markNotificationRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    );
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

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
      const user = JSON.parse(localStorage.getItem('user') || '{}');
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
                <span className="nav-icon">{link.icon}</span>
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
            🔍
          </button>

          {/* Notifications (only for logged in users) */}
          {auth.token && (
            <div className="notifications-menu">
              <button 
                className={`notifications-btn ${unreadCount > 0 ? 'has-notifications' : ''}`}
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
              >
                🔔
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>
              
              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      <button className="mark-all-read">Mark all read</button>
                    )}
                  </div>
                  <div className="notifications-list">
                    {notifications.length > 0 ? (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`notification-item ${!notif.read ? 'unread' : ''}`}
                          onClick={() => markNotificationRead(notif.id)}
                        >
                          <div className="notification-message">{notif.message}</div>
                          <div className="notification-time">{notif.time}</div>
                        </div>
                      ))
                    ) : (
                      <div className="no-notifications">No notifications</div>
                    )}
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
                <span className="dropdown-arrow">▼</span>
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
                        <span className="dropdown-icon">📊</span>
                        Dashboard
                      </Link>
                      <div className="dropdown-divider"></div>
                    </>
                  )}
                  <Link to="/profile" className="dropdown-item" onClick={handleLinkClick}>
                    <span className="dropdown-icon">👤</span>
                    My Profile
                  </Link>
                  <Link to="/settings" className="dropdown-item" onClick={handleLinkClick}>
                    <span className="dropdown-icon">⚙️</span>
                    Settings
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout-item" onClick={logout}>
                    <span className="dropdown-icon">🚪</span>
                    Logout
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
          <button type="button" className="search-close" onClick={() => setSearchOpen(false)}>✕</button>
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
          <button className="mobile-close" onClick={toggleMobileMenu}>✕</button>
        </div>

        <div className="mobile-menu-search">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit">🔍</button>
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
                <span className="mobile-nav-icon">{link.icon}</span>
                <span className="mobile-nav-label">{link.label}</span>
              </Link>
            </li>
          ))}
          
          {auth.token && dashboardPath && (
            <li>
              <Link to={dashboardPath} className="mobile-nav-link" onClick={handleLinkClick}>
                <span className="mobile-nav-icon">📊</span>
                Dashboard
              </Link>
            </li>
          )}
          
          {auth.token && (
            <>
              <li>
                <Link to="/profile" className="mobile-nav-link" onClick={handleLinkClick}>
                  <span className="mobile-nav-icon">👤</span>
                  Profile
                </Link>
              </li>
              <li>
                <Link to="/settings" className="mobile-nav-link" onClick={handleLinkClick}>
                  <span className="mobile-nav-icon">⚙️</span>
                  Settings
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