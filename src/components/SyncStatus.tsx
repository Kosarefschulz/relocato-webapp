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
import { autoSyncService } from '../services/autoSyncService';

const SyncStatus: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(autoSyncService.getSyncStatus());
  
  useEffect(() => {
    // Lade gespeicherten Status
    autoSyncService.loadSyncStatus();
    const savedAutoSync = localStorage.getItem('autoSyncEnabled') === 'true';
    setAutoSyncEnabled(savedAutoSync);
    
    if (savedAutoSync) {
      autoSyncService.startAutoSync(5); // Alle 5 Minuten
    }
    
    // Update Status alle 10 Sekunden
    const interval = setInterval(() => {
      setSyncStatus(autoSyncService.getSyncStatus());
    }, 10000);
    
    return () => {
      clearInterval(interval);
      autoSyncService.stopAutoSync();
    };
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const status = await autoSyncService.syncNow();
      setSyncStatus(status);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAutoSyncToggle = () => {
    const newValue = !autoSyncEnabled;
    setAutoSyncEnabled(newValue);
    localStorage.setItem('autoSyncEnabled', newValue.toString());
    
    if (newValue) {
      autoSyncService.startAutoSync(5);
    } else {
      autoSyncService.stopAutoSync();
    }
  };

  const getSyncIcon = () => {
    if (isSyncing) {
      return <CircularProgress size={20} sx={{ color: 'white' }} />;
    }
    
    if (syncStatus.errors.length > 0) {
      return <ErrorIcon />;
    }
    
    if (!autoSyncEnabled) {
      return <SyncDisabledIcon />;
    }
    
    return <SyncIcon />;
  };

  const getSyncColor = () => {
    if (syncStatus.errors.length > 0) return 'error';
    if (!autoSyncEnabled) return 'default';
    if (autoSyncService.needsSync()) return 'warning';
    return 'success';
  };

  const formatLastSync = () => {
    if (!syncStatus.lastSync) return 'Noch nie synchronisiert';
    
    const now = new Date();
    const diff = now.getTime() - syncStatus.lastSync.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Gerade eben';
    if (minutes < 60) return `vor ${minutes} Min.`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `vor ${hours} Std.`;
    
    return syncStatus.lastSync.toLocaleDateString('de-DE');
  };

  return (
    <>
      <Tooltip title="Google Sheets Sync">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ ml: 1 }}
        >
          <Badge 
            color={getSyncColor()} 
            variant="dot"
            invisible={!autoSyncService.needsSync() && syncStatus.errors.length === 0}
          >
            {getSyncIcon()}
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 350 }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Google Sheets Synchronisation
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={autoSyncEnabled}
                onChange={handleAutoSyncToggle}
                color="primary"
              />
            }
            label="Automatische Synchronisation"
          />
          
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Synchronisiert alle 5 Minuten mit Google Sheets
          </Typography>
        </Box>

        <Divider />

        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <ScheduleIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
            <Typography variant="body2">
              Letzte Sync: {formatLastSync()}
            </Typography>
          </Box>

          {syncStatus.lastSync && (
            <>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  size="small"
                  icon={<CheckIcon />}
                  label={`${syncStatus.customerssynced} Kunden`}
                  color="success"
                  variant="outlined"
                />
                <Chip
                  size="small"
                  icon={<CheckIcon />}
                  label={`${syncStatus.quotessynced} Angebote`}
                  color="success"
                  variant="outlined"
                />
                <Chip
                  size="small"
                  icon={<CheckIcon />}
                  label={`${syncStatus.invoicessynced} Rechnungen`}
                  color="success"
                  variant="outlined"
                />
              </Box>
            </>
          )}

          {syncStatus.errors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Fehler bei der Synchronisation:
              </Typography>
              {syncStatus.errors.slice(0, 3).map((error, index) => (
                <Typography key={index} variant="caption" display="block">
                  • {error}
                </Typography>
              ))}
              {syncStatus.errors.length > 3 && (
                <Typography variant="caption" color="text.secondary">
                  ... und {syncStatus.errors.length - 3} weitere
                </Typography>
              )}
            </Alert>
          )}
        </Box>

        <Divider />

        <MenuItem 
          onClick={() => {
            handleManualSync();
            handleClose();
          }}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Synchronisiere...
            </>
          ) : (
            <>
              <SyncIcon sx={{ mr: 1 }} />
              Jetzt synchronisieren
            </>
          )}
        </MenuItem>
      </Menu>
    </>
  );
};

export default SyncStatus;