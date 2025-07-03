import React from 'react';
import { Alert, Snackbar, Slide, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { TransitionProps } from '@mui/material/transitions';
import { useNotifications } from '../hooks/useRealtime';

function SlideTransition(props: TransitionProps & {
  children: React.ReactElement<any, any>;
}) {
  return <Slide {...props} direction="down" />;
}

export const RealtimeNotifications: React.FC = () => {
  const { notifications, dismissNotification } = useNotifications();

  // Show only the latest notification
  const latestNotification = notifications[notifications.length - 1];

  if (!latestNotification) return null;

  return (
    <Snackbar
      open={true}
      autoHideDuration={6000}
      onClose={() => dismissNotification(latestNotification.id)}
      TransitionComponent={SlideTransition}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ top: 24 }}
    >
      <Alert
        severity={latestNotification.type}
        variant="filled"
        sx={{
          width: '100%',
          minWidth: 300,
          boxShadow: 3
        }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={() => dismissNotification(latestNotification.id)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <Box>
          <strong>{latestNotification.title}</strong>
          {latestNotification.message && (
            <Box sx={{ mt: 0.5 }}>{latestNotification.message}</Box>
          )}
        </Box>
      </Alert>
    </Snackbar>
  );
};

// Usage example component
export const NotificationExample: React.FC = () => {
  const { sendNotification } = useNotifications();

  const sendTestNotification = () => {
    sendNotification('all', {
      title: 'Neuer Kunde!',
      message: 'Ein neuer Kunde wurde erfolgreich angelegt.',
      type: 'success'
    });
  };

  return (
    <button onClick={sendTestNotification}>
      Test Notification
    </button>
  );
};