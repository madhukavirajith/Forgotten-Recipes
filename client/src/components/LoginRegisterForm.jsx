// client/src/components/LoginRegisterForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './LoginRegisterForm.css';

// Import icons
import { 
  FaEnvelope, 
  FaLock, 
  FaUser, 
  FaPhone, 
  FaCalendarAlt, 
  FaMapMarkerAlt,
  FaEye, 
  FaEyeSlash,
  FaArrowRight,
  FaGoogle,
  FaFacebook,
  FaApple,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner,
  FaArrowLeft
} from 'react-icons/fa';

const LoginRegisterForm = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dob: '',
    address: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [touchedFields, setTouchedFields] = useState({});
  
  const navigate = useNavigate();
  const emailInputRef = useRef(null);

  // Check if user was previously logged in
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  // Password strength checker
  useEffect(() => {
    if (!isRegister) return;
    
    const password = formData.password;
    let strength = 0;
    
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    setPasswordStrength(strength);
  }, [formData.password, isRegister]);

  const toggleForm = () => {
    setIsRegister(!isRegister);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      dob: '',
      address: ''
    });
    setError('');
    setSuccess('');
    setTouchedFields({});
    setPasswordStrength(0);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleBlur = (fieldName) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  const validateForm = () => {
    if (isRegister) {
      if (!formData.name.trim()) {
        setError('Full name is required');
        return false;
      }
      
      if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        setError('Please enter a valid email address');
        return false;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return false;
      }
      
      if (!formData.phone) {
        setError('Phone number is required');
        return false;
      }
      
      if (!formData.dob) {
        setError('Date of birth is required');
        return false;
      }
    } else {
      if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        setError('Please enter a valid email address');
        return false;
      }
      
      if (!formData.password) {
        setError('Password is required');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setError('');
    setSuccess('');
    setLoading(true);

    const url = `${process.env.REACT_APP_API_URL}/api/users/${isRegister ? 'register' : 'login'}`;
    const payload = isRegister ? {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      dob: formData.dob,
      address: formData.address
    } : {
      email: formData.email,
      password: formData.password
    };

    try {
      const res = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (isRegister) {
        setSuccess('Registration successful! You can now login.');
        setTimeout(() => {
          toggleForm();
          setSuccess('');
        }, 2000);
      } else {
        // Remember email if checked
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        const { _id, name, email, role, token } = res.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ 
          id: _id, 
          name, 
          email, 
          role
        }));

        // Navigate based on role
        const roleRoutes = {
          admin: '/admin',
          headchef: '/headchef',
          dietician: '/dietician',
          visitor: '/visitor'
        };
        
        navigate(roleRoutes[role.toLowerCase()] || '/visitor');
      }
    } catch (err) {
      console.error('Auth error:', err);
      
      if (err.response) {
        setError(err.response.data?.msg || 'Authentication failed');
      } else if (err.request) {
        setError('Unable to connect to server. Please check your connection.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    // Implement social login here
    alert(`${provider} login coming soon!`);
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return 'Very Weak';
    if (passwordStrength === 1) return 'Weak';
    if (passwordStrength === 2) return 'Fair';
    if (passwordStrength === 3) return 'Good';
    if (passwordStrength === 4) return 'Strong';
    return 'Very Strong';
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return '#ef4444';
    if (passwordStrength === 2) return '#f59e0b';
    if (passwordStrength === 3) return '#eab308';
    if (passwordStrength >= 4) return '#10b981';
    return '#6b7280';
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        {/* Back Button */}
        <button className="auth-back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>

        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">🍛</div>
          <h2 className="auth-title">{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="auth-subtitle">
            {isRegister 
              ? 'Join our community of food lovers' 
              : 'Login to continue your culinary journey'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <>
              <div className="input-group">
                <div className="input-icon">
                  <FaUser />
                </div>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={() => handleBlur('name')}
                  required
                  disabled={loading}
                  className={touchedFields.name && !formData.name ? 'error' : ''}
                />
                {touchedFields.name && !formData.name && (
                  <div className="input-error-icon">
                    <FaExclamationCircle />
                  </div>
                )}
              </div>

              <div className="input-group">
                <div className="input-icon">
                  <FaPhone />
                </div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={() => handleBlur('phone')}
                  required
                  disabled={loading}
                />
              </div>

              <div className="input-group">
                <div className="input-icon">
                  <FaCalendarAlt />
                </div>
                <input
                  type="date"
                  name="dob"
                  placeholder="Date of Birth"
                  value={formData.dob}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="input-group textarea-group">
                <div className="input-icon">
                  <FaMapMarkerAlt />
                </div>
                <textarea
                  name="address"
                  placeholder="Address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  rows="3"
                />
              </div>
            </>
          )}

          <div className="input-group">
            <div className="input-icon">
              <FaEnvelope />
            </div>
            <input
              ref={emailInputRef}
              name="email"
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => handleBlur('email')}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <div className="input-icon">
              <FaLock />
            </div>
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              onBlur={() => handleBlur('password')}
              required
              disabled={loading}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex="-1"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {isRegister && (
            <>
              <div className="password-strength">
                <div className="strength-bar-container">
                  <div 
                    className="strength-bar" 
                    style={{ 
                      width: `${(passwordStrength / 5) * 100}%`,
                      backgroundColor: getPasswordStrengthColor()
                    }}
                  />
                </div>
                <span className="strength-text" style={{ color: getPasswordStrengthColor() }}>
                  {getPasswordStrengthText()}
                </span>
              </div>

              <div className="input-group">
                <div className="input-icon">
                  <FaLock />
                </div>
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </>
          )}

          {!isRegister && (
            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot Password?
              </Link>
            </div>
          )}

          {error && (
            <div className="alert-message error">
              <FaExclamationCircle />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert-message success">
              <FaCheckCircle />
              <span>{success}</span>
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <>
                <FaSpinner className="spinning" />
                {isRegister ? 'Creating Account...' : 'Logging in...'}
              </>
            ) : (
              <>
                {isRegister ? 'Create Account' : 'Login'}
                <FaArrowRight />
              </>
            )}
          </button>
        </form>

        {/* Social Login */}
        <div className="social-section">
          <div className="divider">
            <span>or continue with</span>
          </div>
          <div className="social-buttons">
            <button onClick={() => handleSocialLogin('Google')} className="social-btn google">
              <FaGoogle /> Google
            </button>
            <button onClick={() => handleSocialLogin('Facebook')} className="social-btn facebook">
              <FaFacebook /> Facebook
            </button>
            <button onClick={() => handleSocialLogin('Apple')} className="social-btn apple">
              <FaApple /> Apple
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <p>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            <button onClick={toggleForm} className="toggle-btn" disabled={loading}>
              {isRegister ? 'Login' : 'Register as Visitor'}
            </button>
          </p>
        </div>

        {/* Terms */}
        {isRegister && (
          <p className="terms-text">
            By registering, you agree to our 
            <Link to="/terms"> Terms of Service</Link> and 
            <Link to="/privacy"> Privacy Policy</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginRegisterForm;