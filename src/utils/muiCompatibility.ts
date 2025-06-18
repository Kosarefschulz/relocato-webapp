/**
 * MUI v7 Compatibility Layer
 * This file provides compatibility imports for MUI v7
 */

// Try to import Grid2 if available (MUI v6+), otherwise fall back to Grid
let GridComponent: any;

try {
  // Try to import Grid2 from MUI v6+
  const { Grid2 } = require('@mui/material');
  GridComponent = Grid2;
} catch {
  try {
    // Try Unstable_Grid as fallback
    const { default: UnstableGrid } = require('@mui/material/Unstable_Grid');
    GridComponent = UnstableGrid;
  } catch {
    // Fall back to regular Grid
    const { Grid } = require('@mui/material');
    GridComponent = Grid;
  }
}

export const Grid = GridComponent;

// Re-export other commonly used components to ensure they work
export * from '@mui/material';