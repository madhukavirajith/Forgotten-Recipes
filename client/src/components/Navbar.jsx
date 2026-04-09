// client/src/components/Navbar.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

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

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [auth, setAuth] = useState(readAuth());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close mobile menu when window resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update auth state when route changes
  useEffect(() => {
    setAuth(readAuth());
    // Close mobile menu on route change
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Listen for storage events (logout from other tabs)
  useEffect(() => {
    const onStorage = () => setAuth(readAuth());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setAuth({ token: null, role: null });
    setMobileMenuOpen(false);
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    // Prevent body scroll when menu is open
    if (!mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  };

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
    document.body.style.overflow = 'unset';
  };

  // Decide the dashboard path per role
  let dashboardPath = null;
  if (auth.role === 'admin') dashboardPath = '/admin';
  else if (auth.role === 'headchef') dashboardPath = '/headchef';
  else if (auth.role === 'dietician') dashboardPath = '/dietician';
  else if (auth.role === 'visitor') dashboardPath = '/visitor';

  // Check if link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-left" onClick={() => navigate('/')}>
        <img src="/logo.jpg" alt="Forgotten Recipes Logo" className="navbar-logo" />
        <span className="navbar-brand">FORGOTTEN RECIPES</span>
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

      {/* Navigation Links */}
      <ul className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <li>
          <Link 
            to="/" 
            onClick={handleLinkClick}
            className={isActive('/') ? 'active' : ''}
          >
            Home
          </Link>
        </li>
        <li>
          <Link 
            to="/blog" 
            onClick={handleLinkClick}
            className={isActive('/blog') ? 'active' : ''}
          >
            Blog
          </Link>
        </li>
        <li>
          <Link 
            to="/calendar" 
            onClick={handleLinkClick}
            className={isActive('/calendar') ? 'active' : ''}
          >
            Calendar
          </Link>
        </li>
        <li>
          <Link 
            to="/recipes" 
            onClick={handleLinkClick}
            className={isActive('/recipes') ? 'active' : ''}
          >
            Recipes
          </Link>
        </li>
        <li>
          <Link 
            to="/about" 
            onClick={handleLinkClick}
            className={isActive('/about') ? 'active' : ''}
          >
            About
          </Link>
        </li>
        <li>
          <Link 
            to="/stories" 
            onClick={handleLinkClick}
            className={isActive('/stories') ? 'active' : ''}
          >
            Cultural Stories
          </Link>
        </li>

        {auth.token ? (
          <>
            {dashboardPath && (
              <li>
                <Link 
                  to={dashboardPath} 
                  onClick={handleLinkClick}
                  className={isActive(dashboardPath) ? 'active' : ''}
                >
                  Dashboard
                </Link>
              </li>
            )}
            <li>
              <button className="logout-btn" onClick={logout}>
                Logout
              </button>
            </li>
          </>
        ) : (
          <li>
            <Link 
              to="/login" 
              onClick={handleLinkClick}
              className={isActive('/login') ? 'active' : ''}
            >
              Login/Register
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}