'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
  CircularProgress,
  Chip,
  Alert,
} from '@mui/material';
import {
  Sync as SyncIcon,
  SyncDisabled as SyncDisabledIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { lexwareSyncService } from '@/lib/services/lexwareSyncService';

const SyncStatus: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    isRunning: false,
    isAutoSyncActive: false,
    lastSyncTime: null as Date | null
  });
  const [syncErrors, setSyncErrors] = useState<string[]>([]);

  useEffect(() => {
    // Get initial sync status
    const status = lexwareSyncService.getSyncStatus();
    setSyncStatus(status);
    setAutoSyncEnabled(status.isAutoSyncActive);
    setIsSyncing(status.isRunning);

    // Set up interval to check sync status
    const interval = setInterval(() => {
      const currentStatus = lexwareSyncService.getSyncStatus();
      setSyncStatus(currentStatus);
      setIsSyncing(currentStatus.isRunning);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleToggleAutoSync = async () => {
    try {
      if (autoSyncEnabled) {
        lexwareSyncService.stopAutoSync();
        setAutoSyncEnabled(false);
      } else {
        lexwareSyncService.startAutoSync(5); // 5 minutes interval
        setAutoSyncEnabled(true);
      }
    } catch (error) {
      console.error('Error toggling auto sync:', error);
      setSyncErrors(prev => [...prev, 'Auto-Sync konnte nicht umgeschaltet werden']);
    }
  };

  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
      setSyncErrors([]);
      await lexwareSyncService.manualSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
      setSyncErrors(prev => [...prev, 'Manuelle Synchronisation fehlgeschlagen']);
    } finally {
      setIsSyncing(false);
    }
  };

  const getSyncIcon = () => {
    if (isSyncing) {
      return <CircularProgress size={20} />;
    }
    
    if (syncErrors.length > 0) {
      return <ErrorIcon color="error" />;
    }
    
    if (autoSyncEnabled) {
      return <SyncIcon color="success" />;
    }
    
    return <SyncDisabledIcon color="action" />;
  };

  const getSyncTooltip = () => {
    if (isSyncing) {
      return 'Synchronisation läuft...';
    }
    
    if (syncErrors.length > 0) {
      return `${syncErrors.length} Sync-Fehler`;
    }
    
    if (autoSyncEnabled) {
      return `Auto-Sync aktiv${syncStatus.lastSyncTime ? ` (Letzter Sync: ${syncStatus.lastSyncTime.toLocaleTimeString('de-DE')})` : ''}`;
    }
    
    return 'Lexware Sync deaktiviert';
  };

  const getBadgeContent = () => {
    if (syncErrors.length > 0) {
      return syncErrors.length;
    }
    return undefined;
  };

  return (
    <Box>
      <Tooltip title={getSyncTooltip()}>
        <IconButton
          onClick={handleMenuOpen}
          size="small"
          sx={{
            color: syncErrors.length > 0 ? 'error.main' : 
                   autoSyncEnabled ? 'success.main' : 'action.active'
          }}
        >
          <Badge badgeContent={getBadgeContent()} color="error">
            {getSyncIcon()}
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { minWidth: 280 }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Lexware Synchronisation
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={autoSyncEnabled}
                onChange={handleToggleAutoSync}
                color="primary"
              />
            }
            label="Auto-Sync (alle 5 Min.)"
          />
        </Box>

        <Divider />

        <MenuItem onClick={handleManualSync} disabled={isSyncing}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isSyncing ? (
              <CircularProgress size={16} />
            ) : (
              <SyncIcon fontSize="small" />
            )}
            <Typography>
              {isSyncing ? 'Synchronisiere...' : 'Jetzt synchronisieren'}
            </Typography>
          </Box>
        </MenuItem>

        {syncStatus.lastSyncTime && (
          <MenuItem disabled>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScheduleIcon fontSize="small" />
              <Typography variant="body2">
                Letzter Sync: {syncStatus.lastSyncTime.toLocaleString('de-DE')}
              </Typography>
            </Box>
          </MenuItem>
        )}

        {syncErrors.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Alert severity="error" sx={{ mb: 1 }}>
                <Typography variant="caption">
                  {syncErrors.length} Sync-Fehler
                </Typography>
              </Alert>
              {syncErrors.map((error, index) => (
                <Typography key={index} variant="caption" display="block" color="error">
                  • {error}
                </Typography>
              ))}
            </Box>
          </>
        )}

        <Divider />
        
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip 
              label={autoSyncEnabled ? 'AKTIV' : 'INAKTIV'} 
              size="small" 
              color={autoSyncEnabled ? 'success' : 'default'}
              variant="filled"
            />
            <Chip 
              label="LEXWARE" 
              size="small" 
              variant="outlined"
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {autoSyncEnabled 
              ? 'Automatische Synchronisation alle 5 Minuten aktiv'
              : 'Manuelle Synchronisation verfügbar'
            }
          </Typography>
        </Box>
      </Menu>
    </Box>
  );
};

export default SyncStatus;