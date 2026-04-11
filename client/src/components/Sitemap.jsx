// client/src/components/Sitemap.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaUtensils, FaBook, FaCalendarAlt, FaNewspaper, FaInfoCircle, FaScroll, FaEnvelope, FaQuestionCircle, FaShieldAlt, FaCookie, FaUniversalAccess, FaSitemap } from 'react-icons/fa';
import './Sitemap.css';

const Sitemap = () => {
  const sections = [
    {
      title: "Main Pages",
      icon: <FaSitemap />,
      links: [
        { name: "Home", path: "/" },
        { name: "Recipes", path: "/recipes" },
        { name: "Blog", path: "/blog" },
        { name: "Calendar", path: "/calendar" },
        { name: "About", path: "/about" },
        { name: "Cultural Stories", path: "/stories" },
      ]
    },
    {
      title: "Account",
      icon: <FaInfoCircle />,
      links: [
        { name: "Login", path: "/login" },
        { name: "Register", path: "/login?register=true" },
      ]
    },
    {
      title: "Tools",
      icon: <FaUtensils />,
      links: [
        { name: "Western Twist Tool", path: "/twist-tool" },
        { name: "Measurement Converter", path: "/convert" },
        { name: "Chat", path: "/chat" },
      ]
    },
    {
      title: "Support",
      icon: <FaEnvelope />,
      links: [
        { name: "Contact Us", path: "/contact" },
        { name: "FAQs", path: "/faqs" },
      ]
    },
    {
      title: "Legal",
      icon: <FaShieldAlt />,
      links: [
        { name: "Privacy Policy", path: "/privacy" },
        { name: "Terms of Service", path: "/terms" },
        { name: "Cookie Policy", path: "/cookies" },
        { name: "Accessibility", path: "/accessibility" },
      ]
    }
  ];

  return (
    <div className="sitemap-container">
      <div className="sitemap-hero">
        <h1>Site Map</h1>
        <p>Navigate through all pages of Forgotten Recipes</p>
      </div>

      <div className="sitemap-grid">
        {sections.map((section, index) => (
          <div key={index} className="sitemap-section">
            <h2>
              <span className="section-icon">{section.icon}</span>
              {section.title}
            </h2>
            <ul>
              {section.links.map((link, linkIndex) => (
                <li key={linkIndex}>
                  <Link to={link.path}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="sitemap-footer">
        <p>Can't find what you're looking for? <Link to="/contact">Contact Us</Link></p>
      </div>
    </div>
  );
};

export default Sitemap;