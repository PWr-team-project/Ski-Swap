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

const renderHtml = (templatePath, data) => {
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  return templateContent.replace(/{{(\w+)}}/g, (match, key) => data[key]);
};
const templateDir = path.join(__dirname, '..', 'utils');

const sendEmail = async (data) => {
  try {

    let transporter = createTransporter();
    const { 
      to, 
      subject, 
      text = null, 
      html, 
      attachments = null, 
      cc = [], 
      bcc = [],
      replyTo = null
    } = data;

    if (!to || !subject) {
      throw error;
    }

    const mailOptions = {
      from: `SkiSwap <${process.env.GOOGLE_APP_LOGIN}>`,
      to: to,
      subject: subject,
      text: text,
      html: html,
      attachments: attachments,
      cc: cc,
      bcc: bcc,
      replyTo: replyTo
    };

    const info = await transporter.sendMail(mailOptions);

    return { messageId: info.messageId };

  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Send password reset code email
const sendPasswordResetEmail = async (email, code, firstName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"SkiSwap" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Code - SkiSwap',
      html: renderHtml(path.join(templateDir, 'emailPasswordReset.html'), { code, firstName })
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
  sendEmail,
  sendPasswordResetEmail
};
