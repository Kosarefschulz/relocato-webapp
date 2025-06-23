import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import {
  Phone as PhoneIcon,
  PhoneDisabled as PhoneDisabledIcon,
  Cancel as CancelIcon,
  NoteAdd as NoteIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { Customer, SalesNote } from '../types';
import { databaseService as googleSheetsService } from '../config/database.config';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface SalesActionsProps {
  customer: Customer;
  onUpdate: () => void;
}

const SalesActions: React.FC<SalesActionsProps> = ({ customer, onUpdate }) => {
  const [cancelDialog, setCancelDialog] = useState(false);
  const [noteDialog, setNoteDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<'call' | 'email' | 'meeting' | 'other'>('call');
  const [loading, setLoading] = useState(false);

  const handleReached = async () => {
    try {
      setLoading(true);
      await googleSheetsService.updateCustomer(customer.id, {
        salesStatus: 'reached',
        contacted: true
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Fehler beim Aktualisieren des Status');
    } finally {
      setLoading(false);
    }
  };

  const handleNotReached = async () => {
    try {
      setLoading(true);
      await googleSheetsService.updateCustomer(customer.id, {
        salesStatus: 'not_reached',
        contacted: false
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Fehler beim Aktualisieren des Status');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Bitte geben Sie einen Grund für die Stornierung an');
      return;
    }

    try {
      setLoading(true);
      await googleSheetsService.updateCustomer(customer.id, {
        salesStatus: 'cancelled',
        cancelledAt: new Date(),
        cancelledReason: cancelReason
      });
      setCancelDialog(false);
      setCancelReason('');
      onUpdate();
    } catch (error) {
      console.error('Error cancelling customer:', error);
      alert('Fehler beim Stornieren');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) {
      alert('Bitte geben Sie eine Notiz ein');
      return;
    }

    try {
      setLoading(true);
      const newNote: SalesNote = {
        id: `note_${Date.now()}`,
        content: noteContent,
        createdAt: new Date(),
        createdBy: 'current-user', // TODO: Get actual user
        type: noteType
      };

      const currentNotes = customer.salesNotes || [];
      await googleSheetsService.updateCustomer(customer.id, {
        salesNotes: [...currentNotes, newNote]
      });
      
      setNoteDialog(false);
      setNoteContent('');
      setNoteType('call');
      onUpdate();
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Fehler beim Hinzufügen der Notiz');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = () => {
    if (customer.salesStatus === 'reached') {
      return <Chip label="Erreicht" color="success" icon={<CheckIcon />} />;
    } else if (customer.salesStatus === 'not_reached') {
      return <Chip label="Nicht erreicht" color="warning" icon={<PhoneDisabledIcon />} />;
    } else if (customer.salesStatus === 'cancelled') {
      return <Chip label="Storniert" color="error" icon={<CancelIcon />} />;
    }
    return null;
  };

  const getNoteTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <PhoneIcon fontSize="small" />;
      case 'email': return '@';
      case 'meeting': return <PersonIcon fontSize="small" />;
      default: return <NoteIcon fontSize="small" />;
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Vertriebsaktionen</Typography>
          {getStatusChip()}
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<PhoneIcon />}
            onClick={handleReached}
            disabled={loading || customer.salesStatus === 'reached'}
          >
            Erreicht
          </Button>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<PhoneDisabledIcon />}
            onClick={handleNotReached}
            disabled={loading || customer.salesStatus === 'not_reached'}
          >
            Nicht erreicht
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => setCancelDialog(true)}
            disabled={loading || customer.salesStatus === 'cancelled'}
          >
            Storno
          </Button>
          <Button
            variant="outlined"
            startIcon={<NoteIcon />}
            onClick={() => setNoteDialog(true)}
            disabled={loading}
          >
            Notiz
          </Button>
        </Stack>

        {/* Cancel Info */}
        {customer.salesStatus === 'cancelled' && customer.cancelledReason && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Storniert am {customer.cancelledAt ? format(new Date(customer.cancelledAt), 'dd.MM.yyyy', { locale: de }) : ''}</Typography>
            <Typography variant="body2">Grund: {customer.cancelledReason}</Typography>
          </Alert>
        )}

        {/* Sales Notes */}
        {customer.salesNotes && customer.salesNotes.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>Vertriebsnotizen</Typography>
            <List dense>
              {customer.salesNotes.map((note) => (
                <ListItem key={note.id}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getNoteTypeIcon(note.type)}
                        <Typography variant="body2">{note.content}</Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <TimeIcon fontSize="small" sx={{ fontSize: 14 }} />
                        <Typography variant="caption">
                          {format(new Date(note.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })} - {note.createdBy}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </CardContent>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Kunde stornieren
            <IconButton onClick={() => setCancelDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Grund für Stornierung"
            fullWidth
            multiline
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="z.B. Kunde hat sich für anderen Anbieter entschieden"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>Abbrechen</Button>
          <Button onClick={handleCancel} color="error" variant="contained" disabled={loading}>
            Stornieren
          </Button>
        </DialogActions>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={noteDialog} onClose={() => setNoteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Notiz hinzufügen
            <IconButton onClick={() => setNoteDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Typ</InputLabel>
              <Select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value as any)}
                label="Typ"
              >
                <MenuItem value="call">Telefonat</MenuItem>
                <MenuItem value="email">E-Mail</MenuItem>
                <MenuItem value="meeting">Termin</MenuItem>
                <MenuItem value="other">Sonstiges</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Notiz"
              fullWidth
              multiline
              rows={4}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="z.B. Kunde interessiert sich für Umzug im März..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialog(false)}>Abbrechen</Button>
          <Button onClick={handleAddNote} variant="contained" disabled={loading}>
            Hinzufügen
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default SalesActions;