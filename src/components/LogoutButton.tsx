import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';

const AUTH_STORAGE_KEY = 'relocato_auth_token';

const LogoutButton: React.FC = () => {
  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.reload(); // Seite neu laden, um zur Login-Seite zu kommen
  };

  return (
    <Tooltip title="Abmelden">
      <IconButton 
        onClick={handleLogout}
        sx={{ 
          color: 'text.secondary',
          '&:hover': {
            color: 'error.main'
          }
        }}
      >
        <LogoutIcon />
      </IconButton>
    </Tooltip>
  );
};

export default LogoutButton;