import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  alpha,
  useTheme
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Home as HomeIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckIcon,
  Cancel as CrossIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Customer } from '../types';

const AnimatedCard = motion(Card);

interface CustomerInfoProps {
  customer: Customer;
  editedCustomer: Customer;
  editMode: boolean;
  onFieldChange: (field: string, value: any) => void;
  isMobile: boolean;
}

const CustomerInfo: React.FC<CustomerInfoProps> = ({
  customer,
  editedCustomer,
  editMode,
  onFieldChange,
  isMobile
}) => {
  const theme = useTheme();

  return (
    <Grid container spacing={2}>
      {/* Kontaktdaten */}
      <Grid xs={12} md={6}>
        <AnimatedCard
          whileHover={!isMobile && !editMode ? { y: -4, boxShadow: theme.shadows[8] } : {}}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.3 }}
          sx={{ height: '100%' }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon /> Kontakt
            </Typography>
            <List sx={{ pt: 0 }}>
              <ListItem sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                    <PhoneIcon color="primary" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary="Telefon"
                  secondary={
                    editMode ? (
                      <TextField
                        value={editedCustomer.phone}
                        onChange={(e) => onFieldChange('phone', e.target.value)}
                        variant="standard"
                        fullWidth
                        sx={{ mt: 0.5 }}
                      />
                    ) : (
                      <Typography 
                        component="a"
                        href={`tel:${customer.phone}`}
                        sx={{ 
                          color: 'primary.main',
                          fontWeight: 600,
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {customer.phone}
                      </Typography>
                    )
                  }
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                    <EmailIcon color="primary" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary="E-Mail"
                  secondary={
                    editMode ? (
                      <TextField
                        value={editedCustomer.email}
                        onChange={(e) => onFieldChange('email', e.target.value)}
                        variant="standard"
                        fullWidth
                        type="email"
                        sx={{ mt: 0.5 }}
                      />
                    ) : (
                      <Typography 
                        component="a"
                        href={`mailto:${customer.email}`}
                        sx={{ 
                          color: 'primary.main',
                          fontWeight: 600,
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {customer.email}
                      </Typography>
                    )
                  }
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                    <CalendarIcon color="primary" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary="Umzugstermin"
                  secondary={
                    editMode ? (
                      <TextField
                        value={editedCustomer.movingDate}
                        onChange={(e) => onFieldChange('movingDate', e.target.value)}
                        variant="standard"
                        fullWidth
                        type="date"
                        sx={{ mt: 0.5 }}
                      />
                    ) : (
                      <Typography component="span" sx={{ fontWeight: 600 }}>
                        {new Date(customer.movingDate).toLocaleDateString('de-DE', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Typography>
                    )
                  }
                />
              </ListItem>
            </List>
          </CardContent>
        </AnimatedCard>
      </Grid>

      {/* Adressen */}
      <Grid xs={12} md={6}>
        <AnimatedCard
          whileHover={!isMobile && !editMode ? { y: -4, boxShadow: theme.shadows[8] } : {}}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.3 }}
          sx={{ height: '100%' }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationIcon /> Umzugsroute
            </Typography>
            <Box sx={{ mt: 2 }}>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Box sx={{ mb: 3 }}>
                  <Chip label="Von" size="small" color="primary" sx={{ mb: 1 }} />
                  {editMode ? (
                    <TextField
                      value={editedCustomer.fromAddress}
                      onChange={(e) => onFieldChange('fromAddress', e.target.value)}
                      variant="outlined"
                      fullWidth
                      multiline
                      rows={2}
                    />
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500, flex: 1 }}>
                        {customer.fromAddress}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => window.open(`https://maps.google.com/maps?q=${encodeURIComponent(customer.fromAddress)}`, '_blank')}
                        sx={{ color: 'primary.main' }}
                      >
                        <LocationIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </motion.div>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Box>
                  <Chip label="Nach" size="small" color="success" sx={{ mb: 1 }} />
                  {editMode ? (
                    <TextField
                      value={editedCustomer.toAddress}
                      onChange={(e) => onFieldChange('toAddress', e.target.value)}
                      variant="outlined"
                      fullWidth
                      multiline
                      rows={2}
                    />
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500, flex: 1 }}>
                        {customer.toAddress}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => window.open(`https://maps.google.com/maps?q=${encodeURIComponent(customer.toAddress)}`, '_blank')}
                        sx={{ color: 'success.main' }}
                      >
                        <LocationIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </motion.div>
            </Box>
          </CardContent>
        </AnimatedCard>
      </Grid>

      {/* Wohnungsdetails */}
      <Grid xs={12}>
        <AnimatedCard
          whileHover={!isMobile && !editMode ? { y: -4, boxShadow: theme.shadows[8] } : {}}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.3 }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HomeIcon /> Wohnungsdetails
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid xs={6} sm={3}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 2, 
                  borderRadius: 2, 
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                }}>
                  {editMode ? (
                    <TextField
                      value={editedCustomer.apartment?.rooms || ''}
                      onChange={(e) => onFieldChange('apartment.rooms', parseInt(e.target.value) || 0)}
                      type="number"
                      variant="standard"
                      sx={{ 
                        width: '60px',
                        '& input': { textAlign: 'center', fontSize: '2rem', fontWeight: 700 }
                      }}
                    />
                  ) : (
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                      {customer.apartment?.rooms || '-'}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Zimmer
                  </Typography>
                </Box>
              </Grid>
              <Grid xs={6} sm={3}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 2, 
                  borderRadius: 2, 
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                }}>
                  {editMode ? (
                    <TextField
                      value={editedCustomer.apartment?.area || ''}
                      onChange={(e) => onFieldChange('apartment.area', parseInt(e.target.value) || 0)}
                      type="number"
                      variant="standard"
                      sx={{ 
                        width: '80px',
                        '& input': { textAlign: 'center', fontSize: '2rem', fontWeight: 700 }
                      }}
                    />
                  ) : (
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                      {customer.apartment?.area || '-'}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    m² Fläche
                  </Typography>
                </Box>
              </Grid>
              <Grid xs={6} sm={3}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 2, 
                  borderRadius: 2, 
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                }}>
                  {editMode ? (
                    <TextField
                      value={editedCustomer.apartment?.floor || 0}
                      onChange={(e) => onFieldChange('apartment.floor', parseInt(e.target.value) || 0)}
                      type="number"
                      variant="standard"
                      sx={{ 
                        width: '60px',
                        '& input': { textAlign: 'center', fontSize: '2rem', fontWeight: 700 }
                      }}
                    />
                  ) : (
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                      {customer.apartment?.floor || 'EG'}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Etage
                  </Typography>
                </Box>
              </Grid>
              <Grid xs={6} sm={3}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 2, 
                  borderRadius: 2, 
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                }}>
                  {editMode ? (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={editedCustomer.apartment?.hasElevator || false}
                          onChange={(e) => onFieldChange('apartment.hasElevator', e.target.checked)}
                          color="success"
                        />
                      }
                      label={editedCustomer.apartment?.hasElevator ? 'Ja' : 'Nein'}
                    />
                  ) : (
                    <Chip
                      icon={customer.apartment?.hasElevator ? <CheckIcon /> : <CrossIcon />}
                      label={customer.apartment?.hasElevator ? 'Aufzug' : 'Kein Aufzug'}
                      color={customer.apartment?.hasElevator ? 'success' : 'default'}
                      sx={{ fontWeight: 600, width: '100%' }}
                    />
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </AnimatedCard>
      </Grid>

      {/* Notizen */}
      <Grid xs={12}>
        <AnimatedCard
          whileHover={!isMobile && !editMode ? { y: -4, boxShadow: theme.shadows[8] } : {}}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.3 }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Notizen
            </Typography>
            {editMode ? (
              <TextField
                value={editedCustomer.notes || ''}
                onChange={(e) => onFieldChange('notes', e.target.value)}
                variant="outlined"
                fullWidth
                multiline
                rows={4}
                placeholder="Notizen zum Kunden hinzufügen..."
              />
            ) : (
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {customer.notes || 'Keine Notizen vorhanden'}
              </Typography>
            )}
          </CardContent>
        </AnimatedCard>
      </Grid>
    </Grid>
  );
};

export default CustomerInfo;