/**
 * MUI v7 Compatibility Layer
 * This file provides compatibility imports for MUI v7
 */

// Re-export Grid from Unstable_Grid which maintains v5 compatibility
export { default as Grid } from '@mui/material/Unstable_Grid';

// Re-export other commonly used components to ensure they work
export * from '@mui/material';