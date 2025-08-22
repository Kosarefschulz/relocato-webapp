'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  BottomNavigation as MuiBottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge,
  useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Description as DescriptionIcon,
  Email as EmailIcon,
  Add as AddIcon
} from '@mui/icons-material';

const BottomNavigation: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  // Map paths to values
  const pathToValue: { [key: string]: number } = {
    '/dashboard': 0,
    '/customers': 1,
    '/search-customer': 2,
    '/new-customer': 2,
    '/quotes': 3,
    '/email': 4,
    '/email-client': 4
  };

  // Get current value based on path
  const getCurrentValue = () => {
    const path = pathname;
    for (const [key, value] of Object.entries(pathToValue)) {
      if (path.startsWith(key)) {
        return value;
      }
    }
    return 0; // Default to dashboard
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    const paths = ['/dashboard', '/customers', '/search-customer', '/quotes', '/email-client'];
    const targetPath = paths[newValue];
    if (targetPath) {
      router.push(targetPath);
    }
  };

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0,
        zIndex: theme.zIndex.appBar,
        borderTop: '1px solid',
        borderColor: 'divider'
      }} 
      elevation={8}
    >
      <MuiBottomNavigation
        value={getCurrentValue()}
        onChange={handleChange}
        showLabels
        sx={{
          '& .MuiBottomNavigationAction-root': {
            minWidth: 0,
            paddingTop: '8px',
            paddingBottom: '8px',
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.7rem',
            fontWeight: 500,
          },
          '& .Mui-selected': {
            color: theme.palette.primary.main,
          }
        }}
      >
        <BottomNavigationAction
          label="Dashboard"
          icon={<DashboardIcon />}
        />
        <BottomNavigationAction
          label="Kunden"
          icon={<PeopleIcon />}
        />
        <BottomNavigationAction
          label="Suchen"
          icon={<AddIcon />}
        />
        <BottomNavigationAction
          label="Angebote"
          icon={
            <Badge badgeContent={12} color="error" max={99}>
              <DescriptionIcon />
            </Badge>
          }
        />
        <BottomNavigationAction
          label="E-Mail"
          icon={
            <Badge badgeContent={5} color="error" max={99}>
              <EmailIcon />
            </Badge>
          }
        />
      </MuiBottomNavigation>
    </Paper>
  );
};

export default BottomNavigation;