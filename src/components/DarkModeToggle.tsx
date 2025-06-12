import React from 'react';
import { IconButton, Tooltip, useTheme as useMuiTheme } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface DarkModeToggleProps {
  showTooltip?: boolean;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ showTooltip = true }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const muiTheme = useMuiTheme();

  const button = (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={false}
      animate={{ rotate: darkMode ? 180 : 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <IconButton
        onClick={toggleDarkMode}
        sx={{
          color: muiTheme.palette.text.primary,
          backgroundColor: muiTheme.palette.action.hover,
          '&:hover': {
            backgroundColor: muiTheme.palette.action.selected,
          }
        }}
      >
        {darkMode ? <Brightness7 /> : <Brightness4 />}
      </IconButton>
    </motion.div>
  );

  if (showTooltip) {
    return (
      <Tooltip title={darkMode ? 'Light Mode' : 'Dark Mode'}>
        {button}
      </Tooltip>
    );
  }

  return button;
};

export default DarkModeToggle;