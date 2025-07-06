// Vercel API endpoint for email system testing
// This endpoint can be called directly to test email functionality

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const testResults = {
    timestamp: new Date().toISOString(),
    environment: {
      vercel: !!process.env.VERCEL,
      region: process.env.VERCEL_REGION || 'unknown',
      url: process.env.VERCEL_URL || req.headers.host
    },
    tests: []
  };

  // Test 1: Check environment variables
  testResults.tests.push({
    name: 'Environment Variables',
    status: 'checking',
    checks: {
      IONOS_EMAIL: !!process.env.IONOS_EMAIL,
      IONOS_PASSWORD: !!process.env.IONOS_PASSWORD,
      IONOS_SMTP_HOST: !!process.env.IONOS_SMTP_HOST,
      IONOS_IMAP_HOST: !!process.env.IONOS_IMAP_HOST,
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }
  });

  // Test 2: Test SMTP connection
  if (req.method === 'POST' && req.body.testSMTP) {
    try {
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: process.env.IONOS_SMTP_HOST || 'smtp.ionos.de',
        port: 587,
        secure: false,
        auth: {
          user: process.env.IONOS_EMAIL,
          pass: process.env.IONOS_PASSWORD
        }
      });

      await transporter.verify();
      
      testResults.tests.push({
        name: 'SMTP Connection',
        status: 'success',
        message: 'SMTP server is ready to send emails'
      });
    } catch (error) {
      testResults.tests.push({
        name: 'SMTP Connection',
        status: 'error',
        message: error.message
      });
    }
  }

  // Test 3: Send test email
  if (req.method === 'POST' && req.body.sendTestEmail) {
    try {
      const nodemailer = require('nodemailer');
      const { testEmail = 'test@relocato.de' } = req.body;
      
      const transporter = nodemailer.createTransport({
        host: process.env.IONOS_SMTP_HOST || 'smtp.ionos.de',
        port: 587,
        secure: false,
        auth: {
          user: process.env.IONOS_EMAIL,
          pass: process.env.IONOS_PASSWORD
        }
      });

      const info = await transporter.sendMail({
        from: process.env.IONOS_EMAIL,
        to: testEmail,
        subject: `Test Email from Vercel - ${new Date().toISOString()}`,
        text: 'This is a test email sent from the Vercel email test endpoint.',
        html: `
          <h1>Test Email</h1>
          <p>This is a test email sent from the Vercel email test endpoint.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
          <p>Environment: ${process.env.VERCEL_ENV || 'local'}</p>
        `
      });

      testResults.tests.push({
        name: 'Send Test Email',
        status: 'success',
        message: 'Email sent successfully',
        details: {
          messageId: info.messageId,
          accepted: info.accepted
        }
      });
    } catch (error) {
      testResults.tests.push({
        name: 'Send Test Email',
        status: 'error',
        message: error.message
      });
    }
  }

  // Test 4: Check Supabase connection
  if (req.method === 'POST' && req.body.testSupabase) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      // Try to count emails
      const { count, error } = await supabase
        .from('emails')
        .select('*', { count: 'exact', head: true });

      if (error) {
        testResults.tests.push({
          name: 'Supabase Connection',
          status: 'error',
          message: 'Connected but error querying emails table',
          details: error
        });
      } else {
        testResults.tests.push({
          name: 'Supabase Connection',
          status: 'success',
          message: 'Supabase connected successfully',
          details: { emailCount: count || 0 }
        });
      }
    } catch (error) {
      testResults.tests.push({
        name: 'Supabase Connection',
        status: 'error',
        message: error.message
      });
    }
  }

  // Return results
  res.status(200).json({
    success: true,
    results: testResults,
    availableTests: {
      testSMTP: 'Test SMTP connection',
      sendTestEmail: 'Send a test email',
      testSupabase: 'Test Supabase connection'
    },
    usage: 'POST to this endpoint with { testSMTP: true, sendTestEmail: true, testSupabase: true, testEmail: "your@email.com" }'
  });
}