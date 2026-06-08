const nodemailer = require('nodemailer');

let transporter;

// Create SMTP transporter if config is present, fallback to log-only transport
const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT || 587;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || 'Forgotten Recipes <noreply@forgottenrecipes.com>';

if (host && user && pass) {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: Number(port) === 465,
    auth: { user, pass }
  });
  console.log('✉️ Email service initialized with SMTP');
} else {
  // Mock transporter for development/testing
  transporter = {
    sendMail: async (options) => {
      console.log('---------------- MOCK EMAIL DISPATCH ----------------');
      console.log(`From:    ${options.from || from}`);
      console.log(`To:      ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`HTML:\n${options.html}`);
      console.log('-----------------------------------------------------');
      return { messageId: 'mock-id-' + Math.random().toString(36).substr(2, 9) };
    }
  };
  console.log('✉️ Email service initialized in MOCK mode (no SMTP configs found)');
}

const sendMail = async ({ to, subject, html }) => {
  try {
    return await transporter.sendMail({
      from,
      to,
      subject,
      html
    });
  } catch (err) {
    console.error('Failed to send email:', err);
    // Do not throw, keep notification creation robust
    return null;
  }
};

// HTML Email template wrappers
const sendWelcomeEmail = async (userEmail, userName) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #D2691E;">Welcome to Forgotten Recipes, ${userName}!</h2>
      <p>We are thrilled to welcome you to our community dedicated to preserving and reviving Sri Lanka's ancient flavors.</p>
      <p>You can now explore, cook, review, and even submit your own heritage recipes or western twists.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #718096;">Forgotten Recipes • Preserving Heritage, One Recipe at a Time.</p>
    </div>
  `;
  return sendMail({ to: userEmail, subject: 'Welcome to Forgotten Recipes!', html });
};

const sendRecipeStatusEmail = async (userEmail, userName, recipeName, isApproved, details = '') => {
  const status = isApproved ? 'Approved' : 'Rejected';
  const color = isApproved ? '#10b981' : '#ef4444';
  const actionText = isApproved 
    ? `<p>Your recipe is now live and can be viewed by the community.</p>`
    : `<p>Please review our guidelines and comments to revise and resubmit your recipe.</p>`;
    
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: ${color};">Recipe Submission: ${status}</h2>
      <p>Hello ${userName},</p>
      <p>Your recipe <strong>"${recipeName}"</strong> has been reviewed by our Head Chef and its status is now <strong>${status}</strong>.</p>
      ${actionText}
      ${details ? `<p><strong>Chef Comments:</strong> ${details}</p>` : ''}
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #718096;">Forgotten Recipes • Preserving Heritage, One Recipe at a Time.</p>
    </div>
  `;
  return sendMail({ to: userEmail, subject: `Recipe Submission Update: ${recipeName} (${status})`, html });
};

const sendNutritionAddedEmail = async (userEmail, userName, recipeName) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #3b82f6;">Nutrition Information Added</h2>
      <p>Hello ${userName},</p>
      <p>Great news! Our dietician has reviewed and added comprehensive nutritional information to your recipe <strong>"${recipeName}"</strong>.</p>
      <p>You can now view the breakdown of calories, macros, and micro-nutrients on the recipe details page.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #718096;">Forgotten Recipes • Preserving Heritage, One Recipe at a Time.</p>
    </div>
  `;
  return sendMail({ to: userEmail, subject: `Nutrition Added: ${recipeName}`, html });
};

const sendFeedbackUpdateEmail = async (userEmail, userName, feedbackMessage, status) => {
  const statusLabel = status === 'closed' ? 'Resolved' : 'In Progress';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #D2691E;">Feedback Update: ${statusLabel}</h2>
      <p>Hello ${userName},</p>
      <p>Your support ticket/feedback has been updated by our administrator.</p>
      <blockquote style="background: #f7fafc; padding: 15px; border-left: 4px solid #D2691E; margin: 15px 0;">
        "${feedbackMessage}"
      </blockquote>
      <p>Current Status: <strong>${statusLabel}</strong></p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #718096;">Forgotten Recipes • Preserving Heritage, One Recipe at a Time.</p>
    </div>
  `;
  return sendMail({ to: userEmail, subject: `Feedback Ticket Update: ${statusLabel}`, html });
};

module.exports = {
  sendWelcomeEmail,
  sendRecipeStatusEmail,
  sendNutritionAddedEmail,
  sendFeedbackUpdateEmail
};
