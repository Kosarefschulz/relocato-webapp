import React from 'react';
import { Card, CardContent, Typography, Box, List, ListItem, ListItemAvatar, ListItemText, Avatar, Chip, TextField, Switch, FormControlLabel, IconButton, alpha, useTheme } from '@mui/material';
import Grid from './GridCompat';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Home as HomeIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckIcon,
  Cancel as CrossIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Customer } from '../types';
import { formatDate } from '../utils/dateUtils';

const AnimatedCard = motion(Card);

interface CustomerInfoProps {
  customer: Customer;
  editedCustomer: Customer;
  editMode: boolean;
  onFieldChange: (field: string, value: any) => void;
  isMobile: boolean;
  onEditNotes?: () => void;
}

const CustomerInfo: React.FC<CustomerInfoProps> = ({
  customer,
  editedCustomer,
  editMode,
  onFieldChange,
  isMobile,
  onEditNotes
}) => {
  const theme = useTheme();

  // Force text color to ensure visibility
  const textStyle = {
    color: theme.palette.text.primary,
    opacity: 1,
    visibility: 'visible' as const,
    display: 'block',
    zIndex: 1
  };

  const linkStyle = {
    color: theme.palette.primary.main,
    fontWeight: 600,
    textDecoration: 'none',
    opacity: 1,
    visibility: 'visible' as const,
    display: 'inline-block',
    zIndex: 1,
    '&:hover': { textDecoration: 'underline' }
  };

  return (
    <Grid container spacing={2}>
      {/* Kontaktdaten */}
      <Grid xs={12} md={6}>
        <AnimatedCard
          whileHover={!isMobile && !editMode ? { y: -4, boxShadow: theme.shadows[8] } : {}}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.3 }}
          sx={{ height: '100%', position: 'relative' }}
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
                  primary={<Typography sx={textStyle}>Telefon</Typography>}
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
                        sx={linkStyle}
                      >
                        {customer.phone || 'Keine Telefonnummer'}
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
                  primary={<Typography sx={textStyle}>E-Mail</Typography>}
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
                        sx={linkStyle}
                      >
                        {customer.email || 'Keine E-Mail'}
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
                  primary={<Typography sx={textStyle}>Umzugstermin</Typography>}
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
                      <Typography sx={{ ...textStyle, fontWeight: 600 }}>
                        {formatDate(customer.movingDate, { includeWeekday: true, fallback: 'Datum nicht festgelegt' })}
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
          sx={{ height: '100%', position: 'relative' }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationIcon /> Adressen
            </Typography>
            <List sx={{ pt: 0 }}>
              <ListItem sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ backgroundColor: alpha(theme.palette.warning.main, 0.1) }}>
                    <HomeIcon color="warning" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={<Typography sx={textStyle}>Von</Typography>}
                  secondary={
                    editMode ? (
                      <TextField
                        value={editedCustomer.fromAddress}
                        onChange={(e) => onFieldChange('fromAddress', e.target.value)}
                        variant="standard"
                        fullWidth
                        multiline
                        sx={{ mt: 0.5 }}
                      />
                    ) : (
                      <Typography sx={{ ...textStyle, fontWeight: 600 }}>
                        {customer.fromAddress || 'Keine Startadresse'}
                      </Typography>
                    )
                  }
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ backgroundColor: alpha(theme.palette.success.main, 0.1) }}>
                    <LocationIcon color="success" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={<Typography sx={textStyle}>Nach</Typography>}
                  secondary={
                    editMode ? (
                      <TextField
                        value={editedCustomer.toAddress}
                        onChange={(e) => onFieldChange('toAddress', e.target.value)}
                        variant="standard"
                        fullWidth
                        multiline
                        sx={{ mt: 0.5 }}
                      />
                    ) : (
                      <Typography sx={{ ...textStyle, fontWeight: 600 }}>
                        {customer.toAddress || 'Keine Zieladresse'}
                      </Typography>
                    )
                  }
                />
              </ListItem>
            </List>
          </CardContent>
        </AnimatedCard>
      </Grid>

      {/* Wohnungsdetails */}
      <Grid xs={12}>
        <AnimatedCard
          whileHover={!isMobile && !editMode ? { y: -4, boxShadow: theme.shadows[8] } : {}}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.3 }}
          sx={{ position: 'relative' }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HomeIcon /> Wohnungsdetails
            </Typography>
            <Grid container spacing={2}>
              <Grid xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={textStyle}>Zimmer</Typography>
                  {editMode ? (
                    <TextField
                      value={editedCustomer.apartment?.rooms || ''}
                      onChange={(e) => onFieldChange('apartment.rooms', parseInt(e.target.value) || 0)}
                      variant="standard"
                      type="number"
                      inputProps={{ min: 1, max: 20 }}
                      sx={{ width: '80px', mt: 1 }}
                    />
                  ) : (
                    <Typography variant="h4" color="primary" sx={{ ...textStyle, mt: 1 }}>
                      {customer.apartment?.rooms || '-'}
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={textStyle}>Fläche</Typography>
                  {editMode ? (
                    <TextField
                      value={editedCustomer.apartment?.area || ''}
                      onChange={(e) => onFieldChange('apartment.area', parseInt(e.target.value) || 0)}
                      variant="standard"
                      type="number"
                      inputProps={{ min: 10, max: 500 }}
                      sx={{ width: '80px', mt: 1 }}
                    />
                  ) : (
                    <Typography variant="h4" color="primary" sx={{ ...textStyle, mt: 1 }}>
                      {customer.apartment?.area ? `${customer.apartment.area}m²` : '-'}
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={textStyle}>Etage</Typography>
                  {editMode ? (
                    <TextField
                      value={editedCustomer.apartment?.floor || ''}
                      onChange={(e) => onFieldChange('apartment.floor', parseInt(e.target.value) || 0)}
                      variant="standard"
                      type="number"
                      inputProps={{ min: 0, max: 20 }}
                      sx={{ width: '80px', mt: 1 }}
                    />
                  ) : (
                    <Typography variant="h4" color="primary" sx={{ ...textStyle, mt: 1 }}>
                      {customer.apartment?.floor !== undefined ? customer.apartment.floor : '-'}
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={textStyle}>Aufzug</Typography>
                  {editMode ? (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={editedCustomer.apartment?.hasElevator || false}
                          onChange={(e) => onFieldChange('apartment.hasElevator', e.target.checked)}
                        />
                      }
                      label=""
                      sx={{ mt: 1 }}
                    />
                  ) : (
                    <Box sx={{ mt: 2 }}>
                      {customer.apartment?.hasElevator ? (
                        <CheckIcon fontSize="large" color="success" />
                      ) : (
                        <CrossIcon fontSize="large" color="error" />
                      )}
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </AnimatedCard>
      </Grid>

      {/* Dienstleistungen */}
      <Grid xs={12}>
        <AnimatedCard
          whileHover={!isMobile && !editMode ? { y: -4, boxShadow: theme.shadows[8] } : {}}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.3 }}
          sx={{ position: 'relative' }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckIcon /> Dienstleistungen
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              {customer.services && customer.services.length > 0 ? (
                customer.services.map((service, index) => (
                  <Chip 
                    key={index} 
                    label={service} 
                    color="primary" 
                    variant="outlined"
                    sx={{ ...textStyle, borderWidth: 2 }}
                  />
                ))
              ) : (
                <Typography color="text.secondary" sx={textStyle}>
                  Keine Dienstleistungen ausgewählt
                </Typography>
              )}
            </Box>
          </CardContent>
        </AnimatedCard>
      </Grid>

      {/* Notizen */}
      <Grid xs={12}>
        <AnimatedCard
          whileHover={!isMobile && !editMode ? { y: -4, boxShadow: theme.shadows[8] } : {}}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.3 }}
          sx={{ position: 'relative' }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" color="primary">
                Notizen
              </Typography>
              {onEditNotes && (
                <IconButton onClick={onEditNotes} size="small" color="primary">
                  <EditIcon />
                </IconButton>
              )}
            </Box>
            <Typography 
              variant="body2" 
              sx={{ 
                ...textStyle,
                whiteSpace: 'pre-wrap',
                backgroundColor: alpha(theme.palette.action.hover, 0.04),
                p: 2,
                borderRadius: 1,
                minHeight: 60
              }}
            >
              {customer.notes || 'Keine Notizen vorhanden'}
            </Typography>
          </CardContent>
        </AnimatedCard>
      </Grid>
    </Grid>
  );
};

export default CustomerInfo;