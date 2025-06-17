import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Save as SaveIcon,
  FormatBold as FormatBoldIcon,
  FormatItalic as FormatItalicIcon,
  FormatUnderlined as FormatUnderlinedIcon,
  FormatListBulleted as FormatListBulletedIcon,
  FormatListNumbered as FormatListNumberedIcon,
} from '@mui/icons-material';
import { emailClientService, SendEmailData } from '../services/emailClientService';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Customer } from '../types';

interface EmailComposeProps {
  open: boolean;
  onClose: () => void;
  onSent?: () => void;
  replyTo?: {
    from: string;
    subject: string;
    body: string;
    messageId?: string;
  };
  forwardEmail?: {
    from: string;
    to: string;
    subject: string;
    body: string;
    date: Date;
  };
  recipientEmail?: string;
  recipientName?: string;
  defaultTemplate?: string;
}

const EmailCompose: React.FC<EmailComposeProps> = ({
  open,
  onClose,
  onSent,
  replyTo,
  forwardEmail,
  recipientEmail,
  recipientName,
  defaultTemplate
}) => {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  const emailTemplates = [
    {
      id: 'quote',
      name: 'Angebot',
      subject: 'Ihr Umzugsangebot von Relocato',
      body: `
        <p>Sehr geehrte/r {name},</p>
        <p>vielen Dank für Ihre Anfrage. Gerne senden wir Ihnen unser Angebot für Ihren geplanten Umzug.</p>
        <p>Die Details finden Sie im angehängten PDF-Dokument.</p>
        <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
        <p>Mit freundlichen Grüßen<br>
        Ihr Relocato Team</p>
      `
    },
    {
      id: 'confirmation',
      name: 'Bestätigung',
      subject: 'Auftragsbestätigung für Ihren Umzug',
      body: `
        <p>Sehr geehrte/r {name},</p>
        <p>wir bestätigen hiermit Ihren Umzugsauftrag.</p>
        <p><strong>Umzugstermin:</strong> {date}<br>
        <strong>Uhrzeit:</strong> {time}</p>
        <p>Unser Team wird pünktlich bei Ihnen sein.</p>
        <p>Mit freundlichen Grüßen<br>
        Ihr Relocato Team</p>
      `
    },
    {
      id: 'reminder',
      name: 'Erinnerung',
      subject: 'Erinnerung: Ihr Umzugstermin',
      body: `
        <p>Sehr geehrte/r {name},</p>
        <p>wir möchten Sie an Ihren bevorstehenden Umzugstermin erinnern:</p>
        <p><strong>Datum:</strong> {date}<br>
        <strong>Uhrzeit:</strong> {time}</p>
        <p>Bitte stellen Sie sicher, dass alle Vorbereitungen getroffen sind.</p>
        <p>Mit freundlichen Grüßen<br>
        Ihr Relocato Team</p>
      `
    }
  ];

  useEffect(() => {
    if (open) {
      loadCustomers();
      
      // Set initial values
      if (recipientEmail) setTo(recipientEmail);
      if (defaultTemplate) setSelectedTemplate(defaultTemplate);
      
      if (replyTo) {
        setTo(replyTo.from);
        setSubject(`Re: ${replyTo.subject.replace(/^Re:\s*/i, '')}`);
        setBody(`
          <br><br>
          <hr>
          <p>Am ${new Date().toLocaleDateString('de-DE')} schrieb ${replyTo.from}:</p>
          <blockquote>${replyTo.body}</blockquote>
        `);
      } else if (forwardEmail) {
        setSubject(`Fwd: ${forwardEmail.subject.replace(/^Fwd:\s*/i, '')}`);
        setBody(`
          <br><br>
          ---------- Weitergeleitete Nachricht ----------<br>
          Von: ${forwardEmail.from}<br>
          An: ${forwardEmail.to}<br>
          Datum: ${forwardEmail.date.toLocaleString('de-DE')}<br>
          Betreff: ${forwardEmail.subject}<br><br>
          ${forwardEmail.body}
        `);
      }
    }
  }, [open, recipientEmail, recipientName, defaultTemplate, replyTo, forwardEmail]);

  const loadCustomers = async () => {
    try {
      const customersCollection = collection(db, 'customers');
      const customersSnapshot = await getDocs(customersCollection);
      const customersList: Customer[] = [];
      
      customersSnapshot.forEach((doc) => {
        const data = doc.data();
        customersList.push({
          id: doc.id,
          ...data,
        } as Customer);
      });
      
      setCustomers(customersList);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      let templateBody = template.body;
      
      // Replace placeholders
      if (recipientName) {
        templateBody = templateBody.replace(/{name}/g, recipientName);
      }
      templateBody = templateBody.replace(/{date}/g, new Date().toLocaleDateString('de-DE'));
      templateBody = templateBody.replace(/{time}/g, '08:00 Uhr');
      
      setBody(templateBody);
    }
  };

  const handleSend = async () => {
    if (!to || !subject || !body) {
      setError('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const emailData: SendEmailData = {
        to,
        subject,
        html: body,
        cc: cc || undefined,
        bcc: bcc || undefined,
        replyTo: replyTo?.messageId,
      };

      await emailClientService.sendEmail(emailData);
      
      if (onSent) onSent();
      handleClose();
    } catch (error: any) {
      console.error('Error sending email:', error);
      setError(error.message || 'Fehler beim Senden der E-Mail');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setTo('');
    setCc('');
    setBcc('');
    setSubject('');
    setBody('');
    setSelectedTemplate('');
    setError(null);
    setAttachments([]);
    onClose();
  };

  const handleFileAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachments(prev => [...prev, ...Array.from(files)]);
    }
  };

  const formatText = (command: string) => {
    document.execCommand(command, false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Neue E-Mail</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Autocomplete
            freeSolo
            options={customers.map(c => ({
              label: `${c.name} <${c.email}>`,
              value: c.email
            }))}
            value={to}
            onChange={(_, newValue) => {
              if (typeof newValue === 'string') {
                setTo(newValue);
              } else if (newValue) {
                setTo(newValue.value);
              }
            }}
            onInputChange={(_, newValue) => setTo(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="An *"
                fullWidth
                variant="outlined"
              />
            )}
          />
          
          <TextField
            label="CC"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            fullWidth
            variant="outlined"
          />
          
          <TextField
            label="BCC"
            value={bcc}
            onChange={(e) => setBcc(e.target.value)}
            fullWidth
            variant="outlined"
          />
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="Betreff *"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              fullWidth
              variant="outlined"
            />
            
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Vorlage</InputLabel>
              <Select
                value={selectedTemplate}
                onChange={(e) => {
                  setSelectedTemplate(e.target.value);
                  handleTemplateSelect(e.target.value);
                }}
                label="Vorlage"
              >
                <MenuItem value="">Keine Vorlage</MenuItem>
                {emailTemplates.map(template => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, borderBottom: 1, borderColor: 'divider', pb: 1 }}>
              <IconButton size="small" onClick={() => formatText('bold')}>
                <FormatBoldIcon />
              </IconButton>
              <IconButton size="small" onClick={() => formatText('italic')}>
                <FormatItalicIcon />
              </IconButton>
              <IconButton size="small" onClick={() => formatText('underline')}>
                <FormatUnderlinedIcon />
              </IconButton>
              <IconButton size="small" onClick={() => formatText('insertUnorderedList')}>
                <FormatListBulletedIcon />
              </IconButton>
              <IconButton size="small" onClick={() => formatText('insertOrderedList')}>
                <FormatListNumberedIcon />
              </IconButton>
            </Box>
            
            <Box
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => setBody((e.target as HTMLDivElement).innerHTML)}
              dangerouslySetInnerHTML={{ __html: body }}
              sx={{
                minHeight: 300,
                p: 2,
                outline: 'none',
                '&:focus': {
                  outline: 'none',
                }
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <input
              type="file"
              multiple
              onChange={handleFileAttach}
              style={{ display: 'none' }}
              id="file-attach"
            />
            <label htmlFor="file-attach">
              <IconButton component="span">
                <AttachFileIcon />
              </IconButton>
            </label>
            
            {attachments.map((file, index) => (
              <Chip
                key={index}
                label={file.name}
                onDelete={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                size="small"
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>Abbrechen</Button>
        <Button startIcon={<SaveIcon />} variant="outlined">
          Als Entwurf speichern
        </Button>
        <Button
          onClick={handleSend}
          startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
          variant="contained"
          disabled={sending || !to || !subject || !body}
        >
          {sending ? 'Wird gesendet...' : 'Senden'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailCompose;