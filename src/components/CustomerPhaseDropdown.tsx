import React, { useState } from 'react';
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Phone as PhoneIcon,
  PhoneCallback as PhoneCallbackIcon,
  Description as DescriptionIcon,
  Event as EventIcon,
  LocalShipping as LocalShippingIcon,
  Receipt as ReceiptIcon,
  Star as StarIcon,
  Archive as ArchiveIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { CustomerPhase, CUSTOMER_PHASES } from '../types';
import { databaseService } from '../config/database.config';

interface CustomerPhaseDropdownProps {
  customerId: string;
  currentPhase?: CustomerPhase;
  onPhaseChange?: (newPhase: CustomerPhase) => void;
  readonly?: boolean;
  variant?: 'dropdown' | 'chip';
}

// Icon mapping
const iconMap: Record<string, React.ReactElement> = {
  Phone: <PhoneIcon fontSize="small" />,
  PhoneCallback: <PhoneCallbackIcon fontSize="small" />,
  Description: <DescriptionIcon fontSize="small" />,
  Event: <EventIcon fontSize="small" />,
  LocalShipping: <LocalShippingIcon fontSize="small" />,
  Receipt: <ReceiptIcon fontSize="small" />,
  Star: <StarIcon fontSize="small" />,
  Archive: <ArchiveIcon fontSize="small" />,
};

const CustomerPhaseDropdown: React.FC<CustomerPhaseDropdownProps> = ({
  customerId,
  currentPhase = 'angerufen',
  onPhaseChange,
  readonly = false,
  variant = 'dropdown'
}) => {
  const [phase, setPhase] = useState<CustomerPhase>(currentPhase || 'angerufen');
  const [updating, setUpdating] = useState(false);

  const handlePhaseChange = async (newPhase: CustomerPhase) => {
    if (readonly || updating || newPhase === phase) return;

    setUpdating(true);

    try {
      await databaseService.updateCustomer(customerId, {
        currentPhase: newPhase
      });

      setPhase(newPhase);

      if (onPhaseChange) {
        onPhaseChange(newPhase);
      }

      console.log(`✅ Phase updated to: ${newPhase}`);
    } catch (error) {
      console.error('❌ Error updating phase:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getPhaseConfig = (phaseValue: CustomerPhase) => {
    return CUSTOMER_PHASES.find(p => p.value === phaseValue) || CUSTOMER_PHASES[0];
  };

  const currentConfig = getPhaseConfig(phase);
  const currentIndex = CUSTOMER_PHASES.findIndex(p => p.value === phase);

  // Chip variant - for customer list
  if (variant === 'chip') {
    return (
      <Chip
        icon={iconMap[currentConfig.iconName]}
        label={currentConfig.label}
        size="small"
        sx={{
          background: `${currentConfig.color}20`,
          border: `1px solid ${currentConfig.color}60`,
          color: currentConfig.color,
          fontWeight: 600,
          '& .MuiChip-icon': {
            color: currentConfig.color
          }
        }}
      />
    );
  }

  // Dropdown variant - for customer details
  return (
    <FormControl
      sx={{
        minWidth: 200,
        maxWidth: 280,
        position: 'relative'
      }}
    >
      <Select
        value={phase}
        onChange={(e) => handlePhaseChange(e.target.value as CustomerPhase)}
        disabled={readonly || updating}
        sx={{
          background: `${currentConfig.color}15`,
          border: `2px solid ${currentConfig.color}`,
          borderRadius: 2,
          color: currentConfig.color,
          fontWeight: 600,
          '& .MuiSelect-icon': {
            color: currentConfig.color
          },
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none'
          },
          '&:hover': {
            background: `${currentConfig.color}25`
          },
          '&.Mui-focused': {
            background: `${currentConfig.color}25`
          }
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              background: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              mt: 1,
              maxHeight: 400
            }
          }
        }}
        renderValue={(value) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {updating ? (
              <CircularProgress size={20} sx={{ color: currentConfig.color }} />
            ) : (
              <>
                {iconMap[currentConfig.iconName]}
                <span>{currentConfig.label}</span>
              </>
            )}
          </Box>
        )}
      >
        {CUSTOMER_PHASES.map((phaseConfig, index) => {
          const isActive = phaseConfig.value === phase;
          const isCompleted = index < currentIndex;

          return (
            <MenuItem
              key={phaseConfig.value}
              value={phaseConfig.value}
              sx={{
                py: 1.5,
                px: 2,
                color: isActive || isCompleted ? phaseConfig.color : 'rgba(255, 255, 255, 0.7)',
                background: isActive ? `${phaseConfig.color}20` : 'transparent',
                '&:hover': {
                  background: `${phaseConfig.color}25`
                },
                '&.Mui-selected': {
                  background: `${phaseConfig.color}30`,
                  '&:hover': {
                    background: `${phaseConfig.color}35`
                  }
                }
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                {isCompleted && !isActive ? (
                  <CheckCircleIcon fontSize="small" />
                ) : (
                  iconMap[phaseConfig.iconName]
                )}
              </ListItemIcon>
              <ListItemText
                primary={phaseConfig.label}
                secondary={phaseConfig.description}
                primaryTypographyProps={{
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.875rem'
                }}
                secondaryTypographyProps={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}
              />
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};

export default CustomerPhaseDropdown;
