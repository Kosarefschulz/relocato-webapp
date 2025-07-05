import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Typography,
  Divider,
  Button,
  Avatar,
  Chip,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  Checkbox,
  CircularProgress,
  Drawer,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
  Fab,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Create as CreateIcon,
  Inbox as InboxIcon,
  Send as SendIcon,
  Drafts as DraftsIcon,
  Delete as DeleteIcon,
  Label as LabelIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  MoreVert as MoreVertIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  Archive as ArchiveIcon,
  Refresh as RefreshIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  IndeterminateCheckBox as IndeterminateCheckBoxIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  MarkunreadMailbox as MarkunreadMailboxIcon
} from '@mui/icons-material';
import EmailComposerProfessional from './EmailComposerProfessional';
import EmailViewerProfessional from './EmailViewerProfessional';
import { ionosEmailService as emailService } from '../services/emailServiceIONOS';
// Firebase imports entfernt - nicht mehr benötigt
import { Email, Folder, EmailFolder } from '../types/email';
import { format, isToday, isYesterday } from 'date-fns';

interface EmailClientProfessionalProps {
  onError?: (error: string) => void;
}

const EmailClientProfessional: React.FC<EmailClientProfessionalProps> = ({ onError }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // State
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<Email[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('INBOX');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalEmails, setTotalEmails] = useState(0);
  const [composerMode, setComposerMode] = useState<'new' | 'reply' | 'forward'>('new');
  const [replyToEmail, setReplyToEmail] = useState<Email | null>(null);

  // Drawer width
  const drawerWidth = 280;

  // Load folders on mount
  useEffect(() => {
    loadFolders();
    setupWebSocket();
    
    return () => {
      // Cleanup WebSocket
      emailService.disconnect();
    };
  }, []);

  // Load emails when folder changes
  useEffect(() => {
    loadEmails();
  }, [selectedFolder, page]);

  // Setup WebSocket for real-time updates (not used with IONOS)
  const setupWebSocket = () => {
    // IONOS service doesn't support real-time updates
    // We'll rely on manual refresh instead
  };

  // Load folders
  const loadFolders = async () => {
    try {
      const folderList = await emailService.getFolders();
      setFolders(folderList);
    } catch (error) {
      showSnackbar('Failed to load folders', 'error');
      onError?.('Failed to load folders');
    }
  };

  // Load emails
  const loadEmails = async () => {
    try {
      setLoading(true);
      console.log('🔍 DEBUG: Loading emails for folder:', selectedFolder, 'page:', page);
      const response = await emailService.getEmails(selectedFolder, page, 50);
      
      console.log('📧 DEBUG: Email response:', {
        totalEmails: response.total,
        emailCount: response.emails.length,
        firstEmail: response.emails[0] ? {
          id: response.emails[0].id,
          subject: response.emails[0].subject,
          hasHtml: !!response.emails[0].html,
          hasText: !!response.emails[0].text,
          hasTextAsHtml: !!response.emails[0].textAsHtml,
          contentLength: {
            html: response.emails[0].html?.length || 0,
            text: response.emails[0].text?.length || 0,
            textAsHtml: response.emails[0].textAsHtml?.length || 0
          }
        } : null
      });
      
      if (page === 1) {
        setEmails(response.emails);
      } else {
        setEmails(prev => [...prev, ...response.emails]);
      }
      
      setTotalEmails(response.total);
      setHasMore(response.emails.length === 50);
    } catch (error) {
      console.error('❌ DEBUG: Email loading error:', error);
      showSnackbar('Failed to load emails', 'error');
      onError?.('Failed to load emails');
    } finally {
      setLoading(false);
    }
  };

  // Refresh emails
  const refreshEmails = async () => {
    setRefreshing(true);
    setPage(1);
    await loadEmails();
    setRefreshing(false);
    showSnackbar('Emails refreshed', 'success');
  };

  // Search emails
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
    loadEmails();
  }, []);

  // Select folder
  const handleSelectFolder = (folder: string) => {
    setSelectedFolder(folder);
    setSelectedEmails([]);
    setSelectedEmail(null);
    setPage(1);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  // Select email
  const handleSelectEmail = async (email: Email) => {
    // First, set the email as selected (for UI feedback)
    setSelectedEmail(email);
    setSelectedEmails([email.id]);
    
    // Fetch the full email content
    try {
      const fullEmail = await emailService.getEmail(email.id, selectedFolder);
      if (fullEmail) {
        setSelectedEmail(fullEmail);
        
        // Update the email in the list with full content
        setEmails(prevEmails => 
          prevEmails.map(e => e.id === email.id ? fullEmail : e)
        );
      }
    } catch (error) {
      console.error('Failed to load full email:', error);
      showSnackbar('Failed to load email content', 'error');
    }
    
    // Mark as read
    if (!email.flags.includes('SEEN')) {
      emailService.markAsRead(email.id, selectedFolder);
    }
    
    if (isMobile) {
      // Navigate to email view on mobile
    }
  };

  // Toggle email selection
  const toggleEmailSelection = (emailId: string) => {
    setSelectedEmails(prev => 
      prev.includes(emailId)
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };

  // Select all emails
  const selectAllEmails = () => {
    if (selectedEmails.length === emails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(emails.map(email => email.id));
    }
  };

  // Compose new email
  const handleCompose = () => {
    setComposerMode('new');
    setReplyToEmail(null);
    setComposerOpen(true);
  };

  // Reply to email
  const handleReply = (email: Email) => {
    setComposerMode('reply');
    setReplyToEmail(email);
    setComposerOpen(true);
  };

  // Forward email
  const handleForward = (email: Email) => {
    setComposerMode('forward');
    setReplyToEmail(email);
    setComposerOpen(true);
  };

  // Star/unstar email
  const handleStar = async (email: Email) => {
    const starred = !email.flags.includes('FLAGGED');
    await emailService.toggleStar(email.id, selectedFolder, starred);
  };

  // Delete emails
  const handleDelete = async () => {
    try {
      await Promise.all(
        selectedEmails.map(id => emailService.deleteEmail(id, selectedFolder))
      );
      showSnackbar(`${selectedEmails.length} email(s) deleted`, 'success');
      setSelectedEmails([]);
      setSelectedEmail(null);
    } catch (error) {
      showSnackbar('Failed to delete emails', 'error');
    }
  };

  // Move emails
  const handleMove = async (targetFolder: string) => {
    try {
      await Promise.all(
        selectedEmails.map(id => emailService.moveEmail(id, selectedFolder, targetFolder))
      );
      showSnackbar(`${selectedEmails.length} email(s) moved`, 'success');
      setSelectedEmails([]);
      setSelectedEmail(null);
    } catch (error) {
      showSnackbar('Failed to move emails', 'error');
    }
  };

  // Mark as read/unread
  const handleMarkAsRead = async (markAsRead: boolean) => {
    try {
      await Promise.all(
        selectedEmails.map(id => 
          markAsRead 
            ? emailService.markAsRead(id, selectedFolder)
            : emailService.markAsUnread(id, selectedFolder)
        )
      );
      showSnackbar(`Marked as ${markAsRead ? 'read' : 'unread'}`, 'success');
    } catch (error) {
      showSnackbar('Failed to update emails', 'error');
    }
  };

  // Show snackbar
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Format date
  const formatEmailDate = (date: Date | string) => {
    const emailDate = new Date(date);
    
    if (isToday(emailDate)) {
      return format(emailDate, 'h:mm a');
    } else if (isYesterday(emailDate)) {
      return 'Yesterday';
    } else {
      return format(emailDate, 'MMM d');
    }
  };

  // Get folder icon
  const getFolderIcon = (folder: Folder) => {
    switch (folder.specialUse) {
      case 'inbox':
        return <InboxIcon />;
      case 'sent':
        return <SendIcon />;
      case 'drafts':
        return <DraftsIcon />;
      case 'trash':
        return <DeleteIcon />;
      case 'spam':
        return <MarkunreadMailboxIcon />;
      default:
        return folder.hasChildren ? <FolderIcon /> : <FolderOpenIcon />;
    }
  };

  // Render folder tree
  const renderFolderTree = (folders: Folder[], level = 0) => {
    return folders
      .filter(folder => folder.level === level)
      .map(folder => (
        <React.Fragment key={folder.path}>
          <ListItem
            onClick={() => handleSelectFolder(folder.path)}
            sx={{ 
              pl: level * 2 + 2, 
              cursor: 'pointer', 
              '&:hover': { bgcolor: 'action.hover' },
              bgcolor: selectedFolder === folder.path ? 'action.selected' : 'inherit'
            }}
          >
            <ListItemIcon>
              <Badge badgeContent={folder.unreadCount} color="primary">
                {getFolderIcon(folder)}
              </Badge>
            </ListItemIcon>
            <ListItemText primary={folder.name} />
            {folder.hasChildren && (
              <IconButton size="small">
                <KeyboardArrowDownIcon />
              </IconButton>
            )}
          </ListItem>
          {folder.hasChildren && renderFolderTree(folders, level + 1)}
        </React.Fragment>
      ));
  };

  // Drawer content
  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar>
        <Button
          variant="contained"
          startIcon={<CreateIcon />}
          fullWidth
          size="large"
          onClick={handleCompose}
          sx={{ borderRadius: 2 }}
        >
          Compose
        </Button>
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
        {renderFolderTree(folders)}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box'
          }
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* App Bar */}
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            {isMobile && (
              <IconButton
                edge="start"
                onClick={() => setDrawerOpen(true)}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            {/* Search Bar */}
            <TextField
              placeholder="Search emails..."
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              sx={{ flexGrow: 1, maxWidth: 600 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            
            {/* Actions */}
            <Box sx={{ ml: 2, display: 'flex', gap: 1 }}>
              <IconButton onClick={refreshEmails} disabled={refreshing}>
                {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
              </IconButton>
              
              {selectedEmails.length > 0 && (
                <>
                  <IconButton onClick={handleDelete}>
                    <DeleteIcon />
                  </IconButton>
                  <IconButton onClick={() => handleMarkAsRead(true)}>
                    <DraftsIcon />
                  </IconButton>
                  <IconButton
                    onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                  <Menu
                    anchorEl={moreMenuAnchor}
                    open={Boolean(moreMenuAnchor)}
                    onClose={() => setMoreMenuAnchor(null)}
                  >
                    <MenuItem onClick={() => handleMarkAsRead(false)}>
                      Mark as unread
                    </MenuItem>
                    <MenuItem onClick={() => handleMove('Archive')}>
                      Archive
                    </MenuItem>
                    <MenuItem onClick={() => handleMove('Spam')}>
                      Mark as spam
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Box>
          </Toolbar>
        </AppBar>

        {/* Email List and Viewer */}
        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          {/* Email List */}
          <Paper
            sx={{
              width: isTablet ? '100%' : '40%',
              minWidth: 350,
              overflow: 'auto',
              borderRight: 1,
              borderColor: 'divider',
              display: isMobile && selectedEmail ? 'none' : 'block'
            }}
          >
            {/* Selection Bar */}
            {emails.length > 0 && (
              <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Checkbox
                    checked={selectedEmails.length === emails.length}
                    indeterminate={selectedEmails.length > 0 && selectedEmails.length < emails.length}
                    onChange={selectAllEmails}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {selectedEmails.length > 0 
                      ? `${selectedEmails.length} selected`
                      : `${totalEmails} emails`
                    }
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Email List */}
            <List sx={{ p: 0 }}>
              {loading && emails.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <CircularProgress />
                </Box>
              ) : emails.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No emails found
                  </Typography>
                </Box>
              ) : (
                emails.map((email) => (
                  <ListItem
                    key={email.id}
                    onClick={() => handleSelectEmail(email)}
                    sx={{
                      borderBottom: 1,
                      borderColor: 'divider',
                      cursor: 'pointer',
                      bgcolor: selectedEmail?.id === email.id ? 'action.selected' : !email.flags.includes('SEEN') ? 'action.hover' : 'inherit',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        checked={selectedEmails.includes(email.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleEmailSelection(email.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </ListItemIcon>
                    
                    <ListItemIcon>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStar(email);
                        }}
                      >
                        {email.flags.includes('FLAGGED') ? (
                          <StarIcon color="warning" />
                        ) : (
                          <StarBorderIcon />
                        )}
                      </IconButton>
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: !email.flags?.includes('\\Seen') ? 'bold' : 'normal',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1
                            }}
                          >
                            {email.from?.name || email.from?.address || 'Unknown'}
                          </Typography>
                          {email.attachments && email.attachments.length > 0 && (
                            <AttachFileIcon fontSize="small" color="action" />
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {formatEmailDate(email.date)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            sx={{
                              fontWeight: !email.flags?.includes('\\Seen') ? 'bold' : 'normal',
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {email.subject || '(No subject)'}
                          </Typography>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {email.snippet || email.text?.substring(0, 100) || ''}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))
              )}
              
              {/* Load More */}
              {hasMore && !loading && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Button onClick={() => setPage(prev => prev + 1)}>
                    Load More
                  </Button>
                </Box>
              )}
            </List>
          </Paper>

          {/* Email Viewer */}
          {!isTablet && (
            <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
              {selectedEmail ? (
                <EmailViewerProfessional
                  email={selectedEmail}
                  onReply={() => handleReply(selectedEmail)}
                  onForward={() => handleForward(selectedEmail)}
                  onDelete={() => handleDelete()}
                  onStar={() => handleStar(selectedEmail)}
                  onMove={(folder) => handleMove(folder)}
                />
              ) : (
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="h6" color="text.secondary">
                    Select an email to read
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Compose Button (Mobile) */}
      {isMobile && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleCompose}
        >
          <CreateIcon />
        </Fab>
      )}

      {/* Email Composer */}
      <EmailComposerProfessional
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        mode={composerMode}
        replyTo={replyToEmail}
        onSend={() => {
          showSnackbar('Email sent successfully', 'success');
          refreshEmails();
        }}
      />

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
    </Box>
  );
};

export default EmailClientProfessional;