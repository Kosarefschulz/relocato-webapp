import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  Chip,
  ListItemIcon,
  ListItemText,
  Paper,
  alpha,
  useTheme
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  CheckCircle as CheckCircleIcon,
  Email as EmailIcon,
  Description as DescriptionIcon,
  Receipt as ReceiptIcon,
  Circle as CircleIcon,
  Done as DoneIcon,
  DoneAll as DoneAllIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { notificationService, type Notification } from '../services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

const NotificationCenter: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Lade initiale Benachrichtigungen
    loadNotifications();

    // Abonniere Echtzeit-Updates
    const unsubscribe = notificationService.subscribeToNotifications((newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.length);
      
      // Zeige Browser-Benachrichtigung für neue High-Priority Notifications
      const highPriorityNew = newNotifications.filter(n => n.priority === 'high');
      if (typeof Notification !== 'undefined' && highPriorityNew.length > 0 && Notification.permission === 'granted') {
        highPriorityNew.forEach(notification => {
          try {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/logo192.png'
            });
          } catch (error) {
            console.log('Failed to show notification:', error);
          }
        });
      }
    });

    // Browser-Benachrichtigungen anfragen
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(error => {
        console.log('Failed to request notification permission:', error);
      });
    }

    return () => unsubscribe();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const [unreadNotifs, allNotifs] = await Promise.all([
        notificationService.getUnreadNotifications(),
        notificationService.getAllNotifications(20)
      ]);
      setNotifications(unreadNotifs.length > 0 ? unreadNotifs : allNotifs.slice(0, 5));
      setUnreadCount(unreadNotifs.length);
    } catch (error) {
      console.error('Fehler beim Laden der Benachrichtigungen:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.id && !notification.read) {
      await notificationService.markAsRead(notification.id);
      setUnreadCount(Math.max(0, unreadCount - 1));
    }
    
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    
    handleClose();
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setUnreadCount(0);
    await loadNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'quote_confirmed':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'new_customer':
        return <DescriptionIcon fontSize="small" color="primary" />;
      case 'quote_sent':
        return <EmailIcon fontSize="small" color="info" />;
      case 'invoice_created':
        return <ReceiptIcon fontSize="small" color="warning" />;
      default:
        return <NotificationsIcon fontSize="small" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="large"
        aria-label={`${unreadCount} neue Benachrichtigungen`}
        color="inherit"
      >
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? (
            <NotificationsActiveIcon />
          ) : (
            <NotificationsIcon />
          )}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Benachrichtigungen</Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                startIcon={<DoneAllIcon />}
                onClick={handleMarkAllAsRead}
              >
                Alle als gelesen markieren
              </Button>
            )}
          </Box>
        </Box>
        
        <Divider />
        
        {loading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Lade Benachrichtigungen...
            </Typography>
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Keine neuen Benachrichtigungen
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
            {notifications.map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  py: 2,
                  px: 2,
                  backgroundColor: notification.read 
                    ? 'transparent' 
                    : alpha(theme.palette.primary.main, 0.05),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  },
                }}
              >
                <ListItemIcon>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: notification.read ? 400 : 600 }}>
                        {notification.title}
                      </Typography>
                      {!notification.read && (
                        <CircleIcon sx={{ fontSize: 8, color: 'primary.main' }} />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {notification.message}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.disabled">
                          {formatDistanceToNow(notification.createdAt, { 
                            addSuffix: true, 
                            locale: de 
                          })}
                        </Typography>
                        {notification.priority !== 'low' && (
                          <Chip
                            label={notification.priority === 'high' ? 'Wichtig' : 'Mittel'}
                            size="small"
                            color={getPriorityColor(notification.priority) as any}
                            sx={{ height: 16, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </>
                  }
                />
              </MenuItem>
            ))}
          </Box>
        )}
        
        <Divider />
        
        <Box sx={{ p: 1 }}>
          <Button
            fullWidth
            size="small"
            onClick={() => {
              handleClose();
              navigate('/notifications');
            }}
          >
            Alle Benachrichtigungen anzeigen
          </Button>
        </Box>
      </Menu>
    </>
  );
};

export default NotificationCenter;