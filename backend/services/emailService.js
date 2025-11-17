const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send password reset code email
const sendPasswordResetEmail = async (email, code, firstName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"SkiSwap" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Code - SkiSwap',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #2c3e50;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              color: #2c3e50;
              text-align: center;
              padding: 20px;
              background-color: #ecf0f1;
              border-radius: 5px;
              letter-spacing: 5px;
              margin: 20px 0;
            }
            .warning {
              color: #e74c3c;
              font-weight: bold;
              text-align: center;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #7f8c8d;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              <p>We received a request to reset your password for your SkiSwap account.</p>
              <p>Your password reset code is:</p>
              <div class="code">${code}</div>
              <p>Enter this code on the password reset page to continue.</p>
              <p class="warning">⚠️ This code will expire in 5 minutes.</p>
              <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
              <p>Best regards,<br>The SkiSwap Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail
};
