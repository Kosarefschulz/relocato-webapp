import React from 'react';
import { Snackbar, Alert, AlertProps, Slide } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { motion, AnimatePresence } from 'framer-motion';

function SlideTransition(props: TransitionProps & {
  children: React.ReactElement<any, any>;
}) {
  return <Slide {...props} direction="up" />;
}

interface ModernToastProps {
  open: boolean;
  onClose: () => void;
  message: string;
  severity?: AlertProps['severity'];
  duration?: number;
  action?: React.ReactNode;
}

export const ModernToast: React.FC<ModernToastProps> = ({
  open,
  onClose,
  message,
  severity = 'success',
  duration = 4000,
  action,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <Snackbar
          open={open}
          autoHideDuration={duration}
          onClose={onClose}
          TransitionComponent={SlideTransition}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{
            '& .MuiSnackbarContent-root': {
              padding: 0,
            },
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Alert
              onClose={onClose}
              severity={severity}
              action={action}
              sx={{
                width: '100%',
                minWidth: 300,
                borderRadius: 2,
                boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
                '& .MuiAlert-icon': {
                  fontSize: 28,
                },
                '& .MuiAlert-message': {
                  fontSize: '0.95rem',
                  fontWeight: 500,
                },
              }}
            >
              {message}
            </Alert>
          </motion.div>
        </Snackbar>
      )}
    </AnimatePresence>
  );
};

// Hook für einfache Verwendung
export const useToast = () => {
  const [state, setState] = React.useState({
    open: false,
    message: '',
    severity: 'success' as AlertProps['severity'],
  });

  const showToast = (message: string, severity: AlertProps['severity'] = 'success') => {
    setState({ open: true, message, severity });
  };

  const hideToast = () => {
    setState(prev => ({ ...prev, open: false }));
  };

  const ToastComponent = () => (
    <ModernToast
      open={state.open}
      onClose={hideToast}
      message={state.message}
      severity={state.severity}
    />
  );

  return { showToast, ToastComponent };
};