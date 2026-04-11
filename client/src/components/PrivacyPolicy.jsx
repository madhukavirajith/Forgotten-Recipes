// client/src/components/PrivacyPolicy.jsx
import React from 'react';
import './LegalPages.css';

const PrivacyPolicy = () => {
  return (
    <div className="legal-container">
      <div className="legal-hero">
        <h1>Privacy Policy</h1>
        <p>Last updated: January 2024</p>
      </div>

      <div className="legal-content">
        <section>
          <h2>1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you create an account, submit a recipe, or contact us. This may include:</p>
          <ul>
            <li>Name and email address</li>
            <li>Profile information</li>
            <li>Recipes and comments you submit</li>
            <li>Communication preferences</li>
          </ul>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Process your recipe submissions and comments</li>
            <li>Send you technical notices and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Send you newsletters and marketing communications (with your consent)</li>
          </ul>
        </section>

        <section>
          <h2>3. Sharing of Information</h2>
          <p>We do not share your personal information with third parties except:</p>
          <ul>
            <li>With your consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and prevent fraud</li>
            <li>With service providers who assist our operations</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Security</h2>
          <p>We take reasonable measures to protect your personal information from unauthorized access, alteration, or destruction. However, no internet transmission is completely secure.</p>
        </section>

        <section>
          <h2>5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Opt out of marketing communications</li>
          </ul>
        </section>

        <section>
          <h2>6. Cookies</h2>
          <p>We use cookies to enhance your experience on our site. You can set your browser to refuse cookies, but some features may not function properly.</p>
        </section>

        <section>
          <h2>7. Children's Privacy</h2>
          <p>Our service is not directed to children under 13. We do not knowingly collect personal information from children under 13.</p>
        </section>

        <section>
          <h2>8. Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>
        </section>

        <section>
          <h2>9. Contact Us</h2>
          <p>If you have questions about this privacy policy, please contact us at: <a href="mailto:privacy@forgottenrecipes.com">privacy@forgottenrecipes.com</a></p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;