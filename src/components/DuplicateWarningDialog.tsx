import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';
import { Customer } from '../types';
import { DuplicateScore, getDuplicateRecommendation } from '../utils/duplicateDetection';
import { useNavigate } from 'react-router-dom';

interface DuplicateWarningDialogProps {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
  duplicates: DuplicateScore[];
  newCustomerData: Partial<Customer>;
}

const DuplicateWarningDialog: React.FC<DuplicateWarningDialogProps> = ({
  open,
  onClose,
  onContinue,
  duplicates,
  newCustomerData
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleViewCustomer = (customerId: string) => {
    navigate(`/customers/${customerId}`);
  };

  const highSeverityDuplicates = duplicates.filter(d => d.score >= 75);
  const mediumSeverityDuplicates = duplicates.filter(d => d.score >= 50 && d.score < 75);
  const lowSeverityDuplicates = duplicates.filter(d => d.score < 50);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          <Typography variant="h6">
            Mögliche Duplikate gefunden
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Neue Kundendaten */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Sie versuchen folgenden Kunden anzulegen:
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2">
              <strong>Name:</strong> {newCustomerData.name}
            </Typography>
            {newCustomerData.email && (
              <Typography variant="body2">
                <strong>E-Mail:</strong> {newCustomerData.email}
              </Typography>
            )}
            {newCustomerData.phone && (
              <Typography variant="body2">
                <strong>Telefon:</strong> {newCustomerData.phone}
              </Typography>
            )}
          </Box>
        </Alert>

        {/* Hohe Übereinstimmungen */}
        {highSeverityDuplicates.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, color: 'error.main', fontWeight: 'bold' }}>
              ⚠️ Sehr wahrscheinliche Duplikate ({highSeverityDuplicates.length})
            </Typography>
            {highSeverityDuplicates.map((duplicate, index) => (
              <DuplicateCard
                key={index}
                duplicate={duplicate}
                severity="high"
                onView={() => handleViewCustomer(duplicate.customer.id)}
              />
            ))}
          </Box>
        )}

        {/* Mittlere Übereinstimmungen */}
        {mediumSeverityDuplicates.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, color: 'warning.main', fontWeight: 'bold' }}>
              ⚠️ Mögliche Duplikate ({mediumSeverityDuplicates.length})
            </Typography>
            {mediumSeverityDuplicates.map((duplicate, index) => (
              <DuplicateCard
                key={index}
                duplicate={duplicate}
                severity="medium"
                onView={() => handleViewCustomer(duplicate.customer.id)}
              />
            ))}
          </Box>
        )}

        {/* Niedrige Übereinstimmungen */}
        {lowSeverityDuplicates.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, color: 'info.main' }}>
              Ähnliche Kunden ({lowSeverityDuplicates.length})
            </Typography>
            {lowSeverityDuplicates.map((duplicate, index) => (
              <DuplicateCard
                key={index}
                duplicate={duplicate}
                severity="low"
                onView={() => handleViewCustomer(duplicate.customer.id)}
              />
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Abbrechen
        </Button>
        <Button
          onClick={onContinue}
          variant="contained"
          color={highSeverityDuplicates.length > 0 ? 'warning' : 'primary'}
        >
          Trotzdem anlegen
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Komponente für einzelne Duplikat-Karte
const DuplicateCard: React.FC<{
  duplicate: DuplicateScore;
  severity: 'high' | 'medium' | 'low';
  onView: () => void;
}> = ({ duplicate, severity, onView }) => {
  const theme = useTheme();
  const recommendation = getDuplicateRecommendation(duplicate);

  const severityColors = {
    high: theme.palette.error.main,
    medium: theme.palette.warning.main,
    low: theme.palette.info.main
  };

  return (
    <Card
      sx={{
        mb: 2,
        borderLeft: `4px solid ${severityColors[severity]}`,
        backgroundColor: alpha(severityColors[severity], 0.05)
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: severityColors[severity] }}>
              {duplicate.customer.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {duplicate.customer.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kunde #{duplicate.customer.customerNumber || duplicate.customer.id}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${duplicate.score}% Übereinstimmung`}
              color={severity === 'high' ? 'error' : severity === 'medium' ? 'warning' : 'info'}
              size="small"
            />
            <Button
              size="small"
              startIcon={<OpenIcon />}
              onClick={onView}
            >
              Ansehen
            </Button>
          </Box>
        </Box>

        {/* Übereinstimmende Felder */}
        <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Übereinstimmungen:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {duplicate.matchedFields.map((field, index) => (
              <Chip
                key={index}
                label={field}
                size="small"
                icon={<CheckIcon />}
                color="success"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>

        {/* Kundendaten */}
        <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
          {duplicate.customer.email && (
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <EmailIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={duplicate.customer.email} />
            </ListItem>
          )}
          {duplicate.customer.phone && (
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <PhoneIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={duplicate.customer.phone} />
            </ListItem>
          )}
          {duplicate.customer.fromAddress && (
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <HomeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Aktuelle Adresse"
                secondary={duplicate.customer.fromAddress} 
              />
            </ListItem>
          )}
          {duplicate.customer.movingDate && (
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CalendarIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Umzugsdatum"
                secondary={new Date(duplicate.customer.movingDate).toLocaleDateString('de-DE')} 
              />
            </ListItem>
          )}
        </List>

        <Divider sx={{ my: 2 }} />

        <Alert severity={recommendation.severity} variant="outlined" sx={{ mt: 2 }}>
          <Typography variant="body2">
            {recommendation.message}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
            {recommendation.action}
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default DuplicateWarningDialog;