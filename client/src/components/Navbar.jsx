
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

  
  useEffect(() => {
    setAuth(readAuth());
  }, [location.pathname]);

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
    navigate('/'); 
  };

  // Decide the dashboard path per role
  let dashboardPath = null;
  if (auth.role === 'admin') dashboardPath = '/admin';
  else if (auth.role === 'headchef') dashboardPath = '/headchef';
  else if (auth.role === 'dietician') dashboardPath = '/dietician';
  else if (auth.role === 'visitor') dashboardPath = '/visitor';

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src="/logo.jpg" alt="Logo" className="navbar-logo" />
        <span className="navbar-brand">FORGOTTEN RECIPES</span>
      </div>

      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/blog">Blog</Link></li>
        <li><Link to="/calendar">Calendar</Link></li>
        <li><Link to="/recipes">Recipes</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/stories">Cultural Stories</Link></li>

        
        {auth.token ? (
          <>
            {dashboardPath && (
              <li><Link to={dashboardPath}>Dashboard</Link></li>
            )}
            <li>
              <button
                className="logout-btn"
                onClick={logout}
               
                style={{
                  background: 'transparent',
                  border: '1px solid #6f330d',
                  color: '#6f330d',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </li>
          </>
        ) : (
          <li><Link to="/login">Login/Register</Link></li>
        )}
      </ul>
    </nav>
  );
}





