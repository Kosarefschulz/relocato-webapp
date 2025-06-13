import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider,
  alpha,
  useTheme,
  Badge,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Description as QuoteIcon,
  HomeWork as ViewingIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { Customer, Quote } from '../types';
import { googleSheetsPublicService as googleSheetsService } from '../services/googleSheetsPublic';
import { format, isAfter, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);

interface SalesActivity {
  customer: Customer;
  type: 'viewing_pending' | 'viewing_scheduled' | 'quote_sent' | 'no_contact';
  date: Date;
  quote?: Quote;
}

const SalesOverview: React.FC = () => {
  const theme = useTheme();
  const [activities, setActivities] = useState<{
    viewingPending: SalesActivity[];
    viewingScheduled: SalesActivity[];
    quoteSent: SalesActivity[];
    noContact: SalesActivity[];
  }>({
    viewingPending: [],
    viewingScheduled: [],
    quoteSent: [],
    noContact: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      const customers = await googleSheetsService.getCustomers();
      const quotes = await googleSheetsService.getQuotes();
      
      // Nur Kunden der letzten 5 Tage
      const fiveDaysAgo = subDays(new Date(), 5);
      const recentCustomers = customers.filter(customer => 
        isAfter(new Date(customer.createdAt || customer.movingDate), fiveDaysAgo)
      );

      // Kategorisiere Kunden
      const categorized = {
        viewingPending: [] as SalesActivity[],
        viewingScheduled: [] as SalesActivity[],
        quoteSent: [] as SalesActivity[],
        noContact: [] as SalesActivity[],
      };

      recentCustomers.forEach(customer => {
        const customerQuotes = quotes.filter(q => q.customerId === customer.id);
        
        if (customerQuotes.length > 0) {
          // Angebot wurde erstellt
          categorized.quoteSent.push({
            customer,
            type: 'quote_sent',
            date: new Date(customerQuotes[0].createdAt),
            quote: customerQuotes[0],
          });
        } else if (customer.viewingScheduled) {
          // Besichtigung ist vereinbart
          categorized.viewingScheduled.push({
            customer,
            type: 'viewing_scheduled',
            date: new Date(customer.viewingDate || customer.movingDate),
          });
        } else if (customer.contacted) {
          // Kontaktiert aber noch keine Besichtigung
          categorized.viewingPending.push({
            customer,
            type: 'viewing_pending',
            date: new Date(customer.createdAt || customer.movingDate),
          });
        } else {
          // Noch nicht kontaktiert
          categorized.noContact.push({
            customer,
            type: 'no_contact',
            date: new Date(customer.createdAt || customer.movingDate),
          });
        }
      });

      // Sortiere nach Datum (neueste zuerst)
      Object.keys(categorized).forEach(key => {
        categorized[key as keyof typeof categorized].sort((a, b) => 
          b.date.getTime() - a.date.getTime()
        );
      });

      setActivities(categorized);
    } catch (error) {
      console.error('Fehler beim Laden der Verkaufsdaten:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryConfig = (type: string) => {
    switch (type) {
      case 'viewingPending':
        return {
          title: 'BT vereinbaren',
          color: theme.palette.warning.main,
          icon: <ScheduleIcon />,
          count: activities.viewingPending.length,
        };
      case 'viewingScheduled':
        return {
          title: 'BT vereinbart',
          color: theme.palette.info.main,
          icon: <ViewingIcon />,
          count: activities.viewingScheduled.length,
        };
      case 'quoteSent':
        return {
          title: 'Angebot abgegeben',
          color: theme.palette.success.main,
          icon: <QuoteIcon />,
          count: activities.quoteSent.length,
        };
      case 'noContact':
        return {
          title: 'Noch nicht kontaktiert',
          color: theme.palette.error.main,
          icon: <PhoneIcon />,
          count: activities.noContact.length,
        };
      default:
        return {
          title: '',
          color: theme.palette.grey[500],
          icon: null,
          count: 0,
        };
    }
  };

  const renderActivityItem = (activity: SalesActivity) => {
    const { customer } = activity;
    const initials = customer.name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    return (
      <ListItem
        key={customer.id}
        sx={{
          py: 1.5,
          px: 2,
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
          },
          cursor: 'pointer',
        }}
        onClick={() => window.location.href = `/customer-details/${customer.id}`}
      >
        <ListItemIcon>
          <Avatar sx={{ 
            width: 40, 
            height: 40,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
          }}>
            {initials}
          </Avatar>
        </ListItemIcon>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {customer.name}
              </Typography>
              {activity.quote && (
                <Chip 
                  label={`€${activity.quote.price.toFixed(0)}`} 
                  size="small" 
                  color="success"
                  sx={{ height: 20, fontSize: '0.75rem' }}
                />
              )}
            </Box>
          }
          secondary={
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {customer.toAddress.split(',')[0]}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {format(activity.date, 'dd.MM.yyyy', { locale: de })}
              </Typography>
            </Box>
          }
        />
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Anrufen">
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `tel:${customer.phone}`;
              }}
            >
              <PhoneIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="E-Mail">
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `mailto:${customer.email}`;
              }}
            >
              <EmailIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </ListItem>
    );
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography>Lade Verkaufsübersicht...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ pb: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Verkaufsübersicht
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Letzte 5 Tage
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto' }}>
          {Object.entries(activities).map(([key, items]) => {
            const config = getCategoryConfig(key);
            return (
              <Chip
                key={key}
                icon={config.icon as any}
                label={`${config.title} (${config.count})`}
                size="small"
                sx={{
                  backgroundColor: alpha(config.color, 0.1),
                  color: config.color,
                  fontWeight: 600,
                  '& .MuiChip-icon': {
                    color: config.color,
                  },
                }}
              />
            );
          })}
        </Box>
      </CardContent>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {Object.entries(activities).map(([key, items]) => {
          if (items.length === 0) return null;
          const config = getCategoryConfig(key);
          
          return (
            <Box key={key}>
              <Box sx={{ 
                px: 2, 
                py: 1, 
                backgroundColor: alpha(config.color, 0.05),
                borderLeft: `4px solid ${config.color}`,
              }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600,
                    color: config.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  {config.icon}
                  {config.title} ({config.count})
                </Typography>
              </Box>
              <List dense disablePadding>
                {items.map(renderActivityItem)}
              </List>
              <Divider />
            </Box>
          );
        })}
      </Box>
    </MotionCard>
  );
};

export default SalesOverview;