import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Badge,
  Tooltip,
  Paper,
  CircularProgress,
  Alert,
  Stack,
  useTheme
} from '@mui/material';
import {
  Email as EmailIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  AttachFile as AttachFileIcon,
  OpenInNew as OpenInNewIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { Customer } from '../types';
import emailHistoryService, { EmailRecord } from '../services/emailHistoryService';
import { sendEmailViaSMTP } from '../services/smtpEmailService';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';

interface CustomerCommunicationProps {
  customer: Customer;
}

interface LinkedEmail {
  id: string;
  emailId: string;
  subject: string;
  from: string;
  date: Date;
  hasAttachments?: boolean;
}

const CustomerCommunication: React.FC<CustomerCommunicationProps> = ({ customer }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [emailRecords, setEmailRecords] = useState<EmailRecord[]>([]);
  const [linkedEmails, setLinkedEmails] = useState<LinkedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [newEmail, setNewEmail] = useState({
    to: customer.email || '',
    subject: '',
    content: ''
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEmailHistory();
    loadLinkedEmails();
  }, [customer.id]);

  const loadEmailHistory = () => {
    try {
      setLoading(true);
      const emails = emailHistoryService.getCustomerEmails(customer.id);
      setEmailRecords(emails);
    } catch (err) {
      console.error('Fehler beim Laden der E-Mail-Historie:', err);
      setError('Fehler beim Laden der E-Mail-Historie');
    } finally {
      setLoading(false);
    }
  };

  const loadLinkedEmails = async () => {
    try {
      // Load linked emails from Firestore
      const linksQuery = query(
        collection(db, 'emailCustomerLinks'),
        where('customerId', '==', customer.id),
        orderBy('linkedAt', 'desc')
      );
      
      const snapshot = await getDocs(linksQuery);
      const emails: LinkedEmail[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          emailId: data.emailId,
          subject: data.emailSubject || 'Kein Betreff',
          from: data.emailFrom || 'Unbekannt',
          date: data.linkedAt?.toDate() || new Date(),
          hasAttachments: data.hasAttachments || false
        };
      });
      
      setLinkedEmails(emails);
    } catch (err) {
      console.error('Fehler beim Laden verknüpfter E-Mails:', err);
    }
  };

  const handleSendEmail = async () => {
    if (!newEmail.subject || !newEmail.content) {
      setError('Bitte Betreff und Inhalt eingeben');
      return;
    }

    setSending(true);
    setError('');

    try {
      const emailData = {
        to: newEmail.to,
        subject: newEmail.subject,
        content: newEmail.content.replace(/\n/g, '<br>'),
        customerId: customer.id,
        customerName: customer.name,
        templateType: 'custom'
      };

      const sent = await sendEmailViaSMTP(emailData);
      
      if (sent) {
        setComposeOpen(false);
        setNewEmail({
          to: customer.email || '',
          subject: '',
          content: ''
        });
        loadEmailHistory(); // Reload to show new email
      } else {
        setError('E-Mail konnte nicht gesendet werden');
      }
    } catch (err) {
      console.error('Fehler beim E-Mail-Versand:', err);
      setError('Fehler beim E-Mail-Versand');
    } finally {
      setSending(false);
    }
  };

  const getTemplateTypeLabel = (type: string) => {
    switch (type) {
      case 'quote_email': return 'Angebot per E-Mail';
      case 'quote_sent': return 'Angebot versendet';
      case 'invoice': return 'Rechnung';
      case 'reminder': return 'Zahlungserinnerung';
      case 'custom': return 'Individuelle Nachricht';
      default: return type;
    }
  };

  const getTemplateTypeColor = (type: string) => {
    switch (type) {
      case 'quote_email':
      case 'quote_sent': return 'primary';
      case 'invoice': return 'warning';
      case 'reminder': return 'error';
      case 'custom': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          E-Mail-Kommunikation
        </Typography>
        <Box>
          <Tooltip title="Aktualisieren">
            <IconButton onClick={() => {
              loadEmailHistory();
              loadLinkedEmails();
            }} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setComposeOpen(true)}
            sx={{ ml: 1 }}
          >
            Neue E-Mail
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Linked Emails from Email Client */}
      {linkedEmails.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Verknüpfte E-Mails aus dem E-Mail-Client
          </Typography>
          <Stack spacing={2}>
            {linkedEmails.map((email) => (
              <Paper
                key={email.id}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    transform: 'translateY(-2px)',
                    boxShadow: 2
                  }
                }}
                onClick={() => navigate('/email-client')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                    <LinkIcon />
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap>
                      {email.subject}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      Von: {email.from} • {format(email.date, 'dd.MM.yyyy HH:mm', { locale: de })}
                    </Typography>
                  </Box>
                  {email.hasAttachments && (
                    <Tooltip title="Hat Anhänge">
                      <AttachFileIcon fontSize="small" color="action" />
                    </Tooltip>
                  )}
                  <Tooltip title="Im E-Mail-Client öffnen">
                    <IconButton size="small">
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            ))}
          </Stack>
        </Box>
      )}

      {/* System Generated Emails */}
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
        System-generierte E-Mails
      </Typography>
      
      {/* Email List */}
      {emailRecords.length === 0 && linkedEmails.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <EmailIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography color="text.secondary">
            Noch keine E-Mails
          </Typography>
          <Button
            variant="outlined"
            startIcon={<SendIcon />}
            onClick={() => setComposeOpen(true)}
            sx={{ mt: 2 }}
          >
            Erste E-Mail senden
          </Button>
        </Paper>
      ) : emailRecords.length === 0 ? (
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Keine system-generierten E-Mails vorhanden
          </Typography>
        </Paper>
      ) : (
        <List sx={{ bgcolor: 'background.paper' }}>
          {emailRecords.map((email, index) => (
            <React.Fragment key={email.id}>
              {index > 0 && <Divider />}
              <ListItem
                sx={{
                  py: 2,
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <ListItemAvatar>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      email.status === 'sent' ? (
                        <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                      ) : (
                        <ErrorIcon sx={{ fontSize: 16, color: 'error.main' }} />
                      )
                    }
                  >
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <EmailIcon />
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {email.subject}
                      </Typography>
                      <Chip
                        label={getTemplateTypeLabel(email.templateType)}
                        size="small"
                        color={getTemplateTypeColor(email.templateType)}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        An: {email.to}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(email.sentAt), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr
                      </Typography>
                      {email.errorMessage && (
                        <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                          Fehler: {email.errorMessage}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onClose={() => setComposeOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Neue E-Mail an {customer.name}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="An"
            value={newEmail.to}
            onChange={(e) => setNewEmail({ ...newEmail, to: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Betreff"
            value={newEmail.subject}
            onChange={(e) => setNewEmail({ ...newEmail, subject: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Nachricht"
            value={newEmail.content}
            onChange={(e) => setNewEmail({ ...newEmail, content: e.target.value })}
            margin="normal"
            multiline
            rows={6}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComposeOpen(false)} disabled={sending}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSendEmail}
            variant="contained"
            startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
            disabled={sending}
          >
            Senden
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerCommunication;