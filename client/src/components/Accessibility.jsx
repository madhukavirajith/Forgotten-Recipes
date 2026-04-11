// client/src/components/Accessibility.jsx
import React from 'react';
import './LegalPages.css';

const Accessibility = () => {
  return (
    <div className="legal-container">
      <div className="legal-hero">
        <h1>Accessibility Statement</h1>
        <p>Committed to making our website accessible to everyone</p>
      </div>

      <div className="legal-content">
        <section>
          <h2>Our Commitment</h2>
          <p>Forgotten Recipes is committed to ensuring digital accessibility for people with disabilities. We strive to provide an accessible experience for all users, regardless of technology or ability.</p>
        </section>

        <section>
          <h2>Accessibility Features</h2>
          <p>Our website includes the following accessibility features:</p>
          <ul>
            <li>Keyboard navigation support</li>
            <li>Screen reader compatibility</li>
            <li>High contrast color options</li>
            <li>Responsive design for zoom functionality</li>
            <li>Alternative text for images</li>
            <li>Clear heading structure</li>
          </ul>
        </section>

        <section>
          <h2>Standards Compliance</h2>
          <p>We strive to comply with WCAG 2.1 Level AA guidelines. Our team regularly tests and updates the website to maintain accessibility standards.</p>
        </section>

        <section>
          <h2>Keyboard Navigation</h2>
          <p>You can navigate our website using the Tab key to move between interactive elements. Focus indicators are visible on all interactive elements.</p>
        </section>

        <section>
          <h2>Screen Reader Support</h2>
          <p>Our website is compatible with popular screen readers including NVDA, JAWS, and VoiceOver. We use semantic HTML to ensure proper interpretation by assistive technologies.</p>
        </section>

        <section>
          <h2>Adjusting Display Settings</h2>
          <p>You can adjust your browser settings to:</p>
          <ul>
            <li>Zoom in up to 200% without loss of functionality</li>
            <li>Change font sizes</li>
            <li>Use high contrast mode</li>
            <li>Disable animations (if you prefer reduced motion)</li>
          </ul>
        </section>

        <section>
          <h2>Ongoing Efforts</h2>
          <p>We continuously work to improve our website's accessibility. Our team undergoes regular accessibility training and we conduct periodic audits.</p>
        </section>

        <section>
          <h2>Feedback and Assistance</h2>
          <p>If you experience any accessibility barriers or need assistance accessing any content, please contact us:</p>
          <ul>
            <li>Email: <a href="mailto:accessibility@forgottenrecipes.com">accessibility@forgottenrecipes.com</a></li>
            <li>Phone: +94 12 345 6789</li>
          </ul>
        </section>

        <section>
          <h2>Third-Party Content</h2>
          <p>While we strive for accessibility across our entire website, some third-party content may not be fully accessible. We work with our partners to improve accessibility over time.</p>
        </section>

        <section>
          <h2>Last Updated</h2>
          <p>This accessibility statement was last updated in January 2024. We review and update our accessibility practices regularly.</p>
        </section>
      </div>
    </div>
  );
};

export default Accessibility;