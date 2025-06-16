import React, { useState, useContext } from 'react';
import {
  Box,
  Chip,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Stack,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  LocalOffer as TagIcon,
  Note as NoteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Handshake as HandshakeIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { Customer, CustomerNote } from '../types';
import { AuthContext } from '../App';
import { v4 as uuidv4 } from 'uuid';

interface CustomerTagsAndNotesProps {
  customer: Customer;
  onUpdate: (updates: Partial<Customer>) => void;
  readOnly?: boolean;
}

// Vordefinierte Tags zur schnellen Auswahl
const PREDEFINED_TAGS = [
  'VIP-Kunde',
  'Großauftrag',
  'Stammkunde',
  'Empfehlung',
  'Online-Anfrage',
  'Telefonisch',
  'Vor-Ort-Besichtigung',
  'Express-Umzug',
  'Auslandsumzug',
  'Firmenumzug',
  'Privatumzug',
  'Seniorenumzug',
  'Studentenumzug',
  'Preissensibel',
  'Qualitätsorientiert',
  'Flexible Termine',
  'Feste Termine',
  'Zusatzleistungen',
  'Verpackungsservice',
  'Möbelmontage'
];

const NOTE_CATEGORY_ICONS = {
  general: <InfoIcon />,
  wichtig: <WarningIcon />,
  besichtigung: <HandshakeIcon />,
  preisverhandlung: <MoneyIcon />,
  sonstiges: <NoteIcon />
};

const NOTE_CATEGORY_COLORS = {
  general: 'info',
  wichtig: 'error',
  besichtigung: 'primary',
  preisverhandlung: 'success',
  sonstiges: 'default'
} as const;

const CustomerTagsAndNotes: React.FC<CustomerTagsAndNotesProps> = ({
  customer,
  onUpdate,
  readOnly = false
}) => {
  const { user } = useContext(AuthContext);
  const [newTag, setNewTag] = useState('');
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<CustomerNote | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<CustomerNote['category']>('general');
  const [isInternalNote, setIsInternalNote] = useState(false);

  // Tags Management
  const handleAddTag = (tag: string) => {
    if (tag && !customer.tags?.includes(tag)) {
      const updatedTags = [...(customer.tags || []), tag];
      onUpdate({ tags: updatedTags });
    }
    setNewTag('');
    setShowTagDialog(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = customer.tags?.filter(tag => tag !== tagToRemove) || [];
    onUpdate({ tags: updatedTags });
  };

  // Notes Management
  const handleAddNote = () => {
    if (!noteContent.trim()) return;

    const newNote: CustomerNote = {
      id: uuidv4(),
      content: noteContent,
      createdAt: new Date(),
      createdBy: user?.email || 'Unbekannt',
      category: noteCategory,
      isInternal: isInternalNote
    };

    const updatedNotes = [...(customer.extendedNotes || []), newNote];
    onUpdate({ extendedNotes: updatedNotes });

    // Reset form
    setNoteContent('');
    setNoteCategory('general');
    setIsInternalNote(false);
    setShowNoteDialog(false);
  };

  const handleUpdateNote = () => {
    if (!editingNote || !noteContent.trim()) return;

    const updatedNotes = customer.extendedNotes?.map(note =>
      note.id === editingNote.id
        ? { ...note, content: noteContent, category: noteCategory, isInternal: isInternalNote }
        : note
    ) || [];

    onUpdate({ extendedNotes: updatedNotes });

    // Reset form
    setEditingNote(null);
    setNoteContent('');
    setNoteCategory('general');
    setIsInternalNote(false);
    setShowNoteDialog(false);
  };

  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = customer.extendedNotes?.filter(note => note.id !== noteId) || [];
    onUpdate({ extendedNotes: updatedNotes });
  };

  const handlePriorityChange = (priority: Customer['priority']) => {
    onUpdate({ priority });
  };

  const openNoteDialog = (note?: CustomerNote) => {
    if (note) {
      setEditingNote(note);
      setNoteContent(note.content);
      setNoteCategory(note.category || 'general');
      setIsInternalNote(note.isInternal || false);
    } else {
      setEditingNote(null);
      setNoteContent('');
      setNoteCategory('general');
      setIsInternalNote(false);
    }
    setShowNoteDialog(true);
  };

  return (
    <Box>
      {/* Priorität */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Priorität
          </Typography>
          {!readOnly && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                size="small"
                color={customer.priority === 'high' ? 'warning' : 'default'}
                onClick={() => handlePriorityChange('high')}
              >
                <Tooltip title="Hohe Priorität">
                  <StarIcon />
                </Tooltip>
              </IconButton>
              <IconButton
                size="small"
                color={customer.priority === 'medium' ? 'primary' : 'default'}
                onClick={() => handlePriorityChange('medium')}
              >
                <Tooltip title="Mittlere Priorität">
                  <StarBorderIcon />
                </Tooltip>
              </IconButton>
              <IconButton
                size="small"
                color={customer.priority === 'low' ? 'default' : 'default'}
                onClick={() => handlePriorityChange('low')}
              >
                <Tooltip title="Niedrige Priorität">
                  <span style={{ opacity: 0.5 }}><StarBorderIcon /></span>
                </Tooltip>
              </IconButton>
            </Box>
          )}
        </Box>
        {customer.priority && (
          <Chip
            size="small"
            label={
              customer.priority === 'high' ? 'Hohe Priorität' :
              customer.priority === 'medium' ? 'Mittlere Priorität' :
              'Niedrige Priorität'
            }
            color={
              customer.priority === 'high' ? 'error' :
              customer.priority === 'medium' ? 'warning' :
              'default'
            }
            sx={{ mt: 1 }}
          />
        )}
      </Paper>

      {/* Tags */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TagIcon fontSize="small" />
            Tags
          </Typography>
          {!readOnly && (
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setShowTagDialog(true)}
            >
              Tag hinzufügen
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {customer.tags?.length ? (
            customer.tags.map(tag => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                onDelete={!readOnly ? () => handleRemoveTag(tag) : undefined}
                color="primary"
                variant="outlined"
              />
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              Keine Tags vorhanden
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Erweiterte Notizen */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NoteIcon fontSize="small" />
            Erweiterte Notizen
          </Typography>
          {!readOnly && (
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => openNoteDialog()}
            >
              Notiz hinzufügen
            </Button>
          )}
        </Box>

        <Stack spacing={2}>
          {customer.extendedNotes?.length ? (
            customer.extendedNotes
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map(note => (
                <Card key={note.id} variant="outlined">
                  <CardContent sx={{ pb: 1, '&:last-child': { pb: 1 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Chip
                            icon={NOTE_CATEGORY_ICONS[note.category || 'general']}
                            label={
                              note.category === 'wichtig' ? 'Wichtig' :
                              note.category === 'besichtigung' ? 'Besichtigung' :
                              note.category === 'preisverhandlung' ? 'Preisverhandlung' :
                              note.category === 'sonstiges' ? 'Sonstiges' :
                              'Allgemein'
                            }
                            size="small"
                            color={NOTE_CATEGORY_COLORS[note.category || 'general']}
                          />
                          {note.isInternal && (
                            <Chip
                              label="Intern"
                              size="small"
                              variant="outlined"
                              color="warning"
                            />
                          )}
                        </Box>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {note.content}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          {new Date(note.createdAt).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })} - {note.createdBy}
                        </Typography>
                      </Box>
                      {!readOnly && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => openNoteDialog(note)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))
          ) : (
            <Alert severity="info" variant="outlined">
              Keine erweiterten Notizen vorhanden
            </Alert>
          )}
        </Stack>
      </Paper>

      {/* Tag Dialog */}
      <Dialog open={showTagDialog} onClose={() => setShowTagDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tag hinzufügen</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Neuer Tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddTag(newTag);
              }
            }}
          />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Oder wählen Sie aus vordefinierten Tags:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {PREDEFINED_TAGS.filter(tag => !customer.tags?.includes(tag)).map(tag => (
              <Chip
                key={tag}
                label={tag}
                onClick={() => handleAddTag(tag)}
                clickable
                variant="outlined"
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTagDialog(false)}>Abbrechen</Button>
          <Button onClick={() => handleAddTag(newTag)} variant="contained" disabled={!newTag}>
            Hinzufügen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={showNoteDialog} onClose={() => setShowNoteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingNote ? 'Notiz bearbeiten' : 'Neue Notiz hinzufügen'}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Kategorie</InputLabel>
            <Select
              value={noteCategory}
              onChange={(e) => setNoteCategory(e.target.value as CustomerNote['category'])}
              label="Kategorie"
            >
              <MenuItem value="general">Allgemein</MenuItem>
              <MenuItem value="wichtig">Wichtig</MenuItem>
              <MenuItem value="besichtigung">Besichtigung</MenuItem>
              <MenuItem value="preisverhandlung">Preisverhandlung</MenuItem>
              <MenuItem value="sonstiges">Sonstiges</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Notiz"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            multiline
            rows={4}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={isInternalNote}
                onChange={(e) => setIsInternalNote(e.target.checked)}
              />
            }
            label="Interne Notiz (nicht für Kunden sichtbar)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNoteDialog(false)}>Abbrechen</Button>
          <Button
            onClick={editingNote ? handleUpdateNote : handleAddNote}
            variant="contained"
            disabled={!noteContent.trim()}
          >
            {editingNote ? 'Aktualisieren' : 'Hinzufügen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerTagsAndNotes;