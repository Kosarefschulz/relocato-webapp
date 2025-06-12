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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tooltip,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Email as EmailIcon,
  Send as SendIcon,
  Reply as ReplyIcon,
  Attachment as AttachmentIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { Customer } from '../types';
import { emailHistoryService, EmailThread, EmailMessage } from '../services/emailHistoryService';
import { emailSyncService } from '../services/emailSyncService';

interface CustomerCommunicationProps {
  customer: Customer;
}

const CustomerCommunication: React.FC<CustomerCommunicationProps> = ({ customer }) => {
  const [emailThreads, setEmailThreads] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<EmailMessage | null>(null);
  const [newEmail, setNewEmail] = useState({
    to: customer.email || '',
    subject: '',
    content: ''
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEmailHistory();
  }, [customer.id]);

  const loadEmailHistory = async () => {
    try {
      setLoading(true);
      
      // Lade E-Mail-Historie
      const threads = emailHistoryService.getEmailHistoryForCustomer(customer.id);
      
      // Füge Mock-Daten hinzu wenn keine Historie vorhanden
      if (threads.length === 0 && customer.email) {
        emailHistoryService.addMockData(customer.id, customer.email, customer.name);
        const updatedThreads = emailHistoryService.getEmailHistoryForCustomer(customer.id);
        setEmailThreads(updatedThreads);
      } else {
        setEmailThreads(threads);
      }
    } catch (err) {
      console.error('Fehler beim Laden der E-Mail-Historie:', err);
      setError('Fehler beim Laden der E-Mail-Historie');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Versuche E-Mail-Synchronisation
      const syncResult = await emailSyncService.syncEmails();
      
      if (syncResult.success) {
        if (syncResult.newMessages > 0) {
          console.log(`✅ ${syncResult.newMessages} neue E-Mails synchronisiert`);
        }
        // Reload nach Sync
        loadEmailHistory();
      } else {
        // Fallback: Simuliere eingehende E-Mail für Demo
        if (customer.email) {
          emailSyncService.simulateIncomingEmail(customer.id, customer.email, customer.name);
          loadEmailHistory();
          console.log('📧 Demo-E-Mail hinzugefügt');
        }
      }
    } catch (err) {
      console.error('Sync-Fehler:', err);
      setError('E-Mail-Synchronisation fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!newEmail.content.trim() || !newEmail.to.trim()) {
      setError('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    setSending(true);
    setError('');

    try {
      const success = await emailHistoryService.sendEmail(
        newEmail.to,
        newEmail.subject || 'Nachricht von RELOCATO® Bielefeld',
        newEmail.content,
        customer.id
      );

      if (success) {
        setComposeOpen(false);
        setReplyToMessage(null);
        setNewEmail({ to: customer.email || '', subject: '', content: '' });
        loadEmailHistory(); // Aktualisiere Historie
      } else {
        setError('E-Mail konnte nicht gesendet werden');
      }
    } catch (err) {
      setError('Fehler beim Senden der E-Mail');
    } finally {
      setSending(false);
    }
  };

  const handleReply = (message: EmailMessage) => {
    setReplyToMessage(message);
    setNewEmail({
      to: message.from,
      subject: message.subject.startsWith('Re:') ? message.subject : `Re: ${message.subject}`,
      content: `\n\n---\nAm ${message.timestamp.toLocaleDateString('de-DE')} schrieb ${message.from}:\n> ${message.content.replace(/\n/g, '\n> ')}`
    });
    setComposeOpen(true);
  };

  const getMessageStatusIcon = (message: EmailMessage) => {
    switch (message.status) {
      case 'sent':
        return <ScheduleIcon fontSize="small" color="action" />;
      case 'delivered':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'read':
        return <CheckCircleIcon fontSize="small" color="primary" />;
      case 'failed':
        return <ErrorIcon fontSize="small" color="error" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('de-DE', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header mit Aktionen */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon color="primary" />
          Kommunikationshistorie
        </Typography>
        <Box display="flex" gap={1}>
          <Tooltip title="E-Mails synchronisieren">
            <IconButton onClick={handleSync} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setReplyToMessage(null);
              setNewEmail({ to: customer.email || '', subject: '', content: '' });
              setComposeOpen(true);
            }}
            disabled={!customer.email}
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

      {/* E-Mail-Threads */}
      {emailThreads.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <EmailIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Keine E-Mail-Kommunikation vorhanden
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Starten Sie die Kommunikation mit diesem Kunden
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />}
            onClick={() => setComposeOpen(true)}
            disabled={!customer.email}
          >
            Erste E-Mail senden
          </Button>
        </Paper>
      ) : (
        <Box>
          {emailThreads.map((thread) => (
            <Accordion key={thread.id} defaultExpanded={emailThreads.length === 1}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                  <Box display="flex" alignItems="center" gap={2}>
                    <Badge badgeContent={thread.messages.length} color="primary">
                      <EmailIcon />
                    </Badge>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {thread.subject}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {thread.messages.length} Nachrichten • Letzte: {formatTimestamp(thread.updatedAt)}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label={thread.status === 'active' ? 'Aktiv' : 'Archiviert'} 
                    size="small"
                    color={thread.status === 'active' ? 'success' : 'default'}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List disablePadding>
                  {thread.messages.map((message, index) => (
                    <Box key={message.id}>
                      <ListItem
                        sx={{
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 2,
                          bgcolor: message.direction === 'sent' ? 'primary.50' : 'grey.50'
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            bgcolor: message.direction === 'sent' ? 'primary.main' : 'grey.400' 
                          }}>
                            {message.direction === 'sent' ? 'R' : customer.name[0]?.toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle2">
                                {message.direction === 'sent' ? 'RELOCATO® Bielefeld' : customer.name}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1}>
                                {getMessageStatusIcon(message)}
                                <Typography variant="caption" color="text.secondary">
                                  {formatTimestamp(message.timestamp)}
                                </Typography>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleReply(message)}
                                  sx={{ ml: 1 }}
                                >
                                  <ReplyIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                          }
                          secondary={
                            <Box mt={1}>
                              <Typography variant="body2" gutterBottom>
                                <strong>An:</strong> {message.to.join(', ')}
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                whiteSpace: 'pre-wrap',
                                bgcolor: 'background.paper',
                                p: 1,
                                borderRadius: 1,
                                border: 1,
                                borderColor: 'divider'
                              }}>
                                {message.content}
                              </Typography>
                              {message.attachments && message.attachments.length > 0 && (
                                <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                                  {message.attachments.map((attachment) => (
                                    <Chip
                                      key={attachment.id}
                                      icon={<AttachmentIcon />}
                                      label={attachment.filename}
                                      size="small"
                                      variant="outlined"
                                    />
                                  ))}
                                </Box>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    </Box>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* E-Mail Compose Dialog */}
      <Dialog 
        open={composeOpen} 
        onClose={() => setComposeOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {replyToMessage ? 'Antworten' : 'Neue E-Mail'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="An"
              value={newEmail.to}
              onChange={(e) => setNewEmail({ ...newEmail, to: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Betreff"
              value={newEmail.subject}
              onChange={(e) => setNewEmail({ ...newEmail, subject: e.target.value })}
              fullWidth
            />
            <TextField
              label="Nachricht"
              value={newEmail.content}
              onChange={(e) => setNewEmail({ ...newEmail, content: e.target.value })}
              multiline
              rows={10}
              fullWidth
              required
              placeholder="Sehr geehrte/r ...&#10;&#10;Mit freundlichen Grüßen&#10;Ihr RELOCATO® Team Bielefeld"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComposeOpen(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSendEmail}
            variant="contained"
            startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
            disabled={sending || !newEmail.content.trim()}
          >
            {sending ? 'Wird gesendet...' : 'Senden'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerCommunication;