// client/src/components/TermsOfService.jsx
import React from 'react';
import './LegalPages.css';

const TermsOfService = () => {
  return (
    <div className="legal-container">
      <div className="legal-hero">
        <h1>Terms of Service</h1>
        <p>Last updated: January 2024</p>
      </div>

      <div className="legal-content">
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using Forgotten Recipes, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.</p>
        </section>

        <section>
          <h2>2. User Accounts</h2>
          <p>To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
        </section>

        <section>
          <h2>3. User Content</h2>
          <p>You retain ownership of any recipes, comments, or other content you submit. By submitting content, you grant us a worldwide license to use, display, and distribute your content on our platform.</p>
        </section>

        <section>
          <h2>4. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Submit false or misleading information</li>
            <li>Impersonate another person</li>
            <li>Upload malicious code or viruses</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>
        </section>

        <section>
          <h2>5. Recipe Approval</h2>
          <p>All submitted recipes are reviewed by our head chefs before publication. We reserve the right to reject or remove any content that violates our guidelines.</p>
        </section>

        <section>
          <h2>6. Intellectual Property</h2>
          <p>The content, features, and functionality of Forgotten Recipes are owned by us and are protected by copyright, trademark, and other intellectual property laws.</p>
        </section>

        <section>
          <h2>7. Termination</h2>
          <p>We may terminate or suspend your account immediately, without prior notice, for conduct that violates these Terms or is harmful to other users.</p>
        </section>

        <section>
          <h2>8. Disclaimer of Warranties</h2>
          <p>The service is provided "as is" without warranties of any kind. We do not guarantee the accuracy or reliability of any recipe or nutritional information.</p>
        </section>

        <section>
          <h2>9. Limitation of Liability</h2>
          <p>To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
        </section>

        <section>
          <h2>10. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
        </section>

        <section>
          <h2>11. Contact Information</h2>
          <p>For questions about these Terms, please contact us at: <a href="mailto:legal@forgottenrecipes.com">legal@forgottenrecipes.com</a></p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;