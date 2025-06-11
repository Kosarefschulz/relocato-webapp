import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Button,
  TextField,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Euro as EuroIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { Invoice } from '../types';
import { googleSheetsPublicService as googleSheetsService } from '../services/googleSheetsPublic';
import { sendEmailViaSMTP } from '../services/smtpEmailService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const InvoicesList: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const invoices = await googleSheetsService.getInvoices();
        setInvoices(invoices);
      } catch (error) {
        console.error('Fehler beim Laden der Rechnungen:', error);
      }
    };
    
    loadInvoices();
  }, []);

  const filteredInvoices = invoices.filter(invoice => 
    invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoiceNumber.includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'sent': return 'warning';
      case 'overdue': return 'error';
      case 'cancelled': return 'default';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Bezahlt';
      case 'sent': return 'Offen';
      case 'overdue': return 'Überfällig';
      case 'cancelled': return 'Storniert';
      case 'draft': return 'Entwurf';
      default: return status;
    }
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    try {
      const updatedInvoice = { ...invoice, status: 'paid' as const, paidDate: new Date() };
      
      // TODO: Update invoice status in Google Sheets
      console.log('Rechnung als bezahlt markieren:', invoice.invoiceNumber);
      
      // Refresh invoices
      const invoices = await googleSheetsService.getInvoices();
      setInvoices(invoices);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Rechnung:', error);
    }
  };

  const generatePaymentReminderEmail = (invoice: Invoice): { subject: string; content: string } => {
    const daysOverdue = Math.abs(getDaysUntilDue(invoice.dueDate));
    const formattedDueDate = invoice.dueDate.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const subject = `Zahlungserinnerung: Rechnung ${invoice.invoiceNumber}`;
    
    const content = `
Sehr geehrte Damen und Herren,

wir möchten Sie höflich daran erinnern, dass die folgende Rechnung noch offen ist:

Rechnungsnummer: ${invoice.invoiceNumber}
Rechnungsdatum: ${invoice.createdAt.toLocaleDateString('de-DE')}
Fälligkeitsdatum: ${formattedDueDate}
Gesamtbetrag: € ${invoice.totalPrice.toFixed(2).replace('.', ',')}

Die Rechnung ist seit ${daysOverdue} Tagen überfällig.

Bitte überweisen Sie den offenen Betrag auf folgendes Konto:

Relocato Umzugsservice GmbH
IBAN: DE12 3456 7890 1234 5678 90
BIC: GENODED1XXX
Verwendungszweck: ${invoice.invoiceNumber}

Falls Sie bereits bezahlt haben, betrachten Sie diese Erinnerung bitte als gegenstandslos.

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
Ihr Relocato Team

--
Relocato Umzugsservice GmbH
Tel: 030 123456789
Email: rechnung@relocato.de
    `;
    
    return { subject, content };
  };

  const handleSendReminder = async (invoice: Invoice) => {
    try {
      setSendingReminder(invoice.id);
      
      // Lade Kundendaten
      const customers = await googleSheetsService.getCustomers();
      const customer = customers.find(c => c.id === invoice.customerId);
      
      if (!customer || !customer.email) {
        alert('Kunde oder E-Mail-Adresse nicht gefunden');
        return;
      }
      
      // Generiere Zahlungserinnerung
      const { subject, content } = generatePaymentReminderEmail(invoice);
      
      // Generiere PDF der Rechnung als Anhang
      const htmlContent = generateInvoiceHTML(invoice);
      const pdfBlob = await generatePDFFromHTML(htmlContent);
      
      // Sende E-Mail mit Rechnung als Anhang
      const success = await sendEmailViaSMTP({
        to: customer.email,
        subject: subject,
        content: content,
        attachments: [{
          filename: `Rechnung_${invoice.invoiceNumber}.pdf`,
          content: pdfBlob
        }]
      });
      
      if (success) {
        alert('Zahlungserinnerung wurde erfolgreich versendet!');
      } else {
        alert('Fehler beim Versenden der Zahlungserinnerung. Bitte versuchen Sie es erneut.');
      }
      
    } catch (error) {
      console.error('Fehler beim Senden der Zahlungserinnerung:', error);
      alert('Fehler beim Versenden der Zahlungserinnerung. Bitte versuchen Sie es erneut.');
    } finally {
      setSendingReminder(null);
    }
  };

  const generatePDFFromHTML = async (htmlContent: string): Promise<Blob> => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '750px';
    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 750,
        height: tempDiv.scrollHeight
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png', 1.0);
      const imgWidth = 190;
      const pageHeight = 270;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 15;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      return pdf.output('blob');
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  const generateInvoiceHTML = (invoice: Invoice): string => {
    const formattedDate = invoice.createdAt.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const formattedDueDate = invoice.dueDate.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const netAmount = invoice.price;
    const taxAmount = invoice.taxAmount || 0;
    const totalAmount = invoice.totalPrice;

    return `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            background: white;
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
          }
          .company-info {
            text-align: right;
          }
          .company-info h1 {
            color: #2E7D32;
            margin: 0;
            font-size: 28px;
          }
          .invoice-title {
            font-size: 24px;
            font-weight: bold;
            margin: 30px 0;
          }
          .invoice-details {
            margin-bottom: 30px;
          }
          .invoice-details table {
            width: 100%;
          }
          .invoice-details td {
            padding: 5px 0;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
          }
          .items-table th {
            background: #f5f5f5;
            padding: 10px;
            text-align: left;
            border-bottom: 2px solid #ddd;
          }
          .items-table td {
            padding: 10px;
            border-bottom: 1px solid #eee;
          }
          .totals {
            margin-left: auto;
            width: 300px;
            margin-top: 30px;
          }
          .totals table {
            width: 100%;
          }
          .totals td {
            padding: 8px;
          }
          .totals .total-row {
            font-weight: bold;
            font-size: 18px;
            border-top: 2px solid #333;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          .payment-info {
            margin-top: 40px;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 5px;
          }
          .payment-info h3 {
            margin-top: 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h2>${invoice.customerName}</h2>
          </div>
          <div class="company-info">
            <h1>Relocato</h1>
            <p>Umzugsservice GmbH<br>
            Musterstraße 123<br>
            12345 Berlin<br>
            Tel: 030 123456789<br>
            Email: rechnung@relocato.de</p>
          </div>
        </div>

        <div class="invoice-title">Rechnung</div>

        <div class="invoice-details">
          <table>
            <tr>
              <td><strong>Rechnungsnummer:</strong></td>
              <td>${invoice.invoiceNumber}</td>
            </tr>
            <tr>
              <td><strong>Rechnungsdatum:</strong></td>
              <td>${formattedDate}</td>
            </tr>
            <tr>
              <td><strong>Fälligkeitsdatum:</strong></td>
              <td>${formattedDueDate}</td>
            </tr>
            ${invoice.quoteId ? `
            <tr>
              <td><strong>Angebotsnummer:</strong></td>
              <td>${invoice.quoteId}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Beschreibung</th>
              <th style="text-align: center;">Menge</th>
              <th style="text-align: right;">Einzelpreis</th>
              <th style="text-align: right;">Gesamtpreis</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.description}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">€ ${item.unitPrice.toFixed(2).replace('.', ',')}</td>
                <td style="text-align: right;">€ ${item.totalPrice.toFixed(2).replace('.', ',')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr>
              <td>Nettobetrag:</td>
              <td style="text-align: right;">€ ${netAmount.toFixed(2).replace('.', ',')}</td>
            </tr>
            <tr>
              <td>MwSt. (19%):</td>
              <td style="text-align: right;">€ ${taxAmount.toFixed(2).replace('.', ',')}</td>
            </tr>
            <tr class="total-row">
              <td>Gesamtbetrag:</td>
              <td style="text-align: right;">€ ${totalAmount.toFixed(2).replace('.', ',')}</td>
            </tr>
          </table>
        </div>

        <div class="payment-info">
          <h3>Zahlungsinformationen</h3>
          <p>Bitte überweisen Sie den Gesamtbetrag bis zum ${formattedDueDate} auf folgendes Konto:</p>
          <p><strong>Relocato Umzugsservice GmbH</strong><br>
          IBAN: DE12 3456 7890 1234 5678 90<br>
          BIC: GENODED1XXX<br>
          Verwendungszweck: ${invoice.invoiceNumber}</p>
        </div>

        <div class="footer">
          <p>Relocato Umzugsservice GmbH | Geschäftsführer: Max Mustermann<br>
          Amtsgericht Berlin HRB 12345 | USt-IdNr.: DE123456789<br>
          Bankverbindung: Volksbank Berlin | IBAN: DE12 3456 7890 1234 5678 90</p>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      setLoadingPdf(invoice.id);
      
      // Generiere HTML für Rechnung
      const htmlContent = generateInvoiceHTML(invoice);
      
      // Konvertiere zu PDF
      const pdfBlob = await generatePDFFromHTML(htmlContent);
      
      // Download
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Rechnung_${invoice.invoiceNumber}_${invoice.customerName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Fehler beim PDF-Download:', error);
    } finally {
      setLoadingPdf(null);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" gutterBottom>
          Rechnungen
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Alle Rechnungen im Überblick
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          label="Rechnung suchen"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <Paper elevation={3}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {filteredInvoices.length} Rechnung{filteredInvoices.length !== 1 ? 'en' : ''} gefunden
          </Typography>
        </Box>
        
        <List>
          {filteredInvoices.map((invoice, index) => (
            <React.Fragment key={invoice.id}>
              {index > 0 && <Divider />}
              <ListItem>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6">
                        {invoice.customerName}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        € {invoice.totalPrice.toFixed(2).replace('.', ',')}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Rechnung #{invoice.invoiceNumber}
                          </Typography>
                          {invoice.id.startsWith('local_') && (
                            <Chip 
                              label="Lokal" 
                              color="warning" 
                              size="small"
                            />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip 
                            label={getStatusText(invoice.status)} 
                            color={getStatusColor(invoice.status) as any}
                            size="small"
                          />
                          {invoice.status === 'sent' && getDaysUntilDue(invoice.dueDate) <= 0 && (
                            <Chip 
                              label={`${Math.abs(getDaysUntilDue(invoice.dueDate))} Tage überfällig`} 
                              color="error"
                              size="small"
                            />
                          )}
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          Erstellt: {invoice.createdAt.toLocaleDateString('de-DE')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Fällig: {invoice.dueDate.toLocaleDateString('de-DE')}
                        </Typography>
                        {invoice.paidDate && (
                          <Typography variant="body2" color="text.secondary">
                            Bezahlt: {invoice.paidDate.toLocaleDateString('de-DE')}
                          </Typography>
                        )}
                      </Box>
                      
                      {invoice.items && invoice.items.length > 0 && (
                        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                          {invoice.items.map(item => item.description).join(', ')}
                        </Typography>
                      )}
                      
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={loadingPdf === invoice.id ? <CircularProgress size={16} /> : <DownloadIcon />}
                          onClick={() => handleDownloadPDF(invoice)}
                          disabled={loadingPdf === invoice.id}
                        >
                          {loadingPdf === invoice.id ? 'Erstelle PDF...' : 'PDF'}
                        </Button>
                        {invoice.status === 'sent' && (
                          <>
                            <Button
                              size="small"
                              startIcon={sendingReminder === invoice.id ? <CircularProgress size={16} /> : <EmailIcon />}
                              onClick={() => handleSendReminder(invoice)}
                              color="warning"
                              disabled={sendingReminder === invoice.id}
                            >
                              {sendingReminder === invoice.id ? 'Sende...' : 'Zahlungserinnerung'}
                            </Button>
                            <Button
                              size="small"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => handleMarkAsPaid(invoice)}
                              color="success"
                            >
                              Als bezahlt markieren
                            </Button>
                          </>
                        )}
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>

        {filteredInvoices.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {searchTerm ? 'Keine Rechnungen gefunden' : 'Noch keine Rechnungen erstellt'}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default InvoicesList;