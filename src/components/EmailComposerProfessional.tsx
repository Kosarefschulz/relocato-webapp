import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Typography,
  Tooltip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Menu,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  FormatBold as FormatBoldIcon,
  FormatItalic as FormatItalicIcon,
  FormatUnderlined as FormatUnderlinedIcon,
  FormatListBulleted as FormatListBulletedIcon,
  FormatListNumbered as FormatListNumberedIcon,
  FormatQuote as FormatQuoteIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  MoreVert as MoreVertIcon,
  Schedule as ScheduleIcon,
  LowPriority as LowPriorityIcon,
  PriorityHigh as PriorityHighIcon,
  Code as CodeIcon,
  FormatAlignLeft as FormatAlignLeftIcon,
  FormatAlignCenter as FormatAlignCenterIcon,
  FormatAlignRight as FormatAlignRightIcon
} from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Email } from '../types/email';
import { ionosEmailService as emailService } from '../services/emailServiceIONOS';

interface EmailComposerProfessionalProps {
  open: boolean;
  onClose: () => void;
  onSend: () => void;
  mode?: 'new' | 'reply' | 'forward';
  replyTo?: Email | null;
}

interface Attachment {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  uploading: boolean;
  error?: string;
}

const EmailComposerProfessional: React.FC<EmailComposerProfessionalProps> = ({
  open,
  onClose,
  onSend,
  mode = 'new',
  replyTo
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [to, setTo] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [priority, setPriority] = useState<'high' | 'normal' | 'low'>('normal');
  const [scheduleMenuAnchor, setScheduleMenuAnchor] = useState<null | HTMLElement>(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const [emailError, setEmailError] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | ''>('');

  // Quill modules
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false
    }
  };

  // Quill formats
  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'blockquote', 'code-block',
    'list', 'bullet',
    'align',
    'link', 'image'
  ];

  // Initialize composer based on mode
  useEffect(() => {
    if (open) {
      if (mode === 'reply' && replyTo) {
        setTo([replyTo.from?.address || '']);
        setSubject(`Re: ${replyTo.subject}`);
        setContent(getReplyContent(replyTo));
      } else if (mode === 'forward' && replyTo) {
        setSubject(`Fwd: ${replyTo.subject}`);
        setContent(getForwardContent(replyTo));
      } else {
        // Reset for new email
        setTo([]);
        setCc([]);
        setBcc([]);
        setSubject('');
        setContent('');
        setAttachments([]);
        setShowCc(false);
        setShowBcc(false);
        setPriority('normal');
      }
    }
  }, [open, mode, replyTo]);

  // Auto-save draft
  useEffect(() => {
    if (open && (to.length > 0 || subject || content)) {
      const timer = setTimeout(() => {
        saveDraft();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [to, cc, bcc, subject, content]);

  // Get reply content
  const getReplyContent = (email: Email): string => {
    const date = new Date(email.date).toLocaleString();
    const from = email.from?.name || email.from?.address || 'Unknown';
    
    return `<br><br><div style="border-left: 2px solid #ccc; padding-left: 10px; margin-left: 10px;">
      <p>On ${date}, ${from} wrote:</p>
      ${email.html || email.text || ''}
    </div>`;
  };

  // Get forward content
  const getForwardContent = (email: Email): string => {
    const date = new Date(email.date).toLocaleString();
    const from = email.from?.name || email.from?.address || 'Unknown';
    const to = Array.isArray(email.to) ? email.to.map(t => t.address).join(', ') : '';
    
    return `<br><br><div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
      <p><strong>---------- Forwarded message ----------</strong></p>
      <p><strong>From:</strong> ${from}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Subject:</strong> ${email.subject}</p>
      <p><strong>To:</strong> ${to}</p>
      <br>
      ${email.html || email.text || ''}
    </div>`;
  };

  // Validate email
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Handle email input
  const handleEmailInput = (value: string[], setter: (value: string[]) => void) => {
    const validEmails = value.filter(email => {
      if (!validateEmail(email)) {
        setEmailError(`Invalid email: ${email}`);
        return false;
      }
      return true;
    });
    
    if (validEmails.length === value.length) {
      setEmailError('');
    }
    
    setter(validEmails);
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      uploading: false
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  // Remove attachment
  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Save draft
  const saveDraft = async () => {
    try {
      setAutoSaveStatus('saving');
      // Draft saving not implemented in IONOS service
      // We could save to local storage or implement a draft folder
      localStorage.setItem('emailDraft', JSON.stringify({
        to,
        cc,
        bcc,
        subject,
        html: content,
        savedAt: new Date().toISOString()
      }));
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus(''), 2000);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  // Send email
  const handleSend = async () => {
    // Validate
    if (to.length === 0) {
      setEmailError('Please add at least one recipient');
      return;
    }

    if (!subject.trim()) {
      const confirm = window.confirm('Send without subject?');
      if (!confirm) return;
    }

    try {
      setSending(true);

      // IONOS service expects a simple format
      const recipients = to.join(', ');
      
      // Process attachments for IONOS
      const processedAttachments = [];
      if (attachments.length > 0) {
        for (const att of attachments) {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onload = () => {
              const base64String = (reader.result as string).split(',')[1];
              resolve(base64String);
            };
            reader.readAsDataURL(att.file);
          });
          
          processedAttachments.push({
            filename: att.name,
            content: base64,
            encoding: 'base64'
          });
        }
      }

      // Send via IONOS service
      const success = await emailService.sendEmail(
        recipients,
        subject,
        content,
        processedAttachments
      );
      
      if (success) {
        onSend();
        handleClose();
      } else {
        setEmailError('Failed to send email. Please try again.');
      }
    } catch (error) {
      console.error('Send error:', error);
      setEmailError('Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if ((to.length > 0 || subject || content) && !sending) {
      const confirm = window.confirm('Discard draft?');
      if (!confirm) return;
    }
    onClose();
  };

  // Schedule send
  const handleScheduleSend = (time: Date) => {
    // Implementation for scheduled send
    console.log('Schedule send for:', time);
    setScheduleMenuAnchor(null);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          height: isMobile ? '100%' : '90vh',
          maxHeight: isMobile ? '100%' : '90vh'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {mode === 'reply' ? 'Reply' : mode === 'forward' ? 'Forward' : 'New Message'}
        </Typography>
        
        {autoSaveStatus && (
          <Chip
            label={autoSaveStatus === 'saving' ? 'Saving...' : 'Draft saved'}
            size="small"
            color={autoSaveStatus === 'saving' ? 'default' : 'success'}
          />
        )}
        
        <IconButton onClick={handleClose} edge="end">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ p: 2 }}>
          {/* Recipients */}
          <Box sx={{ mb: 2 }}>
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={to}
              onChange={(_, value) => handleEmailInput(value, setTo)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    size="small"
                    {...getTagProps({ index })}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="To"
                  placeholder="Add recipients"
                  error={!!emailError && to.length === 0}
                  helperText={emailError && to.length === 0 ? emailError : ''}
                />
              )}
            />
          </Box>

          {/* CC/BCC */}
          <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
            {!showCc && (
              <Button size="small" onClick={() => setShowCc(true)}>
                Add Cc
              </Button>
            )}
            {!showBcc && (
              <Button size="small" onClick={() => setShowBcc(true)}>
                Add Bcc
              </Button>
            )}
          </Box>

          {showCc && (
            <Box sx={{ mb: 2 }}>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={cc}
                onChange={(_, value) => handleEmailInput(value, setCc)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Cc"
                    placeholder="Add Cc recipients"
                  />
                )}
              />
            </Box>
          )}

          {showBcc && (
            <Box sx={{ mb: 2 }}>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={bcc}
                onChange={(_, value) => handleEmailInput(value, setBcc)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Bcc"
                    placeholder="Add Bcc recipients"
                  />
                )}
              />
            </Box>
          )}

          {/* Subject */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </Box>

          {/* Rich Text Editor */}
          <Box sx={{ mb: 2, minHeight: 300 }}>
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={quillModules}
              formats={quillFormats}
              style={{ height: '250px' }}
            />
          </Box>

          {/* Attachments */}
          {attachments.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Attachments ({attachments.length})
              </Typography>
              <List dense>
                {attachments.map(att => (
                  <ListItem key={att.id}>
                    <ListItemText
                      primary={att.name}
                      secondary={formatFileSize(att.size)}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => removeAttachment(att.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          style={{ display: 'none' }}
        />
        
        <IconButton onClick={() => fileInputRef.current?.click()}>
          <AttachFileIcon />
        </IconButton>
        
        <Box sx={{ flexGrow: 1 }} />
        
        {/* Priority */}
        <ToggleButtonGroup
          value={priority}
          exclusive
          onChange={(_, value) => value && setPriority(value)}
          size="small"
        >
          <ToggleButton value="high">
            <Tooltip title="High priority">
              <PriorityHighIcon color={priority === 'high' ? 'error' : 'inherit'} />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="normal">
            <Tooltip title="Normal priority">
              <span>=</span>
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="low">
            <Tooltip title="Low priority">
              <LowPriorityIcon color={priority === 'low' ? 'primary' : 'inherit'} />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
        
        <IconButton
          onClick={(e) => setScheduleMenuAnchor(e.currentTarget)}
        >
          <ScheduleIcon />
        </IconButton>
        
        <IconButton
          onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
        >
          <MoreVertIcon />
        </IconButton>
        
        <Button
          variant="outlined"
          onClick={saveDraft}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
        >
          Save Draft
        </Button>
        
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={sending || to.length === 0}
          startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
        >
          Send
        </Button>
      </DialogActions>
      
      {/* Schedule Menu */}
      <Menu
        anchorEl={scheduleMenuAnchor}
        open={Boolean(scheduleMenuAnchor)}
        onClose={() => setScheduleMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleScheduleSend(new Date(Date.now() + 3600000))}>
          Send in 1 hour
        </MenuItem>
        <MenuItem onClick={() => handleScheduleSend(new Date(Date.now() + 14400000))}>
          Send in 4 hours
        </MenuItem>
        <MenuItem onClick={() => handleScheduleSend(new Date(Date.now() + 86400000))}>
          Send tomorrow
        </MenuItem>
        <Divider />
        <MenuItem>Pick date & time...</MenuItem>
      </Menu>
      
      {/* More Menu */}
      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={() => setMoreMenuAnchor(null)}
      >
        <MenuItem>Request read receipt</MenuItem>
        <MenuItem>Set expiration date</MenuItem>
        <MenuItem>Add signature</MenuItem>
        <MenuItem>Encrypt email</MenuItem>
      </Menu>
    </Dialog>
  );
};

export default EmailComposerProfessional;