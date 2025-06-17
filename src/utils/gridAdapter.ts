/**
 * Grid Adapter for MUI v5/v6 compatibility
 * This file helps with the transition between MUI Grid versions
 */

import { as MUIGrid, GridProps } from '@mui/material';
import Grid from '../components/GridCompat';
import React from 'react';

// Type to handle both old and new Grid props
interface GridAdapterProps extends Omit<GridProps, 'item' | 'container' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'spacing'> {
  item?: boolean;
  container?: boolean;
  xs?: number | 'auto' | boolean;
  sm?: number | 'auto' | boolean;
  md?: number | 'auto' | boolean;
  lg?: number | 'auto' | boolean;
  xl?: number | 'auto' | boolean;
  spacing?: number;
  children?: React.ReactNode;
}

/**
 * Grid adapter component that works with both MUI v5 and v6
 * In v6, Grid2 is used with size prop instead of individual breakpoint props
 */
export const Grid = React.forwardRef<HTMLDivElement, GridAdapterProps>((props, ref) => {
  const { item, container, xs, sm, md, lg, xl, spacing, ...otherProps } = props;

  // For MUI v5 Grid (legacy)
  return (
    <MUIGrid
      ref={ref}
      item={item}
      container={container}
      xs={xs}
      sm={sm}
      md={md}
      lg={lg}
      xl={xl}
      spacing={spacing}
      {...otherProps}
    />
  );
});

Grid.displayName = 'GridAdapter';