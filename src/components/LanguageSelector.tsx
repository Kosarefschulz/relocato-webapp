import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Language as LanguageIcon,
  ExpandMore as ExpandMoreIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useI18n, Language } from '../i18n/i18nContext';

interface LanguageSelectorProps {
  variant?: 'button' | 'toggle' | 'chip' | 'menu' | 'compact';
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showFlag?: boolean;
  color?: 'primary' | 'secondary' | 'inherit';
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'button',
  size = 'medium',
  showLabel = true,
  showFlag = true,
  color = 'inherit',
}) => {
  const theme = useTheme();
  const { language, setLanguage, t } = useI18n();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const languages = [
    {
      code: 'de' as Language,
      name: 'Deutsch',
      flag: '🇩🇪',
      nativeName: 'Deutsch',
    },
    {
      code: 'en' as Language,
      name: 'English',
      flag: '🇺🇸',
      nativeName: 'English',
    },
  ];

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (variant === 'menu') {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    handleClose();
  };

  const renderFlag = (flag: string) => (
    showFlag && (
      <Box component="span" sx={{ fontSize: size === 'small' ? '1rem' : '1.2rem', mr: showLabel ? 1 : 0 }}>
        {flag}
      </Box>
    )
  );

  const renderLabel = (name: string) => (
    showLabel && (
      <Box component="span" sx={{ fontWeight: 500 }}>
        {name}
      </Box>
    )
  );

  // Compact variant - just flag, no dropdown
  if (variant === 'compact') {
    return (
      <Tooltip title={`${t('nav.language')}: ${currentLanguage.nativeName}`}>
        <IconButton
          size={size}
          onClick={() => setLanguage(language === 'de' ? 'en' : 'de')}
          sx={{
            color: color === 'inherit' ? 'inherit' : `${color}.main`,
            '&:hover': {
              backgroundColor: alpha(theme.palette.action.hover, 0.1),
            },
          }}
        >
          {renderFlag(currentLanguage.flag)}
        </IconButton>
      </Tooltip>
    );
  }

  // Toggle variant
  if (variant === 'toggle') {
    return (
      <ToggleButtonGroup
        value={language}
        exclusive
        onChange={(_, newLanguage) => newLanguage && handleLanguageChange(newLanguage)}
        size={size}
        sx={{
          '& .MuiToggleButton-root': {
            border: 'none',
            '&:hover': {
              backgroundColor: alpha(theme.palette.action.hover, 0.1),
            },
            '&.Mui-selected': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              },
            },
          },
        }}
      >
        {languages.map((lang) => (
          <ToggleButton key={lang.code} value={lang.code}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {renderFlag(lang.flag)}
              {renderLabel(lang.code.toUpperCase())}
            </Box>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );
  }

  // Chip variant
  if (variant === 'chip') {
    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        {languages.map((lang) => (
          <Chip
            key={lang.code}
            icon={<span style={{ fontSize: '1rem' }}>{lang.flag}</span>}
            label={showLabel ? lang.code.toUpperCase() : ''}
            onClick={() => handleLanguageChange(lang.code)}
            color={language === lang.code ? 'primary' : 'default'}
            variant={language === lang.code ? 'filled' : 'outlined'}
            size={size === 'large' ? 'medium' : size}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              },
            }}
          />
        ))}
      </Box>
    );
  }

  // Button and Menu variants
  return (
    <Box>
      <Button
        onClick={handleClick}
        size={size}
        color={color}
        startIcon={<LanguageIcon />}
        endIcon={variant === 'menu' ? <ExpandMoreIcon /> : undefined}
        sx={{
          minWidth: 'auto',
          px: 2,
          '&:hover': {
            backgroundColor: alpha(theme.palette.action.hover, 0.1),
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {renderFlag(currentLanguage.flag)}
          {renderLabel(showLabel ? currentLanguage.nativeName : currentLanguage.code.toUpperCase())}
        </Box>
      </Button>

      {variant === 'menu' && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            sx: {
              minWidth: 200,
              mt: 1,
            },
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
        >
          {languages.map((lang) => (
            <MenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              selected={language === lang.code}
              sx={{
                py: 1.5,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                },
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.15),
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Box component="span" sx={{ fontSize: '1.25rem' }}>
                  {lang.flag}
                </Box>
              </ListItemIcon>
              <ListItemText 
                primary={lang.nativeName}
                secondary={lang.name !== lang.nativeName ? lang.name : undefined}
              />
              {language === lang.code && (
                <CheckIcon color="primary" sx={{ ml: 1 }} />
              )}
            </MenuItem>
          ))}
        </Menu>
      )}
    </Box>
  );
};

// Advanced Language Selector with additional features
export const AdvancedLanguageSelector: React.FC<{
  showBrowserDetection?: boolean;
  showKeyboardShortcuts?: boolean;
  onLanguageChange?: (language: Language) => void;
}> = ({
  showBrowserDetection = false,
  showKeyboardShortcuts = false,
  onLanguageChange,
}) => {
  const { language, setLanguage, t } = useI18n();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    onLanguageChange?.(newLanguage);
    setAnchorEl(null);
  };

  const getBrowserLanguage = () => {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('de')) return 'de';
    if (browserLang.startsWith('en')) return 'en';
    return null;
  };

  const browserLanguage = getBrowserLanguage();

  React.useEffect(() => {
    if (showKeyboardShortcuts) {
      const handleKeyPress = (event: KeyboardEvent) => {
        if (event.ctrlKey && event.shiftKey) {
          if (event.key === 'D') {
            event.preventDefault();
            setLanguage('de');
          } else if (event.key === 'E') {
            event.preventDefault();
            setLanguage('en');
          }
        }
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [setLanguage, showKeyboardShortcuts]);

  return (
    <Box>
      <Button
        onClick={(e) => setAnchorEl(e.currentTarget)}
        startIcon={<LanguageIcon />}
        endIcon={<ExpandMoreIcon />}
        sx={{
          color: 'text.primary',
          textTransform: 'none',
          fontWeight: 500,
        }}
      >
        {language === 'de' ? '🇩🇪 Deutsch' : '🇺🇸 English'}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            minWidth: 280,
            mt: 1,
            border: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ fontWeight: 600, mb: 1 }}>
            {t('settings.language')}
          </Box>
          <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
            {t('settings.languageDescription')}
          </Box>
        </Box>

        <MenuItem
          onClick={() => handleLanguageChange('de')}
          selected={language === 'de'}
          sx={{ py: 1.5 }}
        >
          <ListItemIcon>
            <Box component="span" sx={{ fontSize: '1.25rem' }}>🇩🇪</Box>
          </ListItemIcon>
          <ListItemText 
            primary="Deutsch" 
            secondary={showKeyboardShortcuts ? 'Ctrl+Shift+D' : undefined}
          />
          {language === 'de' && <CheckIcon color="primary" />}
        </MenuItem>

        <MenuItem
          onClick={() => handleLanguageChange('en')}
          selected={language === 'en'}
          sx={{ py: 1.5 }}
        >
          <ListItemIcon>
            <Box component="span" sx={{ fontSize: '1.25rem' }}>🇺🇸</Box>
          </ListItemIcon>
          <ListItemText 
            primary="English" 
            secondary={showKeyboardShortcuts ? 'Ctrl+Shift+E' : undefined}
          />
          {language === 'en' && <CheckIcon color="primary" />}
        </MenuItem>

        {showBrowserDetection && browserLanguage && browserLanguage !== language && (
          <>
            <Box sx={{ px: 2, py: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1 }}>
                {t('settings.browserLanguageDetected')}
              </Box>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleLanguageChange(browserLanguage as Language)}
                startIcon={
                  <span style={{ fontSize: '1rem' }}>
                    {browserLanguage === 'de' ? '🇩🇪' : '🇺🇸'}
                  </span>
                }
              >
                {t('settings.useBrowserLanguage')} ({browserLanguage === 'de' ? 'Deutsch' : 'English'})
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </Box>
  );
};

export default LanguageSelector;