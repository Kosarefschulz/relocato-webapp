import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Avatar,
  Chip,
  Button,
  Divider,
  Menu,
  MenuItem,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Link,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  MoreVert as MoreVertIcon,
  Print as PrintIcon,
  Archive as ArchiveIcon,
  Label as LabelIcon,
  ReportGmailerrorred as SpamIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  OpenInNew as OpenInNewIcon,
  Person as PersonIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Link as LinkIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { Email } from '../types/email';
import { format } from 'date-fns';
import EmailToCustomerDialog from './EmailToCustomerDialog';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';

interface EmailViewerProfessionalProps {
  email: Email;
  onReply: () => void;
  onForward: () => void;
  onDelete: () => void;
  onStar: () => void;
  onMove: (folder: string) => void;
}

const EmailViewerProfessional: React.FC<EmailViewerProfessionalProps> = ({
  email,
  onReply,
  onForward,
  onDelete,
  onStar,
  onMove
}) => {
  const navigate = useNavigate();
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [downloadingAttachment, setDownloadingAttachment] = useState<string | null>(null);
  const [linkCustomerDialogOpen, setLinkCustomerDialogOpen] = useState(false);
  const [linkedCustomer, setLinkedCustomer] = useState<any>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);

  // Format email date
  const formatEmailDate = (date: Date | string) => {
    return format(new Date(date), 'PPpp');
  };

  // Get sender initials
  const getSenderInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return '?';
  };

  // Get sender color
  const getSenderColor = (email?: string) => {
    if (!email) return '#ccc';
    const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = ['#1976d2', '#388e3c', '#d32f2f', '#f57c00', '#7b1fa2'];
    return colors[hash % colors.length];
  };

  // Load linked customer
  useEffect(() => {
    loadLinkedCustomer();
  }, [email.id]);

  const loadLinkedCustomer = async () => {
    try {
      setLoadingCustomer(true);
      
      // Check if email is linked to a customer
      const linksQuery = query(
        collection(db, 'emailCustomerLinks'),
        where('emailId', '==', email.id)
      );
      const linksSnapshot = await getDocs(linksQuery);
      
      if (!linksSnapshot.empty) {
        const link = linksSnapshot.docs[0].data();
        const customerDoc = await getDoc(doc(db, 'customers', link.customerId));
        
        if (customerDoc.exists()) {
          setLinkedCustomer({
            id: customerDoc.id,
            ...customerDoc.data()
          });
        }
      }
    } catch (error) {
      console.error('Error loading linked customer:', error);
    } finally {
      setLoadingCustomer(false);
    }
  };

  // Handle customer linked
  const handleCustomerLinked = (customerId: string) => {
    loadLinkedCustomer();
    navigate(`/customer-details/${customerId}`);
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle download attachment
  const handleDownloadAttachment = async (attachment: any) => {
    setDownloadingAttachment(attachment.filename);
    try {
      // Implementation to download attachment
      console.log('Downloading:', attachment.filename);
    } catch (error) {
      console.error('Failed to download attachment:', error);
    } finally {
      setDownloadingAttachment(null);
    }
  };

  // Extract email content
  const getEmailContent = () => {
    // Check if content is still loading (no html and no text)
    if (!email.html && !email.text && !email.textAsHtml) {
      setLoadingContent(true);
      return { __html: '<div style="text-align: center; padding: 20px;">Loading email content...</div>' };
    }
    
    setLoadingContent(false);
    
    if (email.html) {
      return { __html: email.html };
    }
    if (email.textAsHtml) {
      return { __html: email.textAsHtml };
    }
    if (email.text) {
      return { __html: email.text.replace(/\n/g, '<br>') };
    }
    return { __html: '<p>No content available</p>' };
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Email Header */}
      <Paper elevation={0} sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <IconButton onClick={onReply}>
            <ReplyIcon />
          </IconButton>
          <IconButton onClick={onForward}>
            <ForwardIcon />
          </IconButton>
          <IconButton onClick={onDelete}>
            <DeleteIcon />
          </IconButton>
          <IconButton onClick={onStar}>
            {email.flags.includes('FLAGGED') ? (
              <StarIcon color="warning" />
            ) : (
              <StarBorderIcon />
            )}
          </IconButton>
          <IconButton onClick={() => onMove('Archive')}>
            <ArchiveIcon />
          </IconButton>
          <IconButton onClick={() => onMove('Spam')}>
            <SpamIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={handlePrint}>
            <PrintIcon />
          </IconButton>
          <IconButton onClick={(e) => setMoreMenuAnchor(e.currentTarget)}>
            <MoreVertIcon />
          </IconButton>
        </Box>
        
        <Typography variant="h5" gutterBottom>
          {email.subject || '(No subject)'}
        </Typography>
        
        {/* Labels */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {email.flags.includes('FLAGGED') && (
            <Chip label="Starred" size="small" color="warning" />
          )}
          {!email.flags.includes('SEEN') && (
            <Chip label="Unread" size="small" color="primary" />
          )}
          {email.flags.includes('ANSWERED') && (
            <Chip label="Replied" size="small" />
          )}
        </Box>
      </Paper>

      {/* Email Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {/* Sender Info */}
        <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: getSenderColor(email.from?.address),
                width: 48,
                height: 48
              }}
            >
              {getSenderInitials(email.from?.name, email.from?.address)}
            </Avatar>
            
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {email.from?.name || email.from?.address || 'Unknown sender'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatEmailDate(email.date)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  to {Array.isArray(email.to) ? email.to.map(t => t.name || t.address).join(', ') : 'No recipients'}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={showDetails}>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>From:</strong> {email.from?.address}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>To:</strong> {Array.isArray(email.to) ? email.to.map(t => t.address).join(', ') : 'No recipients'}
                  </Typography>
                  {Array.isArray(email.cc) && email.cc.length > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Cc:</strong> {email.cc.map(c => c.address).join(', ')}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    <strong>Date:</strong> {formatEmailDate(email.date)}
                  </Typography>
                  {email.messageId && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Message-ID:</strong> {email.messageId}
                    </Typography>
                  )}
                </Box>
              </Collapse>
            </Box>
          </Box>
        </Paper>

        {/* Customer Link Section */}
        <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
          {loadingCustomer ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Lade Kundenverknüpfung...</Typography>
            </Box>
          ) : linkedCustomer ? (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Verknüpfter Kunde:
              </Typography>
              <Card variant="outlined" sx={{ mt: 1 }}>
                <CardContent sx={{ py: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {linkedCustomer.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1">
                        {linkedCustomer.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {linkedCustomer.company && `${linkedCustomer.company} • `}
                        {linkedCustomer.email}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<PersonIcon />}
                    onClick={() => navigate(`/customer-details/${linkedCustomer.id}`)}
                  >
                    Kunde anzeigen
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ) : (
            <Alert 
              severity="info" 
              action={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    size="small" 
                    startIcon={<LinkIcon />}
                    onClick={() => setLinkCustomerDialogOpen(true)}
                  >
                    Kunde verknüpfen
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<PersonAddIcon />}
                    onClick={() => setLinkCustomerDialogOpen(true)}
                  >
                    Kunde erstellen
                  </Button>
                </Box>
              }
            >
              Diese E-Mail ist noch keinem Kunden zugeordnet.
            </Alert>
          )}
        </Paper>

        {/* Email Body */}
        <Paper elevation={0} sx={{ p: 3, mb: 2 }}>
          {loadingContent ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              className="email-content"
              dangerouslySetInnerHTML={getEmailContent()}
              sx={{
                '& img': {
                  maxWidth: '100%',
                  height: 'auto'
                },
                '& a': {
                  color: theme => theme.palette.primary.main,
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                },
                '& blockquote': {
                  borderLeft: '4px solid #ccc',
                  marginLeft: 0,
                  paddingLeft: '16px',
                  color: 'text.secondary'
                },
                '& pre': {
                  backgroundColor: 'grey.100',
                  padding: 2,
                  borderRadius: 1,
                  overflow: 'auto'
                }
              }}
            />
          )}
        </Paper>

        {/* Attachments */}
        {email.attachments && email.attachments.length > 0 && (
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Attachments ({email.attachments.length})
            </Typography>
            <List>
              {email.attachments.map((attachment, index) => (
                <ListItem
                  key={index}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1
                  }}
                >
                  <ListItemIcon>
                    <AttachFileIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={attachment.filename}
                    secondary={`${(attachment.size / 1024).toFixed(2)} KB`}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      onClick={() => handleDownloadAttachment(attachment)}
                      disabled={downloadingAttachment === attachment.filename}
                    >
                      {downloadingAttachment === attachment.filename ? (
                        <CircularProgress size={20} />
                      ) : (
                        <DownloadIcon />
                      )}
                    </IconButton>
                    <IconButton>
                      <OpenInNewIcon />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      {/* Quick Reply */}
      <Paper elevation={0} sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ReplyIcon />}
            onClick={onReply}
            fullWidth
          >
            Reply
          </Button>
          <Button
            variant="outlined"
            startIcon={<ForwardIcon />}
            onClick={onForward}
            fullWidth
          >
            Forward
          </Button>
        </Box>
      </Paper>

      {/* More Menu */}
      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={() => setMoreMenuAnchor(null)}
      >
        <MenuItem onClick={() => onMove('Inbox')}>
          Move to Inbox
        </MenuItem>
        <MenuItem onClick={() => onMove('Important')}>
          Mark as Important
        </MenuItem>
        <MenuItem>
          Add Label
        </MenuItem>
        <Divider />
        <MenuItem>
          Filter messages like this
        </MenuItem>
        <MenuItem>
          Block sender
        </MenuItem>
        <MenuItem>
          Report phishing
        </MenuItem>
        <Divider />
        <MenuItem>
          Show original
        </MenuItem>
        <MenuItem>
          Download message
        </MenuItem>
      </Menu>

      {/* Email to Customer Dialog */}
      <EmailToCustomerDialog
        open={linkCustomerDialogOpen}
        onClose={() => setLinkCustomerDialogOpen(false)}
        email={email}
        onCustomerLinked={handleCustomerLinked}
      />
    </Box>
  );
};

export default EmailViewerProfessional;