const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

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

/**
 * Renders an HTML template with the given data.
 * Replaces all occurrences of {{\w+}} with the corresponding data value.
 * @param {string} templatePath The path to the HTML template file.
 * @param {Object} replacements The data to render into the template.
 * @returns {string} The rendered HTML template.
 */
const renderHtml = (templatePath, replacements) => {
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  return templateContent.replace(/{{(\w+)}}/g, (match) => replacements[match]);
};
const templateDir = path.join(__dirname, '..', 'utils');

/**
 * Sends an email with the given data.
 * @param {Object} data The email data object.
 * @returns {Promise<Object>} A promise resolving to an object with the messageId property.
 * @throws {Error} If there is an error sending the email.
 */

const sendEmail = async (data) => {
  try {

    const transporter = createTransporter();
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


/**
 * Sends an email with a rendered HTML template
 * @param {Object} data Email sending data. Must include 'to' & 'subject' properties
 * @param {string} templatePath Path to the HTML template file
 * @param {Object} fillValues Object containing values to fill in the template
 * @returns {Promise<Object>} Promise resolving to an object with the messageId property
 * @throws {Error} If there is an error rendering the email
 */
const sendEmailWithTemplate = async (data, templatePath, fillValues) => {
  try {
  data.html = renderHtml(path.join(templateDir, templatePath), fillValues);
  return sendEmail(data);
  } catch (error) {
    console.error('Error rendering email:', error);
    throw error;
  }
}

module.exports = {
  renderHtml,
  sendEmail,
  sendEmailWithTemplate
};
