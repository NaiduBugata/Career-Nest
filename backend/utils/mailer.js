const nodemailer = require('nodemailer');

let transporterPromise = null;

async function getTransporter() {
  if (transporterPromise) return transporterPromise;
  transporterPromise = (async () => {
    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        } : undefined,
      });
      try {
        await transporter.verify();
        console.log('📬 Mailer ready');
      } catch (err) {
        console.warn('⚠️ Mailer verification failed:', err.message);
      }
      return transporter;
    }

    // Fallback to Ethereal for development if no SMTP configured
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('🧪 Using Ethereal test SMTP; emails will generate a preview URL (not delivered).');
    return transporter;
  })();
  return transporterPromise;
}

async function sendCredentialsEmail({ to, organizationName, username, password }) {
  if (!to) throw new Error('Recipient email is required');

  const from = process.env.SMTP_FROM || 'no-reply@careernest.local';

  const html = `
    <div style="font-family:Arial, Helvetica, sans-serif; line-height:1.6; color:#222">
      <h2 style="color:#0c10cf;">Career Nest – Organization Approved</h2>
      <p>Hi ${organizationName || 'Organization'},</p>
      <p>Your organization has been approved. Here are your login credentials:</p>
      <ul>
        <li><strong>Username:</strong> <code>${username}</code></li>
        <li><strong>Password:</strong> <code>${password}</code></li>
      </ul>
      <p>Please change your password after first login.</p>
      <p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/Role" 
           style="background:#0c10cf;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">
          Go to Login
        </a>
      </p>
      <p style="font-size:12px;color:#666">If you did not request this, ignore this message.</p>
    </div>
  `;

  const text = `Career Nest – Organization Approved\n\n` +
    `Username: ${username}\nPassword: ${password}\n\n` +
    `Login: ${(process.env.FRONTEND_URL || 'http://localhost:5173') + '/Role'}\n` +
    `Please change your password after first login.`;

  const transporter = await getTransporter();
  const info = await transporter.sendMail({ from, to, subject: 'Your Career Nest Credentials', text, html });
  const previewUrl = nodemailer.getTestMessageUrl(info) || null;
  if (previewUrl) {
    console.log('🔗 Email preview URL:', previewUrl);
  }
  return { info, previewUrl };
}

module.exports = { sendCredentialsEmail };
