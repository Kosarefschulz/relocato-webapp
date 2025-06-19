// Brevo (Sendinblue) Email API - 9000 kostenlose Emails/Monat
// Kein Kreditkarte erforderlich!

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

  try {
    const { to, subject, htmlContent, textContent } = req.body;

    // Brevo API Configuration
    // HINWEIS: Sie müssen sich bei https://www.brevo.com registrieren
    // und einen API Key erstellen (kostenlos, keine Kreditkarte)
    const BREVO_API_KEY = process.env.BREVO_API_KEY || 'YOUR_BREVO_API_KEY';
    
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
          email: 'noreply@relocato.de' // Diese Email muss in Brevo verifiziert werden
        },
        to: [{
          email: to || 'sergej.schulz@relocato.de',
          name: 'RELOCATO Kunde'
        }],
        subject: subject || `RELOCATO® - ${new Date().toLocaleString('de-DE')}`,
        htmlContent: htmlContent || `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>🚀 RELOCATO® Email über Brevo</h2>
            <p>Diese Email wurde erfolgreich über die Brevo API gesendet!</p>
            <p>Brevo bietet 9000 kostenlose Emails pro Monat.</p>
          </div>
        `,
        textContent: textContent || 'RELOCATO® Email über Brevo API'
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Email erfolgreich über Brevo gesendet');
      return res.status(200).json({
        success: true,
        service: 'Brevo',
        messageId: data.messageId,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(data.message || 'Brevo API Error');
    }

  } catch (error) {
    console.error('❌ Brevo Email Fehler:', error);
    
    return res.status(500).json({
      success: false,
      service: 'Brevo',
      error: error.message,
      hint: 'Bitte registrieren Sie sich kostenlos bei https://www.brevo.com und fügen Sie den API Key als BREVO_API_KEY zu den Vercel Environment Variables hinzu.'
    });
  }
}

export const config = {
  maxDuration: 10,
};