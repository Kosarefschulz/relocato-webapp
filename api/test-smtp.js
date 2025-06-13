export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Environment check
  const envStatus = {
    SMTP_HOST: {
      exists: !!process.env.SMTP_HOST,
      value: process.env.SMTP_HOST ? process.env.SMTP_HOST.substring(0, 10) + '...' : null
    },
    SMTP_PORT: {
      exists: !!process.env.SMTP_PORT,
      value: process.env.SMTP_PORT
    },
    SMTP_USER: {
      exists: !!process.env.SMTP_USER,
      value: process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 5) + '...' : null
    },
    SMTP_PASS: {
      exists: !!process.env.SMTP_PASS,
      length: process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0
    },
    SMTP_FROM: {
      exists: !!process.env.SMTP_FROM,
      value: process.env.SMTP_FROM
    },
    VERCEL: process.env.VERCEL === '1',
    NODE_ENV: process.env.NODE_ENV
  };

  // Test SMTP connection if requested
  if (req.method === 'POST' && req.body?.testConnection) {
    try {
      const nodemailer = await import('nodemailer');
      
      const transporter = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2'
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000
      });

      await transporter.verify();
      
      res.status(200).json({
        success: true,
        message: 'SMTP connection successful',
        envStatus,
        connectionTest: 'passed'
      });
    } catch (error) {
      res.status(200).json({
        success: false,
        message: 'SMTP connection failed',
        error: {
          message: error.message,
          code: error.code,
          command: error.command
        },
        envStatus,
        connectionTest: 'failed'
      });
    }
  } else {
    // GET request - just show environment status
    res.status(200).json({
      success: true,
      message: 'SMTP configuration status',
      envStatus,
      hint: 'Send POST request with { "testConnection": true } to test SMTP connection'
    });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};