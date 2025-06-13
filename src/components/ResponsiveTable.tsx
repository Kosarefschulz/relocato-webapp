import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useResponsive } from '../hooks/useResponsive';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any) => string;
  mobileHide?: boolean; // Hide this column on mobile
  mobilePriority?: number; // Higher priority shows first on mobile (1-3)
}

interface ResponsiveTableProps {
  columns: Column[];
  rows: any[];
  onRowClick?: (row: any) => void;
  mobileCardRenderer?: (row: any) => React.ReactNode;
  emptyMessage?: string;
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  columns,
  rows,
  onRowClick,
  mobileCardRenderer,
  emptyMessage = 'Keine Daten vorhanden',
}) => {
  const theme = useTheme();
  const { isMobile } = useResponsive();

  // Default mobile card renderer if none provided
  const defaultMobileCardRenderer = (row: any) => {
    // Get columns sorted by mobile priority
    const mobileColumns = columns
      .filter(col => !col.mobileHide)
      .sort((a, b) => (b.mobilePriority || 0) - (a.mobilePriority || 0));

    return (
      <Card 
        sx={{ 
          mb: 2,
          cursor: onRowClick ? 'pointer' : 'default',
          '&:active': onRowClick ? {
            transform: 'scale(0.98)',
          } : {},
          transition: 'transform 0.1s',
        }}
        onClick={() => onRowClick && onRowClick(row)}
      >
        <CardContent sx={{ p: 2 }}>
          {mobileColumns.map((column, index) => {
            const value = row[column.id];
            const formattedValue = column.format ? column.format(value) : value;
            
            // First item (highest priority) gets special treatment
            if (index === 0 && column.mobilePriority === 3) {
              return (
                <Typography
                  key={column.id}
                  variant="h6"
                  sx={{ fontWeight: 600, mb: 1 }}
                >
                  {formattedValue}
                </Typography>
              );
            }
            
            // Second priority items shown as key-value pairs
            if (column.mobilePriority === 2) {
              return (
                <Box key={column.id} sx={{ mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary" component="span">
                    {column.label}:{' '}
                  </Typography>
                  <Typography variant="body2" component="span" fontWeight="medium">
                    {formattedValue}
                  </Typography>
                </Box>
              );
            }
            
            // Lower priority items shown smaller
            return (
              <Typography
                key={column.id}
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5 }}
              >
                {column.label}: {formattedValue}
              </Typography>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  // Mobile layout - Cards
  if (isMobile) {
    return (
      <Box>
        {rows.length === 0 ? (
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {emptyMessage}
            </Typography>
          </Card>
        ) : (
          rows.map((row, index) => (
            <Box key={index}>
              {mobileCardRenderer ? mobileCardRenderer(row) : defaultMobileCardRenderer(row)}
            </Box>
          ))
        )}
      </Box>
    );
  }

  // Desktop layout - Table
  return (
    <TableContainer 
      component={Paper} 
      sx={{ 
        borderRadius: 2,
        overflow: 'hidden',
        '& .MuiTable-root': {
          minWidth: 650,
        }
      }}
    >
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                align={column.align}
                style={{ minWidth: column.minWidth }}
                sx={{
                  fontWeight: 600,
                  backgroundColor: theme.palette.background.paper,
                  borderBottom: `2px solid ${theme.palette.divider}`,
                }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow
                key={index}
                hover
                onClick={() => onRowClick && onRowClick(row)}
                sx={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  '&:last-child td, &:last-child th': { border: 0 },
                }}
              >
                {columns.map((column) => {
                  const value = row[column.id];
                  return (
                    <TableCell key={column.id} align={column.align}>
                      {column.format ? column.format(value) : value}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ResponsiveTable;