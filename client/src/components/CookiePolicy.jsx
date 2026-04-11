// client/src/components/CookiePolicy.jsx
import React, { useState, useEffect } from 'react';
import './LegalPages.css';

const CookiePolicy = () => {
  const [cookieSettings, setCookieSettings] = useState({
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    const saved = localStorage.getItem('cookieSettings');
    if (saved) {
      setCookieSettings(JSON.parse(saved));
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('cookieSettings', JSON.stringify(cookieSettings));
    alert('Cookie preferences saved!');
  };

  return (
    <div className="legal-container">
      <div className="legal-hero">
        <h1>Cookie Policy</h1>
        <p>Last updated: January 2024</p>
      </div>

      <div className="legal-content">
        <section>
          <h2>What Are Cookies?</h2>
          <p>Cookies are small text files placed on your device to help our website function properly and provide a better user experience.</p>
        </section>

        <section>
          <h2>How We Use Cookies</h2>
          <p>We use cookies for various purposes:</p>
          <ul>
            <li><strong>Essential Cookies:</strong> Required for the website to function</li>
            <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our site</li>
            <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
          </ul>
        </section>

        <section>
          <h2>Manage Cookie Preferences</h2>
          <div className="cookie-settings">
            <div className="cookie-setting">
              <label>
                <input type="checkbox" checked={cookieSettings.necessary} disabled />
                <strong>Necessary Cookies</strong> (Always Active)
              </label>
              <p>Required for basic website functionality. Cannot be disabled.</p>
            </div>

            <div className="cookie-setting">
              <label>
                <input type="checkbox" checked={cookieSettings.functional} onChange={(e) => setCookieSettings({...cookieSettings, functional: e.target.checked})} />
                <strong>Functional Cookies</strong>
              </label>
              <p>Remember your preferences and enhance your experience.</p>
            </div>

            <div className="cookie-setting">
              <label>
                <input type="checkbox" checked={cookieSettings.analytics} onChange={(e) => setCookieSettings({...cookieSettings, analytics: e.target.checked})} />
                <strong>Analytics Cookies</strong>
              </label>
              <p>Help us improve our website by tracking usage patterns.</p>
            </div>

            <div className="cookie-setting">
              <label>
                <input type="checkbox" checked={cookieSettings.marketing} onChange={(e) => setCookieSettings({...cookieSettings, marketing: e.target.checked})} />
                <strong>Marketing Cookies</strong>
              </label>
              <p>Used to show you relevant advertisements.</p>
            </div>

            <button onClick={saveSettings} className="save-btn">Save Preferences</button>
          </div>
        </section>

        <section>
          <h2>Third-Party Cookies</h2>
          <p>Some cookies may be placed by third-party services we use, such as Google Analytics for traffic analysis.</p>
        </section>

        <section>
          <h2>How to Control Cookies</h2>
          <p>You can control cookies through your browser settings. However, disabling certain cookies may affect website functionality.</p>
        </section>

        <section>
          <h2>Contact Us</h2>
          <p>If you have questions about our cookie policy, please contact us at: <a href="mailto:privacy@forgottenrecipes.com">privacy@forgottenrecipes.com</a></p>
        </section>
      </div>
    </div>
  );
};

export default CookiePolicy;