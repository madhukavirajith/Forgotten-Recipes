// client/src/components/Footer.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaFacebookF, 
  FaInstagram, 
  FaTwitter, 
  FaYoutube, 
  FaPinterest, 
  FaTiktok,
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt,
  FaArrowUp,
  FaHeart,
  FaUtensils,
  FaBook,
  FaCalendarAlt,
  FaNewspaper,
  FaInfoCircle,
  FaScroll
} from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const location = useLocation();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Newsletter subscription
  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email) {
      // Add your newsletter API call here
      console.log('Newsletter subscription:', email);
      setEmailSubmitted(true);
      setEmail('');
      setTimeout(() => setEmailSubmitted(false), 3000);
    }
  };

  // Footer navigation links
  const quickLinks = [
    { name: 'Home', path: '/', icon: <FaUtensils /> },
    { name: 'Recipes', path: '/recipes', icon: <FaBook /> },
    { name: 'Blog', path: '/blog', icon: <FaNewspaper /> },
    { name: 'Calendar', path: '/calendar', icon: <FaCalendarAlt /> },
    { name: 'About', path: '/about', icon: <FaInfoCircle /> },
    { name: 'Cultural Stories', path: '/stories', icon: <FaScroll /> },
  ];

  const supportLinks = [
    { name: 'Contact Us', path: '/contact' },
    { name: 'FAQs', path: '/faqs' },
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Terms of Service', path: '/terms' },
    { name: 'Cookie Policy', path: '/cookies' },
    { name: 'Accessibility', path: '/accessibility' },
  ];

  const socialLinks = [
    { name: 'Facebook', icon: <FaFacebookF />, url: 'https://facebook.com/forgottenrecipes', color: '#1877f2' },
    { name: 'Instagram', icon: <FaInstagram />, url: 'https://instagram.com/forgottenrecipes', color: '#e4405f' },
    { name: 'Twitter', icon: <FaTwitter />, url: 'https://twitter.com/forgottenrecipes', color: '#1da1f2' },
    { name: 'YouTube', icon: <FaYoutube />, url: 'https://youtube.com/forgottenrecipes', color: '#ff0000' },
    { name: 'Pinterest', icon: <FaPinterest />, url: 'https://pinterest.com/forgottenrecipes', color: '#bd081c' },
    { name: 'TikTok', icon: <FaTiktok />, url: 'https://tiktok.com/@forgottenrecipes', color: '#000000' },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      {/* Scroll to Top Button */}
      <button 
        className={`scroll-to-top ${showScrollTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <FaArrowUp />
      </button>

      {/* Main Footer Content */}
      <div className="footer-main">
        <div className="footer-container">
          
          {/* Column 1 - Brand Section */}
          <div className="footer-column brand-column">
            <div className="footer-logo">
              <img src="/logo.jpg" alt="Forgotten Recipes" className="footer-logo-img" />
              <h2 className="footer-brand">
                <span className="brand-main">FORGOTTEN</span>
                <span className="brand-sub">RECIPES</span>
              </h2>
            </div>
            <p className="footer-description">
              Bringing back traditional Sri Lankan tastes with a modern twist. 
              Preserving ancient flavors and cultural heritage for future generations.
            </p>
            <div className="footer-contact">
              <div className="contact-item">
                <FaEnvelope />
                <a href="mailto:info@forgottenrecipes.com">info@forgottenrecipes.com</a>
              </div>
              <div className="contact-item">
                <FaPhone />
                <a href="tel:+94123456789">+94 12 345 6789</a>
              </div>
              <div className="contact-item">
                <FaMapMarkerAlt />
                <span>Colombo, Sri Lanka</span>
              </div>
            </div>
          </div>

          {/* Column 2 - Quick Links */}
          <div className="footer-column">
            <h3 className="footer-column-title">Quick Links</h3>
            <ul className="footer-links">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="footer-link">
                    <span className="link-icon">{link.icon}</span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Support */}
          <div className="footer-column">
            <h3 className="footer-column-title">Support</h3>
            <ul className="footer-links">
              {supportLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="footer-link">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 - Newsletter */}
          <div className="footer-column newsletter-column">
            <h3 className="footer-column-title">Newsletter</h3>
            <p className="newsletter-text">
              Subscribe to get weekly traditional recipes and cultural stories delivered to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
              <div className="newsletter-input-group">
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="newsletter-input"
                />
                <button type="submit" className="newsletter-btn">
                  Subscribe
                </button>
              </div>
            </form>
            {emailSubmitted && (
              <div className="newsletter-success">
                ✅ Thank you for subscribing!
              </div>
            )}
            <p className="newsletter-note">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Social Media Bar */}
      <div className="footer-social-bar">
        <div className="footer-container">
          <div className="social-wrapper">
            <div className="social-links">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label={social.name}
                  style={{ '--social-color': social.color }}
                >
                  {social.icon}
                </a>
              ))}
            </div>
            <div className="footer-credit">
              <p>
                Made with <FaHeart className="heart-icon" /> in Sri Lanka
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-container">
          <div className="bottom-wrapper">
            <p className="copyright">
              © {currentYear} Forgotten Recipes. All rights reserved.
            </p>
            <div className="bottom-links">
              <Link to="/privacy">Privacy Policy</Link>
              <span className="separator">|</span>
              <Link to="/terms">Terms of Service</Link>
              <span className="separator">|</span>
              <Link to="/sitemap">Sitemap</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="footer-decoration">
        <div className="decoration-spice spice-1">🌶️</div>
        <div className="decoration-spice spice-2">🌿</div>
        <div className="decoration-spice spice-3">🍛</div>
        <div className="decoration-spice spice-4">🥥</div>
      </div>
    </footer>
  );
};

export default Footer;