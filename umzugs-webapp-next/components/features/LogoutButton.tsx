'use client';

import React, { useState } from 'react';
import {
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Avatar,
  Box
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { useToast } from '@/components/ui/Toaster';

const LogoutButton: React.FC = () => {
  const router = useRouter();
  const { supabase, user } = useSupabase();
  const { addToast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogoutClick = () => {
    setDialogOpen(true);
  };

  const handleConfirmLogout = async () => {
    try {
      setLoading(true);
      
      if (supabase) {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          throw error;
        }
        
        addToast({
          type: 'success',
          title: 'Erfolgreich abgemeldet',
          message: 'Sie wurden sicher abgemeldet',
        });
        
        // Redirect to login page
        router.push('/login');
      } else {
        throw new Error('Supabase nicht verfügbar');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      addToast({
        type: 'error',
        title: 'Abmeldung fehlgeschlagen',
        message: 'Ein Fehler ist aufgetreten',
      });
    } finally {
      setLoading(false);
      setDialogOpen(false);
    }
  };

  const handleCancelLogout = () => {
    setDialogOpen(false);
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Benutzer';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Box>
      <Tooltip title={`Abmelden (${getUserDisplayName()})`}>
        <IconButton
          onClick={handleLogoutClick}
          size="small"
          sx={{ 
            color: 'text.secondary',
            '&:hover': {
              color: 'error.main',
            }
          }}
        >
          <Avatar
            sx={{ 
              width: 32, 
              height: 32, 
              bgcolor: 'primary.main',
              fontSize: '0.8rem'
            }}
          >
            {user ? getUserInitials() : <PersonIcon />}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Dialog
        open={dialogOpen}
        onClose={handleCancelLogout}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{ 
                bgcolor: 'primary.main',
                width: 40,
                height: 40
              }}
            >
              {getUserInitials()}
            </Avatar>
            <Box>
              <Typography variant="h6">
                Abmelden
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getUserDisplayName()}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1">
            Möchten Sie sich wirklich abmelden?
          </Typography>
          
          {user?.email && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Angemeldet als: <strong>{user.email}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Letzte Anmeldung: {new Date().toLocaleString('de-DE')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleCancelLogout}
            disabled={loading}
          >
            Abbrechen
          </Button>
          <Button 
            onClick={handleConfirmLogout}
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={<LogoutIcon />}
          >
            {loading ? 'Wird abgemeldet...' : 'Abmelden'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LogoutButton;