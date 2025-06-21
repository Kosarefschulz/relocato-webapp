import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Typography,
  Chip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Description as DescriptionIcon,
  Receipt as ReceiptIcon,
  CalendarMonth as CalendarIcon,
  PhotoLibrary as PhotoIcon,
  TrendingUp as SalesIcon,
  Assignment as DispositionIcon,
  AdminPanelSettings as AdminIcon,
  Analytics as AnalyticsIcon,
  Article as TemplateIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

interface MenuItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavigationMenuProps {
  mobile?: boolean;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({ mobile = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: <DashboardIcon />
    },
    {
      title: 'E-Mail',
      path: '/email',
      icon: <EmailIcon />,
      badge: 'PRO'
    },
    {
      title: 'Kunden',
      path: '/customers',
      icon: <PeopleIcon />
    },
    {
      title: 'Angebote',
      path: '/quotes',
      icon: <DescriptionIcon />
    },
    {
      title: 'Rechnungen',
      path: '/invoices',
      icon: <ReceiptIcon />
    },
    {
      title: 'Kalender',
      path: '/calendar',
      icon: <CalendarIcon />
    },
    {
      title: 'Foto-Galerie',
      path: '/gallery',
      icon: <PhotoIcon />,
      badge: 'NEU'
    },
    {
      title: 'Vertrieb',
      path: '/sales',
      icon: <SalesIcon />
    },
    {
      title: 'Disposition',
      path: '/disposition',
      icon: <DispositionIcon />
    },
    {
      title: 'Analytics',
      path: '/analytics',
      icon: <AnalyticsIcon />,
      badge: 'BETA'
    }
  ];

  const adminItems: MenuItem[] = [
    {
      title: 'Admin Tools',
      path: '/admin-tools',
      icon: <AdminIcon />,
      badge: 'NEU'
    },
    {
      title: 'Angebots-Templates',
      path: '/templates',
      icon: <TemplateIcon />
    },
    {
      title: 'E-Mail Vorlagen',
      path: '/email-templates',
      icon: <EmailIcon />
    },
    {
      title: 'Follow-ups',
      path: '/follow-ups',
      icon: <ScheduleIcon />
    },
    {
      title: 'Import Tool',
      path: '/admin-import',
      icon: <AdminIcon />
    },
    {
      title: 'Import Monitor',
      path: '/import-monitor',
      icon: <AnalyticsIcon />
    },
    {
      title: 'Import Einstellungen',
      path: '/import-settings',
      icon: <EmailIcon />
    }
  ];

  return (
    <Paper sx={{ 
      width: mobile ? '100%' : 240, 
      height: '100%', 
      borderRadius: 0,
      boxShadow: mobile ? 'none' : '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
      bgcolor: mobile ? 'transparent' : 'rgba(255, 255, 255, 0.25)',
      backdropFilter: mobile ? 'none' : 'blur(10px)',
      WebkitBackdropFilter: mobile ? 'none' : 'blur(10px)',
      border: mobile ? 'none' : '1px solid rgba(255, 255, 255, 0.18)',
      // Fallback für Browser ohne backdrop-filter
      '@supports not (backdrop-filter: blur(10px))': {
        bgcolor: mobile ? 'transparent' : 'rgba(255, 255, 255, 0.9)'
      }
    }}>
      {!mobile && (
        <Box sx={{ 
          p: 2,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 'bold',
            color: 'primary.main',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            RELOCATO®
          </Typography>
          <Typography variant="caption" sx={{
            color: 'text.secondary',
            fontWeight: 500
          }}>
            Umzugsmanagement
          </Typography>
        </Box>
      )}
      
      
      <List sx={{ pt: mobile ? 0 : 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                py: mobile ? 1.5 : 1.2,
                px: mobile ? 3 : 2,
                mx: mobile ? 0 : 1,
                my: 0.5,
                borderRadius: mobile ? 0 : 2,
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease'
                },
                '&.Mui-selected': {
                  backgroundColor: mobile ? 'action.selected' : 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: mobile ? 'none' : 'blur(5px)',
                  WebkitBackdropFilter: mobile ? 'none' : 'blur(5px)',
                  color: mobile ? 'primary.main' : 'primary.main',
                  borderLeft: mobile ? `4px solid ${theme => theme.palette.primary.main}` : 'none',
                  boxShadow: mobile ? 'none' : '0 4px 20px 0 rgba(31, 38, 135, 0.1)',
                  border: mobile ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                  '&::before': {
                    opacity: 1
                  },
                  '& .MuiListItemIcon-root': {
                    color: mobile ? 'primary.main' : 'primary.main'
                  },
                  '&:hover': {
                    backgroundColor: mobile ? 'action.selected' : 'rgba(255, 255, 255, 0.2)'
                  }
                },
                '&:hover': {
                  backgroundColor: mobile ? 'action.hover' : 'rgba(255, 255, 255, 0.1)',
                  transform: mobile ? 'none' : 'translateX(4px)',
                  '&::before': {
                    opacity: 0.5
                  }
                }
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.title} />
              {item.badge && (
                <Chip 
                  label={item.badge} 
                  size="small" 
                  sx={{ 
                    height: 20, 
                    fontSize: '0.7rem',
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'primary.main',
                    backdropFilter: 'blur(5px)',
                    WebkitBackdropFilter: 'blur(5px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ 
        my: 2, 
        mx: 2, 
        height: 1, 
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' 
      }} />
      
      <List>
        <ListItem>
          <Typography variant="overline" sx={{
            color: 'text.secondary',
            px: 1,
            fontWeight: 600,
            letterSpacing: 1.5
          }}>
            Administration
          </Typography>
        </ListItem>
        {adminItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                py: 1.2,
                px: 2,
                mx: 1,
                my: 0.5,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease'
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(5px)',
                  WebkitBackdropFilter: 'blur(5px)',
                  color: 'primary.main',
                  boxShadow: '0 4px 20px 0 rgba(31, 38, 135, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  '&::before': {
                    opacity: 1
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main'
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                  }
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  transform: 'translateX(4px)',
                  '&::before': {
                    opacity: 0.5
                  }
                }
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.title} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default NavigationMenu;