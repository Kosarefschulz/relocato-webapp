import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Avatar,
  IconButton,
  useTheme,
  Stack,
  Divider
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { Customer } from '../types';
import { motion } from 'framer-motion';

interface CustomerCardProps {
  customer: Customer;
  onClick: () => void;
  index?: number;
}

const MotionCard = motion(Card);

const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onClick, index = 0 }) => {
  const theme = useTheme();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: string | Date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      sx={{
        mb: 2,
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: `1px solid ${theme.palette.divider}`,
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)',
          borderColor: theme.palette.primary.main
        },
        '&:active': {
          transform: 'scale(0.98)'
        }
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: theme.palette.primary.main,
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 },
              mr: 2
            }}
          >
            {getInitials(customer.name || 'Unknown')}
          </Avatar>
          
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {customer.name}
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {customer.customerNumber && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500
                  }}
                >
                  {customer.customerNumber}
                </Typography>
              )}
              {customer.company && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {customer.company}
                </Typography>
              )}
            </Box>
          </Box>
          
          <IconButton 
            size="small" 
            sx={{ 
              color: 'text.secondary',
              display: { xs: 'none', sm: 'flex' }
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>

        {/* Contact Info */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={1} 
          divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />}
          sx={{ mb: 2 }}
        >
          {customer.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {customer.phone}
              </Typography>
            </Box>
          )}
          
          {customer.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: { xs: '200px', sm: 'none' }
                }}
              >
                {customer.email}
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Tags */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {customer.movingDate && (
            <Chip
              icon={<CalendarIcon sx={{ fontSize: 16 }} />}
              label={formatDate(customer.movingDate)}
              size="small"
              variant="outlined"
            />
          )}
          
          {customer.address && (
            <Chip
              icon={<LocationIcon sx={{ fontSize: 16 }} />}
              label={customer.address.split(',')[0]}
              size="small"
              variant="outlined"
              sx={{
                maxWidth: { xs: '150px', sm: 'none' },
                '& .MuiChip-label': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }
              }}
            />
          )}
          
          {customer.status && (
            <Chip
              label={customer.status}
              size="small"
              color={customer.status === 'active' ? 'success' : 'default'}
            />
          )}
        </Stack>
      </CardContent>
    </MotionCard>
  );
};

export default CustomerCard;