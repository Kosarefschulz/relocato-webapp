import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, FormControl, InputLabel, Select, MenuItem, Typography, Box, Chip, IconButton, Tooltip, Alert, CircularProgress, Paper, Divider, List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction } from '@mui/material';
import Grid from './GridCompat';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Receipt as InvoiceIcon,
  Article as TemplateIcon,
  Close as CloseIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import emailTemplateService, { EmailTemplate } from '../services/emailTemplateService';
import { sendEmailViaSMTP } from '../services/smtpEmailService';
import emailHistoryService from '../services/emailHistoryService';
import { Customer, Quote, Invoice } from '../types';
import { generatePDF, generateInvoicePDF } from '../services/pdfService';

interface EmailComposerProps {
  open: boolean;
  onClose: () => void;
  customer: Customer;
  quote?: Quote;
  invoice?: Invoice;
  onEmailSent?: () => void;
}

interface EmailAttachment {
  type: 'quote_pdf' | 'invoice_pdf' | 'custom';
  filename: string;
  content?: Blob;
}

const EmailComposer: React.FC<EmailComposerProps> = ({
  open,
  onClose,
  customer,
  quote,
  invoice,
  onEmailSent
}) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  useEffect(() => {
    // Auto-select template based on context
    if (templates.length > 0 && !selectedTemplateId) {
      if (quote) {
        const quoteTemplate = templates.find(t => t.category === 'quote' && t.isActive);
        if (quoteTemplate) {
          setSelectedTemplateId(quoteTemplate.id!);
          applyTemplate(quoteTemplate);
        }
      } else if (invoice) {
        const invoiceTemplate = templates.find(t => t.category === 'invoice' && t.isActive);
        if (invoiceTemplate) {
          setSelectedTemplateId(invoiceTemplate.id!);
          applyTemplate(invoiceTemplate);
        }
      }
    }
  }, [templates, quote, invoice]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await emailTemplateService.getAllTemplates();
      const activeTemplates = data.filter(t => t.isActive);
      setTemplates(activeTemplates);
    } catch (error) {
      console.error('Fehler beim Laden der E-Mail-Vorlagen:', error);
      setError('Fehler beim Laden der Vorlagen');
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (template: EmailTemplate) => {
    const variables = prepareVariables();
    const processedSubject = emailTemplateService.replaceVariables(template.subject, variables);
    const processedContent = emailTemplateService.replaceVariables(template.content, variables);
    
    setSubject(processedSubject);
    setContent(processedContent);

    // Auto-add attachments based on template
    if (template.attachmentTypes) {
      const newAttachments: EmailAttachment[] = [];
      
      if (template.attachmentTypes.includes('quote_pdf') && quote) {
        newAttachments.push({
          type: 'quote_pdf',
          filename: `Angebot_${customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
        });
      }
      
      if (template.attachmentTypes.includes('invoice_pdf') && invoice) {
        newAttachments.push({
          type: 'invoice_pdf',
          filename: `Rechnung_${invoice.invoiceNumber}_${customer.name.replace(/\s+/g, '_')}.pdf`
        });
      }
      
      setAttachments(newAttachments);
    }
  };

  const prepareVariables = (): Record<string, string> => {
    const variables: Record<string, string> = {
      customerName: customer.name || '',
      customerEmail: customer.email || '',
      customerPhone: customer.phone || '',
      fromAddress: `${customer.address?.street || ''}, ${customer.address?.city || ''}`,
      toAddress: `${customer.movingToAddress?.street || ''}, ${customer.movingToAddress?.city || ''}`,
      moveDate: customer.movingDate ? new Date(customer.movingDate).toLocaleDateString('de-DE') : '',
      employeeName: 'Thomas Schmidt' // TODO: Get from current user
    };

    if (quote) {
      variables.quoteNumber = quote.id || '';
      variables.quotePrice = `€ ${quote.price.toFixed(2)}`;
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 14);
      variables.quoteValidUntil = validUntil.toLocaleDateString('de-DE');
    }

    if (invoice) {
      variables.invoiceNumber = invoice.invoiceNumber || '';
      variables.quotePrice = `€ ${invoice.totalPrice.toFixed(2)}`;
    }

    return variables;
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      applyTemplate(template);
    }
  };

  const handleSendEmail = async () => {
    if (!subject || !content) {
      setError('Bitte füllen Sie Betreff und Inhalt aus');
      return;
    }

    setSending(true);
    setError('');

    try {
      // Generate PDFs for attachments
      const emailAttachments = await Promise.all(
        attachments.map(async (att) => {
          let blob: Blob;
          
          if (att.type === 'quote_pdf' && quote) {
            blob = await generatePDF(customer, quote);
          } else if (att.type === 'invoice_pdf' && invoice) {
            blob = await generateInvoicePDF(customer, invoice);
          } else if (att.content) {
            blob = att.content;
          } else {
            throw new Error('Anhang konnte nicht generiert werden');
          }

          return {
            filename: att.filename,
            content: blob
          };
        })
      );

      // Send email
      const emailData = {
        to: customer.email!,
        subject,
        content,
        attachments: emailAttachments,
        customerId: customer.id,
        customerName: customer.name,
        templateType: templates.find(t => t.id === selectedTemplateId)?.category || 'custom',
        quoteId: quote?.id
      };

      await sendEmailViaSMTP(emailData);

      // Save to history
      await emailHistoryService.saveEmailRecord({
        customerId: customer.id!,
        customerName: customer.name,
        to: customer.email!,
        subject,
        content,
        templateType: emailData.templateType,
        sentAt: new Date(),
        status: 'sent',
        attachments: emailAttachments.map(a => a.filename)
      });

      setSuccess('E-Mail erfolgreich versendet');
      setTimeout(() => {
        onClose();
        if (onEmailSent) onEmailSent();
      }, 1500);
    } catch (error: any) {
      console.error('Fehler beim Senden der E-Mail:', error);
      setError(error.message || 'Fehler beim Senden der E-Mail');
      
      // Save failed attempt to history
      await emailHistoryService.saveEmailRecord({
        customerId: customer.id!,
        customerName: customer.name,
        to: customer.email!,
        subject,
        content,
        templateType: 'custom',
        sentAt: new Date(),
        status: 'failed',
        error: error.message
      });
    } finally {
      setSending(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const addCustomAttachment = () => {
    // TODO: Implement file upload
    console.log('File upload noch nicht implementiert');
  };

  if (!customer.email) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>E-Mail senden</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Für diesen Kunden ist keine E-Mail-Adresse hinterlegt.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Schließen</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">E-Mail an {customer.name}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="An"
              value={customer.email}
              disabled
              size="small"
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>E-Mail Vorlage</InputLabel>
              <Select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                label="E-Mail Vorlage"
                disabled={loading}
              >
                <MenuItem value="">
                  <em>Keine Vorlage</em>
                </MenuItem>
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    <Box display="flex" alignItems="center" width="100%">
                      <TemplateIcon sx={{ mr: 1, fontSize: 20 }} />
                      <Typography variant="body2">{template.name}</Typography>
                      <Chip 
                        label={template.category} 
                        size="small" 
                        sx={{ ml: 'auto' }}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Betreff"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              size="small"
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nachricht"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              multiline
              rows={10}
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Anhänge
              </Typography>
              <List dense>
                {attachments.map((attachment, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {attachment.type === 'quote_pdf' ? <DescriptionIcon /> : <InvoiceIcon />}
                    </ListItemIcon>
                    <ListItemText primary={attachment.filename} />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" size="small" onClick={() => removeAttachment(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              
              <Box mt={1}>
                {quote && !attachments.find(a => a.type === 'quote_pdf') && (
                  <Button
                    size="small"
                    startIcon={<DescriptionIcon />}
                    onClick={() => setAttachments([...attachments, {
                      type: 'quote_pdf',
                      filename: `Angebot_${customer.name.replace(/\s+/g, '_')}.pdf`
                    }])}
                  >
                    Angebot anhängen
                  </Button>
                )}
                {invoice && !attachments.find(a => a.type === 'invoice_pdf') && (
                  <Button
                    size="small"
                    startIcon={<InvoiceIcon />}
                    onClick={() => setAttachments([...attachments, {
                      type: 'invoice_pdf',
                      filename: `Rechnung_${invoice.invoiceNumber}.pdf`
                    }])}
                    sx={{ ml: 1 }}
                  >
                    Rechnung anhängen
                  </Button>
                )}
                <Tooltip title="Datei-Upload noch nicht implementiert">
                  <span>
                    <Button
                      size="small"
                      startIcon={<AttachFileIcon />}
                      onClick={addCustomAttachment}
                      disabled
                      sx={{ ml: 1 }}
                    >
                      Datei anhängen
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button
          onClick={() => setShowPreview(!showPreview)}
          startIcon={<PreviewIcon />}
        >
          Vorschau
        </Button>
        <Button
          onClick={handleSendEmail}
          variant="contained"
          startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
          disabled={sending || !subject || !content}
        >
          {sending ? 'Wird gesendet...' : 'Senden'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailComposer;