'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  Chip,
  useTheme
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
  Error as ErrorIcon,
  WhatsApp as WhatsAppIcon,
  Search as SearchIcon,
  Add as AddIcon
} from '@mui/icons-material';

interface MenuItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  category?: string;
}

interface NavigationMenuProps {
  onNavigate?: () => void;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({ onNavigate }) => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  const mainMenuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: <DashboardIcon />,
      category: 'main'
    },
    {
      title: 'Kunde suchen',
      path: '/search-customer',
      icon: <SearchIcon />,
      category: 'main'
    },
    {
      title: 'Neuer Kunde',
      path: '/new-customer',
      icon: <AddIcon />,
      category: 'main'
    }
  ];

  const businessMenuItems: MenuItem[] = [
    {
      title: 'Kunden',
      path: '/customers',
      icon: <PeopleIcon />,
      category: 'business'
    },
    {
      title: 'Angebote',
      path: '/quotes',
      icon: <DescriptionIcon />,
      badge: '12',
      category: 'business'
    },
    {
      title: 'Buchhaltung',
      path: '/accounting',
      icon: <ReceiptIcon />,
      category: 'business'
    },
    {
      title: 'Kalender',
      path: '/calendar',
      icon: <CalendarIcon />,
      category: 'business'
    }
  ];

  const toolsMenuItems: MenuItem[] = [
    {
      title: 'E-Mail Client',
      path: '/email-client',
      icon: <EmailIcon />,
      badge: '5',
      category: 'tools'
    },
    {
      title: 'WhatsApp',
      path: '/whatsapp',
      icon: <WhatsAppIcon />,
      badge: '3',
      category: 'tools'
    },
    {
      title: 'Vertrieb',
      path: '/sales',
      icon: <SalesIcon />,
      category: 'tools'
    },
    {
      title: 'Admin Tools',
      path: '/admin-tools',
      icon: <AdminIcon />,
      category: 'tools'
    }
  ];

  const handleNavigate = (path: string) => {
    router.push(path);
    if (onNavigate) {
      onNavigate();
    }
  };

  const isActive = (path: string) => {
    return pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
  };

  const renderMenuSection = (title: string, items: MenuItem[]) => (
    <Box sx={{ mb: 2 }}>
      <Typography 
        variant="overline" 
        sx={{ 
          px: 2, 
          color: 'text.secondary',
          fontWeight: 'bold',
          fontSize: '0.75rem'
        }}
      >
        {title}
      </Typography>
      <List dense>
        {items.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => handleNavigate(item.path)}
              selected={isActive(item.path)}
              sx={{
                mx: 1,
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main + '15',
                  color: theme.palette.primary.main,
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main,
                  },
                  '&:hover': {
                    backgroundColor: theme.palette.primary.main + '25',
                  }
                },
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.title}
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: isActive(item.path) ? 600 : 400
                }}
              />
              {item.badge && (
                <Chip 
                  label={item.badge} 
                  size="small" 
                  sx={{ 
                    height: 20,
                    fontSize: '0.7rem',
                    backgroundColor: theme.palette.error.main,
                    color: 'white'
                  }} 
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      pt: 1
    }}>
      {renderMenuSection('Hauptfunktionen', mainMenuItems)}
      <Divider sx={{ mx: 2, my: 1 }} />
      {renderMenuSection('Geschäft', businessMenuItems)}
      <Divider sx={{ mx: 2, my: 1 }} />
      {renderMenuSection('Tools', toolsMenuItems)}
      
      {/* Version Info */}
      <Box sx={{ mt: 'auto', p: 2 }}>
        <Paper sx={{ p: 1.5, backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            Next.js 15.5 + React 19
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', opacity: 0.8 }}>
            Turbopack aktiv
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default NavigationMenu;