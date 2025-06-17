import React from 'react';
import { Box } from '@mui/material';

// Custom Grid component that works with both old and new syntax
interface GridCompatProps {
  item?: boolean;
  container?: boolean;
  children?: React.ReactNode;
  spacing?: number;
  xs?: number | 'auto' | boolean;
  sm?: number | 'auto' | boolean;
  md?: number | 'auto' | boolean;
  lg?: number | 'auto' | boolean;
  xl?: number | 'auto' | boolean;
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  sx?: any;
  style?: React.CSSProperties;
  className?: string;
  [key: string]: any;
}

const GridCompat = React.forwardRef<HTMLDivElement, GridCompatProps>((props, ref) => {
  const { 
    item, 
    container, 
    xs, 
    sm, 
    md, 
    lg, 
    xl,
    spacing,
    alignItems,
    justifyContent,
    direction,
    sx,
    style,
    className,
    children,
    ...otherProps 
  } = props;

  // For container grids
  if (container) {
    const gap = spacing ? spacing * 8 / 8 : 0; // Convert spacing to rem (8px = 1 spacing unit)
    
    return (
      <Box 
        ref={ref} 
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: gap,
          alignItems,
          justifyContent,
          flexDirection: direction || 'row',
          ...sx
        }}
        style={style}
        className={className}
        {...otherProps}
      >
        {children}
      </Box>
    );
  }

  // For item grids, convert to flex properties
  if (item) {
    // Calculate flex properties based on breakpoint values
    const getFlexBasis = (size: number | 'auto' | boolean | undefined) => {
      if (size === 'auto') return 'auto';
      if (typeof size === 'number') return `${(size / 12) * 100}%`;
      if (size === true) return '100%';
      return undefined;
    };

    const itemSx = {
      flexBasis: getFlexBasis(xs),
      flexGrow: xs === true ? 1 : 0,
      maxWidth: getFlexBasis(xs),
      '@media (min-width: 600px)': sm !== undefined ? {
        flexBasis: getFlexBasis(sm),
        flexGrow: sm === true ? 1 : 0,
        maxWidth: getFlexBasis(sm),
      } : {},
      '@media (min-width: 900px)': md !== undefined ? {
        flexBasis: getFlexBasis(md),
        flexGrow: md === true ? 1 : 0,
        maxWidth: getFlexBasis(md),
      } : {},
      '@media (min-width: 1200px)': lg !== undefined ? {
        flexBasis: getFlexBasis(lg),
        flexGrow: lg === true ? 1 : 0,
        maxWidth: getFlexBasis(lg),
      } : {},
      '@media (min-width: 1536px)': xl !== undefined ? {
        flexBasis: getFlexBasis(xl),
        flexGrow: xl === true ? 1 : 0,
        maxWidth: getFlexBasis(xl),
      } : {},
      ...sx
    };

    return (
      <Box 
        ref={ref}
        sx={itemSx}
        style={style}
        className={className}
        {...otherProps}
      >
        {children}
      </Box>
    );
  }

  // Neither container nor item - just a Box
  return (
    <Box 
      ref={ref}
      sx={sx}
      style={style}
      className={className}
      {...otherProps}
    >
      {children}
    </Box>
  );
});

GridCompat.displayName = 'GridCompat';

export default GridCompat;