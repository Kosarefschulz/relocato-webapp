'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Typography,
  CircularProgress,
  Chip,
  InputAdornment,
  IconButton,
  Collapse,
  Alert,
  Button,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  School as SchoolIcon,
  Clear as ClearIcon,
  TrendingUp as TrendingUpIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { Customer, Quote } from '@/types';

interface SearchResult {
  id: string;
  type: 'customer' | 'quote' | 'suggestion';
  title: string;
  subtitle?: string;
  score?: number;
  data?: any;
}

interface SmartSearchProps {
  onResultClick?: (result: SearchResult) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({
  onResultClick,
  placeholder = "🔍 Smart Search - Kunden, Angebote, oder fragen Sie einfach...",
  autoFocus = false
}) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [suggestions] = useState<SearchResult[]>([
    {
      id: 'recent-customers',
      type: 'suggestion',
      title: 'Letzte Kunden anzeigen',
      subtitle: 'Kürzlich bearbeitete Kunden'
    },
    {
      id: 'pending-quotes',
      type: 'suggestion', 
      title: 'Offene Angebote',
      subtitle: 'Angebote die auf Antwort warten'
    },
    {
      id: 'todays-moves',
      type: 'suggestion',
      title: 'Heutige Umzüge',
      subtitle: 'Umzüge für heute'
    }
  ]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    try {
      setLoading(true);
      setShowResults(true);

      // Mock search results - in real implementation, this would use Supabase
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'customer',
          title: 'Max Mustermann',
          subtitle: 'Berlin → Hamburg, 25.08.2025',
          score: 0.95
        },
        {
          id: '2',
          type: 'quote',
          title: 'Angebot #A-2025-001',
          subtitle: 'Familie Schmidt, €1,250',
          score: 0.87
        },
        {
          id: '3',
          type: 'customer',
          title: 'Firma ABC GmbH',
          subtitle: 'München → Berlin, Büroumzug',
          score: 0.73
        }
      ].filter(result => 
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setResults(mockResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    } else {
      // Default navigation based on type
      switch (result.type) {
        case 'customer':
          router.push(`/customers/${result.id}`);
          break;
        case 'quote':
          router.push(`/quotes/${result.id}`);
          break;
        case 'suggestion':
          handleSuggestionClick(result.id);
          break;
      }
    }
    setQuery('');
    setShowResults(false);
  };

  const handleSuggestionClick = (suggestionId: string) => {
    switch (suggestionId) {
      case 'recent-customers':
        router.push('/customers?filter=recent');
        break;
      case 'pending-quotes':
        router.push('/quotes?status=pending');
        break;
      case 'todays-moves':
        router.push('/calendar?view=today');
        break;
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'customer':
        return <PersonIcon />;
      case 'quote':
        return <DescriptionIcon />;
      case 'suggestion':
        return <AutoAwesomeIcon />;
      default:
        return <SearchIcon />;
    }
  };

  const getResultChipColor = (type: string) => {
    switch (type) {
      case 'customer':
        return 'primary';
      case 'quote':
        return 'secondary';
      case 'suggestion':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus={autoFocus}
        onFocus={() => query.length >= 2 && setShowResults(true)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                <AutoAwesomeIcon color="primary" />
              )}
            </InputAdornment>
          ),
          endAdornment: query && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={clearSearch}>
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            backgroundColor: 'background.paper',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main',
            },
          }
        }}
      />

      {/* Search Results */}
      <Collapse in={showResults} timeout={200}>
        <Paper 
          elevation={8}
          sx={{ 
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            mt: 1,
            maxHeight: 400,
            overflow: 'auto',
            borderRadius: 2
          }}
        >
          {results.length > 0 ? (
            <List dense>
              {results.map((result, index) => (
                <React.Fragment key={result.id}>
                  <ListItem disablePadding>
                    <ListItemButton 
                      onClick={() => handleResultClick(result)}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        }
                      }}
                    >
                      <ListItemIcon>
                        {getResultIcon(result.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1">
                              {result.title}
                            </Typography>
                            <Chip 
                              label={result.type === 'customer' ? 'Kunde' : result.type === 'quote' ? 'Angebot' : 'Vorschlag'} 
                              size="small" 
                              color={getResultChipColor(result.type) as any}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={result.subtitle}
                      />
                      {result.score && (
                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {Math.round(result.score * 100)}%
                          </Typography>
                        </Box>
                      )}
                    </ListItemButton>
                  </ListItem>
                  {index < results.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : query.length >= 2 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Keine Ergebnisse für "{query}" gefunden
              </Typography>
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, px: 1 }}>
                💡 Vorschläge:
              </Typography>
              <List dense>
                {suggestions.map((suggestion) => (
                  <ListItem key={suggestion.id} disablePadding>
                    <ListItemButton onClick={() => handleResultClick(suggestion)}>
                      <ListItemIcon>
                        <TrendingUpIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={suggestion.title}
                        secondary={suggestion.subtitle}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Paper>
      </Collapse>

      {/* Click outside to close */}
      {showResults && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onClick={() => setShowResults(false)}
        />
      )}
    </Box>
  );
};

export default SmartSearch;