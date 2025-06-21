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
      boxShadow: 'none',
      bgcolor: mobile ? 'transparent' : 'background.paper'
    }}>
      {!mobile && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            RELOCATO®
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Umzugsmanagement
          </Typography>
        </Box>
      )}
      
      {!mobile && <Divider />}
      
      <List sx={{ pt: mobile ? 0 : 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                py: mobile ? 1.5 : 1,
                px: mobile ? 3 : 2,
                '&.Mui-selected': {
                  backgroundColor: mobile ? 'action.selected' : 'primary.main',
                  color: mobile ? 'primary.main' : 'primary.contrastText',
                  borderLeft: mobile ? `4px solid ${theme => theme.palette.primary.main}` : 'none',
                  '& .MuiListItemIcon-root': {
                    color: mobile ? 'primary.main' : 'primary.contrastText'
                  },
                  '&:hover': {
                    backgroundColor: mobile ? 'action.selected' : 'primary.dark'
                  }
                },
                '&:hover': {
                  backgroundColor: mobile ? 'action.hover' : 'rgba(0, 0, 0, 0.04)'
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
                  color="secondary"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      <List>
        <ListItem>
          <Typography variant="overline" color="text.secondary">
            Administration
          </Typography>
        </ListItem>
        {adminItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
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