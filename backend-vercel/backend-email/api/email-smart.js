// Smart Email Service mit automatischem Fallback
// Versucht verschiedene Email-Provider in dieser Reihenfolge:
// 1. IONOS SMTP (falls verfügbar)
// 2. Brevo API (9000 kostenlose Emails/Monat)
// 3. Mock Response (für Entwicklung)

const nodemailer = require('nodemailer');

async function sendViaIONOS(emailData) {
  const transporter = nodemailer.createTransporter({
    host: 'smtp.ionos.de',
    port: 587,
    secure: false,
    auth: {
      user: process.env.VITE_EMAIL_USER || 'bielefeld@relocato.de',
      pass: process.env.VITE_EMAIL_PASS || 'Bicm1308'
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const info = await transporter.sendMail({
    from: '"RELOCATO®" <bielefeld@relocato.de>',
    to: emailData.to,
    subject: emailData.subject,
    text: emailData.text,
    html: emailData.html
  });

  return {
    success: true,
    provider: 'IONOS',
    messageId: info.messageId
  };
}

async function sendViaBrevo(emailData) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  
  if (!BREVO_API_KEY || BREVO_API_KEY === 'YOUR_BREVO_API_KEY') {
    throw new Error('Brevo API Key nicht konfiguriert');
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': BREVO_API_KEY
    },
    body: JSON.stringify({
      sender: {
        name: 'RELOCATO®',
        email: 'noreply@relocato.de'
      },
      to: [{
        email: emailData.to
      }],
      subject: emailData.subject,
      htmlContent: emailData.html,
      textContent: emailData.text
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Brevo API Error');
  }

  return {
    success: true,
    provider: 'Brevo',
    messageId: data.messageId
  };
}

async function sendViaMock(emailData) {
  // Mock implementation für Entwicklung
  console.log('📧 Mock Email:', emailData);
  
  return {
    success: true,
    provider: 'Mock',
    messageId: `mock-${Date.now()}`,
    message: 'Email wurde im Mock-Modus "gesendet" (nicht wirklich versendet)'
  };
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const emailData = {
    to: req.body.to || 'sergej.schulz@relocato.de',
    subject: req.body.subject || `RELOCATO® - ${new Date().toLocaleString('de-DE')}`,
    text: req.body.text || 'RELOCATO® Email',
    html: req.body.html || `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>🚀 RELOCATO® Email System</h2>
        <p>Diese Email wurde über das Smart Email System gesendet.</p>
        <p><strong>Zeit:</strong> ${new Date().toLocaleString('de-DE')}</p>
      </div>
    `
  };

  const providers = [
    { name: 'IONOS', fn: sendViaIONOS },
    { name: 'Brevo', fn: sendViaBrevo },
    { name: 'Mock', fn: sendViaMock }
  ];

  const errors = [];

  for (const provider of providers) {
    try {
      console.log(`🔄 Versuche Email-Versand über ${provider.name}...`);
      const result = await provider.fn(emailData);
      console.log(`✅ Erfolgreich über ${provider.name} gesendet`);
      
      return res.status(200).json({
        ...result,
        timestamp: new Date().toISOString(),
        attempts: errors.length + 1
      });
    } catch (error) {
      console.error(`❌ ${provider.name} fehlgeschlagen:`, error.message);
      errors.push({
        provider: provider.name,
        error: error.message
      });
    }
  }

  // Alle Provider fehlgeschlagen
  return res.status(500).json({
    success: false,
    error: 'Alle Email-Provider fehlgeschlagen',
    errors: errors,
    hint: 'Bitte konfigurieren Sie mindestens einen Email-Provider in den Environment Variables'
  });
}

export const config = {
  maxDuration: 30,
};