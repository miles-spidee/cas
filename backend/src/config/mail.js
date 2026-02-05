/**
 * Mail Configuration
 * Configure email service settings
 */

const mail = {
  service: process.env.MAIL_SERVICE || 'gmail',
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT || 587,
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
  from: process.env.MAIL_FROM || 'noreply@classaltersystem.com',
};

module.exports = mail;
