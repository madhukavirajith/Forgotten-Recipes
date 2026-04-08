import React from 'react';
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <h2 className="footer-title">Forgotten Recipes</h2>
        <p className="footer-tagline">Bringing back traditional tastes with a modern twist.</p>

        <div className="footer-links">
          <a href="/about">About</a>
          <a href="/recipes">Recipes</a>
          <a href="/blog">Blog</a>
          <a href="/contact">Contact</a>
        </div>

        <div className="footer-socials">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><FaFacebookF /></a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Forgotten Recipes. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
