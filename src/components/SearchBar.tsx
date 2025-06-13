import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Autocomplete,
  Paper,
  Box,
  Typography,
  InputAdornment,
  Chip,
  CircularProgress,
  alpha,
  useTheme,
  ClickAwayListener,
  Popper,
  Avatar,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { Customer } from '../types';
import { googleSheetsPublicService as googleSheetsService } from '../services/googleSheetsPublic';
import { motion, AnimatePresence } from 'framer-motion';

const SearchBar: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  // Load customers on mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await googleSheetsService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  // Calculate similarity between two strings (Levenshtein distance)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const track = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
    }
    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator, // substitution
        );
      }
    }
    return track[str2.length][str1.length];
  };

  // Filter customers based on input with fuzzy search
  useEffect(() => {
    if (inputValue.length > 0) {
      const searchTerm = inputValue.toLowerCase();
      
      // First, try exact matches
      let filtered = customers.filter(customer => {
        return (
          customer.name.toLowerCase().includes(searchTerm) ||
          customer.email?.toLowerCase().includes(searchTerm) ||
          customer.phone?.includes(searchTerm)
        );
      });

      // If no exact matches, try fuzzy search on names
      if (filtered.length === 0 && inputValue.length >= 2) {
        const fuzzyMatches = customers
          .map(customer => {
            const nameLower = customer.name.toLowerCase();
            // Check each word in the customer name
            const words = nameLower.split(' ');
            let minDistance = Infinity;
            
            for (const word of words) {
              // Calculate distance for whole search term
              const distance = calculateSimilarity(searchTerm, word);
              // Also check if search term is at the beginning of a word
              if (word.startsWith(searchTerm.substring(0, Math.min(3, searchTerm.length)))) {
                minDistance = Math.min(minDistance, distance * 0.5); // Prefer prefix matches
              } else {
                minDistance = Math.min(minDistance, distance);
              }
            }
            
            return { customer, distance: minDistance };
          })
          .filter(item => {
            // Allow up to 2 character differences for short searches, 3 for longer
            const maxDistance = inputValue.length <= 4 ? 2 : 3;
            return item.distance <= maxDistance;
          })
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 5) // Limit to 5 suggestions
          .map(item => item.customer);
        
        filtered = fuzzyMatches;
      }
      
      setOptions(filtered);
    } else {
      setOptions([]);
    }
  }, [inputValue, customers]);

  const handleCustomerSelect = (customer: Customer | null) => {
    if (customer) {
      navigate(`/customer-details/${customer.id}`);
      setInputValue('');
      setExpanded(false);
    }
  };

  return (
    <Box sx={{ position: 'relative' }} ref={anchorRef}>
      <ClickAwayListener onClickAway={() => setExpanded(false)}>
        <Box>
          <motion.div
            animate={{ width: expanded ? 300 : 48 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              overflow: 'hidden',
              borderRadius: 24,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              height: 48,
            }}
          >
            <Box
              onClick={() => setExpanded(!expanded)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                },
                borderRadius: '50%',
                transition: 'background-color 0.3s',
              }}
            >
              <SearchIcon />
            </Box>
            
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ flex: 1, paddingRight: 12 }}
                >
                  <Autocomplete
                    open={options.length > 0 && inputValue.length > 0}
                    options={options}
                    loading={loading}
                    inputValue={inputValue}
                    onInputChange={(event, newValue) => setInputValue(newValue)}
                    onChange={(event, customer) => handleCustomerSelect(customer)}
                    getOptionLabel={(option) => option.name}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Kunde suchen..."
                        variant="standard"
                        autoFocus
                        InputProps={{
                          ...params.InputProps,
                          disableUnderline: true,
                          sx: {
                            fontSize: 14,
                            '& input': {
                              padding: '0 !important',
                            },
                          },
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} sx={{ py: 1, px: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              mr: 1.5,
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              fontSize: 16,
                            }}
                          >
                            {option.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {option.name}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    PaperComponent={(props) => (
                      <Paper
                        {...props}
                        elevation={8}
                        sx={{
                          mt: 1,
                          borderRadius: 2,
                          overflow: 'hidden',
                          maxHeight: 400,
                        }}
                      />
                    )}
                    sx={{
                      '& .MuiAutocomplete-listbox': {
                        padding: 0,
                      },
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Box>
      </ClickAwayListener>
    </Box>
  );
};

export default SearchBar;