import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // CORS Headers setzen
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Nur POST erlauben
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Debug: Environment variables prüfen
  const envCheck = {
    SMTP_HOST: process.env.SMTP_HOST ? 'Set' : 'Missing',
    SMTP_PORT: process.env.SMTP_PORT ? 'Set' : 'Missing',
    SMTP_USER: process.env.SMTP_USER ? 'Set' : 'Missing',
    SMTP_PASS: process.env.SMTP_PASS ? 'Set' : 'Missing',
    SMTP_FROM: process.env.SMTP_FROM ? 'Set' : 'Missing',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL ? 'Yes' : 'No'
  };
  
  console.log('Environment check:', envCheck);

  // Detaillierte Fehlerprüfung für fehlende Umgebungsvariablen
  const missingVars = [];
  if (!process.env.SMTP_HOST) missingVars.push('SMTP_HOST');
  if (!process.env.SMTP_PORT) missingVars.push('SMTP_PORT');
  if (!process.env.SMTP_USER) missingVars.push('SMTP_USER');
  if (!process.env.SMTP_PASS) missingVars.push('SMTP_PASS');
  
  if (missingVars.length > 0) {
    console.error('Fehlende Umgebungsvariablen:', missingVars);
    res.status(500).json({ 
      success: false, 
      error: 'E-Mail Service nicht konfiguriert',
      details: `Fehlende Umgebungsvariablen: ${missingVars.join(', ')}`,
      envCheck: envCheck
    });
    return;
  }

  try {
    const { to, subject, content, attachments, bcc } = req.body;
    
    if (!to || !subject || !content) {
      res.status(400).json({ 
        success: false, 
        error: 'Fehlende Pflichtfelder: to, subject, content' 
      });
      return;
    }

    // IONOS SMTP Konfiguration mit Vercel-spezifischen Anpassungen
    const SMTP_CONFIG = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465', // true für SSL, false für STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        // Wichtig für Vercel: Strikte TLS-Validierung kann Probleme verursachen
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
      // Vercel-spezifische Timeouts
      connectionTimeout: 10000, // 10 Sekunden
      greetingTimeout: 10000,
      socketTimeout: 10000,
      // Debug-Logging aktivieren
      debug: true,
      logger: true
    };

    console.log('SMTP Config (ohne Passwort):', {
      host: SMTP_CONFIG.host,
      port: SMTP_CONFIG.port,
      secure: SMTP_CONFIG.secure,
      user: SMTP_CONFIG.auth.user,
      hasPassword: !!SMTP_CONFIG.auth.pass
    });

    // Nodemailer Transporter erstellen
    let transporter;
    try {
      transporter = nodemailer.createTransport(SMTP_CONFIG);
      console.log('Transporter erstellt');
    } catch (createError) {
      console.error('Fehler beim Erstellen des Transporters:', createError);
      res.status(500).json({ 
        success: false, 
        error: 'E-Mail Service Initialisierung fehlgeschlagen',
        details: createError.message
      });
      return;
    }

    // Verbindung testen (mit Timeout)
    try {
      console.log('Teste SMTP Verbindung...');
      const verifyPromise = transporter.verify();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Verbindungs-Timeout')), 15000)
      );
      
      await Promise.race([verifyPromise, timeoutPromise]);
      console.log('SMTP Verbindung erfolgreich');
    } catch (verifyError) {
      console.error('SMTP Verbindungsfehler:', {
        message: verifyError.message,
        code: verifyError.code,
        command: verifyError.command,
        response: verifyError.response,
        responseCode: verifyError.responseCode
      });
      
      // Detaillierte Fehlermeldung basierend auf Fehlertyp
      let errorMessage = 'SMTP Verbindung fehlgeschlagen';
      if (verifyError.message.includes('Timeout')) {
        errorMessage = 'SMTP Server Timeout - Server antwortet nicht';
      } else if (verifyError.code === 'EAUTH') {
        errorMessage = 'SMTP Authentifizierung fehlgeschlagen - Benutzername oder Passwort falsch';
      } else if (verifyError.code === 'ECONNECTION') {
        errorMessage = 'Keine Verbindung zum SMTP Server möglich';
      }
      
      res.status(500).json({ 
        success: false, 
        error: errorMessage,
        details: verifyError.message,
        code: verifyError.code
      });
      return;
    }

    // E-Mail-Optionen
    const mailOptions = {
      from: `Relocato Bielefeld <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      text: content.replace(/<[^>]*>/g, ''), // HTML zu Text
      html: content,
      attachments: [],
      // Zusätzliche Header für bessere Zustellbarkeit
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'Relocato Webapp'
      }
    };

    // BCC hinzufügen
    if (bcc) {
      mailOptions.bcc = bcc;
    }

    // Anhänge verarbeiten
    if (attachments && attachments.length > 0) {
      console.log(`Verarbeite ${attachments.length} Anhänge`);
      mailOptions.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        encoding: 'base64'
      }));
    }

    // E-Mail senden mit Retry-Logik
    let info;
    let retries = 2;
    let lastError;
    
    for (let i = 0; i <= retries; i++) {
      try {
        console.log(`E-Mail Versand Versuch ${i + 1}/${retries + 1}`);
        info = await transporter.sendMail(mailOptions);
        console.log('E-Mail erfolgreich gesendet:', {
          messageId: info.messageId,
          response: info.response,
          accepted: info.accepted,
          rejected: info.rejected
        });
        break;
      } catch (sendError) {
        lastError = sendError;
        console.error(`E-Mail Versand Fehler (Versuch ${i + 1}):`, {
          message: sendError.message,
          code: sendError.code,
          command: sendError.command,
          response: sendError.response
        });
        
        if (i < retries) {
          console.log('Warte 2 Sekunden vor erneutem Versuch...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    if (!info) {
      res.status(500).json({
        success: false,
        error: 'E-Mail konnte nicht gesendet werden',
        details: lastError.message,
        code: lastError.code
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });

  } catch (error) {
    console.error('Unerwarteter E-Mail Fehler:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({
      success: false,
      error: 'Unerwarteter Fehler beim E-Mail-Versand',
      details: error.message,
      type: error.name
    });
  }
}

// Vercel-spezifische Konfiguration
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Für E-Mails mit Anhängen
    },
    responseLimit: false,
  },
};