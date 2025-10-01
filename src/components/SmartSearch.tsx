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
import { useNavigate } from 'react-router-dom';
import { vectorSearchService, SearchResult } from '../services/vectorSearchService';
import { useDebounce } from '../hooks/useDebounce';

interface SmartSearchProps {
  onResultClick?: (result: SearchResult) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({
  onResultClick,
  placeholder = 'Intelligente Suche... (Kunden, Angebote, Wissen)',
  autoFocus = false
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const debouncedQuery = useDebounce(query, 300);

  // Perform search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Get search results
      const searchResults = await vectorSearchService.search(searchQuery, {
        matchCount: 10,
        threshold: 0.6
      });
      setResults(searchResults);

      // Get suggestions for autocomplete
      const searchSuggestions = await vectorSearchService.getSuggestions(searchQuery, 3);
      setSuggestions(searchSuggestions);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect for debounced search
  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [debouncedQuery, performSearch]);

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    } else {
      // Default navigation behavior
      switch (result.type) {
        case 'customer':
          navigate(`/customer/${result.id}`);
          break;
        case 'quote':
          navigate(`/quotes?highlight=${result.id}`);
          break;
        case 'knowledge':
          // Show knowledge in a dialog or navigate to help page
          console.log('Knowledge item:', result);
          break;
      }
    }
    setQuery('');
    setShowResults(false);
  };

  // Get icon for result type
  const getResultIcon = (type: string) => {
    switch (type) {
      case 'customer':
        return <PersonIcon />;
      case 'quote':
        return <DescriptionIcon />;
      case 'knowledge':
        return <SchoolIcon />;
      default:
        return <SearchIcon />;
    }
  };

  // Get type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'customer':
        return 'Kunde';
      case 'quote':
        return 'Angebot';
      case 'knowledge':
        return 'Wissen';
      default:
        return type;
    }
  };

  // Format similarity score
  const formatSimilarity = (similarity: number) => {
    const percentage = Math.round(similarity * 100);
    return `${percentage}%`;
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        fullWidth
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onFocus={() => query.length >= 2 && setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <AutoAwesomeIcon color="primary" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {loading && <CircularProgress size={20} />}
              {query && !loading && (
                <IconButton
                  size="small"
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                    setShowResults(false);
                  }}
                >
                  <ClearIcon />
                </IconButton>
              )}
            </InputAdornment>
          )
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.05) !important',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.08) !important',
              borderColor: 'rgba(255, 255, 255, 0.2)'
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(255, 255, 255, 0.08) !important',
              borderColor: 'rgba(255, 255, 255, 0.3)'
            },
            '& input': {
              color: '#ffffff !important',
              '&::placeholder': {
                color: 'rgba(255, 255, 255, 0.5) !important',
                opacity: 1
              }
            },
            '& fieldset': {
              border: 'none !important'
            }
          },
          '& .MuiInputAdornment-root svg': {
            color: 'rgba(255, 255, 255, 0.7) !important'
          }
        }}
      />

      <Collapse in={showResults && (results.length > 0 || suggestions.length > 0)}>
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 1,
            maxHeight: 400,
            overflow: 'auto',
            zIndex: 1000
          }}
        >
          {/* Suggestions */}
          {suggestions.length > 0 && results.length === 0 && (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ p: 1, display: 'block' }}>
                Vorschläge:
              </Typography>
              <List dense>
                {suggestions.map((suggestion, index) => (
                  <ListItemButton
                    key={index}
                    onClick={() => setQuery(suggestion)}
                  >
                    <ListItemIcon>
                      <TrendingUpIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={suggestion} />
                  </ListItemButton>
                ))}
              </List>
              <Divider />
            </>
          )}

          {/* Search Results */}
          {results.length > 0 && (
            <List>
              {results.map((result) => (
                <ListItemButton
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
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
                          label={getTypeLabel(result.type)}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={formatSimilarity(result.similarity)}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {result.content}
                      </Typography>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          )}

          {/* No results */}
          {query.length >= 2 && !loading && results.length === 0 && (
            <Box sx={{ p: 2 }}>
              <Alert severity="info">
                Keine Ergebnisse für "{query}" gefunden.
              </Alert>
            </Box>
          )}
        </Paper>
      </Collapse>
    </Box>
  );
};

// Standalone search page component
export const SmartSearchPage: React.FC = () => {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const handleSearch = (query: string) => {
    // Save to recent searches
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoAwesomeIcon color="primary" />
        Intelligente Suche
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Nutzen Sie unsere KI-gestützte Suche, um schnell Kunden, Angebote und Informationen zu finden.
      </Typography>

      <Box sx={{ mb: 4 }}>
        <SmartSearch
          autoFocus
          onResultClick={(result) => setSelectedResult(result)}
        />
      </Box>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Letzte Suchen
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {recentSearches.map((search, index) => (
              <Chip
                key={index}
                label={search}
                onClick={() => handleSearch(search)}
                onDelete={() => {
                  const updated = recentSearches.filter((_, i) => i !== index);
                  setRecentSearches(updated);
                  localStorage.setItem('recentSearches', JSON.stringify(updated));
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Selected Result Preview */}
      {selectedResult && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {selectedResult.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip label={getTypeLabel(selectedResult.type)} size="small" />
            <Chip label={`Relevanz: ${formatSimilarity(selectedResult.similarity)}`} size="small" color="primary" />
          </Box>
          <Typography variant="body1" paragraph>
            {selectedResult.content}
          </Typography>
          {selectedResult.metadata && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Weitere Informationen:
              </Typography>
              <pre style={{ fontSize: '0.875rem', overflow: 'auto' }}>
                {JSON.stringify(selectedResult.metadata, null, 2)}
              </pre>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );

  function getTypeLabel(type: string) {
    switch (type) {
      case 'customer': return 'Kunde';
      case 'quote': return 'Angebot';
      case 'knowledge': return 'Wissen';
      default: return type;
    }
  }

  function formatSimilarity(similarity: number) {
    return `${Math.round(similarity * 100)}%`;
  }
};

export default SmartSearch;