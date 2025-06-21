import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
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
    const path = location.pathname;
    for (const [key, value] of Object.entries(pathToValue)) {
      if (path.startsWith(key)) {
        return value;
      }
    }
    return 0; // Default to dashboard
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    const routes = ['/dashboard', '/customers', '/search-customer', '/quotes', '/email'];
    navigate(routes[newValue]);
  };

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0,
        zIndex: theme.zIndex.appBar,
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper
      }} 
      elevation={0}
    >
      <MuiBottomNavigation
        value={getCurrentValue()}
        onChange={handleChange}
        showLabels
        sx={{
          height: { xs: 56, sm: 64 },
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '6px 0',
            color: theme.palette.text.secondary,
            '&.Mui-selected': {
              color: theme.palette.primary.main,
            },
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.75rem',
            '&.Mui-selected': {
              fontSize: '0.75rem',
            },
          },
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
          label="Neu" 
          icon={
            <Paper 
              elevation={0}
              sx={{ 
                bgcolor: theme.palette.primary.main,
                color: 'white',
                borderRadius: '50%',
                p: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AddIcon />
            </Paper>
          } 
        />
        
        <BottomNavigationAction 
          label="Angebote" 
          icon={
            <Badge badgeContent={3} color="primary">
              <DescriptionIcon />
            </Badge>
          } 
        />
        
        <BottomNavigationAction 
          label="E-Mail" 
          icon={
            <Badge variant="dot" color="error">
              <EmailIcon />
            </Badge>
          } 
        />
      </MuiBottomNavigation>
    </Paper>
  );
};

export default BottomNavigation;