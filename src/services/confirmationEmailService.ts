import { Customer, Quote } from '../types';

export const sendConfirmationEmail = async (
  customer: Customer,
  quote: Quote,
  customerEmail: string
): Promise<boolean> => {
  try {
    console.log('📧 Sende Bestätigungsmail an:', customerEmail || customer.email);
    
    const emailContent = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #8BC34A; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .success-icon { font-size: 48px; margin-bottom: 10px; }
        .details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; text-align: center; }
        .button { display: inline-block; background-color: #8BC34A; color: white !important; text-decoration: none; padding: 12px 24px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="success-icon">✅</div>
            <h1>Vielen Dank für Ihre Bestätigung!</h1>
        </div>
        
        <div class="content">
            <p>Sehr geehrte/r ${customer.name},</p>
            
            <p>wir freuen uns, dass Sie unser Angebot angenommen haben! Ihre Bestätigung wurde erfolgreich registriert.</p>
            
            <div class="details">
                <h3>Ihre Auftragsdetails:</h3>
                <div class="detail-row">
                    <span><strong>Auftragsnummer:</strong></span>
                    <span>${quote.id}</span>
                </div>
                <div class="detail-row">
                    <span><strong>Bestätigt am:</strong></span>
                    <span>${new Date().toLocaleDateString('de-DE', { 
                      weekday: 'long', 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                </div>
                <div class="detail-row">
                    <span><strong>Gesamtpreis:</strong></span>
                    <span style="font-size: 20px; color: #8BC34A; font-weight: bold;">€ ${quote.price.toFixed(2)}</span>
                </div>
                ${customer.movingDate ? `
                <div class="detail-row">
                    <span><strong>Umzugstermin:</strong></span>
                    <span>${new Date(customer.movingDate).toLocaleDateString('de-DE', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}</span>
                </div>
                ` : ''}
            </div>
            
            <h3>Wie geht es weiter?</h3>
            <ol>
                <li><strong>Auftragsbestätigung:</strong> Sie erhalten in Kürze eine detaillierte Auftragsbestätigung per E-Mail.</li>
                <li><strong>Terminabsprache:</strong> Unser Team wird sich bezüglich der genauen Uhrzeiten mit Ihnen in Verbindung setzen.</li>
                <li><strong>Vorbereitung:</strong> Ca. eine Woche vor dem Umzug erhalten Sie eine Checkliste zur optimalen Vorbereitung.</li>
                <li><strong>Umzugstag:</strong> Unser Team erscheint pünktlich zum vereinbarten Termin.</li>
            </ol>
            
            <p style="margin-top: 30px;"><strong>Bei Fragen stehen wir Ihnen jederzeit zur Verfügung:</strong></p>
            <p style="margin-left: 20px;">
                📞 Telefon: (0521) 1200551-0<br>
                ✉️ E-Mail: bielefeld@relocato.de<br>
                🕒 Erreichbar: Mo-Fr 8:00-18:00 Uhr, Sa 9:00-14:00 Uhr
            </p>
            
            <p style="margin-top: 30px;">Mit freundlichen Grüßen<br>
            <strong>Ihr RELOCATO® Team Bielefeld</strong></p>
        </div>
        
        <div class="footer">
            <p>
                RELOCATO® Bielefeld<br>
                Detmolder Str. 234a, 33605 Bielefeld<br>
                Wertvoll Dienstleistungen GmbH | Geschäftsführer: M. Michailowski & M. Knaub<br>
                Amtsgericht Bielefeld HRB 43574 | USt-IdNr.: DE328644143
            </p>
        </div>
    </div>
</body>
</html>
`;

    // Send email via backend
    const API_URL = process.env.REACT_APP_API_URL || 'https://api.ruempel-schmiede.com';
    
    const emailData = {
      to: customerEmail || customer.email,
      subject: `Bestätigung Ihres Umzugsauftrags - ${customer.name}`,
      content: emailContent
    };
    
    const response = await fetch(`${API_URL}/api/send-email`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Origin': window.location.origin
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      throw new Error(`Email service responded with status: ${response.status}`);
    }

    console.log('✅ Bestätigungsmail erfolgreich gesendet');
    return true;
  } catch (error) {
    console.error('❌ Fehler beim Senden der Bestätigungsmail:', error);
    throw error;
  }
};