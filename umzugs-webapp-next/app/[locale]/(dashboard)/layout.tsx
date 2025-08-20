'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Description,
  CalendarMonth,
  FolderOpen,
  Settings,
  Notifications,
  Logout,
  ChevronLeft,
} from '@mui/icons-material';
import { TypedLink } from '@/lib/navigation';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { useRouter } from 'next/navigation';

const drawerWidth = 260;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const t = useTranslations('navigation');
  const pathname = usePathname();
  const { user, supabase } = useSupabase();
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    router.push('/login');
  };

  const menuItems = [
    { text: t('dashboard'), icon: <Dashboard />, href: '/dashboard' },
    { text: t('customers'), icon: <People />, href: '/customers' },
    { text: t('quotes'), icon: <Description />, href: '/quotes' },
    { text: t('calendar'), icon: <CalendarMonth />, href: '/calendar' },
    { text: t('documents'), icon: <FolderOpen />, href: '/documents' },
    { text: t('settings'), icon: <Settings />, href: '/settings' },
  ];

  // Extract locale from pathname
  const locale = pathname.split('/')[1];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          transition: (theme) =>
            theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          ...(open && {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            transition: (theme) =>
              theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ marginRight: 2 }}
          >
            {open ? <ChevronLeft /> : <MenuIcon />}
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Relocato CRM
          </Typography>
          
          <IconButton color="inherit" sx={{ mr: 2 }}>
            <Badge badgeContent={4} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          
          <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0 }}>
            <Avatar alt={user?.email} src={user?.user_metadata?.avatar_url}>
              {user?.email?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleProfileMenuClose}>
              <Typography>{user?.email}</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => router.push(`/${locale}/settings/profile`)}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              Profil
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              {t('logout')}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : 64,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : 64,
            boxSizing: 'border-box',
            transition: (theme) =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: open
                  ? theme.transitions.duration.enteringScreen
                  : theme.transitions.duration.leavingScreen,
              }),
            overflowX: 'hidden',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => {
              const isActive = pathname.includes(item.href);
              return (
                <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                  <TypedLink href={`/${locale}${item.href}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <ListItemButton
                      sx={{
                        minHeight: 48,
                        justifyContent: open ? 'initial' : 'center',
                        px: 2.5,
                        backgroundColor: isActive ? 'action.selected' : 'transparent',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: open ? 3 : 'auto',
                          justifyContent: 'center',
                          color: isActive ? 'primary.main' : 'inherit',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        sx={{
                          opacity: open ? 1 : 0,
                          color: isActive ? 'primary.main' : 'inherit',
                        }}
                      />
                    </ListItemButton>
                  </TypedLink>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          transition: (theme) =>
            theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          marginLeft: open ? 0 : `-${drawerWidth - 64}px`,
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}