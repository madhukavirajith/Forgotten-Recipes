import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './LoginRegisterForm.css';

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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Frontend validation
    if (isRegister) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        setLoading(false);
        return;
      }
    }

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
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (isRegister) {
        alert('Registration successful! You can now login.');
        toggleForm();
      } else {
        // Login successful
        const { _id, name, email, role, token } = res.data;

        // Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ 
          id: _id, 
          name, 
          email, 
          role
        }));

        // Navigate based on role
        switch (role.toLowerCase()) {
          case 'admin':
            navigate('/admin');
            break;
          case 'headchef':
            navigate('/headchef');
            break;
          case 'dietician':
            navigate('/dietician');
            break;
          case 'visitor':
          default:
            navigate('/visitor');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      
      if (err.response) {
        setError(err.response.data?.msg || 'Server error occurred');
      } else if (err.request) {
        setError('Unable to connect to server. Please check if the server is running.');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2 className="form-title">{isRegister ? 'Register as Visitor' : 'Login'}</h2>

      <form onSubmit={handleSubmit} className="auth-form">
        {isRegister && (
          <>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <input
              type="date"
              name="dob"
              placeholder="Date of Birth"
              value={formData.dob}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <textarea
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
              required
              disabled={loading}
              rows="3"
            />
          </>
        )}

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={loading}
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={loading}
          minLength="6"
        />

        {isRegister && (
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
            minLength="6"
          />
        )}

        {error && <p className="error-msg">{error}</p>}

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Please wait...' : (isRegister ? 'Register' : 'Login')}
        </button>
      </form>

      <div className="form-footer">
        <p onClick={!loading ? toggleForm : undefined} style={{ cursor: loading ? 'not-allowed' : 'pointer' }}>
          {isRegister
            ? 'Already have an account? Login'
            : 'Don\'t have an account? Register as Visitor'}
        </p>
      </div>
    </div>
  );
};

export default LoginRegisterForm;




