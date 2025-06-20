import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

interface EmailComposerProps {
  open: boolean;
  onClose: () => void;
  customer?: any;
  quote?: any;
  onEmailSent?: () => void;
}

const EmailComposer: React.FC<EmailComposerProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>E-Mail Composer</DialogTitle>
      <DialogContent>
        E-Mail-Funktion wird über den neuen E-Mail-Client verarbeitet.
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Schließen</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailComposer;