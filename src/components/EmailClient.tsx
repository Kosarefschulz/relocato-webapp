import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Divider,
  Button,
  CircularProgress,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Toolbar,
  AppBar,
} from '@mui/material';
import {
  Inbox as InboxIcon,
  Send as SendIcon,
  Drafts as DraftsIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Archive as ArchiveIcon,
  Label as LabelIcon,
  AttachFile as AttachFileIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  ImportExport as ImportIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  FolderOpen as FolderIcon,
  MoreVert as MoreVertIcon,
  LocalShipping as LocalShippingIcon,
  Email as EmailIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Customer } from '../types';
import { emailParser } from '../utils/emailParser';
import { emailClientService, Email as ServiceEmail } from '../services/emailClientService';
import EmailCompose from './EmailCompose';

interface EmailMessage {
  id: string;
  uid?: string;
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  date: Date;
  folder: string;
  isRead: boolean;
  isStarred: boolean;
  isImported: boolean;
  importedCustomerId?: string;
  attachments?: {
    filename: string;
    size: number;
    contentType?: string;
    url?: string;
  }[];
  labels?: string[];
  threadId?: string;
  messageId?: string;
  inReplyTo?: string;
  references?: string[];
}

interface EmailFolder {
  id: string;
  name: string;
  icon: React.ReactElement;
  count: number;
  unreadCount: number;
}

interface ParsedCustomerData {
  name: string;
  email: string;
  phone: string;
  fromAddress: string;
  toAddress: string;
  movingDate: string;
  apartment: {
    rooms: number;
    area: number;
    floor: number;
    hasElevator: boolean;
  };
  services: string[];
  notes?: string;
}

const DRAWER_WIDTH = 240;

const EmailClient: React.FC = () => {
  const navigate = useNavigate();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [folders, setFolders] = useState<EmailFolder[]>([
    { id: 'inbox', name: 'Posteingang', icon: <InboxIcon />, count: 0, unreadCount: 0 },
    { id: 'sent', name: 'Gesendet', icon: <SendIcon />, count: 0, unreadCount: 0 },
    { id: 'drafts', name: 'Entwürfe', icon: <DraftsIcon />, count: 0, unreadCount: 0 },
    { id: 'starred', name: 'Markiert', icon: <StarIcon />, count: 0, unreadCount: 0 },
    { id: 'archive', name: 'Archiv', icon: <ArchiveIcon />, count: 0, unreadCount: 0 },
    { id: 'trash', name: 'Papierkorb', icon: <DeleteIcon />, count: 0, unreadCount: 0 },
  ]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [showOnlyImported, setShowOnlyImported] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [importDialog, setImportDialog] = useState<{ open: boolean; email: EmailMessage | null; parsedData: ParsedCustomerData | null }>({
    open: false,
    email: null,
    parsedData: null
  });
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState<{
    replyTo?: any;
    forwardEmail?: any;
    recipientEmail?: string;
    recipientName?: string;
  }>({});

  // Load emails from Firestore
  useEffect(() => {
    loadEmails();
    
    // Set up real-time listener
    const q = query(collection(db, 'emailClient'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const emailList: EmailMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        emailList.push({
          id: doc.id,
          uid: data.uid,
          from: data.from || '',
          fromName: extractNameFromEmail(data.from || ''),
          to: data.to || '',
          subject: data.subject || '(Kein Betreff)',
          body: data.text || data.html || '',
          html: data.html,
          date: data.date?.toDate() || new Date(),
          folder: data.folder?.toLowerCase() || 'inbox',
          isRead: data.flags?.includes('\\Seen') || false,
          isStarred: data.flags?.includes('\\Flagged') || false,
          isImported: data.isImported || false,
          importedCustomerId: data.importedCustomerId,
          attachments: data.attachments || [],
          messageId: data.messageId,
        });
      });
      setEmails(emailList);
      updateFolderCounts(emailList);
    });

    setUnsubscribe(() => unsub);

    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Filter emails when folder or filters change
  useEffect(() => {
    filterEmails();
  }, [selectedFolder, emails, searchQuery, showOnlyUnread, showOnlyImported]);

  const loadEmails = async () => {
    setLoading(true);
    try {
      // First sync emails from IONOS
      await syncEmailsFromIONOS();
      
      // Then load from Firestore
      const emailsCollection = collection(db, 'emailClient');
      const emailsSnapshot = await getDocs(query(emailsCollection, orderBy('date', 'desc')));
      const emailList: EmailMessage[] = [];
      
      emailsSnapshot.forEach((doc) => {
        const data = doc.data();
        emailList.push({
          id: doc.id,
          uid: data.uid,
          from: data.from || '',
          fromName: extractNameFromEmail(data.from || ''),
          to: data.to || '',
          subject: data.subject || '(Kein Betreff)',
          body: data.text || data.html || '',
          html: data.html,
          date: data.date?.toDate() || new Date(),
          folder: data.folder?.toLowerCase() || 'inbox',
          isRead: data.flags?.includes('\\Seen') || false,
          isStarred: data.flags?.includes('\\Flagged') || false,
          isImported: data.isImported || false,
          importedCustomerId: data.importedCustomerId,
          attachments: data.attachments || [],
          messageId: data.messageId,
        });
      });

      setEmails(emailList);
      updateFolderCounts(emailList);
    } catch (error) {
      console.error('Error loading emails:', error);
      showSnackbar('Fehler beim Laden der E-Mails', 'error');
    } finally {
      setLoading(false);
    }
  };

  const syncEmailsFromIONOS = async () => {
    try {
      // Sync INBOX
      await emailClientService.syncEmails('INBOX', 50);
      // Sync Sent folder
      await emailClientService.syncEmails('Sent', 20);
    } catch (error) {
      console.error('Error syncing from IONOS:', error);
      // Don't throw - continue with loading from Firestore
    }
  };

  const extractNameFromEmail = (email: string): string => {
    const match = email.match(/^"?([^"<]+)"?\s*</);
    return match ? match[1].trim() : email.split('@')[0];
  };

  const updateFolderCounts = (emailList: EmailMessage[]) => {
    const newFolders = folders.map(folder => {
      let count = 0;
      let unreadCount = 0;

      if (folder.id === 'starred') {
        const starredEmails = emailList.filter(e => e.isStarred);
        count = starredEmails.length;
        unreadCount = starredEmails.filter(e => !e.isRead).length;
      } else {
        const folderEmails = emailList.filter(e => e.folder === folder.id);
        count = folderEmails.length;
        unreadCount = folderEmails.filter(e => !e.isRead).length;
      }

      return { ...folder, count, unreadCount };
    });

    setFolders(newFolders);
  };

  const filterEmails = () => {
    let filtered = [...emails];

    // Filter by folder
    if (selectedFolder === 'starred') {
      filtered = filtered.filter(email => email.isStarred);
    } else {
      filtered = filtered.filter(email => email.folder === selectedFolder);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(email =>
        email.subject.toLowerCase().includes(query) ||
        email.from.toLowerCase().includes(query) ||
        email.body.toLowerCase().includes(query) ||
        (email.fromName && email.fromName.toLowerCase().includes(query))
      );
    }

    // Filter by unread
    if (showOnlyUnread) {
      filtered = filtered.filter(email => !email.isRead);
    }

    // Filter by imported
    if (showOnlyImported) {
      filtered = filtered.filter(email => email.isImported);
    }

    setFilteredEmails(filtered);
  };

  const handleEmailSelect = async (email: EmailMessage) => {
    setSelectedEmail(email);
    
    // Mark as read
    if (!email.isRead) {
      try {
        await updateDoc(doc(db, 'emailClient', email.id), { 
          isRead: true,
          flags: [...(email.flags || []), '\\Seen']
        });
        const updatedEmails = emails.map(e => 
          e.id === email.id ? { ...e, isRead: true } : e
        );
        setEmails(updatedEmails);
        updateFolderCounts(updatedEmails);
      } catch (error) {
        console.error('Error marking email as read:', error);
      }
    }
  };

  const handleToggleStar = async (emailId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const email = emails.find(e => e.id === emailId);
    if (!email) return;

    try {
      const newFlags = email.isStarred 
        ? (email.flags || []).filter(f => f !== '\\Flagged')
        : [...(email.flags || []), '\\Flagged'];
      
      await updateDoc(doc(db, 'emailClient', emailId), { 
        isStarred: !email.isStarred,
        flags: newFlags
      });
      const updatedEmails = emails.map(e => 
        e.id === emailId ? { ...e, isStarred: !e.isStarred } : e
      );
      setEmails(updatedEmails);
      updateFolderCounts(updatedEmails);
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Sync emails from IONOS
      const result = await emailClientService.syncEmails('INBOX', 50, true);
      
      if (result && result.success) {
        showSnackbar(`${result.count || 0} E-Mails synchronisiert`, 'success');
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      console.error('Error syncing emails:', error);
      showSnackbar('Fehler beim Synchronisieren der E-Mails', 'error');
    } finally {
      setRefreshing(false);
      // Reload will happen automatically via real-time listener
    }
  };

  const handleImportEmail = async () => {
    if (!selectedEmail || selectedEmail.isImported) return;

    try {
      // Parse email content
      const parsedData = await emailParser.parseEmail(selectedEmail.body, selectedEmail.from);
      
      setImportDialog({
        open: true,
        email: selectedEmail,
        parsedData: parsedData as ParsedCustomerData
      });
    } catch (error) {
      console.error('Error parsing email:', error);
      showSnackbar('Fehler beim Parsen der E-Mail', 'error');
    }
  };

  const confirmImport = async () => {
    if (!importDialog.email || !importDialog.parsedData) return;

    try {
      // Create customer from parsed data
      const newCustomer: Omit<Customer, 'id'> = {
        ...importDialog.parsedData,
        createdAt: new Date(),
        source: 'E-Mail Import',
        tags: ['E-Mail Import'],
        customerNumber: `K${Date.now()}`,
      };

      // Add customer to Firestore
      const customerRef = doc(collection(db, 'customers'));
      await setDoc(customerRef, newCustomer);

      // Update email as imported
      await updateDoc(doc(db, 'emails', importDialog.email.id), {
        isImported: true,
        importedCustomerId: customerRef.id,
        importedAt: Timestamp.now()
      });

      const updatedEmails = emails.map(e => 
        e.id === importDialog.email.id 
          ? { ...e, isImported: true, importedCustomerId: customerRef.id } 
          : e
      );
      setEmails(updatedEmails);

      showSnackbar('Kunde erfolgreich importiert', 'success');
      setImportDialog({ open: false, email: null, parsedData: null });

      // Navigate to customer details
      navigate(`/customer/${customerRef.id}`);
    } catch (error) {
      console.error('Error importing customer:', error);
      showSnackbar('Fehler beim Importieren des Kunden', 'error');
    }
  };

  const handleDeleteEmails = async () => {
    const emailsToDelete = selectedEmails.length > 0 ? selectedEmails : (selectedEmail ? [selectedEmail.id] : []);
    
    if (emailsToDelete.length === 0) return;

    try {
      for (const emailId of emailsToDelete) {
        const email = emails.find(e => e.id === emailId);
        if (!email) continue;

        if (email.folder === 'trash') {
          // Permanently delete
          await deleteDoc(doc(db, 'emailClient', emailId));
        } else {
          // Move to trash
          await updateDoc(doc(db, 'emailClient', emailId), { folder: 'trash' });
        }
      }

      showSnackbar(`${emailsToDelete.length} E-Mail(s) gelöscht`, 'success');
      setSelectedEmails([]);
      setSelectedEmail(null);
      await loadEmails();
    } catch (error) {
      console.error('Error deleting emails:', error);
      showSnackbar('Fehler beim Löschen der E-Mails', 'error');
    }
  };

  const handleArchiveEmails = async () => {
    const emailsToArchive = selectedEmails.length > 0 ? selectedEmails : (selectedEmail ? [selectedEmail.id] : []);
    
    if (emailsToArchive.length === 0) return;

    try {
      for (const emailId of emailsToArchive) {
        await updateDoc(doc(db, 'emailClient', emailId), { folder: 'archive' });
      }

      showSnackbar(`${emailsToArchive.length} E-Mail(s) archiviert`, 'success');
      setSelectedEmails([]);
      setSelectedEmail(null);
      await loadEmails();
    } catch (error) {
      console.error('Error archiving emails:', error);
      showSnackbar('Fehler beim Archivieren der E-Mails', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatEmailDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, 'HH:mm', { locale: de });
    } else if (diffInHours < 168) { // 7 days
      return format(date, 'EEEE', { locale: de });
    } else {
      return format(date, 'dd.MM.yyyy', { locale: de });
    }
  };

  const getEmailStatusIcon = (email: EmailMessage) => {
    if (email.isImported) {
      return (
        <Tooltip title="Bereits importiert">
          <CheckCircleIcon color="success" fontSize="small" />
        </Tooltip>
      );
    }
    return null;
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            position: 'relative',
            height: '100%',
          },
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            E-Mail Client
          </Typography>
          <Button
            variant="contained"
            startIcon={<EmailIcon />}
            onClick={() => {
              setComposeData({});
              setComposeOpen(true);
            }}
          >
            Neue E-Mail
          </Typography>
        </Toolbar>
        <Divider />
        <List>
          {folders.map((folder) => (
            <ListItem key={folder.id} disablePadding>
              <ListItemButton
                selected={selectedFolder === folder.id}
                onClick={() => setSelectedFolder(folder.id)}
              >
                <ListItemIcon>
                  <Badge badgeContent={folder.unreadCount} color="primary">
                    {folder.icon}
                  </Badge>
                </ListItemIcon>
                <ListItemText 
                  primary={folder.name} 
                  secondary={folder.count > 0 ? `${folder.count} E-Mails` : undefined}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Email List */}
      <Box sx={{ width: 400, borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="E-Mails durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconButton size="small" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
            >
              <FilterListIcon />
            </IconButton>
            {selectedEmails.length > 0 && (
              <>
                <Typography variant="caption" sx={{ ml: 1 }}>
                  {selectedEmails.length} ausgewählt
                </Typography>
                <IconButton size="small" onClick={handleArchiveEmails}>
                  <ArchiveIcon />
                </IconButton>
                <IconButton size="small" onClick={handleDeleteEmails}>
                  <DeleteIcon />
                </IconButton>
              </>
            )}
          </Box>
        </Box>

        {/* Email List */}
        <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredEmails.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <EmailIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
              <Typography color="text.secondary">
                Keine E-Mails gefunden
              </Typography>
            </Box>
          ) : (
            filteredEmails.map((email) => (
              <ListItem
                key={email.id}
                onClick={() => handleEmailSelect(email)}
                sx={{
                  cursor: 'pointer',
                  bgcolor: selectedEmail?.id === email.id ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
                secondaryAction={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getEmailStatusIcon(email)}
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => handleToggleStar(email.id, e)}
                    >
                      {email.isStarred ? <StarIcon color="primary" /> : <StarBorderIcon />}
                    </IconButton>
                  </Box>
                }
              >
                <ListItemAvatar>
                  <Checkbox
                    checked={selectedEmails.includes(email.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      setSelectedEmails(prev =>
                        prev.includes(email.id)
                          ? prev.filter(id => id !== email.id)
                          : [...prev, email.id]
                      );
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: email.isRead ? 'normal' : 'bold',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {email.fromName || email.from}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatEmailDate(email.date)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: email.isRead ? 'normal' : 'bold',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {email.subject}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                        }}
                      >
                        {email.body.replace(/<[^>]*>/g, '').substring(0, 100)}...
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </Box>

      {/* Email Preview */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
        {selectedEmail ? (
          <>
            {/* Email Header */}
            <Paper sx={{ p: 2, borderRadius: 0, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                <Typography variant="h5" gutterBottom>
                  {selectedEmail.subject}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {!selectedEmail.isImported && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<ImportIcon />}
                      onClick={handleImportEmail}
                    >
                      Als Kunde importieren
                    </Button>
                  )}
                  {selectedEmail.isImported && selectedEmail.importedCustomerId && (
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<PersonIcon />}
                      onClick={() => navigate(`/customer/${selectedEmail.importedCustomerId}`)}
                    >
                      Kunde anzeigen
                    </Button>
                  )}
                  <IconButton onClick={() => window.print()}>
                    <PrintIcon />
                  </IconButton>
                  <IconButton onClick={(e) => setMoreMenuAnchor(e.currentTarget)}>
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {(selectedEmail.fromName || selectedEmail.from).charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1">
                    {selectedEmail.fromName || selectedEmail.from}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    an {selectedEmail.to} • {format(selectedEmail.date, 'dd. MMMM yyyy, HH:mm', { locale: de })}
                  </Typography>
                </Box>
              </Box>

              {selectedEmail.labels && selectedEmail.labels.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  {selectedEmail.labels.map((label) => (
                    <Chip key={label} label={label} size="small" />
                  ))}
                </Box>
              )}
            </Paper>

            {/* Email Body */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              {selectedEmail.isImported && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Diese E-Mail wurde bereits als Kunde importiert.
                </Alert>
              )}
              
              <div dangerouslySetInnerHTML={{ __html: selectedEmail.body }} />
              
              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Anhänge ({selectedEmail.attachments.length})
                  </Typography>
                  {selectedEmail.attachments.map((attachment, index) => (
                    <Chip
                      key={index}
                      icon={<AttachFileIcon />}
                      label={`${attachment.filename} (${(attachment.size / 1024).toFixed(1)} KB)`}
                      sx={{ mr: 1, mb: 1 }}
                      onClick={() => attachment.url && window.open(attachment.url)}
                    />
                  ))}
                </Box>
              )}
            </Box>

            {/* Email Actions */}
            <Paper sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  startIcon={<ReplyIcon />}
                  onClick={() => {
                    setComposeData({
                      replyTo: {
                        from: selectedEmail.from,
                        subject: selectedEmail.subject,
                        body: selectedEmail.body,
                        messageId: selectedEmail.messageId
                      }
                    });
                    setComposeOpen(true);
                  }}
                >
                  Antworten
                </Button>
                <Button 
                  startIcon={<ForwardIcon />}
                  onClick={() => {
                    setComposeData({
                      forwardEmail: {
                        from: selectedEmail.from,
                        to: selectedEmail.to,
                        subject: selectedEmail.subject,
                        body: selectedEmail.body,
                        date: selectedEmail.date
                      }
                    });
                    setComposeOpen(true);
                  }}
                >
                  Weiterleiten
                </Button>
                <Button startIcon={<ArchiveIcon />} onClick={handleArchiveEmails}>
                  Archivieren
                </Button>
                <Button startIcon={<DeleteIcon />} onClick={handleDeleteEmails} color="error">
                  Löschen
                </Button>
              </Box>
            </Paper>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="h6" color="text.secondary">
              Wählen Sie eine E-Mail aus, um sie anzuzeigen
            </Typography>
          </Box>
        )}
      </Box>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
      >
        <MenuItem>
          <FormControlLabel
            control={
              <Checkbox
                checked={showOnlyUnread}
                onChange={(e) => setShowOnlyUnread(e.target.checked)}
              />
            }
            label="Nur ungelesene"
          />
        </MenuItem>
        <MenuItem>
          <FormControlLabel
            control={
              <Checkbox
                checked={showOnlyImported}
                onChange={(e) => setShowOnlyImported(e.target.checked)}
              />
            }
            label="Nur importierte"
          />
        </MenuItem>
      </Menu>

      {/* More Actions Menu */}
      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={() => setMoreMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          if (selectedEmail) {
            navigator.clipboard.writeText(selectedEmail.body);
            showSnackbar('E-Mail-Inhalt kopiert', 'success');
          }
          setMoreMenuAnchor(null);
        }}>
          Inhalt kopieren
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedEmail) {
            const blob = new Blob([selectedEmail.body], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedEmail.subject}.html`;
            a.click();
            URL.revokeObjectURL(url);
          }
          setMoreMenuAnchor(null);
        }}>
          Als HTML herunterladen
        </MenuItem>
      </Menu>

      {/* Import Dialog */}
      <Dialog open={importDialog.open} onClose={() => setImportDialog({ open: false, email: null, parsedData: null })} maxWidth="md" fullWidth>
        <DialogTitle>Kunde aus E-Mail importieren</DialogTitle>
        <DialogContent>
          {importDialog.parsedData && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Alert severity="info">
                  Die folgenden Daten wurden aus der E-Mail extrahiert. Bitte überprüfen und ggf. anpassen.
                </Alert>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Kundendaten
                    </Typography>
                    <Typography><strong>Name:</strong> {importDialog.parsedData.name}</Typography>
                    <Typography><strong>E-Mail:</strong> {importDialog.parsedData.email}</Typography>
                    <Typography><strong>Telefon:</strong> {importDialog.parsedData.phone}</Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Umzugsdaten
                    </Typography>
                    <Typography><strong>Umzugsdatum:</strong> {importDialog.parsedData.movingDate}</Typography>
                    <Typography><strong>Von:</strong> {importDialog.parsedData.fromAddress}</Typography>
                    <Typography><strong>Nach:</strong> {importDialog.parsedData.toAddress}</Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <HomeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Wohnungsdaten
                    </Typography>
                    <Typography><strong>Zimmer:</strong> {importDialog.parsedData.apartment.rooms}</Typography>
                    <Typography><strong>Fläche:</strong> {importDialog.parsedData.apartment.area} m²</Typography>
                    <Typography><strong>Etage:</strong> {importDialog.parsedData.apartment.floor}</Typography>
                    <Typography><strong>Aufzug:</strong> {importDialog.parsedData.apartment.hasElevator ? 'Ja' : 'Nein'}</Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <LocalShippingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Services
                    </Typography>
                    {importDialog.parsedData.services.map((service, index) => (
                      <Chip key={index} label={service} sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              {importDialog.parsedData.notes && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Notizen</Typography>
                      <Typography>{importDialog.parsedData.notes}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialog({ open: false, email: null, parsedData: null })}>
            Abbrechen
          </Button>
          <Button onClick={confirmImport} variant="contained" color="primary">
            Kunde importieren
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Email Compose Dialog */}
      <EmailCompose
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSent={() => {
          showSnackbar('E-Mail erfolgreich gesendet', 'success');
          handleRefresh();
        }}
        {...composeData}
      />
    </Box>
  );
};

export default EmailClient;