import React, { useEffect } from 'react';
import { useTheme } from '@mui/material/styles';

/**
 * Global visibility fix for text rendering issues
 * This component ensures that all text is visible regardless of theme or CSS conflicts
 */
export const VisibilityFix: React.FC = () => {
  const theme = useTheme();

  useEffect(() => {
    // Create a style element to inject global CSS fixes
    const styleElement = document.createElement('style');
    styleElement.id = 'visibility-fix-styles';
    
    // Force text visibility across the entire app
    styleElement.innerHTML = `
      /* Force text visibility for all MUI Typography components */
      .MuiTypography-root {
        opacity: 1 !important;
        visibility: visible !important;
        color: inherit;
      }
      
      /* Ensure list item text is visible */
      .MuiListItemText-primary,
      .MuiListItemText-secondary {
        opacity: 1 !important;
        visibility: visible !important;
      }
      
      /* Fix for links and interactive elements */
      a, button, .MuiButton-root, .MuiIconButton-root {
        opacity: 1 !important;
        visibility: visible !important;
      }
      
      /* Ensure all text in cards is visible */
      .MuiCard-root .MuiTypography-root,
      .MuiPaper-root .MuiTypography-root {
        opacity: 1 !important;
        visibility: visible !important;
      }
      
      /* Fix for dark mode text visibility */
      [data-mui-color-scheme="dark"] .MuiTypography-root {
        color: ${theme.palette.mode === 'dark' ? '#ffffff' : 'inherit'} !important;
        opacity: 1 !important;
      }
      
      /* Ensure customer details are always visible */
      .MuiListItemText-secondary a {
        display: inline-block !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
      
      /* Fix for any potential z-index issues */
      .MuiTypography-root,
      .MuiListItemText-root {
        position: relative;
        z-index: 1;
      }
      
      /* Remove any potential filters or effects that might hide text */
      * {
        filter: none !important;
      }
    `;
    
    // Append to head
    document.head.appendChild(styleElement);
    
    // Cleanup on unmount
    return () => {
      const existingStyle = document.getElementById('visibility-fix-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [theme.palette.mode]);

  return null;
};

export default VisibilityFix;