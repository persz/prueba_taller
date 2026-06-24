const path       = require('path');
const dotenv     = require('dotenv');
const nodemailer = require('nodemailer');

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'];
const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
console.warn(`[NODEMAILER] Variables SMTP faltantes: ${missingVars.join(', ')}. El envío de correos estará desactivado.`);
}

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT, 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

transporter.verify((err) => {
  if (err) {
    console.warn('[NODEMAILER]   No se pudo conectar al servidor SMTP:', err.message);
  } else {
    console.log('[NODEMAILER]  Conexión SMTP verificada y lista.');
  }
});

module.exports = transporter;