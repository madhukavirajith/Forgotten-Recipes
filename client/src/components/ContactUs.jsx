// client/src/components/ContactUs.jsx
import React, { useState } from 'react';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock, FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaPaperPlane, FaCheckCircle } from 'react-icons/fa';
import './ContactUs.css';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    }, 1000);
  };

  return (
    <div className="contact-container">
      <div className="contact-hero">
        <h1>Contact Us</h1>
        <p>We'd love to hear from you! Get in touch with any questions or feedback.</p>
      </div>

      <div className="contact-grid">
        {/* Contact Info */}
        <div className="contact-info">
          <h2>Get in Touch</h2>
          <p>Have a question about a recipe? Want to share your own culinary story? Reach out to us!</p>
          
          <div className="info-items">
            <div className="info-item">
              <FaEnvelope className="info-icon" />
              <div>
                <h4>Email Us</h4>
                <a href="mailto:hello@forgottenrecipes.com">hello@forgottenrecipes.com</a>
              </div>
            </div>
            
            <div className="info-item">
              <FaPhone className="info-icon" />
              <div>
                <h4>Call Us</h4>
                <a href="tel:+94123456789">+94 12 345 6789</a>
              </div>
            </div>
            
            <div className="info-item">
              <FaMapMarkerAlt className="info-icon" />
              <div>
                <h4>Visit Us</h4>
                <p>Colombo, Sri Lanka</p>
              </div>
            </div>
            
            <div className="info-item">
              <FaClock className="info-icon" />
              <div>
                <h4>Business Hours</h4>
                <p>Monday - Friday: 9am - 6pm</p>
                <p>Saturday: 10am - 4pm</p>
              </div>
            </div>
          </div>

          <div className="social-section">
            <h4>Follow Us</h4>
            <div className="social-links">
              <a href="#"><FaFacebook /></a>
              <a href="#"><FaInstagram /></a>
              <a href="#"><FaTwitter /></a>
              <a href="#"><FaYoutube /></a>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="contact-form-wrapper">
          <h2>Send Us a Message</h2>
          {submitted ? (
            <div className="success-message">
              <FaCheckCircle />
              <h3>Message Sent!</h3>
              <p>Thank you for reaching out. We'll get back to you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <input type="text" name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <input type="email" name="email" placeholder="Your Email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <input type="text" name="subject" placeholder="Subject" value={formData.subject} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <textarea name="message" placeholder="Your Message" rows="5" value={formData.message} onChange={handleChange} required></textarea>
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Sending...' : <><FaPaperPlane /> Send Message</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactUs;