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
      {/* Decorative Wave Divider */}
      <div className="footer-wave">
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
        </svg>
      </div>

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
              <div className="footer-brand">
                <span className="brand-main">FORGOTTEN</span>
                <span className="brand-sub">RECIPES</span>
              </div>
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
            <ul className="footer-links-list">
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
            <ul className="footer-links-list">
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
          <div className="footer-column footer-newsletter-column">
            <h3 className="footer-column-title">Newsletter</h3>
            <p className="footer-newsletter-text">
              Subscribe to get weekly traditional recipes and cultural stories delivered to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="footer-newsletter-form">
              <div className="footer-newsletter-input-group">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="footer-newsletter-input"
                />
                <button type="submit" className="footer-newsletter-btn">
                  Join the Heritage
                </button>
              </div>
            </form>
            {emailSubmitted && (
              <div className="newsletter-success">
                Thank you for subscribing!
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
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="container">
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

    </footer>
  );
};

export default Footer;